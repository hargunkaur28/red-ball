const User = require('../models/User');

exports.getAll = async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.create = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { res.status(500).json({ message: 'Server error.', error: error.message }); }
};

exports.update = async (req, res) => {
  try {
    const { password, ...updates } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.toggleActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ user });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};
