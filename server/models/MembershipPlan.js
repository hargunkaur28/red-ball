const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
  },
  duration: {
    type: String,
    enum: ['monthly', 'quarterly', 'half-yearly'],
    required: true,
  },
  durationDays: {
    type: Number,
    required: true,
  },
  sportsIncluded: [{
    type: String,
    enum: ['cricket', 'swimming', 'gym', 'turf', 'badminton'],
  }],
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
