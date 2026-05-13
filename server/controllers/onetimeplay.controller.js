const OneTimePlay = require('../models/OneTimePlay');
const Payment = require('../models/Payment');
const { calculateGST } = require('../utils/gstCalculator');
const razorpayConfig = require('../config/razorpay');

// GET /api/onetimeplay
exports.getAll = async (req, res) => {
  try {
    const { date } = req.query;
    const filter = {};
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    // Fetch the plays (recent 50 entries if no date filter is passed)
    const plays = await OneTimePlay.find(filter)
      .populate('createdBy', 'name')
      .populate('paymentId')
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate today's total dynamically using UTC to avoid timezone issues
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const todayTotal = plays
      .filter(p => {
        const pDate = new Date(p.createdAt);
        return pDate >= todayStart && pDate <= todayEnd;
      })
      .reduce((sum, p) => sum + p.totalAmount, 0);

    res.json({ plays, todayTotal });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/onetimeplay
exports.create = async (req, res) => {
  try {
    const { name, phone, sport, hours, ratePerHour, amountPaid, paymentMode, razorpayPaymentId, razorpayOrderId } = req.body;
    
    if (!name || !sport || !hours || !ratePerHour) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const amount = hours * ratePerHour;
    const gst = calculateGST(amount);

    const play = await OneTimePlay.create({
      name, phone, sport, hours, ratePerHour,
      amount: gst.amount,
      gstAmount: gst.gstAmount,
      totalAmount: gst.totalAmount,
      createdBy: req.user.userId,
    });

    // Handle amountPaid - convert empty string or undefined to 0
    let parsedAmountPaid = 0;
    if (amountPaid) {
      const parsed = parseFloat(amountPaid);
      parsedAmountPaid = isNaN(parsed) ? 0 : parsed;
    }

    const remainingAmount = Math.max(0, gst.totalAmount - parsedAmountPaid);
    let status = 'pending';
    if (remainingAmount === 0) status = 'paid';
    else if (parsedAmountPaid > 0) status = 'partial';

    // Auto-create Payment record so it appears on the Payments page
    const payment = await Payment.create({
      type: 'one-time-play',
      referenceId: play._id,
      customerName: name,
      amount: gst.amount,
      gstAmount: gst.gstAmount,
      gstPercent: gst.gstPercent,
      totalAmount: gst.totalAmount,
      amountPaid: Math.min(parsedAmountPaid, gst.totalAmount),
      remainingAmount,
      status,
      paymentMode: paymentMode || 'cash',
      razorpayPaymentId: razorpayPaymentId || null,
      razorpayOrderId: razorpayOrderId || null,
    });

    // Link payment back to the play
    play.paymentId = payment._id;
    await play.save();

    res.status(201).json({ play, payment });
  } catch (error) {
    console.error('OneTimePlay create error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
  }
};

// GET /api/onetimeplay/:id
exports.getById = async (req, res) => {
  try {
    const play = await OneTimePlay.findById(req.params.id).populate('createdBy', 'name');
    if (!play) return res.status(404).json({ message: 'Not found.' });
    res.json({ play });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/onetimeplay/:id
exports.delete = async (req, res) => {
  try {
    const play = await OneTimePlay.findById(req.params.id);
    if (!play) return res.status(404).json({ message: 'Entry not found.' });

    // Delete associated payment record
    if (play.paymentId) {
      await Payment.findByIdAndDelete(play.paymentId);
    }

    // Delete the play entry
    await OneTimePlay.findByIdAndDelete(req.params.id);

    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('OneTimePlay delete error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// POST /api/onetimeplay/create-razorpay-order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, gstAmount, description } = req.body;
    const totalAmount = Math.round((amount + gstAmount) * 100); // Convert to paise

    const order = await razorpayConfig.createRazorpayOrder({
      amount: totalAmount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      description: description || 'One-Time Play',
    });

    res.json({
      orderId: order.id,
      amount: totalAmount,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};
