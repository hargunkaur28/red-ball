require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

async function checkOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const orders = await Order.find().sort({ createdAt: -1 }).limit(3);
    console.log(JSON.stringify(orders.map(o => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      customerName: o.customerName,
      createdAt: o.createdAt
    })), null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
checkOrders();
