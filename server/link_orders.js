require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

async function linkOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find Hargun's order to get the customerId
    const hargunOrder = await Order.findOne({ orderNumber: 'ORD-0019' });
    if (!hargunOrder || !hargunOrder.customerId) {
      // If customerId is null on ORD-0019, let's find the user by phone
      const User = require('./models/User');
      const hargun = await User.findOne({ phone: '1236987450' });
      if (hargun) {
        await Order.updateMany(
          { orderNumber: { $in: ['ORD-0019', 'ORD-0020', 'ORD-0021'] } },
          { $set: { customerId: hargun._id } }
        );
        console.log('Linked all orders to Hargun User ID: ' + hargun._id);
      } else {
        console.log('Hargun user not found');
      }
    } else {
      await Order.updateMany(
        { orderNumber: { $in: ['ORD-0020', 'ORD-0021'] } },
        { $set: { customerId: hargunOrder.customerId } }
      );
      console.log('Linked all orders to Hargun customerId: ' + hargunOrder.customerId);
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
linkOrders();
