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
}, { timestamps: true });

module.exports = mongoose.model('RestaurantSettings', restaurantSettingsSchema);
