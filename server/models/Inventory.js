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
    enum: ['kg', 'litre', 'pieces', 'packs', 'grams', 'ml'],
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
  threshold: {
    type: Number,
    default: 10,
  },
  costPerUnit: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    default: 'General',
  },
  // Link to menu items that consume this ingredient
  linkedMenuItems: [{
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
    },
    quantityUsed: {
      type: Number,
      default: 1,
    },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  lastRestocked: {
    type: Date,
  },
}, {
  timestamps: true,
});

inventorySchema.index({ name: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
