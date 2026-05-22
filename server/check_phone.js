require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

async function checkPhone() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const orders = await Order.find({ orderNumber: { $in: ['ORD-0019', 'ORD-0020', 'ORD-0021'] } });
    console.log(JSON.stringify(orders.map(o => ({
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      customerName: o.customerName,
      customerPhone: o.customerPhone
    })), null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
checkPhone();
