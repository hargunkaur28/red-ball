const OneTimePlay = require('../models/OneTimePlay');
const Payment = require('../models/Payment');
const { calculateGST } = require('../utils/gstCalculator');

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
      filter.date = { $gte: start, $lte: end };
    }

    // Fetch the plays (recent 50 entries if no date filter is passed)
    const plays = await OneTimePlay.find(filter)
      .populate('createdBy', 'name')
      .populate('paymentId')
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate today's total dynamically
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

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
    const { name, phone, sport, hours, ratePerHour, amountPaid, paymentMode } = req.body;
    const amount = hours * ratePerHour;
    const gst = calculateGST(amount);

    const play = await OneTimePlay.create({
      name, phone, sport, hours, ratePerHour,
      amount: gst.amount,
      gstAmount: gst.gstAmount,
      totalAmount: gst.totalAmount,
      createdBy: req.user.userId,
    });

    const parsedAmountPaid = amountPaid !== undefined ? parseFloat(amountPaid) : 0;
    const remainingAmount = Math.max(0, gst.totalAmount - parsedAmountPaid);
    let status = 'pending';
    if (remainingAmount === 0) status = 'paid';
    else if (parsedAmountPaid > 0) status = 'partial';

    // Auto-create Payment record so it appears on the Payments page
    const payment = await Payment.create({
      type: 'one-time-play',
      referenceId: play._id,
      amount: gst.amount,
      gstAmount: gst.gstAmount,
      gstPercent: gst.gstPercent,
      totalAmount: gst.totalAmount,
      amountPaid: Math.min(parsedAmountPaid, gst.totalAmount),
      remainingAmount,
      status,
      paymentMode: paymentMode || 'cash',
    });

    // Link payment back to the play
    play.paymentId = payment._id;
    await play.save();

    res.status(201).json({ play, payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
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
