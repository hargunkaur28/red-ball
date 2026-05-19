const mongoose = require('mongoose');
const Membership = require('../models/Membership');

let testExpiryCheckerInterval = null;
let retryCount = 0;
const MAX_RETRIES = 3;

const startTestExpiryChecker = (io) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('⏱️ Development test expiry checker started (runs every 30s)');
    
    testExpiryCheckerInterval = setInterval(async () => {
      try {
        // Check if MongoDB connection is active before attempting operations
        if (mongoose.connection.readyState !== 1) {
          console.warn('⚠️ Test expiry checker: MongoDB connection not ready (state: ' + mongoose.connection.readyState + ')');
          retryCount++;
          
          if (retryCount >= MAX_RETRIES) {
            console.error('❌ Test expiry checker: Max retries reached. Stopping job.');
            clearInterval(testExpiryCheckerInterval);
          }
          return;
        }
        
        // Reset retry count on successful connection
        retryCount = 0;
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
        console.error('Test expiry checker error:', error.code || error.message);
        
        // Stop job if connection is aborted
        if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
          retryCount++;
          if (retryCount >= MAX_RETRIES) {
            console.error('❌ Test expiry checker: Connection aborted too many times. Stopping job.');
            clearInterval(testExpiryCheckerInterval);
          }
        }
      }
    }, 30000); // 30 seconds
  }
};

// Graceful shutdown
const stopTestExpiryChecker = () => {
  if (testExpiryCheckerInterval) {
    clearInterval(testExpiryCheckerInterval);
    console.log('⏹️ Test expiry checker stopped');
  }
};

module.exports = startTestExpiryChecker;
module.exports.stopTestExpiryChecker = stopTestExpiryChecker;
