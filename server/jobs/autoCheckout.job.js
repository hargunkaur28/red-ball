const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const Sport = require('../models/Sport');
const { applySessionCheckout } = require('../utils/sessionCalculator');

const AUTO_CHECKOUT_HOURS = parseInt(process.env.AUTO_CHECKOUT_HOURS) || 4;

// Runs every 10 minutes — auto-checkout sessions active > configurable timeout
const startAutoCheckout = (io) => {
  cron.schedule('*/10 * * * *', async () => {
    try {
      const cutoff = new Date(Date.now() - AUTO_CHECKOUT_HOURS * 60 * 60 * 1000);

      // Find all stale active sessions (checked in but not out, older than cutoff)
      const staleSessions = await Attendance.find({
        checkOutTime: null,
        checkInTime: { $lt: cutoff }
      });

      if (staleSessions.length === 0) return;

      console.log(`🔄 Auto-checkout: Found ${staleSessions.length} stale session(s) older than ${AUTO_CHECKOUT_HOURS}h`);

      for (const session of staleSessions) {
        const sport = session.sport ? await Sport.findOne({ name: session.sport }) : null;
        applySessionCheckout(session, {
          checkOutTime: new Date(),
          hourlyPrice: sport?.hourlyPrice || session.hourlyRateAtCheckIn || 0,
          autoClosed: true,
        });
        session.notes = (session.notes || '') + ` [Auto-checkout after ${AUTO_CHECKOUT_HOURS}h inactivity]`;
        await session.save();

        // Decrement sport occupancy
        if (session.sport) {
          await Sport.findOneAndUpdate(
            { name: session.sport, activeOccupancy: { $gt: 0 } },
            { $inc: { activeOccupancy: -1 } }
          );
        }
      }

      // Emit dashboard refresh after all auto-checkouts
      if (io) {
        io.emit('dashboard:refresh');
        io.emit('attendance:auto-checkout', {
          count: staleSessions.length,
          timestamp: new Date()
        });
        staleSessions
          .filter((session) => (session.lateAmount || 0) > 0)
          .forEach((session) => {
            io.emit('session:overtime', {
              userId: session.userId,
              sport: session.sport,
              attendanceId: session._id,
              overtimeMinutes: session.overtimeMinutes,
              lateAmount: session.lateAmount,
              autoClosed: true,
            });
          });
      }

      console.log(`✅ Auto-checkout: Completed ${staleSessions.length} session(s)`);
    } catch (error) {
      console.error('❌ Auto-checkout job error:', error);
    }
  });
  console.log(`⏰ Auto-checkout job scheduled (every 10 min, timeout: ${AUTO_CHECKOUT_HOURS}h)`);
};

module.exports = startAutoCheckout;
