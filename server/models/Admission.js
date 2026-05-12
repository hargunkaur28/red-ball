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
    enum: ['cricket', 'swimming', 'gym', 'turf', 'badminton'],
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active',
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

admissionSchema.index({ studentId: 1 });
admissionSchema.index({ status: 1 });
admissionSchema.index({ admissionNumber: 1 });

module.exports = mongoose.model('Admission', admissionSchema);
