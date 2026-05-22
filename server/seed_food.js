require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const items = [
      {
        name: 'Spicy Paneer Burger',
        category: 'Burgers',
        description: 'Crispy paneer patty with spicy mayo and fresh lettuce.',
        image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        calories: 450,
        protein: 18,
        featured: true,
        chefRecommended: true,
        sizes: [{ label: 'Regular', price: 180 }],
        isActive: true,
        isAvailable: true,
        isVeg: true,
        preparationTime: 12,
        tags: ['spicy', 'bestseller']
      },
      {
        name: 'Classic Cold Coffee',
        category: 'Beverages',
        description: 'Creamy cold coffee blended with vanilla ice cream.',
        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        calories: 320,
        protein: 8,
        featured: true,
        chefRecommended: false,
        sizes: [{ label: 'Regular', price: 120 }, { label: 'Large', price: 150 }],
        isActive: true,
        isAvailable: true,
        isVeg: true,
        preparationTime: 5,
        tags: ['sweet', 'refreshing']
      }
    ];

    await MenuItem.insertMany(items);
    console.log('Seeded 2 food items successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding items:', error);
    process.exit(1);
  }
}

seed();
