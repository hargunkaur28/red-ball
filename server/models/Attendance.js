const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  checkInTime: Date,
  checkOutTime: Date,
  checkedOutAt: Date,
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'early-checkout'],
    default: 'absent',
  },
  sessionStatus: {
    type: String,
    enum: ['Active', 'Completed', 'Auto Closed', 'Overtime'],
    default: 'Active',
  },
  allowedDurationMinutes: {
    type: Number,
    default: 75,
  },
  actualDurationMinutes: {
    type: Number,
    default: 0,
  },
  overtimeMinutes: {
    type: Number,
    default: 0,
  },
  lateFeePerMinute: {
    type: Number,
    default: 0,
  },
  lateAmount: {
    type: Number,
    default: 0,
  },
  hourlyRateAtCheckIn: {
    type: Number,
    default: 0,
  },
  feeCollectionStatus: {
    type: String,
    enum: ['Not Applicable', 'Pending Collection', 'Paid', 'Waived'],
    default: 'Not Applicable',
  },
  feeCollectionNote: String,
  feeCollectedAt: Date,
  feeCollectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  autoClosed: {
    type: Boolean,
    default: false,
  },
  duration: {
    type: Number, // in minutes
  },
  checkInMethod: {
    type: String,
    enum: ['manual', 'qr-scan', 'membership-id', 'app'],
  },
  sport: String,
  sportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sport',
  },
  ground: String,
  // Entitlement snapshot — frozen at check-in time
  entitlementType: {
    type: String,
    enum: ['single-sport', 'multi-sport', 'all-services', 'one-time-play'],
  },
  concurrentSessionLimit: {
    type: Number,
    default: null, // null = unlimited
  },
  isUnlimited: {
    type: Boolean,
    default: false,
  },
  activeSessionCountSnapshot: Number,
  sportNameSnapshot: String,
  membershipPlanSnapshot: String,
  // Session config snapshot — frozen at check-in time
  currentSessionConfig: {
    allowedDurationMinutes: Number,
    overtimeThresholdMinutes: Number,
    lateFeePerMinute: Number,
    configVersionSnapshot: Number,
  },
  overtimeThresholdMinutes: {
    type: Number,
    default: 0,
  },
  relatedBookingId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  relatedBookingType: {
    type: String,
    enum: ['slot-booking', 'membership', 'one-time-play', 'coaching'],
  },
  notes: String,
}, {
  timestamps: true,
});

attendanceSchema.pre('save', function (next) {
  if (this.checkInTime && this.checkOutTime) {
    const duration = (this.checkOutTime - this.checkInTime) / (1000 * 60); // in minutes
    this.duration = this.actualDurationMinutes || Math.ceil(duration);
    if (this.duration > 0) {
      this.status = this.overtimeMinutes > 0 ? 'late' : 'present';
    }
  }
  next();
});

attendanceSchema.index({ userId: 1, date: 1 });
attendanceSchema.index({ userId: 1, sport: 1, checkOutTime: 1 });
attendanceSchema.index({ userId: 1, checkOutTime: 1 });           // fast active session lookup
attendanceSchema.index({ sessionStatus: 1, checkOutTime: 1 });    // dashboard queries
attendanceSchema.index({ feeCollectionStatus: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
