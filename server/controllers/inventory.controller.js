const Inventory = require('../models/Inventory');

exports.getAll = async (req, res) => {
  try {
    const items = await Inventory.find().populate('linkedMenuItems', 'name').sort({ name: 1 });
    res.json({ items });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.create = async (req, res) => {
  try {
    const item = await Inventory.create(req.body);
    res.status(201).json({ item });
  } catch (error) { res.status(500).json({ message: 'Server error.', error: error.message }); }
};

exports.update = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    res.json({ item });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.restock = async (req, res) => {
  try {
    const { quantity, note } = req.body;
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    item.currentStock += quantity;
    item.lastRestockedAt = new Date();
    item.lastRestockedBy = req.user.userId;
    item.history.push({ quantity, type: 'restock', note });
    await item.save();
    res.json({ item });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.getLowStock = async (req, res) => {
  try {
    const items = await Inventory.find({ $expr: { $lte: ['$currentStock', '$minimumStock'] } });
    res.json({ items, count: items.length });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};
