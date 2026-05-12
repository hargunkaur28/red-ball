const MenuItem = require('../models/MenuItem');
const MenuCategory = require('../models/MenuCategory');

exports.getMenu = async (req, res) => {
  try {
    const categories = await MenuCategory.find({ isActive: true }).sort({ sortOrder: 1 });
    const items = await MenuItem.find({ isActive: true }).populate('categoryId', 'name icon').sort({ name: 1 });
    res.json({ categories, items });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.getByCategory = async (req, res) => {
  try {
    const items = await MenuItem.find({ categoryId: req.params.categoryId, isActive: true });
    res.json({ items });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.createItem = async (req, res) => {
  try {
    const item = await MenuItem.create(req.body);
    const populated = await item.populate('categoryId', 'name icon');
    res.status(201).json({ item: populated });
  } catch (error) { res.status(500).json({ message: 'Server error.', error: error.message }); }
};

exports.updateItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('categoryId', 'name icon');
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    res.json({ item });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.deleteItem = async (req, res) => {
  try {
    await MenuItem.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Item archived.' });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.createCategory = async (req, res) => {
  try {
    const category = await MenuCategory.create(req.body);
    res.status(201).json({ category });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await MenuCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    res.json({ category });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};
