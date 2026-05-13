const Payment = require('../models/Payment');
const Membership = require('../models/Membership');
const Admission = require('../models/Admission');
const { calculateGST } = require('../utils/gstCalculator');

// GET /api/payments
exports.getAll = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const payments = await Payment.find(filter)
      .populate('studentId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    // Summary stats
    const paidTotal = await Payment.aggregate([
      { $match: { status: { $in: ['paid', 'partial'] } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$amountPaid', '$totalAmount'] } } } },
    ]);
    const pendingTotal = await Payment.aggregate([
      { $match: { status: { $in: ['pending', 'partial'] } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$remainingAmount', '$totalAmount'] } } } },
    ]);

    res.json({
      payments,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      paidTotal: paidTotal[0]?.total || 0,
      pendingTotal: pendingTotal[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/payments/create-order (Razorpay online payment)
exports.createOrder = async (req, res) => {
  try {
    const { amount, type, studentId, referenceId, gstPercent = 18 } = req.body;
    const gst = calculateGST(amount, gstPercent);

    const payment = await Payment.create({
      studentId,
      type,
      referenceId,
      amount: gst.amount,
      gstAmount: gst.gstAmount,
      gstPercent: gst.gstPercent,
      totalAmount: gst.totalAmount,
      amountPaid: 0,
      remainingAmount: gst.totalAmount,
      status: 'pending',
      paymentMode: 'razorpay',
    });

    // In production: create actual Razorpay order
    const razorpayOrder = {
      id: `order_${Date.now()}`,
      amount: gst.totalAmount * 100,
      currency: 'INR',
    };

    payment.razorpayOrderId = razorpayOrder.id;
    await payment.save();

    res.json({ payment, razorpayOrder });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// POST /api/payments/verify — Verify online payment and ACTIVATE everything
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    // In production: verify HMAC signature with Razorpay secret
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.amountPaid = payment.totalAmount;
    payment.remainingAmount = 0;
    payment.status = 'paid';
    await payment.save();

    // CRITICAL: Activate related records after successful payment
    await activateOnPaymentSuccess(payment, req);

    res.json({ payment, message: 'Payment verified and activated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/payments/manual — Manual cash/UPI/card payment
exports.manualPayment = async (req, res) => {
  try {
    const { amount, type, studentId, referenceId, paymentMode, gstPercent = 18 } = req.body;
    const gst = calculateGST(amount, gstPercent);

    const payment = await Payment.create({
      studentId,
      type,
      referenceId,
      amount: gst.amount,
      gstAmount: gst.gstAmount,
      gstPercent: gst.gstPercent,
      totalAmount: gst.totalAmount,
      amountPaid: gst.totalAmount,
      remainingAmount: 0,
      status: 'paid',
      paymentMode,
    });

    // CRITICAL: Activate related records after manual payment
    await activateOnPaymentSuccess(payment, req);

    res.status(201).json({ payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// POST /api/payments/:id/mark-paid — Mark a pending payment as paid or partial
exports.markPaid = async (req, res) => {
  try {
    const { paymentMode, amountPaid } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    if (payment.status === 'paid') {
      return res.status(400).json({ message: 'Payment is already fully paid.' });
    }

    // Default to paying the remaining amount if amountPaid is not provided
    const addition = amountPaid !== undefined ? parseFloat(amountPaid) : payment.remainingAmount;
    const newAmountPaid = (payment.amountPaid || 0) + addition;

    payment.amountPaid = Math.min(newAmountPaid, payment.totalAmount);
    payment.remainingAmount = Math.max(0, payment.totalAmount - payment.amountPaid);
    
    // Treat floating point fractional dust (< 1 Rupee) as fully settled
    if (payment.remainingAmount < 1) {
      payment.remainingAmount = 0;
      payment.amountPaid = payment.totalAmount;
      payment.status = 'paid';
    } else {
      payment.status = 'partial';
    }

    payment.paymentMode = paymentMode || payment.paymentMode || 'cash';
    await payment.save();

    // CRITICAL: Activate related records if fully paid
    if (payment.status === 'paid') {
      await activateOnPaymentSuccess(payment, req);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('dashboard:refresh');
      io.emit('payment:success');
    }

    res.json({ payment, message: `Payment updated. Status: ${payment.status}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/payments/:id/refund
exports.refundPayment = async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    payment.status = 'refunded';
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    payment.refundedBy = req.user.userId;
    await payment.save();

    // Deactivate membership if it was a membership payment
    if (payment.type === 'membership') {
      await Membership.findOneAndUpdate(
        { paymentId: payment._id },
        { status: 'cancelled' }
      );
      await Admission.findOneAndUpdate(
        { membershipId: { $exists: true }, studentId: payment.studentId },
        { paymentStatus: 'pending' }
      );
    }

    const io = req.app.get('io');
    if (io) io.emit('payment:refunded', { paymentId: payment._id });

    res.json({ payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/payments/:id/invoice (JSON data)
exports.getInvoice = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('studentId', 'name email phone');
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    res.json({ payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/payments/:id/invoice/print (HTML)
exports.printInvoice = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('studentId', 'name email phone');
    if (!payment) return res.status(404).send('<h1>Invoice not found</h1>');

    const { buildInvoiceHTML } = require('../utils/invoiceBuilder');

    const html = buildInvoiceHTML({
      invoiceNumber: payment.invoiceNumber,
      date: new Date(payment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      studentName: payment.studentId?.name || 'Walk-in Customer',
      studentPhone: payment.studentId?.phone || '',
      studentEmail: payment.studentId?.email || '',
      items: [{
        description: payment.type === 'membership' ? 'Membership Fee'
          : payment.type === 'one-time-play' ? 'One-Time Play Booking'
          : payment.type === 'restaurant' ? 'Restaurant Order'
          : 'Payment',
        quantity: 1,
        rate: payment.amount,
        amount: payment.amount,
      }],
      subtotal: payment.amount,
      gstPercent: payment.gstPercent || 18,
      gstAmount: payment.gstAmount,
      totalAmount: payment.totalAmount,
      paymentMode: payment.paymentMode,
      paymentId: payment.razorpayPaymentId || payment._id,
      status: payment.status?.toUpperCase(),
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Invoice render error:', error);
    res.status(500).send('<h1>Error generating invoice</h1>');
  }
};

/**
 * CRITICAL HELPER: Activate all related records when payment succeeds.
 * This is the single source of truth for payment → activation logic.
 */
async function activateOnPaymentSuccess(payment, req) {
  const io = req.app.get('io');

  if (payment.type === 'membership') {
    // Activate the membership
    const membership = await Membership.findOneAndUpdate(
      { paymentId: payment._id },
      { status: 'active' },
      { new: true }
    );

    // Update admission paymentStatus
    if (membership) {
      await Admission.findOneAndUpdate(
        { membershipId: membership._id },
        { paymentStatus: 'paid' }
      );
    }
  }

  // Emit realtime updates
  if (io) {
    io.emit('payment:success', {
      paymentId: payment._id,
      studentId: payment.studentId,
      type: payment.type,
      amount: payment.totalAmount,
    });
    io.emit('dashboard:refresh');
  }
}
