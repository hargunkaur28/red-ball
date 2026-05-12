const cron = require('node-cron');
const Membership = require('../models/Membership');

// Runs daily at 9:00 AM
const startExpiryReminder = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const oneDayFromNow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
      const today = new Date(); today.setHours(0,0,0,0);

      // 7-day reminder
      const expiring7d = await Membership.find({
        status: 'active',
        endDate: { $gte: today, $lte: sevenDaysFromNow },
      }).populate('studentId', 'name email').populate('planId', 'name');

      for (const m of expiring7d) {
        console.log(`📧 7-day reminder for: ${m.studentId?.name} (${m.studentId?.email})`);
        // TODO: Send Brevo email template #3
      }

      // 1-day reminder
      const expiring1d = await Membership.find({
        status: 'active',
        endDate: { $gte: today, $lte: oneDayFromNow },
      }).populate('studentId', 'name email');

      for (const m of expiring1d) {
        console.log(`🚨 1-day reminder for: ${m.studentId?.name} (${m.studentId?.email})`);
        // TODO: Send Brevo email template #4
      }

      console.log(`✅ Expiry reminders: ${expiring7d.length} (7d), ${expiring1d.length} (1d)`);
    } catch (error) {
      console.error('Expiry Reminder Job Error:', error);
    }
  });
  console.log('⏰ Expiry reminder job scheduled (daily 9:00 AM)');
};

module.exports = startExpiryReminder;
