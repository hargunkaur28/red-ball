const mongoose = require('mongoose');
require('dotenv').config();

const Payment = require('../models/Payment');
const Order = require('../models/Order');

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const payment = await Payment.findOne({ invoiceNumber: 'INV-2026-00014' });
    if (!payment) {
      console.log('Payment not found');
      process.exit(0);
    }

    console.log('Payment details:', JSON.stringify(payment, null, 2));

    if (payment.referenceId) {
      const order = await Order.findById(payment.referenceId);
      if (order) {
        console.log('Order details:', JSON.stringify(order, null, 2));
      } else {
        console.log('Linked Order not found');
      }
    } else {
      console.log('No referenceId for this payment');
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

debug();
