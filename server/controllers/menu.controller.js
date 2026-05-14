const MenuItem = require('../models/MenuItem');
const MenuCategory = require('../models/MenuCategory');

exports.getMenu = async (req, res) => {
  try {
    const categories = await MenuCategory.find({ isActive: true }).sort({ sortOrder: 1 });
    let items = await MenuItem.find({ isActive: true }).populate('categoryId', 'name icon').sort({ name: 1 });
    
    // Auto-seed Premium Sports Café Menu if database is empty
    if (items.length === 0) {
      const seedDishes = [
        {
          name: 'Whey Protein Isolate Shake',
          category: 'Recovery Shakes',
          price: 249,
          sizes: [{ label: 'Regular', price: 249 }, { label: 'Large', price: 349 }],
          calories: 210,
          protein: 28,
          preparationTime: 5,
          featured: true,
          chefRecommended: true,
          isVeg: true,
          image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=800&auto=format&fit=crop',
          description: 'Pure grass-fed isolate blended with raw cocoa, banana, and almond milk for rapid post-game muscle recovery.'
        },
        {
          name: 'Grilled Chicken Avocado Wrap',
          category: 'Protein Meals',
          price: 299,
          sizes: [{ label: 'Regular', price: 299 }],
          calories: 420,
          protein: 32,
          preparationTime: 12,
          featured: true,
          chefRecommended: true,
          isVeg: false,
          image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=800&auto=format&fit=crop',
          description: 'Tender seasoned chicken breast, fresh avocado guacamole, and crisp iceberg folded in a toasted multigrain wrap.'
        },
        {
          name: 'Gourmet Pesto Grilled Sandwich',
          category: 'Snacks',
          price: 219,
          sizes: [{ label: 'Regular', price: 219 }],
          calories: 380,
          protein: 14,
          preparationTime: 10,
          featured: true,
          chefRecommended: false,
          isVeg: true,
          image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=800&auto=format&fit=crop',
          description: 'Thick sourdough toast packed with fresh basil pesto, chargrilled peppers, zucchini, and stringy low-fat mozzarella.'
        },
        {
          name: 'Hydration Electrolyte Elixir',
          category: 'Drinks',
          price: 149,
          sizes: [{ label: 'Regular', price: 149 }],
          calories: 45,
          protein: 0,
          preparationTime: 5,
          featured: true,
          chefRecommended: false,
          isVeg: true,
          image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?q=80&w=800&auto=format&fit=crop',
          description: 'Chilled pink Himalayan salt, pure organic coconut water, fresh lime, and essential trace minerals to stop cramps.'
        },
        {
          name: 'Superfood Quinoa Energy Bowl',
          category: 'Healthy Bowls',
          price: 349,
          sizes: [{ label: 'Regular', price: 349 }],
          calories: 450,
          protein: 18,
          preparationTime: 15,
          featured: true,
          chefRecommended: true,
          isVeg: true,
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop',
          description: 'Protein-rich tri-color quinoa, spiced sweet potato, steamed edamame, and toasted flax seeds in citrus vinaigrette.'
        },
        {
          name: 'Wholewheat Protein Pasta',
          category: 'High Carb Meals',
          price: 379,
          sizes: [{ label: 'Regular', price: 379 }],
          calories: 520,
          protein: 26,
          preparationTime: 18,
          featured: true,
          chefRecommended: false,
          isVeg: true,
          image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800&auto=format&fit=crop',
          description: 'High-fiber durum wheat pasta cooked perfectly in authentic arrabbiata tomato-herb reduction with paneer cubes.'
        },
        {
          name: 'Peanut Butter Banana Smoothie',
          category: 'Recovery Shakes',
          price: 199,
          sizes: [{ label: 'Regular', price: 199 }],
          calories: 320,
          protein: 24,
          preparationTime: 5,
          featured: false,
          chefRecommended: true,
          isVeg: true,
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
          description: 'Creamy high-protein organic peanut butter, ripe bananas, Greek yogurt, and cinnamon blended smooth.'
        },
        {
          name: 'Chicken Rice Performance Meal',
          category: 'Protein Meals',
          price: 399,
          sizes: [{ label: 'Regular', price: 399 }],
          calories: 580,
          protein: 42,
          preparationTime: 15,
          featured: false,
          chefRecommended: true,
          isVeg: false,
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop',
          description: 'Herb-grilled lean chicken breast served over steamed brown rice and sautéed broccoli florets.'
        }
      ];

      await MenuItem.insertMany(seedDishes);
      items = await MenuItem.find({ isActive: true }).sort({ name: 1 });
    }

    res.json({ categories, items });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.getByCategory = async (req, res) => {
  try {
    const items = await MenuItem.find({ categoryId: req.params.categoryId, isActive: true });
    res.json({ items });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.createItem = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }
    if (typeof data.sizes === 'string') {
      try { data.sizes = JSON.parse(data.sizes); } catch(e){}
    }
    const item = await MenuItem.create(data);
    const populated = await item.populate('categoryId', 'name icon');
    const io = req.app.get('io');
    if (io) { io.emit('menu:updated'); io.emit('dashboard:refresh'); }
    res.status(201).json({ item: populated });
  } catch (error) { res.status(500).json({ message: 'Server error.', error: error.message }); }
};

exports.updateItem = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }
    if (typeof data.sizes === 'string') {
      try { data.sizes = JSON.parse(data.sizes); } catch(e){}
    }
    const item = await MenuItem.findByIdAndUpdate(req.params.id, data, { new: true }).populate('categoryId', 'name icon');
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    const io = req.app.get('io');
    if (io) { io.emit('menu:updated'); io.emit('dashboard:refresh'); }
    res.json({ item });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.deleteItem = async (req, res) => {
  try {
    await MenuItem.findByIdAndUpdate(req.params.id, { isActive: false });
    const io = req.app.get('io');
    if (io) { io.emit('menu:updated'); io.emit('dashboard:refresh'); }
    res.json({ message: 'Item archived.' });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.createCategory = async (req, res) => {
  try {
    const category = await MenuCategory.create(req.body);
    res.status(201).json({ category });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await MenuCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    res.json({ category });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};
