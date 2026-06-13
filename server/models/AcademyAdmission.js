const mongoose = require('mongoose');

const academyAdmissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sport',
    required: true,
  },
  admissionPaid: {
    type: Boolean,
    default: false,
  },
  paidAt: {
    type: Date,
  },
  paymentId: {
    type: String, // razorpay payment id
  },
  amount: {
    type: Number,
  },
}, {
  timestamps: true,
});

// Unique per user + sport
academyAdmissionSchema.index({ userId: 1, sportId: 1 }, { unique: true });

module.exports = mongoose.model('AcademyAdmission', academyAdmissionSchema);
