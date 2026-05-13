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
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'early-checkout'],
    default: 'absent',
  },
  duration: {
    type: Number, // in minutes
  },
  checkInMethod: {
    type: String,
    enum: ['manual', 'qr-scan', 'membership-id', 'app'],
  },
  sport: String,
  ground: String,
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
    this.duration = Math.floor(duration);
    if (this.duration > 0) {
      this.status = 'present';
    }
  }
  next();
});

attendanceSchema.index({ userId: 1, date: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
