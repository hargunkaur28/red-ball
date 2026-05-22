const SessionConfig = require('../models/SessionConfig');

const ENV_ALLOWED_MINUTES = parseInt(process.env.SESSION_ALLOWED_MINUTES, 10) || 75;

// Legacy constant — kept for backward compatibility with imports
const DEFAULT_ALLOWED_DURATION_MINUTES = ENV_ALLOWED_MINUTES;

// ────────── In-memory config cache (60s TTL) ──────────
let configCache = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 60 * 1000;

const loadConfigs = async () => {
  const now = Date.now();
  if (configCache && (now - configCacheTime) < CONFIG_CACHE_TTL) {
    return configCache;
  }
  try {
    const configs = await SessionConfig.find({}).lean();
    configCache = configs;
    configCacheTime = now;
    return configs;
  } catch (err) {
    // If SessionConfig collection doesn't exist yet (first run), return empty
    return configCache || [];
  }
};

const invalidateConfigCache = () => {
  configCache = null;
  configCacheTime = 0;
};

/**
 * Resolve the effective session configuration for a sport.
 * Merges global defaults with sport-specific overrides.
 * @param {string} [sportSlug] - Sport slug for sport-specific config lookup
 * @returns {Promise<{allowedDurationMinutes: number, overtimeThresholdMinutes: number, lateFeePerMinuteOverride: number|null, autoCheckoutAfterMinutes: number}>}
 */
const getEffectiveConfig = async (sportSlug) => {
  const configs = await loadConfigs();

  const globalConfig = configs.find(c => c.key === 'default') || {
    allowedDurationMinutes: ENV_ALLOWED_MINUTES,
    overtimeThresholdMinutes: 0,
    lateFeePerMinuteOverride: null,
    autoCheckoutAfterMinutes: (parseInt(process.env.AUTO_CHECKOUT_HOURS, 10) || 4) * 60,
    accessValidityHours: 24,
    configVersion: 1,
  };

  if (!sportSlug) return globalConfig;

  const sportConfig = configs.find(
    c => c.type === 'sport' && c.sportSlug === sportSlug.toLowerCase()
  );
  if (!sportConfig) return globalConfig;

  // Sport-specific overrides global (only override non-null values)
  return {
    allowedDurationMinutes: sportConfig.allowedDurationMinutes ?? globalConfig.allowedDurationMinutes,
    overtimeThresholdMinutes: sportConfig.overtimeThresholdMinutes ?? globalConfig.overtimeThresholdMinutes,
    lateFeePerMinuteOverride: sportConfig.lateFeePerMinuteOverride ?? globalConfig.lateFeePerMinuteOverride,
    autoCheckoutAfterMinutes: sportConfig.autoCheckoutAfterMinutes ?? globalConfig.autoCheckoutAfterMinutes,
    accessValidityHours: sportConfig.accessValidityHours ?? globalConfig.accessValidityHours,
    configVersion: sportConfig.configVersion ?? globalConfig.configVersion,
  };
};

// ────────── Session Metrics Calculation ──────────

const roundMoney = (amount) => Math.round((Number(amount || 0) + Number.EPSILON) * 100) / 100;

const calculateSessionMetrics = ({
  checkInTime,
  checkOutTime = new Date(),
  allowedDurationMinutes = DEFAULT_ALLOWED_DURATION_MINUTES,
  overtimeThresholdMinutes = 0,
  hourlyPrice = 0,
  lateFeePerMinuteOverride = null,
}) => {
  const startedAt = new Date(checkInTime);
  const endedAt = new Date(checkOutTime);
  const actualDurationMinutes = Math.max(0, Math.ceil((endedAt - startedAt) / (1000 * 60)));

  // Overtime = actual - allowed - grace threshold
  const rawOvertime = actualDurationMinutes - allowedDurationMinutes - overtimeThresholdMinutes;
  const overtimeMinutes = Math.max(0, rawOvertime);

  // Late fee: use override if set, otherwise derive from hourly price
  const lateFeePerMinute = lateFeePerMinuteOverride != null
    ? roundMoney(lateFeePerMinuteOverride)
    : roundMoney((Number(hourlyPrice) || 0) / 60);
  const lateAmount = roundMoney(overtimeMinutes * lateFeePerMinute);

  return {
    allowedDurationMinutes,
    actualDurationMinutes,
    overtimeMinutes,
    overtimeThresholdMinutes,
    lateFeePerMinute,
    lateAmount,
  };
};

const applySessionCheckout = (attendance, {
  checkOutTime = new Date(),
  hourlyPrice = 0,
  autoClosed = false,
} = {}) => {
  const metrics = calculateSessionMetrics({
    checkInTime: attendance.checkInTime,
    checkOutTime,
    allowedDurationMinutes: attendance.allowedDurationMinutes || DEFAULT_ALLOWED_DURATION_MINUTES,
    overtimeThresholdMinutes: attendance.overtimeThresholdMinutes || 0,
    hourlyPrice: attendance.hourlyRateAtCheckIn || hourlyPrice,
    lateFeePerMinuteOverride: attendance.currentSessionConfig?.lateFeePerMinute ?? null,
  });

  attendance.checkOutTime = checkOutTime;
  attendance.checkedOutAt = checkOutTime;
  attendance.duration = metrics.actualDurationMinutes;
  attendance.actualDurationMinutes = metrics.actualDurationMinutes;
  attendance.allowedDurationMinutes = metrics.allowedDurationMinutes;
  attendance.overtimeMinutes = metrics.overtimeMinutes;
  attendance.lateFeePerMinute = metrics.lateFeePerMinute;
  attendance.lateAmount = metrics.lateAmount;
  attendance.autoClosed = autoClosed;
  attendance.status = metrics.overtimeMinutes > 0 ? 'late' : 'present';
  attendance.sessionStatus = autoClosed
    ? 'Auto Closed'
    : (metrics.overtimeMinutes > 0 ? 'Overtime' : 'Completed');

  if (metrics.lateAmount > 0 && !['Paid', 'Waived'].includes(attendance.feeCollectionStatus)) {
    attendance.feeCollectionStatus = 'Pending Collection';
  } else if (metrics.lateAmount <= 0 && !attendance.feeCollectionStatus) {
    attendance.feeCollectionStatus = 'Not Applicable';
  }

  return metrics;
};

module.exports = {
  DEFAULT_ALLOWED_DURATION_MINUTES,
  getEffectiveConfig,
  invalidateConfigCache,
  calculateSessionMetrics,
  applySessionCheckout,
};
