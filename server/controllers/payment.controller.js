const Payment = require('../models/Payment');
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

    res.json({ payments, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/payments/create-order (Razorpay)
exports.createOrder = async (req, res) => {
  try {
    const { amount, type, studentId, referenceId, gstPercent = 18 } = req.body;
    const gst = calculateGST(amount, gstPercent);

    // Create payment record
    const payment = await Payment.create({
      studentId,
      type,
      referenceId,
      amount: gst.amount,
      gstAmount: gst.gstAmount,
      gstPercent: gst.gstPercent,
      totalAmount: gst.totalAmount,
      status: 'pending',
      paymentMode: 'razorpay',
    });

    // In production: create Razorpay order here
    const razorpayOrder = {
      id: `order_${Date.now()}`,
      amount: gst.totalAmount * 100, // paise
      currency: 'INR',
    };

    payment.razorpayOrderId = razorpayOrder.id;
    await payment.save();

    res.json({ payment, razorpayOrder });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// POST /api/payments/verify
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    // In production: verify HMAC signature with Razorpay
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'paid';
    await payment.save();

    // TODO: Generate PDF, upload to Cloudinary, send email

    res.json({ payment, message: 'Payment verified successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/payments/manual
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
      status: 'paid',
      paymentMode,
    });

    res.status(201).json({ payment });
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

// GET /api/payments/:id/invoice/print (HTML — opens in browser for print/save as PDF)
exports.printInvoice = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('studentId', 'name email phone');
    if (!payment) return res.status(404).send('<h1>Invoice not found</h1>');

    const { buildInvoiceHTML } = require('../utils/invoiceBuilder');

    const html = buildInvoiceHTML({
      invoiceNumber: `INV-${payment._id.toString().slice(-8).toUpperCase()}`,
      date: new Date(payment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      studentName: payment.studentId?.name || 'Walk-in Customer',
      studentPhone: payment.studentId?.phone || '',
      studentEmail: payment.studentId?.email || '',
      items: [{
        description: payment.type === 'membership' ? 'Membership Fee' : payment.type === 'admission' ? 'Admission Fee' : payment.type || 'Payment',
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
