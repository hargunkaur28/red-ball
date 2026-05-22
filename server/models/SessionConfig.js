const mongoose = require('mongoose');

const sessionConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  type: {
    type: String,
    enum: ['global', 'sport'],
    required: true,
  },
  sportSlug: {
    type: String,
    trim: true,
    lowercase: true,
    default: null,
  },
  allowedDurationMinutes: {
    type: Number,
    required: true,
    default: 75,
    min: 5,
    max: 1440,
  },
  overtimeThresholdMinutes: {
    type: Number,
    default: 0,
    min: 0,
  },
  lateFeePerMinuteOverride: {
    type: Number,
    default: null, // null = derive from sport hourlyPrice/60
  },
  autoCheckoutAfterMinutes: {
    type: Number,
    default: 240, // 4 hours
    min: 30,
  },
  accessValidityHours: {
    type: Number,
    default: 24, // default 24 hours
    min: 1,
  },
  configVersion: {
    type: Number,
    default: 1,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Compound index for efficient lookups by type + sport
sessionConfigSchema.index({ type: 1, sportSlug: 1 });

module.exports = mongoose.model('SessionConfig', sessionConfigSchema);
