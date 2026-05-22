require('dotenv').config({path: './server/.env'});
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const result = await db.collection('membershipplans').updateMany(
    { price: 500 }, 
    { $set: { isActive: false } }
  );
  console.log('Modified:', result.modifiedCount);
  process.exit(0);
}).catch(console.error);
