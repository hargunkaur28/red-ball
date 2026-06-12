const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  customerName: {
    type: String,
  },
  type: {
    type: String,
    enum: ['membership', 'one-time-play', 'restaurant', 'manual', 'slot-booking'],
    required: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  amount: {
    type: Number,
    required: true,
  },
  gstAmount: {
    type: Number,
    default: 0,
  },
  gstPercent: {
    type: Number,
    default: 18,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  remainingAmount: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded', 'failed', 'cancelled'],
    default: 'pending',
  },
  paymentMode: {
    type: String,
    enum: ['razorpay', 'cash', 'upi', 'card', 'bank-transfer'],
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  razorpayRefundId: String,
  pdfUrl: String,
  emailSentAt: Date,
  refundReason: String,
  refundedAt: Date,
  refundedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  failureReason: String,
  adminNote: { type: String, default: '' },
  statusUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  statusUpdatedAt: { type: Date },

  // Manual/reference payment fields
  isReference: {
    type: Boolean,
    default: false,
  },
  waivedAmount: {
    type: Number,
    default: 0,
  },
  waiverReason: {
    type: String,
    default: '',
  },
  referenceNote: {
    type: String,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // Training add-on snapshot (for membership payments)
  withTraining: {
    type: Boolean,
    default: false,
  },
  trainingAmount: {
    type: Number,
    default: 0,
  },
  basePlanAmount: {
    type: Number,
  },

  // Slot booking snapshot fields — immutable once written, used to bind verify to order
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
  },
  originalAmount: {
    type: Number,
  },
  discountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SportDiscount',
  },
  discountPercent: {
    type: Number,
    default: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

paymentSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Payment').countDocuments();
    this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  if (this.remainingAmount === undefined) {
    this.remainingAmount = this.totalAmount - (this.amountPaid || 0);
  }
  next();
});

paymentSchema.index({ studentId: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ type: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
