const mongoose = require('mongoose');
require('dotenv').config();

const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Table = require('../models/Table');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const payments = await Payment.find({ type: 'restaurant' });
    
    let updatedCount = 0;
    for (const payment of payments) {
      if (payment.referenceId) {
        const order = await Order.findById(payment.referenceId).populate('tableId');
        if (order) {
          let modified = false;

          // NEW LOGIC: Prioritize Table Label if customer name is generic or missing
          const tableLabel = order.tableId ? order.tableId.label : '';
          const currentName = payment.customerName;
          
          if (!currentName || currentName === 'Unknown' || currentName === 'Guest Table User') {
            if (tableLabel) {
              payment.customerName = tableLabel;
              modified = true;
              console.log(`Updated Payment ${payment.invoiceNumber} Name to Table: ${tableLabel}`);
            }
          }

          if (modified) {
            await payment.save();
            updatedCount++;
          }
        }
      }
    }

    console.log(`Cleanup complete. ${updatedCount} payments updated.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

cleanup();
