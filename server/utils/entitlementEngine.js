const Membership = require('../models/Membership');
const Attendance = require('../models/Attendance');
const Sport = require('../models/Sport');

// ---------------------------------------------------------------------------
// Per-user entitlement cache (in-memory, 30-second TTL)
// ---------------------------------------------------------------------------
const entitlementCache = new Map();
const ENTITLEMENT_CACHE_TTL = 30 * 1000;

const getCachedEntitlement = (userId) => {
  const key = userId.toString();
  const cached = entitlementCache.get(key);
  if (cached && (Date.now() - cached.time) < ENTITLEMENT_CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCachedEntitlement = (userId, data) => {
  entitlementCache.set(userId.toString(), { data, time: Date.now() });
};

/**
 * Invalidate cached entitlement for a specific user, or clear the entire
 * cache when no userId is provided (e.g. after bulk membership changes).
 */
exports.invalidateEntitlementCache = (userId) => {
  if (userId) {
    entitlementCache.delete(userId.toString());
  } else {
    entitlementCache.clear();
  }
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true for plan keys that grant access to ALL sports/services.
 * Handles 'all' and 'all-services' (case-insensitive, trimmed).
 */
const isAllServicesKey = (key) => {
  if (!key || typeof key !== 'string') return false;
  const normalized = key.trim().toLowerCase();
  return normalized === 'all' || normalized === 'all-services';
};

exports.isAllServicesKey = isAllServicesKey;

// ---------------------------------------------------------------------------
// calculateEntitlement
// ---------------------------------------------------------------------------

/**
 * Determine the user's current entitlement based on active memberships.
 *
 * @param {String|ObjectId} userId
 * @returns {Object} entitlement descriptor
 */
const calculateEntitlement = async (userId) => {
  // Check cache first
  const cached = getCachedEntitlement(userId);
  if (cached) return cached;

  const OneTimeAccess = require('../models/OneTimeAccess');

  // 1. Fetch all active, non-expired memberships with their plans
  const memberships = await Membership.find({
    studentId: userId,
    status: 'active',
    endDate: { $gte: new Date() },
  }).populate('planId');

  // 2. Filter out memberships whose plan was deleted or deactivated
  const validMemberships = memberships.filter(
    (m) => m.planId && m.planId.isActive,
  );

  // 3. Collect every sport entry across all plans
  const allSportEntries = [];
  let hasAllServices = false;

  for (const m of validMemberships) {
    if (m.planId.isAllServices) {
      hasAllServices = true;
    }
    for (const entry of m.planId.sportsIncluded || []) {
      if (isAllServicesKey(entry)) {
        hasAllServices = true;
      }
      allSportEntries.push(entry);
    }
  }

  // 4. Build the result based on whether any plan grants all-services access
  if (hasAllServices) {
    // All-services plans grant access to every sport with no concurrent cap
    const allSports = await Sport.find({ active: true, deletedAt: null })
      .select('slug name')
      .lean();

    const result = {
      entitlementType: 'all-services',
      concurrentSessionLimit: null,
      isUnlimited: true,
      allowedSports: allSports.map((s) => s.slug),
      activeMemberships: validMemberships,
      isAllServices: true,
    };

    setCachedEntitlement(userId, result);
    return result;
  }

  // 5. For non-all-services plans, resolve which sport slugs are actually known
  const activeSports = await Sport.find({ active: true, deletedAt: null })
    .select('slug name')
    .lean();

  const knownSlugs = new Set(activeSports.map((s) => s.slug));

  // Normalise collected entries and keep only known sport slugs
  const distinctSports = [
    ...new Set(
      allSportEntries
        .map((e) => (e || '').trim().toLowerCase())
        .filter((slug) => knownSlugs.has(slug)),
    ),
  ];

  // Fetch unexpired unused/active prepaid passes to augment allowed sports
  const passes = await OneTimeAccess.find({
    userId,
    accessStatus: { $in: ['unused', 'active'] },
    expiresAt: { $gt: new Date() }
  }).populate('sportId');

  const passSportSlugs = passes.map(p => p.sportId?.slug).filter(Boolean);

  let entitlementType;
  let concurrentSessionLimit;

  if (distinctSports.length > 0) {
    if (distinctSports.length > 1) {
      entitlementType = 'multi-sport';
      concurrentSessionLimit = distinctSports.length;
    } else {
      entitlementType = 'single-sport';
      concurrentSessionLimit = 1;
    }
  } else if (passSportSlugs.length > 0) {
    entitlementType = 'one-time-play';
    concurrentSessionLimit = 1;
  } else {
    entitlementType = 'none';
    concurrentSessionLimit = 0;
  }

  // Merge pass sport slugs into allowedSports
  const allowedSportsSet = new Set([...distinctSports, ...passSportSlugs]);

  const result = {
    entitlementType,
    concurrentSessionLimit,
    isUnlimited: false,
    allowedSports: Array.from(allowedSportsSet),
    activeMemberships: validMemberships,
    isAllServices: false,
  };

  setCachedEntitlement(userId, result);
  return result;
};

exports.calculateEntitlement = calculateEntitlement;

// ---------------------------------------------------------------------------
// validateCheckIn
// ---------------------------------------------------------------------------

/**
 * Validate whether a user is allowed to check in to a given sport.
 * Always queries fresh active sessions (never cached).
 *
 * @param {String|ObjectId} userId
 * @param {String} sportName  – sport slug or display name
 * @returns {Object} { allowed, reason, entitlement, activeSessions }
 */
exports.validateCheckIn = async (userId, sportName) => {
  const OneTimeAccess = require('../models/OneTimeAccess');
  const Sport = require('../models/Sport');

  // Normalize sportName to lowercase/trimmed
  const normalizedSportName = (sportName || '').trim().toLowerCase();

  // Find the sport by slug or name
  const sportObj = await Sport.findOne({
    $or: [
      { slug: normalizedSportName },
      { name: { $regex: new RegExp(`^${sportName}$`, 'i') } }
    ],
    deletedAt: null
  });

  if (!sportObj) {
    return {
      allowed: false,
      reason: `Sport ${sportName} not found.`,
      entitlement: null,
      activeSessions: []
    };
  }

  const resolvedSportSlug = sportObj.slug;

  // 1. Calculate entitlement (may come from cache)
  const entitlement = await calculateEntitlement(userId);

  const baseEntitlement = {
    entitlementType: entitlement.entitlementType,
    concurrentSessionLimit: entitlement.concurrentSessionLimit,
    isUnlimited: entitlement.isUnlimited,
    allowedSports: entitlement.allowedSports,
    isAllServices: entitlement.isAllServices,
  };

  // Determine source: membership or prepaid pass
  let entitlementSource = 'membership';
  let matchingPass = null;

  // Check if user has active membership covering this sport
  const hasMembershipCoverage = entitlement.entitlementType !== 'none' &&
    (entitlement.isAllServices || entitlement.allowedSports.includes(resolvedSportSlug)) &&
    entitlement.activeMemberships.length > 0;

  if (!hasMembershipCoverage) {
    // If not covered by membership, check if we have a prepaid pass
    matchingPass = await OneTimeAccess.findOne({
      userId,
      sportId: sportObj._id,
      accessStatus: 'unused',
      expiresAt: { $gt: new Date() }
    });

    if (!matchingPass) {
      return {
        allowed: false,
        reason: 'No active membership or unused prepaid pass found. Please purchase entry.',
        entitlement: baseEntitlement,
        activeSessions: [],
      };
    }

    entitlementSource = 'one-time-play';
    baseEntitlement.entitlementType = 'one-time-play';
    baseEntitlement.concurrentSessionLimit = 1;
  }

  // 3. Fetch currently active sessions (checkOutTime is null and sessionStatus is Active)
  const activeSessions = await Attendance.find({ userId, checkOutTime: null, sessionStatus: 'Active' });

  // 4. Duplicate-sport check — user already has an open session for this sport
  // Bypass this check if the user has an all-services membership
  const hasDuplicate = activeSessions.some(
    (s) => (s.sport || '').trim().toLowerCase() === resolvedSportSlug || (s.sport || '').trim().toLowerCase() === sportObj.name.toLowerCase(),
  );

  if (hasDuplicate && !entitlement.isAllServices) {
    return {
      allowed: false,
      reason: `You already have an active session for ${sportObj.name}. Please check out first.`,
      entitlement: baseEntitlement,
      activeSessions,
    };
  }

  // 5. Concurrent session limit
  const currentLimit = entitlementSource === 'one-time-play' ? 1 : baseEntitlement.concurrentSessionLimit;
  if (currentLimit !== null && activeSessions.length >= currentLimit) {
    return {
      allowed: false,
      reason: 'You already have an active session. Please check out before starting another session.',
      entitlement: baseEntitlement,
      activeSessions,
    };
  }

  // 6. Daily Limit Check (Only 1 check-in per day per sport for non-all-services)
  // Bypass for one-time-play checkins
  if (entitlementSource !== 'one-time-play' && !entitlement.isAllServices) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const previousCheckInsToday = await Attendance.countDocuments({
      userId,
      sport: { $regex: new RegExp(`^${sportObj.name}$`, 'i') },
      checkInTime: { $gte: todayStart, $lte: todayEnd }
    });

    if (previousCheckInsToday >= 1) {
      return {
        allowed: false,
        reason: `Daily limit reached! You have already used your ${sportObj.name} session for today.`,
        entitlement: baseEntitlement,
        activeSessions,
      };
    }
  }

  // 7. All checks passed
  return {
    allowed: true,
    reason: null,
    entitlement: baseEntitlement,
    entitlementSource,
    matchingPass,
    activeSessions,
  };
};
