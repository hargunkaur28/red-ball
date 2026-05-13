const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const OneTimePlay = require('../models/OneTimePlay');
const User = require('../models/User');
const Membership = require('../models/Membership');
const Admission = require('../models/Admission');

require('dotenv').config();

const syncPaymentNames = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🔄 Syncing payment names...');

    // Get all payments without customerName
    const payments = await Payment.find({ $or: [{ customerName: null }, { customerName: { $exists: false } }] });
    console.log(`Found ${payments.length} payments to sync`);

    let synced = 0;
    let skipped = 0;

    for (const payment of payments) {
      let customerName = null;

      if (payment.type === 'one-time-play' && payment.referenceId) {
        // Get name from OneTimePlay entry
        const play = await OneTimePlay.findById(payment.referenceId);
        if (play) {
          customerName = play.name;
        }
      } else if (payment.studentId) {
        // Get name from User (for memberships and admissions)
        const user = await User.findById(payment.studentId, 'name');
        if (user) {
          customerName = user.name;
        }
      }

      if (customerName) {
        payment.customerName = customerName;
        await payment.save();
        synced++;
        console.log(`✓ ${payment.invoiceNumber}: ${customerName}`);
      } else {
        skipped++;
        console.log(`⊘ ${payment.invoiceNumber}: Could not find customer name`);
      }
    }

    console.log(`\n✅ Sync complete!`);
    console.log(`   Synced: ${synced}`);
    console.log(`   Skipped: ${skipped}`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing payment names:', error);
    process.exit(1);
  }
};

syncPaymentNames();
