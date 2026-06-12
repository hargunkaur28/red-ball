const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema({
  sportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sport',
    required: true,
  },
  sportSlug: {
    type: String,
    required: true,
    lowercase: true,
  },
  sportNameSnapshot: {
    type: String,
  },
  name: {
    type: String,
    required: [true, 'Court name is required'],
    trim: true,
  },
  isOpen: {
    type: Boolean,
    default: true,
  },
  statusReason: {
    type: String,
    default: '',
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

courtSchema.index({ sportId: 1, isOpen: 1 });
courtSchema.index({ sportSlug: 1 });
// Unique court names per sport
courtSchema.index({ sportId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Court', courtSchema);
