const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  sport: {
    type: String,
    required: true,
  },
  timing: {
    type: String,
    trim: true,
  },
  capacity: {
    type: Number,
    default: 30,
  },
  coach: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Batch', batchSchema);
