const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/red-ball');
  const Attendance = mongoose.connection.db.collection('attendances');
  const User = mongoose.connection.db.collection('users');
  
  const hargun = await User.findOne({ email: 'hargun@gmail.com' });
  if (hargun) {
    const atts = await Attendance.find({ userId: hargun._id }).sort({ checkInTime: -1 }).limit(2).toArray();
    console.log(JSON.stringify(atts, null, 2));
  }
  process.exit(0);
}
main().catch(console.error);
