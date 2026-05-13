const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // e.g., "Cricket Ground A", "Football Turf 1"
  },
  sport: {
    type: String,
    required: true, // cricket, football, badminton, swimming, gym, etc.
  },
  capacity: {
    type: Number,
    default: 1, // How many people can use simultaneously
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
    type: Number, // in minutes (60, 90, 120, etc.)
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
  isPeakHour: {
    type: Boolean,
    default: false,
  },
  peakHourMultiplier: {
    type: Number,
    default: 1,
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

// Auto-calculate status based on currentBookings and capacity
slotSchema.pre('save', function (next) {
  const occupancy = (this.currentBookings / this.capacity) * 100;
  if (occupancy === 100) {
    this.status = 'full';
  } else if (occupancy >= 75) {
    this.status = 'filling-fast';
  } else if (occupancy > 0) {
    this.status = 'available';
  }
  next();
});

slotSchema.index({ date: 1, sport: 1 });
slotSchema.index({ name: 1 });

module.exports = mongoose.model('Slot', slotSchema);
