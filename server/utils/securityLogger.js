const SecurityEvent = require('../models/SecurityEvent');
const { logWarn, logError } = require('./logger');

async function logSecurityEvent({ type, userId = null, email = '', role = '', ipAddress = '', userAgent = '', metadata = {}, severity = 'low' }) {
  try {
    await SecurityEvent.create({ type, userId, email, role, ipAddress, userAgent, metadata, severity });
  } catch (err) {
    logError('Failed to write security event', { type, err: err.message });
  }
}

async function logFailedLogin({ email, role, ipAddress, userAgent, attemptCount }) {
  const severity = attemptCount >= 10 ? 'critical' : attemptCount >= 5 ? 'high' : 'medium';
  return logSecurityEvent({
    type: 'failed_login',
    email,
    role,
    ipAddress,
    userAgent,
    metadata: { attemptCount },
    severity,
  });
}

async function logPasswordReset({ email, userId, ipAddress, userAgent }) {
  return logSecurityEvent({
    type: 'password_reset_requested',
    userId,
    email,
    ipAddress,
    userAgent,
    severity: 'low',
  });
}

async function logAdminLogin({ userId, email, role, ipAddress, userAgent }) {
  return logSecurityEvent({
    type: 'admin_login',
    userId,
    email,
    role,
    ipAddress,
    userAgent,
    severity: 'low',
  });
}

async function logSuspiciousActivity({ type, userId, email, role, ipAddress, userAgent, metadata }) {
  return logSecurityEvent({
    type,
    userId,
    email,
    role,
    ipAddress,
    userAgent,
    metadata,
    severity: 'high',
  });
}

module.exports = {
  logSecurityEvent,
  logFailedLogin,
  logPasswordReset,
  logAdminLogin,
  logSuspiciousActivity,
};
