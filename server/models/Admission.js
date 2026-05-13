const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  admissionNumber: {
    type: String,
    unique: true,
  },
  photo: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: '',
  },
  address: {
    type: String,
    trim: true,
    default: '',
  },
  emergencyContact: {
    type: String,
    trim: true,
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
  },
  membershipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership',
  },
  sportsIncluded: [{
    type: String,
    enum: ['cricket', 'swimming', 'gym', 'turf', 'badminton', 'football', 'yoga'],
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active',
  },
  // CRITICAL: tracks whether fees are paid or pending
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'partial'],
    default: 'pending',
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Auto-generate admission number
admissionSchema.pre('save', async function (next) {
  if (!this.admissionNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Admission').countDocuments();
    this.admissionNumber = `RB-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Admission', admissionSchema);
