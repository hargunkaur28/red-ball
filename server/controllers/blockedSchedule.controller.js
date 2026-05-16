const BlockedSchedule = require('../models/BlockedSchedule');

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
    const blocked = await BlockedSchedule.find(filter).sort({ date: 1, startTime: 1 });
    res.json({ success: true, blocked });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const blocked = await BlockedSchedule.create(req.body);
    res.status(201).json({ success: true, blocked });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const blocked = await BlockedSchedule.findByIdAndDelete(req.params.id);
    if (!blocked) return res.status(404).json({ success: false, message: 'Block entry not found' });
    res.json({ success: true, message: 'Block entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
