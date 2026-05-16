const mongoose = require('mongoose');
require('dotenv').config();

const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Table = require('../models/Table');

async function listAll() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const payments = await Payment.find({ type: 'restaurant' }).sort({ createdAt: -1 });
    console.log(`Total restaurant payments: ${payments.length}`);

    for (const p of payments) {
      const order = await Order.findById(p.referenceId).populate('tableId');
      console.log(`---
Invoice: ${p.invoiceNumber}
Customer in Payment: ${p.customerName}
Status in Payment: ${p.status}
Order Status: ${order ? order.status : 'N/A'}
Order Payment Status: ${order ? order.paymentStatus : 'N/A'}
Table: ${order && order.tableId ? order.tableId.label : 'N/A'}
Customer in Order: ${order ? order.customerName : 'N/A'}
---`);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

listAll();
