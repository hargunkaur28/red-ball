const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/red-ball');
  const User = mongoose.connection.db.collection('users');
  const Membership = mongoose.connection.db.collection('memberships');
  const MembershipPlan = mongoose.connection.db.collection('membershipplans');
  
  const user = await User.findOne({ email: 'hargun@gmail.com' });
  if (!user) {
    console.log('User not found');
    process.exit(0);
  }
  console.log('User found:', user._id);
  
  const memberships = await Membership.find({ studentId: user._id }).toArray();
  console.log('Memberships:', memberships.length);
  for (const m of memberships) {
    const plan = await MembershipPlan.findOne({ _id: m.planId });
    console.log(`Plan: ${plan?.name}, Status: ${m.status}`);
  }
  
  process.exit(0);
}
main().catch(console.error);
