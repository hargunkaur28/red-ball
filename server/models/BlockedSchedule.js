const mongoose = require('mongoose');

const blockedScheduleSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String, // "14:00"
    required: true,
  },
  endTime: {
    type: String, // "15:00"
    required: true,
  },
  arena: {
    type: String, // "Turf A"
    required: true,
  },
  reason: {
    type: String, // "Maintenance", "Private Event", etc.
  },
  recurring: {
    type: Boolean,
    default: false,
  },
  recurringType: {
    type: String,
    enum: ['none', 'daily', 'weekly'],
    default: 'none'
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('BlockedSchedule', blockedScheduleSchema);
