const cron = require('node-cron');
const OneTimeAccess = require('../models/OneTimeAccess');
const { invalidateEntitlementCache } = require('../utils/entitlementEngine');

const startExpireOneTimeAccess = (io) => {
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date();
      const expiredPasses = await OneTimeAccess.find({
        accessStatus: 'unused',
        expiresAt: { $lte: now },
      });

      if (expiredPasses.length === 0) return;

      console.log(`🔄 Expiry Job: Expiring ${expiredPasses.length} unused pass(es)`);

      for (const pass of expiredPasses) {
        pass.accessStatus = 'expired';
        await pass.save();
        invalidateEntitlementCache(pass.userId);
      }

      if (io) {
        io.emit('dashboard:refresh');
      }

      console.log(`✅ Expiry Job: Successfully expired ${expiredPasses.length} pass(es)`);
    } catch (error) {
      console.error('❌ Expiry Job error:', error);
    }
  });
  console.log('⏰ Expiry Job for One-Time Prepaid Access scheduled (every 15 min)');
};

module.exports = startExpireOneTimeAccess;
