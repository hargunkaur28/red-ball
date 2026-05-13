const MembershipPlan = require('../models/MembershipPlan');

async function seedTestPlans(adminId) {
  if (process.env.NODE_ENV === 'production') return;

  const testPlans = [
    {
      name: '5 Minute Test Plan',
      duration: '5 Minutes',
      durationValue: 5,
      durationUnit: 'minutes',
      price: 10,
      gstPercent: 18,
      sportsIncluded: ['cricket'],
      isActive: true,
      createdBy: adminId
    },
    {
      name: '1 Hour Test Plan',
      duration: '1 Hour',
      durationValue: 1,
      durationUnit: 'hours',
      price: 50,
      gstPercent: 18,
      sportsIncluded: ['cricket', 'gym'],
      isActive: true,
      createdBy: adminId
    },
    {
      name: '1 Day Test Plan',
      duration: '1 Day',
      durationValue: 1,
      durationUnit: 'days',
      price: 100,
      gstPercent: 18,
      sportsIncluded: ['cricket', 'swimming', 'gym'],
      isActive: true,
      createdBy: adminId
    }
  ];

  for (const planData of testPlans) {
    const exists = await MembershipPlan.findOne({ name: planData.name });
    if (!exists) {
      await MembershipPlan.create(planData);
      console.log(`🌱 Seeded: ${planData.name}`);
    }
  }
}

module.exports = seedTestPlans;
