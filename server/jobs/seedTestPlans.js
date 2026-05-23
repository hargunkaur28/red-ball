const MembershipPlan = require('../models/MembershipPlan');
const Service = require('../models/Service');

async function seedTestPlans(adminId) {
  const plans = [
    { name: 'Gym Monthly', duration: '1 Month', durationValue: 1, durationUnit: 'months', price: 1400, sportsIncluded: ['gym'] },
    { name: 'Gym Quarterly', duration: '3 Months', durationValue: 3, durationUnit: 'months', price: 3500, sportsIncluded: ['gym'] },
    { name: 'Gym Half-Yearly', duration: '6 Months', durationValue: 6, durationUnit: 'months', price: 6000, sportsIncluded: ['gym'] },
    { name: 'Gym Yearly', duration: '1 Year', durationValue: 1, durationUnit: 'years', price: 10000, sportsIncluded: ['gym'] },
    { name: 'Swimming Monthly', duration: '1 Month', durationValue: 1, durationUnit: 'months', price: 2500, sportsIncluded: ['swimming'], features: ['6AM-8PM access', 'Coaching add-on +1000'] },
    { name: 'Swimming Quarterly', duration: '3 Months', durationValue: 3, durationUnit: 'months', price: 6000, sportsIncluded: ['swimming'] },
    { name: 'Swimming Half-Yearly', duration: '6 Months', durationValue: 6, durationUnit: 'months', price: 10000, sportsIncluded: ['swimming'] },
    { name: 'Pickleball Monthly', duration: '1 Month', durationValue: 1, durationUnit: 'months', price: 2500, sportsIncluded: ['pickleball'], features: ['Balls and rackets included'] },
    { name: 'Pickleball Quarterly', duration: '3 Months', durationValue: 3, durationUnit: 'months', price: 6000, sportsIncluded: ['pickleball'] },
    { name: 'Pickleball Half-Yearly', duration: '6 Months', durationValue: 6, durationUnit: 'months', price: 10000, sportsIncluded: ['pickleball'] },
    { name: 'Pickleball Yearly', duration: '1 Year', durationValue: 1, durationUnit: 'years', price: 16000, sportsIncluded: ['pickleball'] },
    { name: 'Badminton Monthly', duration: '1 Month', durationValue: 1, durationUnit: 'months', price: 2500, sportsIncluded: ['badminton'], features: ['5 courts available'] },
    { name: 'Badminton Quarterly', duration: '3 Months', durationValue: 3, durationUnit: 'months', price: 6000, sportsIncluded: ['badminton'] },
    { name: 'Badminton Half-Yearly', duration: '6 Months', durationValue: 6, durationUnit: 'months', price: 10000, sportsIncluded: ['badminton'] },
    { name: 'Badminton Yearly', duration: '1 Year', durationValue: 1, durationUnit: 'years', price: 16000, sportsIncluded: ['badminton'] },
    { name: 'Children Coaching Monthly', duration: '1 Month', durationValue: 1, durationUnit: 'months', price: 3000, sportsIncluded: ['coaching'], features: ['5PM-7PM', '2 slots', 'Minimum 1 month'] },
    { name: 'All Services Quarterly', duration: '3 Months', durationValue: 3, durationUnit: 'months', price: 10000, sportsIncluded: ['all-services'] },
    { name: 'All Services Half-Yearly', duration: '6 Months', durationValue: 6, durationUnit: 'months', price: 17000, sportsIncluded: ['all-services'] },
    { name: 'All Services Yearly', duration: '1 Year', durationValue: 1, durationUnit: 'years', price: 30000, sportsIncluded: ['all-services'] },
  ];

  for (const planData of plans) {
    await MembershipPlan.findOneAndUpdate(
      { name: planData.name },
      { $setOnInsert: { ...planData, gstPercent: 18, isActive: true, createdBy: adminId } },
      { upsert: true, new: true }
    );
  }

  const services = [
    { name: 'Gym', hourlyPrice: 1400, playerCapacity: 30, category: 'gym', availability: 'Monthly packages', pricingOptions: [
      { label: 'Monthly', price: 1400, unit: 'month' }, { label: '3 Months', price: 3500, unit: '3 months' }, { label: '6 Months', price: 6000, unit: '6 months' }, { label: 'Yearly', price: 10000, unit: 'year' },
    ] },
    { name: 'Box Cricket', hourlyPrice: 600, playerCapacity: 10, category: 'cricket', availability: 'Day and premium slots', pricingOptions: [
      { label: 'Standard Day', price: 600, unit: 'day' }, { label: 'Premium Slot', price: 800, unit: 'day' },
    ] },
    { name: 'Swimming', hourlyPrice: 200, playerCapacity: 20, category: 'swimming', availability: '6AM-8PM', pricingOptions: [
      { label: 'Hourly', price: 200, unit: 'hour' }, { label: 'Monthly', price: 2500, unit: 'month' }, { label: '3 Months', price: 6000, unit: '3 months' }, { label: '6 Months', price: 10000, unit: '6 months' }, { label: 'Coaching Add-on', price: 1000, unit: 'month' },
    ] },
    { name: 'Pickleball', hourlyPrice: 1000, playerCapacity: 8, category: 'pickleball', availability: 'Balls and rackets included', pricingOptions: [
      { label: 'Day Pass', price: 1000, unit: 'day' }, { label: 'Monthly', price: 2500, unit: 'month' }, { label: '3 Months', price: 6000, unit: '3 months' }, { label: '6 Months', price: 10000, unit: '6 months' }, { label: 'Yearly', price: 16000, unit: 'year' },
    ] },
    { name: 'Badminton', hourlyPrice: 500, playerCapacity: 10, category: 'badminton', availability: '5 courts', pricingOptions: [
      { label: 'Single Court', price: 500, unit: 'hour/day' }, { label: 'Monthly', price: 2500, unit: 'month' }, { label: '3 Months', price: 6000, unit: '3 months' }, { label: '6 Months', price: 10000, unit: '6 months' }, { label: 'Yearly', price: 16000, unit: 'year' },
    ] },
    { name: 'Children Coaching', hourlyPrice: 3000, playerCapacity: 20, category: 'coaching', availability: '5PM-7PM, 2 slots', pricingOptions: [
      { label: 'Monthly with coaching', price: 3000, unit: 'month', note: 'Minimum 1 month' },
    ] },
    { name: 'All Services Package', hourlyPrice: 10000, playerCapacity: 50, category: 'package', availability: 'All services access', pricingOptions: [
      { label: '3 Months', price: 10000, unit: '3 months' }, { label: '6 Months', price: 17000, unit: '6 months' }, { label: 'Yearly', price: 30000, unit: 'year' },
    ] },
  ];

  for (const serviceData of services) {
    await Service.findOneAndUpdate(
      { name: serviceData.name },
      { $set: serviceData },
      { upsert: true, new: true }
    );
  }
}

module.exports = seedTestPlans;
