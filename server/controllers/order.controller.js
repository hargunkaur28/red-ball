const Order = require('../models/Order');
const { calculateGST } = require('../utils/gstCalculator');

exports.getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const orders = await Order.find(filter).populate('tableId', 'label tableNumber').populate('customerId', 'name phone').sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.create = async (req, res) => {
  try {
    const { tableId, items } = req.body;
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const gst = calculateGST(subtotal, 5);
    const order = await Order.create({
      tableId, customerId: req.user.userId, items,
      subtotal, gstAmount: gst.gstAmount, totalAmount: gst.totalAmount,
    });
    const populated = await order.populate('tableId', 'label tableNumber');

    // Emit socket event for new order
    const io = req.app.get('io');
    if (io) io.to('restaurant-managers').emit('order:new', { order: populated });

    res.status(201).json({ order: populated });
  } catch (error) { res.status(500).json({ message: 'Server error.', error: error.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('tableId', 'label tableNumber').populate('customerId', 'name phone');
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const io = req.app.get('io');
    if (io) {
      io.to('restaurant-managers').emit('order:updated', { orderId: order._id, status });
      io.to(`order-${order._id}`).emit('order:status', { orderId: order._id, status });
    }

    res.json({ order });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { reason, refund } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    order.status = 'cancelled';
    order.cancelledBy = req.user.role;
    order.cancellationReason = reason;
    if (refund) { order.isRefunded = true; order.refundedBy = req.user.userId; order.paymentStatus = 'refunded'; }
    await order.save();

    const io = req.app.get('io');
    if (io) io.to('restaurant-managers').emit('order:cancelled', { orderId: order._id });

    res.json({ order });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.userId }).populate('tableId', 'label').sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};
