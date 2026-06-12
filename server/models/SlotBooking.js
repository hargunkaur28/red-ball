const mongoose = require('mongoose');

const slotBookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
  },
  slotName: {
    type: String,
  },
  sportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sport',
  },
  sportSlug: {
    type: String,
  },
  sportNameSnapshot: {
    type: String,
  },
  courtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
  },
  courtNameSnapshot: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  bookingType: {
    type: String,
    enum: ['one-time-play', 'coaching-batch', 'club-booking', 'slot-booking'],
    default: 'one-time-play',
  },
  playerName: {
    type: String,
    required: true,
  },
  playerPhone: {
    type: String,
  },
  playerEmail: {
    type: String,
  },
  numberOfPlayers: {
    type: Number,
    default: 1,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  gstAmount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'completed', 'cancelled', 'no-show'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending',
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },

  // Manual entry fields (Super Admin only)
  isManualEntry: {
    type: Boolean,
    default: false,
  },
  isReference: {
    type: Boolean,
    default: false,
  },
  amountDue: {
    type: Number,
    default: 0,
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  waivedAmount: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // Discount snapshot at time of booking
  discountApplied: {
    type: Boolean,
    default: false,
  },
  discountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SportDiscount',
  },
  discountPercent: {
    type: Number,
    default: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  originalAmount: {
    type: Number,
  },

  checkInTime: Date,
  checkOutTime: Date,
  cancellationReason: String,
  cancellationTime: Date,
  notes: String,
}, {
  timestamps: true,
});

slotBookingSchema.pre('save', async function (next) {
  if (!this.bookingId) {
    const count = await mongoose.model('SlotBooking').countDocuments();
    this.bookingId = `RB-BOOK-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

slotBookingSchema.index({ slotId: 1, status: 1 });
slotBookingSchema.index({ userId: 1 });
slotBookingSchema.index({ createdAt: -1 });
slotBookingSchema.index({ sportId: 1 });
slotBookingSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('SlotBooking', slotBookingSchema);
