const mongoose = require('mongoose');

const restaurantSettingsSchema = new mongoose.Schema({
  kitchenStatus: {
    type: String,
    enum: ['open', 'busy', 'closed', 'maintenance'],
    default: 'open',
  },
  kitchenStatusUpdatedAt: Date,
  kitchenStatusUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  deliveryChargeEnabled: {
    type: Boolean,
    default: false,
  },
  freeDeliveryMinAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  deliveryChargeBelowMin: {
    type: Number,
    default: 0,
    min: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('RestaurantSettings', restaurantSettingsSchema);
