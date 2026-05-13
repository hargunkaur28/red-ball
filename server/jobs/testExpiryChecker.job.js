const Membership = require('../models/Membership');

const startTestExpiryChecker = (io) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('⏱️ Development test expiry checker started (runs every 30s)');
    
    setInterval(async () => {
      try {
        const now = new Date();

        // Find and update expired memberships
        const result = await Membership.updateMany(
          { status: 'active', endDate: { $lt: now } },
          { $set: { status: 'expired' } }
        );

        if (result.modifiedCount > 0) {
          console.log(`⏱️ Auto-expired ${result.modifiedCount} memberships.`);
          // Emit a refresh event to all connected dashboards
          if (io) {
            io.emit('dashboard:refresh');
          }
        }
      } catch (error) {
        console.error('Test expiry checker error:', error);
      }
    }, 30000); // 30 seconds
  }
};

module.exports = startTestExpiryChecker;
