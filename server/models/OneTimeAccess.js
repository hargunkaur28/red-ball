const mongoose = require('mongoose');

const oneTimeAccessSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sport',
    required: true,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
  },
  accessStatus: {
    type: String,
    enum: ['unused', 'active', 'completed', 'expired', 'cancelled'],
    default: 'unused',
  },
  purchasedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  usedAt: {
    type: Date,
  },
  attendanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance',
  },
  allowedDurationMinutes: {
    type: Number,
    default: 60,
  },
  hourlyRateSnapshot: {
    type: Number,
    required: true,
  },
  lateFeePerMinuteSnapshot: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for fast querying of unused/active passes for users
oneTimeAccessSchema.index({ userId: 1, accessStatus: 1 });
oneTimeAccessSchema.index({ expiresAt: 1, accessStatus: 1 }); // for auto-expiry job

module.exports = mongoose.model('OneTimeAccess', oneTimeAccessSchema);
