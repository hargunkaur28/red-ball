require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Attendance = require('./models/Attendance');
  const atts = await Attendance.find({ 
    userId: '6a039178554a53846671acdb', 
    sport: /swimming/i 
  }).sort({ checkInTime: -1 }).lean();
  
  console.log('Total Swimming entries:', atts.length);
  atts.forEach((a, i) => {
    console.log('Entry ' + (i+1) + ':', JSON.stringify({ 
      id: a._id,
      checkInTime: a.checkInTime, 
      checkOutTime: a.checkOutTime, 
      sessionStatus: a.sessionStatus 
    }));
  });
  process.exit(0);
});
