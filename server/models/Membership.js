const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipPlan',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'frozen', 'cancelled'],
    default: 'pending',  // CRITICAL: starts pending until payment
  },
  frozenAt: Date,
  frozenDays: {
    type: Number,
    default: 0,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  renewalHistory: [{
    date: Date,
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan' },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  }],
  reminderSentAt: [Date],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Membership', membershipSchema);
