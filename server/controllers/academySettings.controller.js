const AcademySettings = require('../models/AcademySettings');

exports.getAcademySettings = async (req, res) => {
  try {
    let settings = await AcademySettings.findOne();
    if (!settings) {
      settings = await AcademySettings.create({
        academyName: 'Red Ball Cricket Academy',
        address: '123 Sports Complex',
        phone: '',
        email: ''
      });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching academy settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch academy settings' });
  }
};

exports.updateAcademySettings = async (req, res) => {
  try {
    const { academyName, address, phone, email } = req.body;
    let settings = await AcademySettings.findOne();
    
    if (!settings) {
      settings = new AcademySettings();
    }
    
    if (academyName !== undefined) settings.academyName = academyName;
    if (address !== undefined) settings.address = address;
    if (phone !== undefined) settings.phone = phone;
    if (email !== undefined) settings.email = email;
    
    settings.updatedBy = req.user.id;
    await settings.save();
    
    res.json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating academy settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update academy settings' });
  }
};
