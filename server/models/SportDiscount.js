const mongoose = require('mongoose');

const sportDiscountSchema = new mongoose.Schema({
  sportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sport',
    required: true,
  },
  sportSlug: {
    type: String,
    required: true,
  },
  sportNameSnapshot: {
    type: String,
  },
  discountPercent: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  bannerText: {
    type: String,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

sportDiscountSchema.index({ sportId: 1, isActive: 1 });
sportDiscountSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('SportDiscount', sportDiscountSchema);
