const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Menu item name is required'],
    trim: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuCategory',
  },
  category: {
    type: String,
    default: 'Snacks',
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
  calories: {
    type: Number,
    default: 250,
  },
  protein: {
    type: Number,
    default: 15,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  chefRecommended: {
    type: Boolean,
    default: false,
  },
  sizes: [{
    label: {
      type: String,
      default: 'Regular',
    },
    price: {
      type: Number,
      required: true,
    },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  isVeg: {
    type: Boolean,
    default: true,
  },
  preparationTime: {
    type: Number,
    default: 15,
  },
  tags: [{
    type: String,
  }],
}, {
  timestamps: true,
});

menuItemSchema.index({ categoryId: 1 });
menuItemSchema.index({ isActive: 1, isAvailable: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
