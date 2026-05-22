require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

async function updateDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // Update all orders to today's date so they show up on the dashboard
    const result = await Order.updateMany({}, { $set: { createdAt: new Date() } });
    console.log(`Updated ${result.modifiedCount} orders to today's date.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
updateDates();
