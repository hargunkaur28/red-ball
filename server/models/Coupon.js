const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  title: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
  maxDiscountAmount: {
    type: Number,
    default: null,
  },
  minOrderAmount: {
    type: Number,
    default: 0,
  },
  targetType: {
    type: String,
    enum: ['sports', 'food', 'both'],
    required: true,
  },
  sportIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sport',
  }],
  appliesToAllSports: {
    type: Boolean,
    default: false,
  },
  visibility: {
    type: String,
    enum: ['all', 'specific-users'],
    default: 'all',
  },
  eligibleUserIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  startsAt: {
    type: Date,
  },
  endsAt: {
    type: Date,
  },
  usageLimitTotal: {
    type: Number,
  },
  usageLimitPerUser: {
    type: Number,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  archivedAt: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, archivedAt: 1 });
couponSchema.index({ targetType: 1, isActive: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
