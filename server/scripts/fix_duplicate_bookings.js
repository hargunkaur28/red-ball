require('dotenv').config();
const mongoose = require('mongoose');
const Slot = require('../models/Slot');
const SlotBooking = require('../models/SlotBooking');

async function fixDuplicates() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // Let's find slot with ID 6a0475de77e9db215d13722c
    const targetSlotId = '6a0475de77e9db215d13722c';
    const slot = await Slot.findById(targetSlotId).populate('bookings');

    if (!slot) {
      console.log(`Slot ${targetSlotId} not found. Searching for all active slots with bookings...`);
      const slots = await Slot.find({ bookings: { $exists: true, $not: { $size: 0 } } }).populate('bookings');
      if (slots.length === 0) {
        console.log('No slots with bookings found.');
        return;
      }
      for (const s of slots) {
        await processSlot(s);
      }
    } else {
      await processSlot(slot);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

async function processSlot(slot) {
  console.log(`\n--- Processing Slot: ${slot.name} (${slot._id}) ---`);
  console.log(`Current Bookings count in DB field: ${slot.currentBookings}`);
  console.log(`Total booking references: ${slot.bookings.length}`);

  // Group bookings by playerName and other fields to identify duplicates
  const bookingsMap = {};
  const duplicateIds = [];
  const keepIds = [];

  for (const booking of slot.bookings) {
    if (!booking) continue;
    // We can identify duplicate walk-in bookings by matchingplayerName, numberOfPlayers and close createdAt timestamp
    const key = `${booking.playerName}_${booking.numberOfPlayers}_${booking.bookingType}`;
    
    if (bookingsMap[key]) {
      // Check if they were created very close to each other (e.g., within 5 minutes)
      const timeDiff = Math.abs(new Date(booking.createdAt) - new Date(bookingsMap[key].createdAt));
      if (timeDiff < 5 * 60 * 1000) {
        console.log(`Found duplicate booking: ${booking._id} for player "${booking.playerName}" created at ${booking.createdAt} (original: ${bookingsMap[key]._id} at ${bookingsMap[key].createdAt})`);
        duplicateIds.push(booking._id);
        continue;
      }
    }
    
    bookingsMap[key] = booking;
    keepIds.push(booking._id);
  }

  if (duplicateIds.length > 0) {
    console.log(`Removing ${duplicateIds.length} duplicate bookings...`);
    
    // Delete the duplicate booking documents
    const deleteResult = await SlotBooking.deleteMany({ _id: { $in: duplicateIds } });
    console.log(`Deleted ${deleteResult.deletedCount} documents from SlotBooking model.`);

    // Remove duplicates from slot booking references
    slot.bookings = keepIds;
    
    // Recalculate current bookings
    let actualBookingsCount = 0;
    for (const id of keepIds) {
      const b = await SlotBooking.findById(id);
      if (b) {
        actualBookingsCount += b.numberOfPlayers;
      }
    }
    
    slot.currentBookings = actualBookingsCount;
    await slot.save();
    console.log(`Updated Slot successfully! New currentBookings: ${slot.currentBookings}`);
  } else {
    console.log('No duplicate bookings found for this slot.');
  }
}

fixDuplicates();
