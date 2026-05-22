const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  customerName: {
    type: String,
    trim: true,
  },
  customerPhone: {
    type: String,
    trim: true,
  },
  orderType: {
    type: String,
    enum: ['table', 'delivery', 'pickup'],
    default: 'table',
  },
  deliveryAddress: {
    type: String,
    trim: true,
  },
  deliveryLocation: {
    lat: Number,
    lng: Number,
    address: String,
    mapsUrl: String,
  },
  items: [{
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
    },
    name: String,
    size: String,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: Number,
    kitchenNote: String,
    status: {
      type: String,
      enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },
    refundStatus: {
      type: String,
      enum: ['not-required', 'pending', 'refunded'],
      default: 'not-required',
    },
    cancelledAt: Date,
    cancelledBy: String,
    cancelReason: String,
    refundedAt: Date,
    refundNote: String,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  estimatedPrepMinutes: {
    type: Number,
  },
  estimatedReadyAt: {
    type: Date,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  gstAmount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['new', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'new',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'online'],
    default: 'cash',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending',
  },
  specialInstructions: {
    type: String,
    trim: true,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  cancelledBy: {
    type: String,
    enum: ['admin', 'manager'],
  },
  cancellationReason: String,
  isRefunded: {
    type: Boolean,
    default: false,
  },
  refundedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  kotPrinted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

orderSchema.index({ status: 1 });
orderSchema.index({ tableId: 1 });
orderSchema.index({ orderType: 1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
