const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: true,
    unique: true,
  },
  label: {
    type: String,
    required: true,
    trim: true,
  },
  qrCode: {
    type: String,
    default: '',
  },
  qrCodeUrl: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  capacity: {
    type: Number,
    default: 4,
  },
  section: {
    type: String,
    enum: ['Indoor', 'Outdoor', 'VIP'],
    default: 'Indoor',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Table', tableSchema);
