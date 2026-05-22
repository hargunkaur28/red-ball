const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/red-ball');
  const Membership = mongoose.connection.db.collection('memberships');
  const User = mongoose.connection.db.collection('users');
  
  const hargun = await User.findOne({ email: 'hargun@gmail.com' });
  if (hargun) {
    const memberships = await Membership.find({ studentId: hargun._id }).toArray();
    console.log('Memberships:', memberships.length);
    for (const m of memberships) {
      console.log('M._id:', m._id, 'planId:', m.planId, 'type:', typeof m.planId, 'isObjectId:', m.planId instanceof mongoose.Types.ObjectId);
    }
  }
  process.exit(0);
}
main().catch(console.error);
