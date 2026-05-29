const jwt = require('jsonwebtoken');
const User = require('../models/User');
const axios = require('axios');
const { sendPasswordResetOTP, sendFailedLoginAlert } = require('../utils/emailService');
const { logFailedLogin, logAdminLogin, logPasswordReset } = require('../utils/securityLogger');
const AdminSession = require('../models/AdminSession');
const tokenBlacklist = require('../utils/tokenBlacklist');

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in .env');
}

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // 'none' required in prod because frontend (Vercel) and backend (Render) are on different domains.
  // 'strict' blocks cross-origin cookie sending entirely, causing refresh to fail every 15 min.
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
};

// rememberMe=true → 90 days; default → 30 days
const getCookieOptions = (rememberMe) => ({
  ...COOKIE_BASE,
  maxAge: (rememberMe ? 90 : 30) * 24 * 60 * 60 * 1000,
});

// Keep a stable options object for logout/clear (30-day baseline)
const REFRESH_COOKIE_OPTIONS = getCookieOptions(false);

const generateAccessToken = (userId) => jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: '30d' });
const generateRefreshToken = (userId, rememberMe) =>
  jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: rememberMe ? '90d' : '30d' });

const getIP = (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown';
const getUA = (req) => req.headers['user-agent'] || 'unknown';

// Shared failed-attempt handler — increments counter, applies lock, sends alerts
const handleFailedAttempt = async (user, req) => {
  user.loginAttempts = (user.loginAttempts || 0) + 1;
  user.lastFailedLoginAt = new Date();

  const attempts = user.loginAttempts;
  const ts = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // 5+ attempts → 2-min lock + alert email to both admin and account owner
  if (attempts >= 5) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (!user.failedAlertSentAt || user.failedAlertSentAt < oneHourAgo) {
      user.failedAlertSentAt = new Date();
      const alertPayload = {
        attemptedEmail: user.email,
        role: user.role,
        attemptCount: attempts,
        ip: getIP(req),
        userAgent: getUA(req),
        timestamp: ts,
      };
      // Notify central admin
      sendFailedLoginAlert({ ...alertPayload, targetEmail: process.env.ADMIN_NOTIFICATION_EMAIL }).catch(() => {});
      // Also notify the account owner directly (all roles)
      if (user.email && user.email !== process.env.ADMIN_NOTIFICATION_EMAIL) {
        sendFailedLoginAlert({ ...alertPayload, targetEmail: user.email }).catch(() => {});
      }
    }
    // 2-min lock (only set if not already locked longer)
    const twoMinFromNow = new Date(Date.now() + 2 * 60 * 1000);
    if (!user.loginLockedUntil || user.loginLockedUntil < twoMinFromNow) {
      user.loginLockedUntil = twoMinFromNow;
    }
  }

  // 10+ attempts → escalate to 15-min lock
  if (attempts >= 10) {
    user.loginLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }

  await user.save({ validateBeforeSave: false });
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password, securityCode, rememberMe = false } = req.body;

    const user = await User.findOne({ email }).select(
      '+password +loginAttempts +loginLockedUntil +failedAlertSentAt'
    );
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Contact admin.' });
    }

    // Temporary lockout check (15 min after 10 failed attempts)
    if (user.loginLockedUntil && user.loginLockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.loginLockedUntil - new Date()) / 60000);
      return res.status(429).json({
        message: `Account temporarily locked. Try again in ${minutesLeft} minute(s).`,
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await handleFailedAttempt(user, req);
      logFailedLogin({ email: user.email, role: user.role, ipAddress: getIP(req), userAgent: getUA(req), attemptCount: user.loginAttempts }).catch(() => {});
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // 6-digit security code required for privileged roles
    if (user.role === 'superadmin' || user.role === 'manager') {
      if (!securityCode) {
        return res.status(401).json({ message: 'Security code required.', requiresCode: true });
      }
      const expectedCode =
        user.role === 'superadmin' ? process.env.SUPER_ADMIN_CODE : process.env.MANAGER_CODE;

      if (securityCode !== expectedCode) {
        await handleFailedAttempt(user, req);
        return res.status(401).json({ message: 'Invalid security code.' });
      }
    }

    // All checks passed — reset counter and issue tokens
    user.loginAttempts = 0;
    user.loginLockedUntil = null;

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id, rememberMe);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Track privileged logins
    if (user.role === 'superadmin' || user.role === 'manager') {
      AdminSession.create({
        userId: user._id,
        role: user.role,
        ipAddress: getIP(req),
        userAgent: getUA(req),
      }).catch(() => {});

      logAdminLogin({
        userId: user._id,
        email: user.email,
        role: user.role,
        ipAddress: getIP(req),
        userAgent: getUA(req),
      }).catch(() => {});
    }

    res.cookie('refreshToken', refreshToken, getCookieOptions(rememberMe));
    res.json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        photo: user.photo,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// POST /api/auth/register (public - for QR table flow)
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const user = await User.create({ name, email, phone, password, role: 'user' });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id, false);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', refreshToken, getCookieOptions(false));
    res.status(201).json({
      message: 'Registration successful',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register Error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages[0] });
    }
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// POST /api/auth/refresh
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found.' });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }

    // Preserve the original remember-me duration: 90d tokens had ~90d lifetime
    const originalDurationDays = Math.round((decoded.exp - decoded.iat) / 86400);
    const wasRemembered = originalDurationDays >= 89;

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id, wasRemembered);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', newRefreshToken, getCookieOptions(wasRemembered));
    res.json({
      accessToken: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    // Blacklist the current access token so it can't be reused
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(accessToken, ACCESS_SECRET);
        tokenBlacklist.add(accessToken, decoded.exp);
      } catch {}
    }

    const { refreshToken } = req.cookies;
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
      await User.findByIdAndUpdate(decoded.userId, { refreshToken: null });
    }
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
    res.json({ message: 'Logged out.' });
  }
};

