require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Sport = require('../models/Sport');

const IMAGE = 'https://mediarelations.gwu.edu/sites/g/files/zaxdzs5306/files/2024-06/adobestock_510555809.jpeg';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await Sport.findOneAndUpdate(
    { slug: 'box-cricket' },
    { thumbnail: IMAGE, heroImage: IMAGE, $set: { 'images.0': IMAGE } },
    { new: true }
  );
  if (!result) {
    console.error('Sport with slug "box-cricket" not found.');
  } else {
    console.log('✓ Updated box cricket image:', result.thumbnail);
  }
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
