const mongoose = require('mongoose');

const slotBookingSchema = new mongoose.Schema({
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    required: true,
  },
  slotName: {
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
    type: Number, // in minutes
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
    enum: ['confirmed', 'checked-in', 'completed', 'cancelled', 'no-show'],
    default: 'confirmed',
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
  checkInTime: Date,
  checkOutTime: Date,
  cancellationReason: String,
  cancellationTime: Date,
  notes: String,
}, {
  timestamps: true,
});

slotBookingSchema.index({ slotId: 1, status: 1 });
slotBookingSchema.index({ userId: 1 });
slotBookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SlotBooking', slotBookingSchema);
