const OneTimePlay = require('../models/OneTimePlay');
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
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: today, $lte: endOfDay };
    }

    const plays = await OneTimePlay.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    const todayTotal = plays.reduce((sum, p) => sum + p.totalAmount, 0);

    res.json({ plays, todayTotal });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/onetimeplay
exports.create = async (req, res) => {
  try {
    const { name, phone, sport, hours, ratePerHour } = req.body;
    const amount = hours * ratePerHour;
    const gst = calculateGST(amount);

    const play = await OneTimePlay.create({
      name, phone, sport, hours, ratePerHour,
      amount: gst.amount,
      gstAmount: gst.gstAmount,
      totalAmount: gst.totalAmount,
      createdBy: req.user.userId,
    });

    res.status(201).json({ play });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
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
