const mongoose = require('mongoose');

const operationEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  eventType: {
    type: String,
    enum: ['coaching', 'one-time-play', 'club-booking', 'maintenance', 'cleaning', 'event'],
    required: true,
  },
  ground: {
    type: String,
    required: true, // Arena/ground name
  },
  sport: {
    type: String,
  },
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  startTime: {
    type: String, // "14:00"
    required: true,
  },
  endTime: {
    type: String, // "15:00"
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  participants: {
    type: Number,
    default: 0,
  },
  maxCapacity: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  description: String,
  color: {
    type: String,
    default: '#000000', // For UI
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    // Can reference SlotBooking, Batch, or other entities
  },
  relatedType: String, // 'slot-booking', 'batch', etc.
}, {
  timestamps: true,
});

operationEventSchema.index({ date: 1, ground: 1 });
operationEventSchema.index({ date: 1, status: 1 });
operationEventSchema.index({ ground: 1 });

module.exports = mongoose.model('OperationEvent', operationEventSchema);
