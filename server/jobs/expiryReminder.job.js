const cron = require('node-cron');
const Membership = require('../models/Membership');
const Admission = require('../models/Admission');

/**
 * Daily Expiry Checker (runs at 9:00 AM every day)
 * 1. Auto-expires memberships past end date
 * 2. Generates expiry alerts for memberships expiring within 7 days
 * 3. Updates admission status for expired memberships
 */
const startExpiryReminder = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running daily membership expiry check...');
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // 1. Auto-expire memberships past due
      const expired = await Membership.updateMany(
        { status: 'active', endDate: { $lt: now } },
        { $set: { status: 'expired' } }
      );

      if (expired.modifiedCount > 0) {
        console.log(`❌ ${expired.modifiedCount} membership(s) auto-expired`);

        // Update related admissions
        const expiredMemberships = await Membership.find({ status: 'expired' }).select('_id');
        await Admission.updateMany(
          { membershipId: { $in: expiredMemberships.map(m => m._id) }, status: 'active' },
          { $set: { status: 'expired' } }
        );
      }

      // 2. Find expiring soon memberships (within 7 days)
      const expiringSoon = await Membership.find({
        status: 'active',
        endDate: { $lte: sevenDaysFromNow, $gte: now },
      })
        .populate('studentId', 'name email phone')
        .populate('planId', 'name price');

      if (expiringSoon.length > 0) {
        console.log(`⚠️ ${expiringSoon.length} membership(s) expiring within 7 days:`);
        expiringSoon.forEach(m => {
          const daysLeft = Math.ceil((m.endDate - now) / (1000 * 60 * 60 * 24));
          console.log(`   → ${m.studentId?.name}: ${daysLeft} days left (${m.planId?.name})`);
          // TODO: Send email/SMS reminder via Brevo
        });
      }

      // 3. Check pending payments older than 3 days
      const Payment = require('../models/Payment');
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const overduePending = await Payment.countDocuments({
        status: 'pending',
        createdAt: { $lt: threeDaysAgo },
      });

      if (overduePending > 0) {
        console.log(`💰 ${overduePending} overdue pending payment(s) found`);
      }

      console.log('✅ Expiry check complete');
    } catch (error) {
      console.error('Expiry reminder error:', error.message);
    }
  });

  console.log('⏰ Expiry reminder job scheduled (daily 9:00 AM)');
};

module.exports = startExpiryReminder;
