const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ACCESS_SECRET = process.env.JWT_SECRET;
if (!ACCESS_SECRET) {
  throw new Error('FATAL: JWT_SECRET must be set in .env');
}

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      // Fallback for browser-opened routes (e.g. invoice print in new tab)
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, ACCESS_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or deactivated.' });
    }

    req.user = {
      userId: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
      phone: user.phone,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.', expired: true });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = auth;
