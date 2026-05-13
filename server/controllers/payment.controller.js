const Payment = require('../models/Payment');
const Membership = require('../models/Membership');
const Admission = require('../models/Admission');
const { calculateGST } = require('../utils/gstCalculator');
const {
  verifyPaymentSignature,
  createRazorpayOrder,
  fetchPaymentDetails,
  createRefund,
  verifyWebhookSignature,
} = require('../config/razorpay');

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
    const { amount, type, studentId, referenceId, gstPercent = 18, customerEmail, customerPhone, description } = req.body;
    const gst = calculateGST(amount, gstPercent);

    // Create payment record first
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

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder({
      amount: gst.totalAmount * 100, // Amount in paise
      currency: 'INR',
      receipt: payment._id.toString(),
      description: description || `Payment for ${type}`,
      customer_notify: 1,
      notes: {
        paymentId: payment._id.toString(),
        type,
        referenceId: referenceId?.toString() || '',
      },
    });

    // Store Razorpay order ID in payment record
    payment.razorpayOrderId = razorpayOrder.id;
    await payment.save();

    res.json({
      payment,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order.', error: error.message });
  }
};

// POST /api/payments/verify — Verify online payment and ACTIVATE everything
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Verify signature
    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid payment signature.' });
    }

    // Find payment record
    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    // Fetch payment details from Razorpay to verify amount and status
    const paymentDetails = await fetchPaymentDetails(razorpayPaymentId);
    if (paymentDetails.status !== 'captured') {
      return res.status(400).json({ message: 'Payment not captured by Razorpay.' });
    }

    // Update payment record
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.amountPaid = payment.totalAmount;
    payment.remainingAmount = 0;
    payment.status = 'paid';
    await payment.save();

    // CRITICAL: Activate related records after successful payment
    await activateOnPaymentSuccess(payment, req);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('payment:success', {
        paymentId: payment._id,
        type: payment.type,
        studentId: payment.studentId,
      });
      io.emit('dashboard:refresh');
    }

    res.json({ payment, message: 'Payment verified and activated successfully.' });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
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
    const { reason, fullRefund = true } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    if (payment.status === 'refunded') {
      return res.status(400).json({ message: 'Payment already refunded.' });
    }

    if (payment.status !== 'paid' && payment.status !== 'partial') {
      return res.status(400).json({ message: 'Only paid/partial payments can be refunded.' });
    }

    // Create refund via Razorpay if payment was via Razorpay
    if (payment.razorpayPaymentId) {
      try {
        const refundAmount = fullRefund ? payment.amountPaid : req.body.refundAmount;
        const refund = await createRefund(payment.razorpayPaymentId, refundAmount);
        payment.razorpayRefundId = refund.id;
      } catch (refundError) {
        console.error('Razorpay refund error:', refundError);
        return res.status(500).json({ message: 'Failed to process refund via Razorpay.' });
      }
    }

    // Update payment status
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

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('payment:refunded', { paymentId: payment._id, reason });
      io.emit('dashboard:refresh');
    }

    res.json({ payment, message: 'Refund processed successfully.' });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
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

// POST /api/payments/webhook/razorpay — Webhook handler for Razorpay events
exports.webhookHandler = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.rawBody; // Ensure rawBody is available

    // Verify webhook signature
    if (!verifyWebhookSignature(req.body, signature)) {
      return res.status(401).json({ message: 'Invalid signature.' });
    }

    const event = req.body.event;
    const eventData = req.body.payload.payment.entity;

    if (event === 'payment.authorized' || event === 'payment.captured') {
      // Payment successful
      const payment = await Payment.findOne({ razorpayOrderId: eventData.order_id });
      if (payment) {
        payment.razorpayPaymentId = eventData.id;
        payment.amountPaid = payment.totalAmount;
        payment.remainingAmount = 0;
        payment.status = 'paid';
        await payment.save();
        await activateOnPaymentSuccess(payment, req);
      }
    } else if (event === 'payment.failed') {
      // Payment failed
      const payment = await Payment.findOne({ razorpayOrderId: eventData.order_id });
      if (payment) {
        payment.status = 'failed';
        await payment.save();
        const io = req.app.get('io');
        if (io) io.emit('payment:failed', { paymentId: payment._id });
      }
    } else if (event === 'refund.created' || event === 'refund.processed') {
      // Refund processed
      const payment = await Payment.findOne({ razorpayPaymentId: req.body.payload.refund.entity.payment_id });
      if (payment) {
        payment.status = 'refunded';
        await payment.save();
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing error.' });
  }
};

// POST /api/payments/:id/retry — Retry a failed payment
exports.retryPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    if (payment.status !== 'failed' && payment.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot retry this payment.' });
    }

    // Create a new Razorpay order
    const razorpayOrder = await createRazorpayOrder({
      amount: payment.totalAmount * 100,
      currency: 'INR',
      receipt: payment._id.toString(),
      description: `Retry Payment for ${payment.type}`,
      notes: {
        paymentId: payment._id.toString(),
        type: payment.type,
        retry: true,
      },
    });

    payment.razorpayOrderId = razorpayOrder.id;
    payment.status = 'pending';
    await payment.save();

    res.json({
      payment,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Retry payment error:', error);
    res.status(500).json({ message: 'Failed to retry payment.', error: error.message });
  }
};
