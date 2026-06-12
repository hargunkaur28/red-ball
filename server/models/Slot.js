const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  // Legacy string field kept for backwards compat; prefer sportId
  sport: {
    type: String,
  },
  sportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sport',
  },
  sportSlug: {
    type: String,
    lowercase: true,
  },
  courtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
  },
  courtNameSnapshot: {
    type: String,
  },
  capacity: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    enum: ['available', 'filling-fast', 'full', 'ongoing', 'completed', 'maintenance'],
    default: 'available',
  },
  startTime: {
    type: String, // "14:00"
    required: true,
  },
  endTime: {
    type: String, // "15:00"
    required: true,
  },
  duration: {
    type: Number, // in minutes
    default: 60,
  },
  date: {
    type: Date,
    required: true,
  },
  pricePerSlot: {
    type: Number,
    required: true,
  },
  pricingType: {
    type: String,
    enum: ['flat', 'day-night'],
    default: 'flat',
  },
  priceLabel: {
    type: String,
    enum: ['day', 'night', 'custom', ''],
    default: '',
  },
  isPeakHour: {
    type: Boolean,
    default: false,
  },
  peakHourMultiplier: {
    type: Number,
    default: 1,
  },
  isBookable: {
    type: Boolean,
    default: true,
  },
  currentBookings: {
    type: Number,
    default: 0,
  },
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SlotBooking',
  }],
}, {
  timestamps: true,
});

slotSchema.pre('save', function (next) {
  // Auto-calculate status based on currentBookings and capacity
  if (this.isBookable === false && this.status !== 'maintenance') {
    this.status = 'maintenance';
  } else {
    const occupancy = (this.currentBookings / this.capacity) * 100;
    if (occupancy >= 100) {
      this.status = 'full';
    } else if (occupancy >= 75) {
      this.status = 'filling-fast';
    } else if (occupancy > 0) {
      this.status = 'available';
    }
  }
  next();
});

slotSchema.index({ date: 1, sport: 1 });
slotSchema.index({ date: 1, sportId: 1 });
slotSchema.index({ date: 1, courtId: 1 });
slotSchema.index({ name: 1 });
// Prevent duplicate slots for same court+date+startTime+endTime
slotSchema.index(
  { courtId: 1, date: 1, startTime: 1, endTime: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model('Slot', slotSchema);
