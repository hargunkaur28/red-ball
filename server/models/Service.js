const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  hourlyPrice: {
    type: Number,
    required: true,
  },
  pricingOptions: [{
    label: String,
    price: Number,
    unit: String,
    note: String,
  }],
  availability: {
    type: String,
  },
  playerCapacity: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    type: String, // URL or base64
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  arenaAssignment: {
    type: String, // e.g., "Turf A", "Court 1"
  },
  category: {
    type: String, // sports, gym, etc.
    default: 'sports'
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Service', serviceSchema);
