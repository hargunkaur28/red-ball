const RestaurantSettings = require('../models/RestaurantSettings');

const ensureSettings = async () => {
  let s = await RestaurantSettings.findOne();
  if (!s) s = await RestaurantSettings.create({ kitchenStatus: 'open' });
  return s;
};

exports.getStatus = async (req, res) => {
  try {
    const settings = await ensureSettings();
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

    const settings = await ensureSettings();
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

// GET /api/kitchen/delivery-settings  (public — customer checkout needs it)
exports.getDeliverySettings = async (req, res) => {
  try {
    const settings = await ensureSettings();
    res.json({
      deliveryChargeEnabled: settings.deliveryChargeEnabled,
      freeDeliveryMinAmount: settings.freeDeliveryMinAmount,
      deliveryChargeBelowMin: settings.deliveryChargeBelowMin,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/kitchen/delivery-settings  (superadmin, admin, manager)
exports.updateDeliverySettings = async (req, res) => {
  try {
    const { deliveryChargeEnabled, freeDeliveryMinAmount, deliveryChargeBelowMin } = req.body;
    const settings = await ensureSettings();

    if (typeof deliveryChargeEnabled === 'boolean') {
      settings.deliveryChargeEnabled = deliveryChargeEnabled;
    }
    if (freeDeliveryMinAmount !== undefined) {
      const v = Number(freeDeliveryMinAmount);
      if (isNaN(v) || v < 0) return res.status(400).json({ message: 'freeDeliveryMinAmount must be >= 0.' });
      settings.freeDeliveryMinAmount = v;
    }
    if (deliveryChargeBelowMin !== undefined) {
      const v = Number(deliveryChargeBelowMin);
      if (isNaN(v) || v < 0) return res.status(400).json({ message: 'deliveryChargeBelowMin must be >= 0.' });
      settings.deliveryChargeBelowMin = v;
    }

    await settings.save();
    res.json({
      deliveryChargeEnabled: settings.deliveryChargeEnabled,
      freeDeliveryMinAmount: settings.freeDeliveryMinAmount,
      deliveryChargeBelowMin: settings.deliveryChargeBelowMin,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
