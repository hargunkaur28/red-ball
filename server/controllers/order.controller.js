const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const { calculateGST } = require('../utils/gstCalculator');
const { sendAdminPaymentAlert } = require('../utils/emailService');

exports.getAll = async (req, res) => {
  try {
    const { status, date } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (date) {
      // Parse date as local noon to avoid UTC offset issues
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

exports.create = async (req, res) => {
  try {
    const { tableId, items, customerName, customerPhone, paymentMethod, specialInstructions, paymentStatus, orderType, deliveryAddress, deliveryLocation, customerId } = req.body;
    if (!items?.length) {
      return res.status(400).json({ message: 'Order must include at least one item.' });
    }
    const normalizedOrderType = orderType || (tableId ? 'table' : 'pickup');
    if (normalizedOrderType === 'delivery' && !deliveryAddress) {
      return res.status(400).json({ message: 'Delivery address is required.' });
    }
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = await Order.create({
      tableId,
      customerId: req.user ? req.user.userId : customerId,
      customerName,
      customerPhone,
      orderType: normalizedOrderType,
      deliveryAddress,
      deliveryLocation,
      items,
      subtotal,
      gstAmount: 0,
      totalAmount: subtotal,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: paymentStatus || 'pending',
      specialInstructions,
    });

    const populated = await order.populate('tableId', 'label tableNumber section');

    // Emit socket event for new order ONLY IF payment is cash or already paid
    const io = req.app.get('io');
    if (io) {
      if (order.paymentMethod === 'cash' || order.paymentStatus === 'paid') {
        io.to('restaurant-managers').emit('order:new', { order: populated });
      }
      io.emit('dashboard:refresh');
    }

    // Email alert to manager + admin for online-paid orders
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

    // CRITICAL: Auto-deduct inventory when order is DELIVERED
    if (status === 'delivered' && previousStatus !== 'delivered') {
      await deductInventoryForOrder(order);
      if (io) io.emit('inventory:updated');
    }

    if (io) {
      io.to('restaurant-managers').emit('order:updated', {
        orderId: order._id,
        status,
        order: populated,
      });
      io.to(`order-${order._id}`).emit('order:status', { orderId: order._id, status });
      io.emit('order:status-update');
      io.emit('dashboard:refresh');
    }

    res.json({ order: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

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
    
    // CRITICAL: Also cancel the linked payment record if it exists and is still pending
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

exports.getCustomerOrders = async (req, res) => {
  try {
    const filter = {
      $or: [
        { customerId: req.user.userId }
      ]
    };
    
    if (req.user.phone) {
      filter.$or.push({ customerPhone: req.user.phone });
    }

    const orders = await Order.find(filter)
      .populate('tableId', 'label')
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

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

/**
 * Auto-deduct inventory when an order is delivered.
 * Checks each menu item against linked inventory items and reduces quantities.
 */
async function deductInventoryForOrder(order) {
  try {
    for (const item of order.items) {
      if (!item.menuItemId) continue;

      // Find inventory items linked to this menu item
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

          // Check low stock threshold
          if (inv.quantity <= inv.threshold) {
            // This will be picked up by the low stock alert job
            console.log(`⚠️ Low stock alert: ${inv.name} (${inv.quantity} ${inv.unit} remaining)`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Inventory deduction error:', error.message);
  }
}

// PUT /api/orders/:id/prep-time
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

// PUT /api/orders/:id/items/:itemId/cancel
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

    // Mark refund pending for paid online orders
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

// PUT /api/orders/:id/items/:itemId/refund
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

// POST /api/orders/create-razorpay-order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json({ message: 'Amount is required.' });
    }

    const { createRazorpayOrder } = require('../config/razorpay');
    const order = await createRazorpayOrder({ 
      amount: Math.round(amount * 100), 
      currency: 'INR' 
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Failed to create payment order.' });
  }
};
