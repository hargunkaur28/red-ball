const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['food', 'sports', 'coaching', 'facilities'],
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
  },
  images: [String],
  status: {
    type: String,
    enum: ['pending', 'approved', 'hidden'],
    default: 'pending',
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  reportCount: {
    type: Number,
    default: 0,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: Date,
  editedAt: Date,
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

reviewSchema.index({ status: 1, isFeatured: 1 });
reviewSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
