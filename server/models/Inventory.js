const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'litre', 'pieces', 'grams', 'ml'],
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0,
  },
  minimumStock: {
    type: Number,
    required: true,
    default: 10,
  },
  linkedMenuItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
  }],
  lastRestockedAt: Date,
  lastRestockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  history: [{
    date: { type: Date, default: Date.now },
    quantity: Number,
    type: { type: String, enum: ['restock', 'consumption', 'adjustment'] },
    note: String,
  }],
}, {
  timestamps: true,
});

inventorySchema.index({ currentStock: 1, minimumStock: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
