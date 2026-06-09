const jwt = require('jsonwebtoken');
const User = require('../models/User');
const tokenBlacklist = require('../utils/tokenBlacklist');

const ACCESS_SECRET = process.env.JWT_SECRET;

// Optional auth — sets req.user if a valid token is present, otherwise passes through
const optAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    if (await tokenBlacklist.has(token)) return next();

    const decoded = jwt.verify(token, ACCESS_SECRET);
    const user = await User.findById(decoded.userId);
    if (user && user.isActive) {
      req.user = {
        userId: user._id,
        role: user.role,
        email: user.email,
        name: user.name,
        phone: user.phone,
      };
    }
  } catch {
    // Invalid or expired token — continue as guest
  }
  next();
};

module.exports = optAuth;
