const mongoose = require('mongoose');

const sportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Sport name is required'],
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },
  hourlyPrice: {
    type: Number,
    required: [true, 'Hourly price is required'],
  },
  dayPrice: {
    type: Number,
  },
  oneMonthPrice: {
    type: Number,
  },
  threeMonthPrice: {
    type: Number,
  },
  sixMonthPrice: {
    type: Number,
  },
  twelveMonthPrice: {
    type: Number,
  },
  active: {
    type: Boolean,
    default: true,
  },
  deletedAt: {
    type: Date,
  },
  memberCount: {
    type: Number,
    default: 0,
  },
  qrSlug: {
    type: String,
    unique: true,
  },
  activeOccupancy: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    default: '',
  },
  tagline: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  features: {
    type: [String],
    default: [],
  },
  images: {
    type: [String],
    default: [],
  },
  thumbnail: {
    type: String,
    default: '',
  },
  heroImage: {
    type: String,
    default: '',
  },
  rentalEquipment: {
    type: String,
    default: '',
  },
  heroIcon: {
    type: String,
    default: '',
  },

  // Day/night slot pricing
  slotPricingMode: {
    type: String,
    enum: ['flat', 'dayNight'],
    default: 'flat',
  },
  daySlotPrice: {
    type: Number,
  },
  nightSlotPrice: {
    type: Number,
  },
  nightStartTime: {
    type: String, // e.g. "18:00"
    default: '18:00',
  },

  // Training add-on for memberships
  trainingAvailable: {
    type: Boolean,
    default: false,
  },
  trainingPrice: {
    type: Number,
    default: 1000,
  },
}, {
  timestamps: true,
});

// Pre-save middleware to auto-generate a clean slug and qrSlug if not set
sportSchema.pre('save', async function (next) {
  if (!this.qrSlug) {
    this.qrSlug = require('crypto').randomBytes(16).toString('hex');
  }

  if (this.isModified('name') || !this.slug) {
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Simple collision check within pre-save
    let slugCandidate = baseSlug;
    let suffix = 1;
    const Sport = mongoose.model('Sport');
    
    while (true) {
      const existing = await Sport.findOne({ slug: slugCandidate, _id: { $ne: this._id } });
      if (!existing) {
        break;
      }
      slugCandidate = `${baseSlug}-${suffix}`;
      suffix++;
    }
    this.slug = slugCandidate;
  }
  next();
});

sportSchema.index({ active: 1, deletedAt: 1 });
sportSchema.index({ slug: 1, active: 1, deletedAt: 1 });

module.exports = mongoose.model('Sport', sportSchema);
