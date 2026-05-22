require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

async function fixOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get the user ID from ORD-0019
    const validOrder = await Order.findOne({ orderNumber: 'ORD-0019' });
    if (!validOrder || !validOrder.customerId) {
      console.log('No valid customerId found on ORD-0019');
      process.exit(1);
    }
    const customerId = validOrder.customerId;

    // Update missing orders
    const result = await Order.updateMany(
      { orderNumber: { $in: ['ORD-0020', 'ORD-0021'] } },
      { $set: { customerId: customerId } }
    );
    
    console.log(`Fixed ${result.modifiedCount} orders by assigning customerId ${customerId}`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
fixOrders();
