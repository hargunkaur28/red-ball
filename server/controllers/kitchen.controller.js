const RestaurantSettings = require('../models/RestaurantSettings');

exports.getStatus = async (req, res) => {
  try {
    let settings = await RestaurantSettings.findOne();
    if (!settings) {
      settings = await RestaurantSettings.create({ kitchenStatus: 'open' });
    }
    res.json({ kitchenStatus: settings.kitchenStatus, updatedAt: settings.kitchenStatusUpdatedAt });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['open', 'busy', 'closed', 'maintenance'];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: 'Invalid kitchen status.' });
    }

    let settings = await RestaurantSettings.findOne();
    if (!settings) {
      settings = new RestaurantSettings({});
    }
    settings.kitchenStatus = status;
    settings.kitchenStatusUpdatedAt = new Date();
    settings.kitchenStatusUpdatedBy = req.user.userId;
    await settings.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('restaurant:kitchenStatus', { status, updatedAt: settings.kitchenStatusUpdatedAt });
    }

    res.json({ kitchenStatus: settings.kitchenStatus, updatedAt: settings.kitchenStatusUpdatedAt });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