// POST /api/auth/google
exports.googleAuth = async (req, res) => {
  try {
    const { credential, role = 'user' } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required.' });
    }

    const { data: profile } = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
      params: { id_token: credential },
    });

    const expectedClientId = process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && profile.aud !== expectedClientId) {
      return res.status(401).json({ message: 'Google credential audience mismatch.' });
    }

    if (!profile.email || profile.email_verified !== 'true') {
      return res.status(401).json({ message: 'Google email is not verified.' });
    }

    let user = await User.findOne({ email: profile.email });
    if (!user) {
      user = await User.create({
        name: profile.name || profile.email.split('@')[0],
        email: profile.email,
        photo: profile.picture || '',
        password: `Google@${Date.now()}`,
        role: 'user',
      });
    } else {
      if (profile.picture && !user.photo) user.photo = profile.picture;
      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated. Contact admin.' });
      }
      await user.save({ validateBeforeSave: false });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id, false);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', refreshToken, getCookieOptions(false));
    res.json({
      message: 'Google sign-in successful',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        photo: user.photo,
      },
    });
  } catch (error) {
    console.error('Google Auth Error:', error.response?.data || error.message);
    res.status(401).json({ message: 'Google sign-in failed.' });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'If that email exists, an OTP has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await sendPasswordResetOTP({ toEmail: user.email, toName: user.name, otp });

    logPasswordReset({
      email: user.email,
      userId: user._id,
      ipAddress: getIP(req),
      userAgent: getUA(req),
    }).catch(() => {});

    res.json({ message: 'If that email exists, an OTP has been sent.' });
  } catch (error) {
    console.error('Forgot Password Error:', error?.response?.data || error?.message || error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email }).select('+resetOtp +resetOtpExpiry');

    if (!user || user.resetOtp !== otp || user.resetOtpExpiry < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // Validate password policy before saving
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword);
    if (!strongPassword) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters with uppercase, lowercase, and a number.',
      });
    }

    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/auth/account
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete your account.' });
    }

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.role === 'superadmin' || user.role === 'manager') {
      return res.status(403).json({ message: 'Privileged accounts cannot be self-deleted.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password.' });

    await User.findByIdAndDelete(req.user.userId);
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
    res.json({ message: 'Account deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        photo: user.photo,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    if (req.file && req.file.path) {
      updateData.photo = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        photo: user.photo,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Server error during profile update.' });
  }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required.' });
    }

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword);
    if (!strongPassword) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters with uppercase, lowercase, and a number.',
      });
    }

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid current password.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ message: 'Server error during password change.' });
  }
};
