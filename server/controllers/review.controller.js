const Review = require('../models/Review');

exports.getPublicFeatured = async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'approved', isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(8);
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    const reviews = await Review.find(filter).populate('userId', 'name email').sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.create = async (req, res) => {
  try {
    const review = await Review.create({
      ...req.body,
      userId: req.user?.userId,
      name: req.body.name || req.user?.name,
      status: 'pending',
    });
    res.status(201).json({ review, message: 'Review submitted for moderation.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateOwn = async (req, res) => {
  try {
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { ...req.body, status: 'pending', isFeatured: false },
      { new: true, runValidators: true }
    );
    if (!review) return res.status(404).json({ message: 'Review not found.' });
    res.json({ review });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteOwn = async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!review) return res.status(404).json({ message: 'Review not found.' });
    res.json({ message: 'Review deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.moderate = async (req, res) => {
  try {
    const { status, isFeatured } = req.body;
    const review = await Review.findByIdAndUpdate(req.params.id, { status, isFeatured }, { new: true });
    if (!review) return res.status(404).json({ message: 'Review not found.' });
    res.json({ review });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
