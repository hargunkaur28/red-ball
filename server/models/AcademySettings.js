const mongoose = require('mongoose');

const academySettingsSchema = new mongoose.Schema({
  academyName: {
    type: String,
    required: true,
    default: 'Red Ball Cricket Academy'
  },
  address: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('AcademySettings', academySettingsSchema);
