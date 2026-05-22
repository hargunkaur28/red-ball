const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
  },
  duration: {
    type: String, // e.g., "5 Minutes", "1 Month"
    required: true,
  },
  durationValue: {
    type: Number,
    required: true,
    default: 30,
  },
  durationUnit: {
    type: String,
    enum: ['minutes', 'hours', 'days', 'months', 'years'],
    default: 'days',
  },
  // Keep for backwards compatibility
  durationDays: {
    type: Number,
  },
  sportsIncluded: [{
    type: String,
  }],
  isAllServices: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
  },
  gstPercent: {
    type: Number,
    default: 18,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  autoSync: {
    type: Boolean,
    default: true,
  },
  features: [{
    type: String,
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);
