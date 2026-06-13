const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema({
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderType: {
    type: String,
    enum: ['sports', 'food'],
    required: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  discountAmount: {
    type: Number,
  },
  usedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

couponUsageSchema.index({ couponId: 1, userId: 1 });
couponUsageSchema.index({ userId: 1 });

module.exports = mongoose.model('CouponUsage', couponUsageSchema);
