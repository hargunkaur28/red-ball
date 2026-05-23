const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function (v) {
        // Only validate on new/modified passwords (not hashed values)
        if (this.isModified && !this.isModified('password')) return true;
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);
      },
      message: 'Password must contain uppercase, lowercase, and a number',
    },
    select: false,
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'manager', 'receptionist', 'user'],
    default: 'user',
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: '',
  },
  address: {
    type: String,
    trim: true,
    default: '',
  },
  photo: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  refreshToken: {
    type: String,
    select: false,
  },
  resetOtp: {
    type: String,
    select: false,
  },
  resetOtpExpiry: {
    type: Date,
    select: false,
  },
  loginAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
  loginLockedUntil: {
    type: Date,
    default: null,
    select: false,
  },
  lastFailedLoginAt: {
    type: Date,
    default: null,
    select: false,
  },
  failedAlertSentAt: {
    type: Date,
    default: null,
    select: false,
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
