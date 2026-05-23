const Attendance = require('../models/Attendance');
const Sport = require('../models/Sport');
const { DEFAULT_ALLOWED_DURATION_MINUTES, getEffectiveConfig, applySessionCheckout } = require('../utils/sessionCalculator');
const { validateCheckIn, calculateEntitlement } = require('../utils/entitlementEngine');

// GET /api/attendance/today — Get today's attendance
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      date: { $gte: today, $lte: endOfDay },
    })
      .populate('userId', 'name email phone')
      .sort({ checkInTime: -1 });

    const stats = {
      totalPresent: attendance.filter((a) => a.status === 'present').length,
      totalAbsent: attendance.filter((a) => a.status === 'absent').length,
      totalLate: attendance.filter((a) => a.status === 'late').length,
      totalCheckedIn: attendance.filter((a) => a.checkInTime).length,
    };

    res.json({ attendance, stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/attendance/active-sessions — Current user's ALL active timed sport sessions
exports.getActiveSessions = async (req, res) => {
  try {
    const activeSessions = await Attendance.find({
      userId: req.user.userId,
      checkOutTime: null,
      sessionStatus: 'Active',
    })
      .populate('userId', 'name email phone')
      .sort({ checkInTime: -1 });

    // Get entitlement info for context
    const entitlement = await calculateEntitlement(req.user.userId);

    const remainingSlots = entitlement.isAllServices
      ? null
      : Math.max(0, entitlement.concurrentSessionLimit - activeSessions.length);

    res.json({
      activeSessions,
      sessionCount: activeSessions.length,
      entitlement: {
        type: entitlement.entitlementType,
        concurrentSessionLimit: entitlement.concurrentSessionLimit === null ? 'unlimited' : entitlement.concurrentSessionLimit,
        remainingSlots: entitlement.isUnlimited ? 'unlimited' : remainingSlots,
        isUnlimited: entitlement.isUnlimited,
        allowedSports: entitlement.allowedSports,
      },
      serverTime: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/attendance/entitlement — Current user's entitlement status + active sessions
exports.getEntitlementStatus = async (req, res) => {
  try {
    const entitlement = await calculateEntitlement(req.user.userId);

    const activeSessions = await Attendance.find({
      userId: req.user.userId,
      checkOutTime: null,
      sessionStatus: 'Active',
    })
      .select('sport sportId checkInTime sessionStatus allowedDurationMinutes entitlementType')
      .sort({ checkInTime: -1 });

    const remainingSlots = entitlement.isAllServices
      ? null
      : Math.max(0, entitlement.concurrentSessionLimit - activeSessions.length);

    res.json({
      entitlement: {
        type: entitlement.entitlementType,
        concurrentSessionLimit: entitlement.concurrentSessionLimit === null ? 'unlimited' : entitlement.concurrentSessionLimit,
        remainingSlots: entitlement.isUnlimited ? 'unlimited' : remainingSlots,
        isUnlimited: entitlement.isUnlimited,
        allowedSports: entitlement.allowedSports,
      },
      activeSessions: activeSessions.map(s => ({
        _id: s._id,
        sport: s.sport,
        checkInTime: s.checkInTime,
        sessionStatus: s.sessionStatus,
        allowedDurationMinutes: s.allowedDurationMinutes,
      })),
      sessionCount: activeSessions.length,
      serverTime: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/attendance/user/:userId — Get user attendance history
exports.getUserAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { userId: req.params.userId };

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(filter)
      .populate('userId', 'name email phone')
      .sort({ checkInTime: -1 });

    // Calculate stats
    const stats = {
      totalDays: attendance.length,
      present: attendance.filter((a) => a.status === 'present').length,
      absent: attendance.filter((a) => a.status === 'absent').length,
      late: attendance.filter((a) => a.status === 'late').length,
      averageDuration:
        attendance.filter((a) => a.duration).reduce((sum, a) => sum + a.duration, 0) /
        attendance.filter((a) => a.duration).length,
    };

    res.json({ attendance, stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/attendance/check-in — Check in a user (admin/receptionist manual check-in)
exports.checkIn = async (req, res) => {
  try {
    const { userId, method, sport, ground, notes } = req.body;

    // ── Entitlement validation ──
    if (sport) {
      const validation = await validateCheckIn(userId, sport);
      if (!validation.allowed) {
        return res.status(403).json({
          message: validation.reason,
          entitlement: validation.entitlement,
          activeSessions: validation.activeSessions?.map(s => ({
            _id: s._id,
            sport: s.sport,
            checkInTime: s.checkInTime,
          })),
        });
      }
    }

    // ── Resolve sport document for sportId and hourly rate ──
    let sportDoc = null;
    if (sport) {
      sportDoc = await Sport.findOne({ name: { $regex: new RegExp(`^${sport}$`, 'i') } });
    }

    // ── Resolve effective session config (snapshot at check-in) ──
    const effectiveConfig = await getEffectiveConfig(sportDoc?.slug || null);
    const entitlement = sport ? await calculateEntitlement(userId) : null;
    const activeSessions = await Attendance.find({ userId, checkOutTime: null, sessionStatus: 'Active' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if already checked in for this specific sport today (prevent duplicate)
    let attendance = await Attendance.findOne({
      userId,
      sport: sport || null,
      checkOutTime: null,
      sessionStatus: 'Active',
    });

    if (attendance && attendance.checkInTime && !attendance.checkOutTime) {
      // Auto-checkout existing session before re-check-in
      applySessionCheckout(attendance, {
        checkOutTime: new Date(),
        hourlyPrice: sportDoc?.hourlyPrice || attendance.hourlyRateAtCheckIn || 0,
      });
      await attendance.save();
    }

    // Find the membership that actually grants access to this sport
    let matchingMembership = null;
    if (entitlement && entitlement.activeMemberships) {
      matchingMembership = entitlement.activeMemberships.find(m => {
        const plan = m.planId;
        if (!plan) return false;
        if (plan.isAllServices) return true;
        const includedKeys = (plan.sportsIncluded || []).map(s => (s || '').trim().toLowerCase());
        const sportSlug = sportDoc?.slug || (sport || '').trim().toLowerCase();
        const sportName = sportDoc?.name?.toLowerCase() || (sport || '').trim().toLowerCase();
        return includedKeys.some(k => k === 'all' || k === 'all-services' || k === sportSlug || k === sportName);
      });
      if (!matchingMembership) matchingMembership = entitlement.activeMemberships[0];
    }

    // Create new attendance record
    attendance = new Attendance({
      userId,
      date: today,
      checkInTime: new Date(),
      status: 'present',
      sessionStatus: 'Active',
      allowedDurationMinutes: effectiveConfig.allowedDurationMinutes,
      overtimeThresholdMinutes: effectiveConfig.overtimeThresholdMinutes,
      checkInMethod: method || 'manual',
      sport,
      sportId: sportDoc?._id || null,
      ground,
      notes,
      hourlyRateAtCheckIn: sportDoc?.hourlyPrice || 0,
      // Entitlement snapshot
      entitlementType: entitlement?.entitlementType || 'one-time-play',
      concurrentSessionLimit: entitlement?.concurrentSessionLimit, // null = unlimited
      isUnlimited: entitlement?.isUnlimited || false,
      activeSessionCountSnapshot: activeSessions.length + 1,
      sportNameSnapshot: sport || '',
      membershipPlanSnapshot: matchingMembership?.planId?.name || '',
      relatedBookingId: matchingMembership?._id || null,
      // Session config snapshot
      currentSessionConfig: {
        allowedDurationMinutes: effectiveConfig.allowedDurationMinutes,
        overtimeThresholdMinutes: effectiveConfig.overtimeThresholdMinutes,
        lateFeePerMinute: effectiveConfig.lateFeePerMinuteOverride,
        configVersionSnapshot: effectiveConfig.configVersion,
      },
    });

    await attendance.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      // Find user name for the payload
      const user = await require('../models/User').findById(userId).select('name');
      const userName = user?.name || 'Unknown User';
      io.emit('attendance:check-in', { userId, userName, sport, timestamp: new Date() });
      io.emit('dashboard:refresh');
    }

    res.json({ attendance, message: 'Check-in successful.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// POST /api/attendance/check-out — Check out a user
exports.checkOut = async (req, res) => {
  try {
    const { userId, attendanceId } = req.body;

    // Support checking out a specific session by attendanceId
    let attendance;
    if (attendanceId) {
      attendance = await Attendance.findOne({
        _id: attendanceId,
        userId,
        checkOutTime: null,
        sessionStatus: 'Active',
      });
    } else {
      // Legacy: find any active session for user (oldest first)
      attendance = await Attendance.findOne({
        userId,
        checkOutTime: null,
        sessionStatus: 'Active',
      }).sort({ checkInTime: 1 });
    }

    if (!attendance) {
      return res.status(404).json({ message: 'No active check-in found.' });
    }

    const sportDoc = attendance.sport
      ? await Sport.findOne({ name: { $regex: new RegExp(`^${attendance.sport}$`, 'i') } })
      : null;
    applySessionCheckout(attendance, {
      checkOutTime: new Date(),
      hourlyPrice: sportDoc?.hourlyPrice || attendance.hourlyRateAtCheckIn || 0,
    });
    await attendance.save();

    const io = req.app.get('io');
    if (io) {
      const user = await require('../models/User').findById(userId).select('name');
      const userName = user?.name || 'Unknown User';
      io.emit('attendance:check-out', {
        userId,
        userName,
        sport: attendance.sport,
        attendanceId: attendance._id,
        timestamp: attendance.checkOutTime,
        overtimeMinutes: attendance.overtimeMinutes || 0,
        lateAmount: attendance.lateAmount || 0
      });
      if ((attendance.lateAmount || 0) > 0) {
        io.emit('session:overtime', {
          userId,
          sport: attendance.sport,
          attendanceId: attendance._id,
          overtimeMinutes: attendance.overtimeMinutes,
          lateAmount: attendance.lateAmount
        });
      }
      io.emit('dashboard:refresh');
    }

    res.json({ attendance, message: 'Check-out successful.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/attendance/:id/fee-collection — Mark late fee collected or waived
exports.updateFeeCollection = async (req, res) => {
  try {
    const { status, note } = req.body;
    const allowedStatuses = ['Pending Collection', 'Paid', 'Waived'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid fee collection status.' });
    }

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) return res.status(404).json({ message: 'Attendance record not found.' });

    if ((attendance.lateAmount || 0) <= 0 && status !== 'Pending Collection') {
      return res.status(400).json({ message: 'This session has no late amount to collect.' });
    }

    attendance.feeCollectionStatus = status;
    attendance.feeCollectionNote = note || '';
    attendance.feeCollectedAt = ['Paid', 'Waived'].includes(status) ? new Date() : null;
    attendance.feeCollectedBy = ['Paid', 'Waived'].includes(status) ? req.user.userId : null;
    await attendance.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('attendance:fee-updated', {
        attendanceId: attendance._id,
        status: attendance.feeCollectionStatus,
        lateAmount: attendance.lateAmount,
      });
      io.emit('dashboard:refresh');
    }

    res.json({ attendance, message: 'Late fee collection status updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/attendance/stats — Get attendance analytics
exports.getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(filter);

    const stats = {
      totalPresent: records.filter((a) => a.status === 'present').length,
      totalAbsent: records.filter((a) => a.status === 'absent').length,
      totalLate: records.filter((a) => a.status === 'late').length,
      peakHours: getPeakHours(records),
      attendanceByHour: getAttendanceByHour(records),
    };

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

function getPeakHours(records) {
  const hours = {};
  records.forEach((record) => {
    if (record.checkInTime) {
      const hour = new Date(record.checkInTime).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    }
  });
  return hours;
}

function getAttendanceByHour(records) {
  const byHour = {};
  for (let i = 0; i < 24; i++) {
    byHour[i] = records.filter((r) => {
      if (!r.checkInTime) return false;
      const hour = new Date(r.checkInTime).getHours();
      return hour === i;
    }).length;
  }
  return byHour;
}
