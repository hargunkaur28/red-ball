const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Inventory = require('../models/Inventory');
const RestaurantSettings = require('../models/RestaurantSettings');
const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const { sendAdminPaymentAlert } = require('../utils/emailService');

// ── helpers ────────────────────────────────────────────────────────────────────

/** Strict: throws an Error if menuItemId is missing/invalid or size not found.
 *  Used for all public (unauthenticated) orders. */
async function resolveItemPriceFromDB(item) {
  if (!item.menuItemId) {
    throw new Error(`Item "${item.name || 'unknown'}" is missing menuItemId.`);
  }
  const dbItem = await MenuItem.findById(item.menuItemId).select('sizes price name').lean();
  if (!dbItem) {
    throw new Error(`Menu item not found: ${item.menuItemId}`);
  }
  if (dbItem.sizes?.length) {
    if (!item.size) throw new Error(`Size is required for "${dbItem.name}".`);
    const sizeMatch = dbItem.sizes.find(s => s.label === item.size);
    if (!sizeMatch) throw new Error(`Size "${item.size}" not found for "${dbItem.name}".`);
    return sizeMatch.price;
  }
  return dbItem.price ?? 0;
}

/** Lenient: falls back to client-supplied price. Used only for authenticated staff orders. */
async function resolveItemPrice(item) {
  if (!item.menuItemId) return Number(item.price) || 0;
  try {
    const dbItem = await MenuItem.findById(item.menuItemId).select('sizes price').lean();
    if (!dbItem) return Number(item.price) || 0;
    const sizeMatch = dbItem.sizes?.find(s => s.label === item.size);
    if (sizeMatch) return sizeMatch.price;
    if (dbItem.sizes?.length) return dbItem.sizes[0].price;
    return dbItem.price || Number(item.price) || 0;
  } catch {
    return Number(item.price) || 0;
  }
}

/** Calculate delivery charge against RestaurantSettings. */
async function calcDeliveryCharge(orderType, subtotal) {
  if (orderType !== 'delivery') return 0;
  try {
    let settings = await RestaurantSettings.findOne().lean();
    if (!settings || !settings.deliveryChargeEnabled) return 0;
    return subtotal < settings.freeDeliveryMinAmount ? (settings.deliveryChargeBelowMin || 0) : 0;
  } catch {
    return 0;
  }
}

// ── GET /api/orders ────────────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { status, date } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      const start = new Date(year, month - 1, day, 0, 0, 0, 0);
      const end   = new Date(year, month - 1, day, 23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }
    const orders = await Order.find(filter)
      .populate('tableId', 'label tableNumber section')
      .populate('customerId', 'name phone email')
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── POST /api/orders  (and /direct, /table-order) ─────────────────────────────
exports.create = async (req, res) => {
  try {
    const {
      tableId, items, customerName, customerPhone, paymentMethod,
      specialInstructions, paymentStatus, orderType, deliveryAddress,
      deliveryLocation, customerId,
    } = req.body;

    if (!items?.length) {
      return res.status(400).json({ message: 'Order must include at least one item.' });
    }

    const normalizedOrderType = orderType || (tableId ? 'table' : 'pickup');
    if (normalizedOrderType === 'delivery' && !deliveryAddress) {
      return res.status(400).json({ message: 'Delivery address is required.' });
    }

    // Validate specialInstructions length
    const instructions = specialInstructions ? String(specialInstructions).trim().slice(0, 500) : undefined;

    // Resolve authoritative prices from DB
    const resolvedItems = await Promise.all(
      items.map(async (item) => {
        const authPrice = await resolveItemPrice(item);
        return { ...item, price: authPrice };
      })
    );

    const subtotal = resolvedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCharge = await calcDeliveryCharge(normalizedOrderType, subtotal);
    const totalAmount = subtotal + deliveryCharge;

    const order = await Order.create({
      tableId,
      customerId: req.user ? req.user.userId : customerId,
      customerName,
      customerPhone,
      orderType: normalizedOrderType,
      deliveryAddress,
      deliveryLocation,
      items: resolvedItems,
      subtotal,
      gstAmount: 0,
      deliveryCharge,
      totalAmount,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: paymentStatus || 'pending',
      specialInstructions: instructions,
    });

    const populated = await order.populate('tableId', 'label tableNumber section');

    const io = req.app.get('io');
    if (io) {
      if (order.paymentMethod === 'cash' || order.paymentStatus === 'paid') {
        io.to('restaurant-managers').emit('order:new', { order: populated });
      }
      io.emit('dashboard:refresh');
    }

    if (order.paymentStatus === 'paid' && order.paymentMethod === 'razorpay') {
      const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      const recipients = [
        process.env.MANAGER_EMAIL,
        process.env.ADMIN_NOTIFICATION_EMAIL,
      ].filter(Boolean);
      recipients.forEach((email) => {
        sendAdminPaymentAlert({
          adminEmail: email,
          payerName: order.customerName || 'Guest',
          payerPhone: order.customerPhone,
          paymentType: `Food Order (${order.orderType})`,
          amount: order.totalAmount,
          paymentMode: 'Razorpay',
          invoiceNumber: order._id.toString().slice(-8).toUpperCase(),
          timestamp,
        }).catch(() => {});
      });
    }

    res.status(201).json({ order: populated });
  } catch (error) {
    console.error('Order create error:', error.message, error.stack);
    res.status(500).json({ message: error.message || 'Server error.' });
  }
};

