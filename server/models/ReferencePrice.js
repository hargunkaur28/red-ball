const mongoose = require('mongoose');

const referencePriceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sport', required: true },
  sportSlug: { type: String },
  sportNameSnapshot: { type: String },
  referencePrice: { type: Number, required: true, min: 0 },
  sourceBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'SlotBooking' },
  sourcePaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  active: { type: Boolean, default: true },
  note: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// One active reference price per user per sport
referencePriceSchema.index({ userId: 1, sportId: 1 }, { unique: true });

module.exports = mongoose.model('ReferencePrice', referencePriceSchema);
