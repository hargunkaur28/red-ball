const Inventory = require('../models/Inventory');

exports.getAll = async (req, res) => {
  try {
    const items = await Inventory.find({ isActive: true })
      .populate('linkedMenuItems.menuItemId', 'name')
      .sort({ name: 1 });
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
    const { addQuantity } = req.body;
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    item.quantity += addQuantity;
    item.lastRestocked = new Date();
    await item.save();
    res.json({ item });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.getLowStock = async (req, res) => {
  try {
    const items = await Inventory.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$threshold'] },
    });
    res.json({ items, count: items.length });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.remove = async (req, res) => {
  try {
    await Inventory.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Item archived.' });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};