// ── PUT /api/orders/:id/status ─────────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const previousStatus = order.status;
    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    await order.save();

    const populated = await Order.findById(order._id)
      .populate('tableId', 'label tableNumber section')
      .populate('customerId', 'name phone');

    const io = req.app.get('io');

    if (status === 'delivered' && previousStatus !== 'delivered') {
      await deductInventoryForOrder(order);
      if (io) io.emit('inventory:updated');
    }

    if (io) {
      io.to('restaurant-managers').emit('order:updated', { orderId: order._id, status, order: populated });
      io.to(`order-${order._id}`).emit('order:status', { orderId: order._id, status });
      io.emit('order:status-update');
      io.emit('dashboard:refresh');
    }

    res.json({ order: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── PUT /api/orders/:id/cancel ─────────────────────────────────────────────────
exports.cancelOrder = async (req, res) => {
  try {
    const { reason, refund } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    order.status = 'cancelled';
    order.cancelledBy = req.user.role;
    order.cancellationReason = reason;
    if (refund) {
      order.isRefunded = true;
      order.refundedBy = req.user.userId;
      order.paymentStatus = 'refunded';
    }
    await order.save();

    const Payment = require('../models/Payment');
    await Payment.updateMany(
      { referenceId: order._id, type: 'restaurant', status: 'pending' },
      { status: 'cancelled' }
    );

    const io = req.app.get('io');
    if (io) {
      io.to('restaurant-managers').emit('order:cancelled', { orderId: order._id });
      io.to(`order-${order._id}`).emit('order:status', { orderId: order._id, status: 'cancelled' });
      io.emit('dashboard:refresh');
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── GET /api/orders/my-orders ──────────────────────────────────────────────────
exports.getCustomerOrders = async (req, res) => {
  try {
    const filter = { $or: [{ customerId: req.user.userId }] };
    if (req.user.phone) filter.$or.push({ customerPhone: req.user.phone });
    const orders = await Order.find(filter).populate('tableId', 'label').sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── GET /api/orders/table/:tableId ─────────────────────────────────────────────
exports.getTableOrders = async (req, res) => {
  try {
    const orders = await Order.find({ tableId: req.params.tableId })
      .populate('tableId', 'label tableNumber section')
      .sort({ createdAt: -1 })
      .limit(30);
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// ── PUT /api/orders/:id/prep-time ──────────────────────────────────────────────
exports.setPrepTime = async (req, res) => {
  try {
    const { estimatedPrepMinutes } = req.body;
    if (!estimatedPrepMinutes || estimatedPrepMinutes < 1) {
      return res.status(400).json({ message: 'Valid prep time (minutes) is required.' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    order.estimatedPrepMinutes = estimatedPrepMinutes;
    order.estimatedReadyAt = new Date(Date.now() + estimatedPrepMinutes * 60000);
    await order.save();

    const io = req.app.get('io');
    if (io) {
      const payload = { orderId: order._id, estimatedPrepMinutes, estimatedReadyAt: order.estimatedReadyAt };
      io.to(`order-${order._id}`).emit('restaurant:orderUpdated', payload);
      io.to('restaurant-managers').emit('restaurant:orderUpdated', payload);
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── PUT /api/orders/:id/items/:itemId/cancel ───────────────────────────────────
exports.cancelItem = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const item = order.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    if (item.status === 'cancelled') return res.status(400).json({ message: 'Item already cancelled.' });

    item.status = 'cancelled';
    item.cancelledAt = new Date();
    item.cancelledBy = req.user.role;
    if (reason) item.cancelReason = reason;

    if (['online', 'upi', 'card'].includes(order.paymentMethod) && order.paymentStatus === 'paid') {
      item.refundStatus = 'pending';
    }

    await order.save();

    const populated = await Order.findById(order._id)
      .populate('tableId', 'label tableNumber section')
      .populate('customerId', 'name phone');

    const io = req.app.get('io');
    if (io) {
      const payload = { orderId: order._id, itemId: req.params.itemId, order: populated };
      io.to('restaurant-managers').emit('restaurant:itemCancelled', payload);
      io.to(`order-${order._id}`).emit('restaurant:itemCancelled', payload);
      io.emit('order:status-update');
    }

    res.json({ order: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// ── PUT /api/orders/:id/items/:itemId/refund ───────────────────────────────────
exports.refundItem = async (req, res) => {
  try {
    const { note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const item = order.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    if (item.refundStatus !== 'pending') {
      return res.status(400).json({ message: 'Item is not pending refund.' });
    }

    item.refundStatus = 'refunded';
    item.status = 'refunded';
    item.refundedAt = new Date();
    item.refundNote = note || 'Manual refund by manager';
    item.refundedBy = req.user.userId;

    await order.save();

    const populated = await Order.findById(order._id)
      .populate('tableId', 'label tableNumber section')
      .populate('customerId', 'name phone');

    const io = req.app.get('io');
    if (io) {
      const payload = { orderId: order._id, itemId: req.params.itemId, order: populated };
      io.to('restaurant-managers').emit('restaurant:itemRefunded', payload);
      io.to(`order-${order._id}`).emit('restaurant:itemRefunded', payload);
      io.emit('order:status-update');
    }

    res.json({ order: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// ── POST /api/orders/direct  and  /api/orders/table-order  (public) ───────────
// Strict item resolution. Razorpay signature + amount verified before paymentStatus:'paid'.
exports.createDirect = async (req, res) => {
  try {
    const {
      items, customerName, customerPhone, orderType, deliveryAddress,
      deliveryLocation, specialInstructions, tableId, customerId,
      paymentMethod, razorpayOrderId, razorpayPaymentId, razorpaySignature,
      couponCode, couponId: clientCouponId,
    } = req.body;

    if (!items?.length) {
      return res.status(400).json({ message: 'Order must include at least one item.' });
    }

    const normalizedOrderType = orderType || (tableId ? 'table' : 'pickup');
    if (normalizedOrderType === 'delivery' && !deliveryAddress) {
      return res.status(400).json({ message: 'Delivery address is required.' });
    }

    const instructions = specialInstructions ? String(specialInstructions).trim().slice(0, 500) : undefined;

    // Strict price resolution — reject any item with invalid menuItemId or size
    let resolvedItems;
    try {
      resolvedItems = await Promise.all(items.map(async (item) => {
        const price = await resolveItemPriceFromDB(item);
        return { ...item, price };
      }));
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const subtotal = resolvedItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryCharge = await calcDeliveryCharge(normalizedOrderType, subtotal);
    let totalAmount = subtotal + deliveryCharge;

    // Apply coupon discount server-side (on subtotal only, not delivery)
    let couponDiscountAmt = 0;
    let validatedCouponId = null;
    let validatedCouponCode = null;
    if (couponCode) {
      try {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
        if (
          coupon &&
          coupon.isActive &&
          !coupon.archivedAt &&
          (coupon.targetType === 'food' || coupon.targetType === 'both')
        ) {
          const now = new Date();
          const notExpired = (!coupon.startsAt || now >= coupon.startsAt) && (!coupon.endsAt || now <= coupon.endsAt);
          const withinLimit = coupon.usageLimitTotal == null || coupon.usedCount < coupon.usageLimitTotal;
          const meetsMin = !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount;
          if (notExpired && withinLimit && meetsMin) {
            let calcDiscount;
            if (coupon.discountType === 'percentage') {
              const pct = (coupon.discountValue / 100) * subtotal;
              const cap = coupon.maxDiscountAmount != null ? coupon.maxDiscountAmount : Infinity;
              calcDiscount = Math.min(pct, cap);
            } else {
              calcDiscount = Math.min(coupon.discountValue, subtotal);
            }
            couponDiscountAmt = Math.max(0, Math.round(calcDiscount * 100) / 100);
            totalAmount = Math.max(0, totalAmount - couponDiscountAmt);
            validatedCouponId = coupon._id;
            validatedCouponCode = coupon.code;
          }
        }
      } catch (_) { /* non-fatal */ }
    }

    // Razorpay: verify signature + check captured amount before accepting 'paid'
    let finalPaymentStatus = 'pending';
    let savedRazorpayPaymentId;
    let savedRazorpayOrderId;

    if (paymentMethod === 'razorpay') {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({ message: 'razorpayOrderId, razorpayPaymentId, and razorpaySignature are required.' });
      }

      const { verifyPaymentSignature, fetchPaymentDetails } = require('../config/razorpay');

      const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      if (!isValid) {
        return res.status(400).json({ message: 'Payment signature verification failed.' });
      }

      const payment = await fetchPaymentDetails(razorpayPaymentId);
      if (payment.status !== 'captured') {
        return res.status(400).json({ message: `Payment not captured. Razorpay status: ${payment.status}.` });
      }

      const expectedPaise = Math.round(totalAmount * 100);
      if (payment.amount !== expectedPaise) {
        return res.status(400).json({
          message: `Payment amount mismatch: expected ₹${totalAmount} but Razorpay received ₹${payment.amount / 100}.`,
        });
      }

      finalPaymentStatus = 'paid';
      savedRazorpayPaymentId = razorpayPaymentId;
      savedRazorpayOrderId = razorpayOrderId;
    }

    const effectiveCustomerId = req.user?.userId || customerId;

    const order = await Order.create({
      tableId,
      customerId: effectiveCustomerId,
      customerName,
      customerPhone,
      orderType: normalizedOrderType,
      deliveryAddress,
      deliveryLocation,
      items: resolvedItems,
      subtotal,
      gstAmount: 0,
      deliveryCharge,
      totalAmount,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: finalPaymentStatus,
      specialInstructions: instructions,
      razorpayOrderId: savedRazorpayOrderId,
      razorpayPaymentId: savedRazorpayPaymentId,
      // Coupon snapshot
      ...(validatedCouponId && {
        couponId: validatedCouponId,
        couponCode: validatedCouponCode,
        couponDiscountAmount: couponDiscountAmt,
        originalAmount: subtotal + deliveryCharge + couponDiscountAmt,
        finalAmount: totalAmount,
      }),
    });

    const populated = await order.populate('tableId', 'label tableNumber section');

    // Record coupon usage if applicable
    if (validatedCouponId && effectiveCustomerId) {
      try {
        await Coupon.findByIdAndUpdate(validatedCouponId, { $inc: { usedCount: 1 } });
        await CouponUsage.create({
          couponId: validatedCouponId,
          userId: effectiveCustomerId,
          orderType: 'food',
          referenceId: order._id,
          discountAmount: couponDiscountAmt,
          usedAt: new Date(),
        });
      } catch (couponErr) {
        console.error('Coupon usage record error (non-fatal):', couponErr.message);
      }
    }

    const io = req.app.get('io');
    if (io) {
      if (order.paymentMethod === 'cash' || order.paymentStatus === 'paid') {
        io.to('restaurant-managers').emit('order:new', { order: populated });
      }
      io.emit('dashboard:refresh');
    }

    if (order.paymentStatus === 'paid' && order.paymentMethod === 'razorpay') {
      const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      const recipients = [process.env.MANAGER_EMAIL, process.env.ADMIN_NOTIFICATION_EMAIL].filter(Boolean);
      recipients.forEach((email) => {
        sendAdminPaymentAlert({
          adminEmail: email,
          payerName: order.customerName || 'Guest',
          payerPhone: order.customerPhone,
          paymentType: `Food Order (${order.orderType})`,
          amount: order.totalAmount,
          paymentMode: 'Razorpay',
          invoiceNumber: order._id.toString().slice(-8).toUpperCase(),
          timestamp,
        }).catch(() => {});
      });
    }

    res.status(201).json({ order: populated });
  } catch (error) {
    console.error('Direct order create error:', error.message, error.stack);
    res.status(500).json({ message: error.message || 'Server error.' });
  }
};

// ── POST /api/orders/create-razorpay-order ─────────────────────────────────────
// Accepts items[] + orderType to calculate the authoritative amount on the backend.
// items: [{ menuItemId, size, quantity }]
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { items, orderType, couponCode } = req.body;

    let serverAmount;
    let subtotalForCoupon;

    if (items?.length) {
      // Strict: same validation as createDirect — reject bad menuItemId/size
      let resolvedItems;
      try {
        resolvedItems = await Promise.all(items.map(async (item) => {
          const price = await resolveItemPriceFromDB(item);
          return { ...item, price };
        }));
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }
      subtotalForCoupon = resolvedItems.reduce((s, i) => s + i.price * i.quantity, 0);
      const deliveryCharge = await calcDeliveryCharge(orderType || 'pickup', subtotalForCoupon);
      serverAmount = subtotalForCoupon + deliveryCharge;
    } else {
      // Legacy fallback: client provides amount (pickup/table, no delivery charge risk)
      const { amount } = req.body;
      if (!amount) return res.status(400).json({ message: 'items[] or amount is required.' });
      serverAmount = Number(amount);
      subtotalForCoupon = serverAmount;
    }

    if (!serverAmount || serverAmount <= 0) {
      return res.status(400).json({ message: 'Order amount must be > 0.' });
    }

    // Apply coupon discount (on subtotal only, not delivery)
    let couponDiscountAmt = 0;
    let validatedCouponId = null;
    let validatedCouponCode = null;
    if (couponCode) {
      try {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
        if (
          coupon &&
          coupon.isActive &&
          !coupon.archivedAt &&
          (coupon.targetType === 'food' || coupon.targetType === 'both')
        ) {
          const now = new Date();
          const notExpired = (!coupon.startsAt || now >= coupon.startsAt) && (!coupon.endsAt || now <= coupon.endsAt);
          const withinLimit = coupon.usageLimitTotal == null || coupon.usedCount < coupon.usageLimitTotal;
          const meetsMin = !coupon.minOrderAmount || subtotalForCoupon >= coupon.minOrderAmount;
          if (notExpired && withinLimit && meetsMin) {
            let calcDiscount;
            if (coupon.discountType === 'percentage') {
              const pct = (coupon.discountValue / 100) * subtotalForCoupon;
              const cap = coupon.maxDiscountAmount != null ? coupon.maxDiscountAmount : Infinity;
              calcDiscount = Math.min(pct, cap);
            } else {
              calcDiscount = Math.min(coupon.discountValue, subtotalForCoupon);
            }
            couponDiscountAmt = Math.max(0, Math.round(calcDiscount * 100) / 100);
            serverAmount = Math.max(0, serverAmount - couponDiscountAmt);
            validatedCouponId = coupon._id;
            validatedCouponCode = coupon.code;
          }
        }
      } catch (_) { /* non-fatal */ }
    }

    const { createRazorpayOrder } = require('../config/razorpay');
    const order = await createRazorpayOrder({
      amount: Math.round(serverAmount * 100),
      currency: 'INR',
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      serverAmount,
      couponApplied: validatedCouponId ? {
        couponId: validatedCouponId,
        couponCode: validatedCouponCode,
        discountAmount: couponDiscountAmt,
      } : null,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Failed to create payment order.' });
  }
};

// ── internal: deduct inventory on delivery ─────────────────────────────────────
async function deductInventoryForOrder(order) {
  try {
    for (const item of order.items) {
      if (!item.menuItemId) continue;
      const inventoryItems = await Inventory.find({
        'linkedMenuItems.menuItemId': item.menuItemId,
        isActive: true,
      });
      for (const inv of inventoryItems) {
        const link = inv.linkedMenuItems.find(
          l => l.menuItemId.toString() === item.menuItemId.toString()
        );
        if (link) {
          const deduction = link.quantityUsed * item.quantity;
          inv.quantity = Math.max(0, inv.quantity - deduction);
          await inv.save();
          if (inv.quantity <= inv.threshold) {
            console.log(`⚠️ Low stock: ${inv.name} (${inv.quantity} ${inv.unit} remaining)`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Inventory deduction error:', error.message);
  }
}
