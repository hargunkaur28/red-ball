const mongoose = require('mongoose');
require('dotenv').config();

const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Table = require('../models/Table');

async function syncOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const orders = await Order.find({ status: { $ne: 'cancelled' } }).populate('tableId');
    
    let updatedCount = 0;
    for (const order of orders) {
      if (order.tableId && (!order.customerName || order.customerName === 'Guest Table User')) {
        order.customerName = order.tableId.label;
        await order.save();
        updatedCount++;
        console.log(`Updated Order ${order.orderNumber} Name to Table: ${order.tableId.label}`);
      }
    }

    console.log(`Sync complete. ${updatedCount} orders updated.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

syncOrders();
