require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

async function checkLatest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const orders = await Order.find().sort({ createdAt: -1 }).limit(1);
    console.log(JSON.stringify(orders.map(o => ({
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerId: o.customerId,
      createdAt: o.createdAt
    })), null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
checkLatest();
