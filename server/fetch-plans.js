const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/red-ball');
  const User = mongoose.connection.db.collection('users');
  const MembershipPlan = mongoose.connection.db.collection('membershipplans');
  
  const user = await User.findOne({ email: 'hargun@gmail.com' });
  console.log('User:', user);
  
  const plans = await MembershipPlan.find({}).toArray();
  console.log('Plans:', plans.map(p => ({ _id: p._id, name: p.name, sportsIncluded: p.sportsIncluded, durationMonths: p.durationMonths })));
  
  process.exit(0);
}
main().catch(console.error);
