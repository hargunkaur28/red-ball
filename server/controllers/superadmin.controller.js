const Membership = require('../models/Membership');
const Attendance = require('../models/Attendance');
const MembershipPlan = require('../models/MembershipPlan');
const OneTimePlay = require('../models/OneTimePlay');
const SlotBooking = require('../models/SlotBooking');
const OneTimeAccess = require('../models/OneTimeAccess');
const User = require('../models/User');

// GET /api/super-admin/memberships - Manage and view memberships with attendance aggregation
exports.getMemberships = async (req, res) => {
  try {
    const { search, sport, status, planType, page = 1, limit = 10 } = req.query;

    const query = {};

    // 1. Filter by Status
    if (status) {
      query.status = status;
    }

    // 2. Filter by User Search (name, phone, or email)
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const studentIds = users.map(u => u._id);
      query.studentId = { $in: studentIds };
    }

    // 3. Filter by Sport / Plan Type
    const planQuery = {};
    let shouldFilterPlans = false;

    if (sport) {
      planQuery.sportsIncluded = sport;
      shouldFilterPlans = true;
    }

    if (planType) {
      shouldFilterPlans = true;
      if (planType === 'all-services') {
        planQuery.sportsIncluded = 'all-services';
      } else if (planType === 'sport-specific' && !sport) {
        // Only apply when no specific sport is selected — a specific sport already implies sport-specific
        planQuery.sportsIncluded = { $ne: 'all-services' };
      }
    }

    if (shouldFilterPlans) {
      const plans = await MembershipPlan.find(planQuery).select('_id');
      const planIds = plans.map(p => p._id);
      query.planId = { $in: planIds };
    }

    const skipCount = (parseInt(page) - 1) * parseInt(limit);
    const limitCount = parseInt(limit);

    const memberships = await Membership.find(query)
      .populate('studentId', 'name phone email')
      .populate('planId')
      .lean();

    // Attach dynamic attendance checks
    const enrichedMemberships = await Promise.all(
      memberships.map(async (m) => {
        if (!m.studentId) {
          return {
            ...m,
            attendanceCount: 0,
            lastCheckIn: null,
            lastCheckOut: null
          };
        }

        const buildMembershipMatch = (m, extraConditions = {}) => {
          const match = { userId: m.studentId._id, ...extraConditions };
          const orConditions = [
            { relatedBookingId: m._id }
          ];
          if (m.planId?.name) {
            orConditions.push({ membershipPlanSnapshot: m.planId.name });
          }
          // Fallback for legacy attendance records with null snapshots
          if (m.planId?.sportsIncluded && m.planId.sportsIncluded.length > 0) {
            const sportsRegex = m.planId.sportsIncluded.map(s => {
              const name = typeof s === 'string' ? s : s.name;
              return new RegExp(`^${name}$`, 'i');
            });
            orConditions.push({
              $and: [
                { $or: [
                  { relatedBookingId: null },
                  { relatedBookingId: { $exists: false } }
                ]},
                { membershipPlanSnapshot: { $in: [null, ''] } },
                { sport: { $in: sportsRegex } }
              ]
            });
          }
          match.$or = orConditions;
          return match;
        };

        const attendanceCount = await Attendance.countDocuments(buildMembershipMatch(m, { status: 'present' }));

        // Fetch ALL attendance records for this membership (each check-in = its own entry)
        const checkins = await Attendance.find(buildMembershipMatch(m, { checkInTime: { $exists: true } }))
          .sort({ checkInTime: -1 })
          .lean();

        return {
          ...m,
          attendanceCount,
          checkins,
          // Keep backward compat: latest check-in/out
          lastCheckIn: checkins.length > 0 ? checkins[0].checkInTime : null,
          lastCheckOut: checkins.find(c => c.checkOutTime)?.checkOutTime || null,
        };
      })
    );

    // Sort by checkin date/time wise (latest first). Fallback to membership createdAt.
    enrichedMemberships.sort((a, b) => {
      const timeA = a.lastCheckIn ? new Date(a.lastCheckIn).getTime() : 0;
      const timeB = b.lastCheckIn ? new Date(b.lastCheckIn).getTime() : 0;
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return createdB - createdA;
    });

    const total = enrichedMemberships.length;
    const paginatedMemberships = enrichedMemberships.slice(skipCount, skipCount + limitCount);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limitCount),
      memberships: paginatedMemberships
    });
  } catch (error) {
    console.error('getMemberships error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/super-admin/overtime-sessions - Completed sport sessions and late-fee collection view
exports.getOvertimeSessions = async (req, res) => {
  try {
    const {
      search,
      sport,
      collectionStatus,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {
      checkInTime: { $exists: true, $ne: null },
    };

    if (sport) {
      query.sport = { $regex: new RegExp(`^${sport}$`, 'i') };
    }

    if (collectionStatus) {
      query.feeCollectionStatus = collectionStatus;
    }

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      query.userId = { $in: users.map((user) => user._id) };
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const [total, sessions, summary] = await Promise.all([
      Attendance.countDocuments(query),
      Attendance.find(query)
        .populate('userId', 'name phone email')
        .sort({ checkInTime: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      Attendance.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            pendingAmount: {
              $sum: {
                $cond: [
                  { $eq: ['$feeCollectionStatus', 'Pending Collection'] },
                  '$lateAmount',
                  0
                ]
              }
            },
            overtimeSessions: {
              $sum: {
                $cond: [{ $gt: ['$overtimeMinutes', 0] }, 1, 0]
              }
            },
            pendingCollections: {
              $sum: {
                $cond: [{ $eq: ['$feeCollectionStatus', 'Pending Collection'] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    // Fallback for older attendance records missing snapshot data
    const enrichedSessions = await Promise.all(sessions.map(async (session) => {
      if (session.membershipPlanSnapshot || session.relatedBookingType === 'one-time-play' || session.entitlementType === 'one-time-play') {
        return session;
      }
      
      if (session.userId && session.userId._id) {
        const activeMembership = await Membership.findOne({ 
          studentId: session.userId._id, 
          status: 'active' 
        }).populate('planId', 'name').lean();
        
        if (activeMembership && activeMembership.planId) {
          session.membershipPlanSnapshot = activeMembership.planId.name;
        }
      }
      return session;
    }));

    res.json({
      success: true,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      summary: summary[0] || { pendingAmount: 0, overtimeSessions: 0, pendingCollections: 0 },
      sessions: enrichedSessions,
    });
  } catch (error) {
    console.error('getOvertimeSessions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/super-admin/one-time - View normalized list of one-time play entries (POS + Online Bookings)
exports.getOneTimeEntries = async (req, res) => {
  try {
    const { search, sport, paymentStatus, status, page = 1, limit = 10, startDate, endDate } = req.query;

    // Build filters for OneTimePlay (Walk-ins)
    const otpQuery = {};
    if (sport) {
      otpQuery.sport = { $regex: new RegExp(`^${sport}$`, 'i') };
    }
    if (search) {
      otpQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (startDate || endDate) {
      otpQuery.date = {};
      if (startDate) otpQuery.date.$gte = new Date(startDate);
      if (endDate) otpQuery.date.$lte = new Date(endDate);
    }
    // POS Walk-ins are always considered paid and completed when logged.
    // If filters query non-matching status/payment state, we omit them
    if ((paymentStatus && paymentStatus !== 'paid') || (status && status !== 'completed')) {
      otpQuery._id = null; // empty results
    }

    // Build filters for SlotBooking
    const sbQuery = { bookingType: 'one-time-play' };
    if (sport) {
      sbQuery.$or = [
        { slotName: { $regex: new RegExp(`^${sport}`, 'i') } }
      ];
    }
    if (search) {
      sbQuery.$or = [
        { playerName: { $regex: search, $options: 'i' } },
        { playerPhone: { $regex: search, $options: 'i' } },
        { playerEmail: { $regex: search, $options: 'i' } },
        { bookingId: { $regex: search, $options: 'i' } }
      ];
    }
    if (paymentStatus) {
      sbQuery.paymentStatus = paymentStatus;
    }
    if (status) {
      sbQuery.status = status;
    }
    if (startDate || endDate) {
      sbQuery.createdAt = {};
      if (startDate) sbQuery.createdAt.$gte = new Date(startDate);
      if (endDate) sbQuery.createdAt.$lte = new Date(endDate);
    }

    // Build filters for OneTimeAccess (Prepaid Online Passes)
    const otaQuery = {};
    if (sport) {
      // match via populated sportId — fetch all and filter below
      // (pre-filter by status is possible)
    }
    if (paymentStatus && paymentStatus !== 'paid') {
      otaQuery._id = null; // OTA passes are always paid at purchase
    }
    if (status && !['completed', 'active', 'unused', 'expired', 'cancelled'].includes(status)) {
      otaQuery._id = null;
    } else if (status) {
      otaQuery.accessStatus = status;
    }
    if (startDate || endDate) {
      otaQuery.purchasedAt = {};
      if (startDate) otaQuery.purchasedAt.$gte = new Date(startDate);
      if (endDate) otaQuery.purchasedAt.$lte = new Date(endDate);
    }

    const [otpCount, sbCount, otaCount] = await Promise.all([
      OneTimePlay.countDocuments(otpQuery),
      SlotBooking.countDocuments(sbQuery),
      OneTimeAccess.countDocuments(otaQuery),
    ]);

    const total = otpCount + sbCount + otaCount;
    const skipCount = (parseInt(page) - 1) * parseInt(limit);
    const limitCount = parseInt(limit);

    // Fetch the most recent elements up to skip + limit to merge correctly in memory
    const fetchLimit = skipCount + limitCount;

    const [otps, sbs, otas] = await Promise.all([
      OneTimePlay.find(otpQuery).sort({ date: -1, createdAt: -1 }).limit(fetchLimit).lean(),
      SlotBooking.find(sbQuery).populate('slotId').sort({ createdAt: -1 }).limit(fetchLimit).lean(),
      OneTimeAccess.find(otaQuery)
        .populate('userId', 'name phone email')
        .populate('sportId', 'name')
        .populate('attendanceId')
        .sort({ purchasedAt: -1 })
        .limit(fetchLimit)
        .lean(),
    ]);

    // Normalize POS Walk-ins
    const otpAttendance = await Attendance.find({
      relatedBookingType: 'one-time-play',
      relatedBookingId: { $in: otps.map((otp) => otp._id) }
    }).lean();
    const attendanceByOtp = new Map(otpAttendance.map((record) => [String(record.relatedBookingId), record]));

    const normalizedOtps = otps.map(otp => {
      const attendance = attendanceByOtp.get(String(otp._id));
      return ({
      _id: otp._id,
      type: 'walk-in',
      bookingId: `POS-${String(otp._id).slice(-6).toUpperCase()}`,
      playerName: otp.name,
      playerPhone: otp.phone || 'N/A',
      sport: otp.sport,
      date: otp.date || otp.createdAt,
      duration: otp.hours * 60, // in minutes
      ratePerHour: otp.ratePerHour,
      amount: otp.amount,
      gstAmount: otp.gstAmount,
      totalAmount: otp.totalAmount,
      paymentStatus: 'paid',
      status: 'completed',
      allowedDurationMinutes: attendance?.allowedDurationMinutes || 75,
      actualDurationMinutes: attendance?.actualDurationMinutes || attendance?.duration || null,
      overtimeMinutes: attendance?.overtimeMinutes || 0,
      lateAmount: attendance?.lateAmount || 0,
      feeCollectionStatus: attendance?.feeCollectionStatus || 'Not Applicable',
      createdAt: otp.createdAt,
      notes: 'Logged directly in POS'
    });
    });

    // Normalize Online Slot Bookings
    const normalizedSbs = sbs.map(sb => ({
      _id: sb._id,
      type: 'slot-booking',
      bookingId: sb.bookingId,
      playerName: sb.playerName,
      playerPhone: sb.playerPhone || 'N/A',
      sport: sb.slotId?.sport || sb.slotName || 'Sport',
      date: sb.createdAt,
      duration: sb.duration,
      ratePerHour: sb.duration ? Math.round((sb.price / (sb.duration / 60))) : sb.price,
      amount: sb.price,
      gstAmount: sb.gstAmount || 0,
      totalAmount: sb.totalAmount,
      paymentStatus: sb.paymentStatus,
      status: sb.status,
      allowedDurationMinutes: 75,
      actualDurationMinutes: sb.actualDurationMinutes || sb.duration,
      overtimeMinutes: sb.overtimeMinutes || 0,
      lateAmount: sb.lateAmount || 0,
      feeCollectionStatus: sb.feeCollectionStatus || 'Not Applicable',
      createdAt: sb.createdAt,
      startTime: sb.startTime,
      endTime: sb.endTime,
      checkInTime: sb.checkInTime,
      checkOutTime: sb.checkOutTime,
      notes: sb.notes || ''
    }));

    // Normalize Prepaid Online Passes (OneTimeAccess)
    const normalizedOtas = otas
      .filter(ota => {
        // Client-side sport/search filter since we can't easily pre-filter populated fields
        if (sport && ota.sportId?.name?.toLowerCase() !== sport.toLowerCase()) return false;
        if (search) {
          const q = search.toLowerCase();
          const name = ota.userId?.name?.toLowerCase() || '';
          const phone = ota.userId?.phone || '';
          const email = ota.userId?.email?.toLowerCase() || '';
          if (!name.includes(q) && !phone.includes(q) && !email.includes(q)) return false;
        }
        return true;
      })
      .map(ota => {
        const att = ota.attendanceId;
        return {
          _id: ota._id,
          type: 'prepaid-pass',
          bookingId: `OTA-${String(ota._id).slice(-6).toUpperCase()}`,
          playerName: ota.userId?.name || 'Online User',
          playerPhone: ota.userId?.phone || 'N/A',
          sport: ota.sportId?.name || 'Sport',
          date: ota.purchasedAt,
          duration: att?.actualDurationMinutes || att?.duration || ota.allowedDurationMinutes,
          ratePerHour: ota.hourlyRateSnapshot,
          amount: ota.hourlyRateSnapshot,
          gstAmount: 0,
          totalAmount: ota.hourlyRateSnapshot,
          paymentStatus: 'paid',
          status: ota.accessStatus,
          allowedDurationMinutes: ota.allowedDurationMinutes,
          actualDurationMinutes: att?.actualDurationMinutes || att?.duration || null,
          overtimeMinutes: att?.overtimeMinutes || 0,
          lateAmount: att?.lateAmount || 0,
          feeCollectionStatus: att?.feeCollectionStatus || 'Not Applicable',
          createdAt: ota.purchasedAt,
          checkInTime: att?.checkInTime || ota.usedAt,
          checkOutTime: att?.checkOutTime,
          notes: 'Online Prepaid Pass',
        };
      });

    // Merge and sort by date descending
    const merged = [...normalizedOtps, ...normalizedSbs, ...normalizedOtas].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    const paginated = merged.slice(skipCount, skipCount + limitCount);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limitCount),
      entries: paginated
    });
  } catch (error) {
    console.error('getOneTimeEntries error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/super-admin/users
exports.getUsers = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20, role = 'user', membershipStatus = '', sport = '', planType = '' } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const skip = (parseInt(page) - 1) * limitNum;

    const query = { role };
    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [{ name: re }, { email: re }, { phone: re }];
    }

    // Filter by membership status, sport, and/or planType
    if (membershipStatus === 'none') {
      const usersWithMembership = await Membership.distinct('studentId');
      query._id = { $nin: usersWithMembership };
    } else if (membershipStatus || sport || planType) {
      const membershipQuery = {};
      if (membershipStatus) membershipQuery.status = membershipStatus;

      if (sport || planType) {
        const planQuery = {};
        if (sport) {
          planQuery.sportsIncluded = sport;
        } else if (planType === 'all-services') {
          planQuery.sportsIncluded = 'all-services';
        } else if (planType === 'sport-specific') {
          planQuery.sportsIncluded = { $ne: 'all-services' };
        }
        const matchingPlans = await MembershipPlan.find(planQuery).select('_id');
        membershipQuery.planId = { $in: matchingPlans.map(p => p._id) };
      }

      const matchingUserIds = await Membership.distinct('studentId', membershipQuery);
      query._id = { $in: matchingUserIds };
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email phone role isActive createdAt photo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    // Attach ALL memberships per user
    const userIds = users.map(u => u._id);
    const memberships = await Membership.find({ studentId: { $in: userIds } })
      .select('studentId status startDate endDate planId')
      .populate('planId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const membershipsByUser = {};
    memberships.forEach(m => {
      const uid = m.studentId.toString();
      if (!membershipsByUser[uid]) membershipsByUser[uid] = [];
      membershipsByUser[uid].push(m);
    });

    const result = users.map(u => ({
      ...u,
      memberships: membershipsByUser[u._id.toString()] || [],
    }));

    res.json({ success: true, users: result, total, page: parseInt(page), totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
