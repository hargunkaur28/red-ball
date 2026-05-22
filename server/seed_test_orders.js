require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');
const MenuItem = require('./models/MenuItem');

async function seedTestOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const hargun = await User.findOne({ email: 'hargun@gmail.com' });
    if (!hargun) {
      console.error('User hargun@gmail.com not found.');
      process.exit(1);
    }
    console.log(`Found user: ${hargun.name} (${hargun._id})`);

    const menuItems = await MenuItem.find({ isActive: true }).limit(6);
    if (menuItems.length < 2) {
      console.error('Not enough menu items found.');
      process.exit(1);
    }

    // Order 1 — Delivery order with location (new status, paid online)
    const item1 = menuItems[0];
    const item2 = menuItems[1];
    const item3 = menuItems[2] || menuItems[0];

    const order1 = await Order.create({
      customerId: hargun._id,
      customerName: hargun.name,
      customerPhone: hargun.phone || '9876543210',
      orderType: 'delivery',
      deliveryAddress: '42, Sector 15, Gurugram, Haryana 122001, India',
      deliveryLocation: {
        lat: 28.4595,
        lng: 77.0266,
        address: '42, Sector 15, Gurugram, Haryana 122001, India',
        mapsUrl: 'https://maps.google.com/?q=28.4595,77.0266',
      },
      items: [
        { menuItemId: item1._id, name: item1.name, size: item1.sizes?.[0]?.label || 'Regular', quantity: 2, price: item1.sizes?.[0]?.price || 250, status: 'preparing' },
        { menuItemId: item2._id, name: item2.name, size: item2.sizes?.[0]?.label || 'Regular', quantity: 1, price: item2.sizes?.[0]?.price || 180, status: 'cancelled', cancelledAt: new Date(), cancelledBy: 'manager', refundStatus: 'pending' },
        { menuItemId: item3._id, name: item3.name, size: item3.sizes?.[0]?.label || 'Regular', quantity: 1, price: item3.sizes?.[0]?.price || 200, status: 'pending' },
      ],
      subtotal: (item1.sizes?.[0]?.price || 250) * 2 + (item2.sizes?.[0]?.price || 180) + (item3.sizes?.[0]?.price || 200),
      gstAmount: 0,
      totalAmount: (item1.sizes?.[0]?.price || 250) * 2 + (item2.sizes?.[0]?.price || 180) + (item3.sizes?.[0]?.price || 200),
      status: 'preparing',
      paymentMethod: 'online',
      paymentStatus: 'paid',
      estimatedPrepMinutes: 20,
      estimatedReadyAt: new Date(Date.now() + 20 * 60 * 1000),
      specialInstructions: 'Extra napkins please',
    });

    // Order 2 — Pickup order (new status, pending cash)
    const item4 = menuItems[3] || menuItems[0];
    const item5 = menuItems[4] || menuItems[1];

    const order2 = await Order.create({
      customerId: hargun._id,
      customerName: hargun.name,
      customerPhone: hargun.phone || '9876543210',
      orderType: 'pickup',
      items: [
        { menuItemId: item4._id, name: item4.name, size: item4.sizes?.[0]?.label || 'Regular', quantity: 1, price: item4.sizes?.[0]?.price || 300, status: 'pending' },
        { menuItemId: item5._id, name: item5.name, size: item5.sizes?.[0]?.label || 'Regular', quantity: 2, price: item5.sizes?.[0]?.price || 150, status: 'pending' },
      ],
      subtotal: (item4.sizes?.[0]?.price || 300) + (item5.sizes?.[0]?.price || 150) * 2,
      gstAmount: 0,
      totalAmount: (item4.sizes?.[0]?.price || 300) + (item5.sizes?.[0]?.price || 150) * 2,
      status: 'new',
      paymentMethod: 'upi',
      paymentStatus: 'pending',
    });

    console.log(`\nCreated Order 1: ${order1.orderNumber}`);
    console.log(`  Type: ${order1.orderType} | Status: ${order1.status} | Payment: ${order1.paymentMethod} (${order1.paymentStatus})`);
    console.log(`  Items: ${order1.items.map(i => `${i.name} [${i.status}]`).join(', ')}`);
    console.log(`  Delivery: ${order1.deliveryAddress}`);
    console.log(`  Prep time: ${order1.estimatedPrepMinutes} min`);

    console.log(`\nCreated Order 2: ${order2.orderNumber}`);
    console.log(`  Type: ${order2.orderType} | Status: ${order2.status} | Payment: ${order2.paymentMethod} (${order2.paymentStatus})`);
    console.log(`  Items: ${order2.items.map(i => `${i.name} [${i.status}]`).join(', ')}`);

    console.log('\nDone! Both orders are ready to test in the restaurant portal.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seedTestOrders();
