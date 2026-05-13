require('dotenv').config();
const mongoose = require('mongoose');
const OperationEvent = require('../models/OperationEvent');

async function seedOperations() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const seedEvents = [
      {
        title: 'Morning Batting Masterclass',
        eventType: 'coaching',
        ground: 'Court A',
        sport: 'cricket',
        startTime: '08:00',
        endTime: '10:30',
        date: today,
        participants: 12,
        maxCapacity: 15,
        status: 'completed',
        description: 'Elite net session with bowling machine setup.',
      },
      {
        title: 'Corporate Box Cricket League',
        eventType: 'club-booking',
        ground: 'Turf 1',
        sport: 'turf',
        startTime: '14:00',
        endTime: '17:00',
        date: today,
        participants: 18,
        maxCapacity: 20,
        status: 'ongoing',
        description: 'Annual corporate knockout match. Refreshments required.',
      },
      {
        title: 'U16 Junior Coaching Camp',
        eventType: 'coaching',
        ground: 'Court B',
        sport: 'cricket',
        startTime: '16:00',
        endTime: '18:30',
        date: today,
        participants: 14,
        maxCapacity: 20,
        status: 'scheduled',
        description: 'Fielding drills and spin bowling evaluation.',
      },
      {
        title: 'Turf Floodlight Maintenance',
        eventType: 'maintenance',
        ground: 'Main Ground',
        sport: 'cricket',
        startTime: '19:00',
        endTime: '21:00',
        date: today,
        participants: 2,
        maxCapacity: 5,
        status: 'scheduled',
        description: 'Replacement of halogen bulbs on Tower 3.',
      },
      // Tomorrow
      {
        title: 'Weekend Fast Bowling Camp',
        eventType: 'coaching',
        ground: 'Court A',
        sport: 'cricket',
        startTime: '09:00',
        endTime: '12:00',
        date: tomorrow,
        participants: 10,
        maxCapacity: 15,
        status: 'scheduled',
        description: 'Pace analysis using speed guns.',
      },
      {
        title: 'Open One-Time Play Slot',
        eventType: 'one-time-play',
        ground: 'Turf 1',
        sport: 'football',
        startTime: '18:00',
        endTime: '19:00',
        date: tomorrow,
        participants: 10,
        maxCapacity: 14,
        status: 'scheduled',
        description: 'Walk-in group slot booking.',
      },
      // Day After
      {
        title: 'Academy Practice Match',
        eventType: 'event',
        ground: 'Main Ground',
        sport: 'cricket',
        startTime: '10:00',
        endTime: '17:00',
        date: dayAfter,
        participants: 22,
        maxCapacity: 30,
        status: 'scheduled',
        description: 'Red Ball Seniors vs Green Ball Challengers 50-over match.',
      },
    ];

    console.log('Seeding operational events...');
    for (const event of seedEvents) {
      // Check if similar event exists to avoid duplicate clutter
      const exists = await OperationEvent.findOne({ title: event.title, date: event.date });
      if (!exists) {
        await OperationEvent.create(event);
        console.log(`Created: ${event.title}`);
      } else {
        console.log(`Skipped existing: ${event.title}`);
      }
    }

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error seeding operations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

seedOperations();
