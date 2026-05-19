require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const connectDB = require('../config/db');

const menuItems = [
  // BEVERAGES
  { name: 'Mango Shake', category: 'Beverages', sizes: [{ label: 'Regular', price: 130 }], isVeg: true, image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8TWFuZ28lMjBTaGFrZXxlbnwwfHwwfHx8MA%3D%3D', description: 'Rich and creamy shake made with fresh Alphonso mangoes.' },
  { name: 'Vanilla Shake', category: 'Beverages', sizes: [{ label: 'Regular', price: 110 }], isVeg: true, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80', description: 'Classic thick shake with pure vanilla extract.' },
  { name: 'Strawberry Shake', category: 'Beverages', sizes: [{ label: 'Regular', price: 139 }], isVeg: true, image: 'https://images.unsplash.com/photo-1543573852-1a71a6ce19bc?auto=format&fit=crop&w=600&q=80', description: 'Luscious shake with real strawberry crush.' },
  { name: 'Chocolate Shake', category: 'Beverages', sizes: [{ label: 'Regular', price: 139 }], isVeg: true, image: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=600&q=80', description: 'Deep chocolate flavor blended with rich milk.' },
  { name: 'Butterscotch Shake', category: 'Beverages', sizes: [{ label: 'Regular', price: 139 }], isVeg: true, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80', description: 'Smooth butterscotch crunch blended into a thick shake.' },
  { name: 'Oreo Shake', category: 'Beverages', sizes: [{ label: 'Regular', price: 149 }], isVeg: true, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80', description: 'Vanilla ice cream blended with Oreo cookies and chocolate syrup.' },
  { name: 'Sweet Lassi', category: 'Beverages', sizes: [{ label: 'Regular', price: 99 }], isVeg: true, image: 'https://images.unsplash.com/photo-1517244683847-7456b63c5969?auto=format&fit=crop&w=600&q=80', description: 'Traditional sweet yogurt drink garnished with nuts.' },
  { name: 'Cold Coffee', category: 'Beverages', sizes: [{ label: 'Regular', price: 99 }], isVeg: true, image: 'https://images.unsplash.com/photo-1517701550527-30c610f37ef5?auto=format&fit=crop&w=600&q=80', description: 'Classic iced coffee with a creamy texture.' },
  { name: 'Mocktails', category: 'Beverages', sizes: [{ label: 'Regular', price: 90 }], isVeg: true, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', description: 'Refreshing non-alcoholic fruit cocktail.' },
  { name: 'Green Apple', category: 'Beverages', sizes: [{ label: 'Regular', price: 80 }], isVeg: true, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', description: 'Tangy and sweet green apple flavored cooler.' },
  { name: 'Virgin Mojito', category: 'Beverages', sizes: [{ label: 'Regular', price: 90 }], isVeg: true, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', description: 'Classic lime and mint cooler with soda.' },
  { name: 'Mint Mojito', category: 'Beverages', sizes: [{ label: 'Regular', price: 70 }], isVeg: true, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', description: 'Refreshing mint loaded cooler.' },
  { name: 'Lemon Soda', category: 'Beverages', sizes: [{ label: 'Regular', price: 99 }], isVeg: true, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', description: 'Fizzy lemon drink served sweet or salted.' },
  { name: 'Watermelon Mojito', category: 'Beverages', sizes: [{ label: 'Regular', price: 99 }], isVeg: true, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', description: 'Fresh watermelon chunks with mint and lime.' },

  // ICE CREAM
  { name: 'Vanilla Ice Cream', category: 'Ice Cream', sizes: [{ label: 'Regular', price: 59 }], isVeg: true, image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80', description: 'Classic vanilla bean ice cream.' },
  { name: 'Butterscotch Ice Cream', category: 'Ice Cream', sizes: [{ label: 'Regular', price: 59 }], isVeg: true, image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80', description: 'Rich ice cream with butterscotch crunchies.' },
  { name: 'Chocolate Ice Cream', category: 'Ice Cream', sizes: [{ label: 'Regular', price: 59 }], isVeg: true, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80', description: 'Rich and creamy dark chocolate ice cream.' },
  { name: 'Kesar Pista Ice Cream', category: 'Ice Cream', sizes: [{ label: 'Regular', price: 59 }], isVeg: true, image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80', description: 'Traditional Indian flavor with saffron and pistachios.' },
  { name: 'Tutti Frutti Ice Cream', category: 'Ice Cream', sizes: [{ label: 'Regular', price: 59 }], isVeg: true, image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80', description: 'Vanilla ice cream loaded with candied fruits.' },

  // CHAAT
  { name: 'Chana Chaat', category: 'Chaat', sizes: [{ label: 'Regular', price: 130 }], isVeg: true, image: 'https://images.unsplash.com/photo-1601050688218-0f99457fc633?auto=format&fit=crop&w=600&q=80', description: 'Tangy chickpea salad with spices and herbs.' },
  { name: 'Peanut Masala', category: 'Chaat', sizes: [{ label: 'Regular', price: 99 }], isVeg: true, image: 'https://images.unsplash.com/photo-1601050688218-0f99457fc633?auto=format&fit=crop&w=600&q=80', description: 'Crunchy peanuts tossed with onions, tomatoes, and spices.' },
  { name: 'Sweet Corn Chaat', category: 'Chaat', sizes: [{ label: 'Regular', price: 160 }], isVeg: true, image: 'https://images.unsplash.com/photo-1601050688218-0f99457fc633?auto=format&fit=crop&w=600&q=80', description: 'Steamed sweet corn with butter and chaat masala.' },
  { name: 'Boiled Veg', category: 'Chaat', sizes: [{ label: 'Regular', price: 199 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Healthy assortment of boiled seasonal vegetables.' },
  { name: 'Dry Fruit', category: 'Chaat', sizes: [{ label: 'Regular', price: 130 }], isVeg: true, image: 'https://images.unsplash.com/photo-1601050688218-0f99457fc633?auto=format&fit=crop&w=600&q=80', description: 'Assorted roasted dry fruits with a touch of salt.' },
  { name: 'Crispy Chana', category: 'Chaat', sizes: [{ label: 'Regular', price: 140 }], isVeg: true, image: 'https://images.unsplash.com/photo-1601050688218-0f99457fc633?auto=format&fit=crop&w=600&q=80', description: 'Deep fried spiced chickpeas.' },
  { name: 'Roasted Peanuts', category: 'Chaat', sizes: [{ label: 'Regular', price: 120 }], isVeg: true, image: 'https://images.unsplash.com/photo-1601050688218-0f99457fc633?auto=format&fit=crop&w=600&q=80', description: 'Classic roasted peanuts with salt.' },
  { name: 'Cashew Fry', category: 'Chaat', sizes: [{ label: 'Regular', price: 199 }], isVeg: true, image: 'https://images.unsplash.com/photo-1601050688218-0f99457fc633?auto=format&fit=crop&w=600&q=80', description: 'Crispy fried cashews with spices.' },
  { name: 'Mix Chaat', category: 'Chaat', sizes: [{ label: 'Regular', price: 180 }], isVeg: true, image: 'https://images.unsplash.com/photo-1601050688218-0f99457fc633?auto=format&fit=crop&w=600&q=80', description: 'Combination of various chaat elements for a blast of flavor.' },
  { name: 'Masala Papad', category: 'Chaat', sizes: [{ label: 'Regular', price: 60 }], isVeg: true, image: 'https://images.unsplash.com/photo-1601050688218-0f99457fc633?auto=format&fit=crop&w=600&q=80', description: 'Crispy papad topped with spicy onion-tomato mix.' },
  { name: 'Kala Chana Dry', category: 'Chaat', sizes: [{ label: 'Regular', price: 180 }], isVeg: true, image: 'https://images.unsplash.com/photo-1601050688218-0f99457fc633?auto=format&fit=crop&w=600&q=80', description: 'Healthy black chickpeas cooked dry with spices.' },

  // SOUPS
  { name: 'Sweet Corn Soup', category: 'Soups', sizes: [{ label: 'Regular', price: 99 }], isVeg: true, image: 'https://images.unsplash.com/photo-1547592166-23ac45744add?auto=format&fit=crop&w=600&q=80', description: 'Creamy soup with sweet corn kernels.' },
  { name: 'Hot and Sour Soup', category: 'Soups', sizes: [{ label: 'Regular', price: 110 }], isVeg: true, image: 'https://images.unsplash.com/photo-1547592166-23ac45744add?auto=format&fit=crop&w=600&q=80', description: 'Spicy and tangy soup with chopped vegetables.' },
  { name: 'Tomato Soup', category: 'Soups', sizes: [{ label: 'Regular', price: 99 }], isVeg: true, image: 'https://images.unsplash.com/photo-1547592166-23ac45744add?auto=format&fit=crop&w=600&q=80', description: 'Classic rich tomato soup with bread croutons.' },
  { name: 'Manchow Soup', category: 'Soups', sizes: [{ label: 'Regular', price: 110 }], isVeg: true, image: 'https://images.unsplash.com/photo-1547592166-23ac45744add?auto=format&fit=crop&w=600&q=80', description: 'Spicy soy-based soup with crispy noodles on top.' },
  { name: 'Veg Clear Soup', category: 'Soups', sizes: [{ label: 'Regular', price: 100 }], isVeg: true, image: 'https://images.unsplash.com/photo-1547592166-23ac45744add?auto=format&fit=crop&w=600&q=80', description: 'Light and healthy soup with clear vegetable broth.' },
  { name: 'Lemon Coriander Soup', category: 'Soups', sizes: [{ label: 'Regular', price: 99 }], isVeg: true, image: 'https://images.unsplash.com/photo-1547592166-23ac45744add?auto=format&fit=crop&w=600&q=80', description: 'Zesty soup with a strong flavor of lemon and coriander.' },

  // CHINESE
  { name: 'Paneer Chilli Dry', category: 'Chinese', sizes: [{ label: 'Regular', price: 280 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Crispy paneer cubes tossed in a spicy chili sauce.' },
  { name: 'Veg Manchurian Dry', category: 'Chinese', sizes: [{ label: 'Regular', price: 180 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Fried vegetable balls in a tangy, spicy sauce.' },
  { name: 'Veg Crispy', category: 'Chinese', sizes: [{ label: 'Regular', price: 170 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Assorted crispy fried vegetables tossed in a sweet and spicy sauce.' },
  { name: 'Paneer Sisali Paneer', category: 'Chinese', sizes: [{ label: 'Regular', price: 260 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Special chef style paneer with a unique sauce.' },
  { name: 'Veg Noodles', category: 'Chinese', sizes: [{ label: 'Regular', price: 199 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Classic stir-fried noodles with crisp vegetables.' },
  { name: 'Hakka Noodles', category: 'Chinese', sizes: [{ label: 'Regular', price: 220 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Indo-Chinese style stir-fried Hakka noodles.' },
  { name: 'Singapore Noodles', category: 'Chinese', sizes: [{ label: 'Regular', price: 210 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Curry flavored noodles with mixed vegetables.' },
  { name: 'Mushroom Chilli', category: 'Chinese', sizes: [{ label: 'Regular', price: 180 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Crispy mushrooms tossed in chili sauce.' },
  { name: 'Chilli Potato', category: 'Chinese', sizes: [{ label: 'Regular', price: 170 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Fried potato fingers in a spicy chili sauce.' },
  { name: 'Honey Chilli Potato', category: 'Chinese', sizes: [{ label: 'Regular', price: 190 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Crispy potatoes tossed in a sweet honey and spicy chili sauce.' },
  { name: 'Crispy Corn', category: 'Chinese', sizes: [{ label: 'Regular', price: 170 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Deep fried corn kernels tossed with spices and onions.' },
  { name: 'Baby Corn Chilli', category: 'Chinese', sizes: [{ label: 'Regular', price: 190 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Crispy baby corn tossed in chili sauce.' },
  { name: 'Gobhi Manchurian', category: 'Chinese', sizes: [{ label: 'Regular', price: 160 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Fried cauliflower florets in a tangy sauce.' },
  { name: 'Paneer Chilli Gravy', category: 'Chinese', sizes: [{ label: 'Regular', price: 280 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Paneer cubes in a rich, spicy Chinese gravy.' },
  { name: 'Mushroom Duples', category: 'Chinese', sizes: [{ label: 'Regular', price: 159 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Special mushroom dish with stuffed filling.' },
  { name: 'Veg Spring Roll', category: 'Chinese', sizes: [{ label: 'Regular', price: 149 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Crispy rolls filled with spiced vegetables.' },
  { name: 'Paneer Salted Paper', category: 'Chinese', sizes: [{ label: 'Regular', price: 160 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Crispy paneer tossed with salt and black pepper.' },
  { name: 'Schezwan Noodles', category: 'Chinese', sizes: [{ label: 'Regular', price: 200 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Spicy noodles tossed in Schezwan sauce.' },
  { name: 'Veg Fried Rice', category: 'Chinese', sizes: [{ label: 'Regular', price: 240 }], isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Stir-fried rice with vegetables and soy sauce.' },
  { name: 'Egg Fried Rice', category: 'Chinese', sizes: [{ label: 'Regular', price: 250 }], isVeg: false, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', description: 'Fried rice with scrambled eggs and vegetables.' },

  // INDIAN DISHES
  { name: 'Shahi Paneer', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 280 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Paneer in a rich, creamy tomato and cashew gravy.' },
  { name: 'Paneer Butter Masala', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 280 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Paneer cooked in a smooth, buttery tomato gravy.' },
  { name: 'Paneer Korma', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 300 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Rich korma with paneer cubes and aromatic spices.' },
  { name: 'Paneer Lababdar', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 280 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Paneer in a spicy tomato-onion gravy with grated paneer.' },
  { name: 'Matar Paneer', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 270 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Classic combination of green peas and paneer in gravy.' },
  { name: 'Palak Paneer', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 300 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Paneer cubes in a smooth spinach gravy.' },
  { name: 'Paneer Do Pyaza', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 310 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Paneer cooked with a large amount of onions.' },
  { name: 'Mix Veg', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 260 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Assorted vegetables cooked in a spiced gravy.' },
  { name: 'Paneer Bhurji', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 320 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Scrambled paneer with onions, tomatoes, and spices.' },
  { name: 'Mushroom Masala', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 270 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Mushrooms cooked in a rich onion-tomato gravy.' },
  { name: 'Kaju Masala', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 320 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Roasted cashews in a spicy and rich gravy.' },
  { name: 'Kaju Curry', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 300 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Cashews cooked in a smooth, mild curry.' },
  { name: 'Dal Tadka', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 240 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Yellow lentils tempered with ghee and spices.' },
  { name: 'Dal Fry', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 230 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Spicy fried lentils.' },
  { name: 'Jeera Aloo', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 220 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Potatoes tossed with cumin seeds and spices.' },
  { name: 'Veg Jaipuri', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 290 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Vegetables cooked in Rajasthani style with papad.' },
  { name: 'Veg Kolhapuri', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 280 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Spicy mixed vegetables from the city of Kolhapur.' },
  { name: 'Veg Biryani', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 249 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Fragrant basmati rice cooked with mixed vegetables and spices.' },
  { name: 'Matar Pulao', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 199 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Basmati rice cooked with green peas.' },
  { name: 'Veg Pulao', category: 'Indian Dishes', sizes: [{ label: 'Regular', price: 230 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Mildly spiced rice with assorted vegetables.' },

  // RAITA
  { name: 'Plain Dahi', category: 'Raita', sizes: [{ label: 'Regular', price: 99 }], isVeg: true, image: 'https://images.unsplash.com/photo-1482049016688-2d3a1b311543?auto=format&fit=crop&w=600&q=80', description: 'Fresh plain homemade yogurt.' },
  { name: 'Pineapple Raita', category: 'Raita', sizes: [{ label: 'Regular', price: 130 }], isVeg: true, image: 'https://images.unsplash.com/photo-1482049016688-2d3a1b311543?auto=format&fit=crop&w=600&q=80', description: 'Sweet and savory yogurt with pineapple chunks.' },
  { name: 'Boondi Raita', category: 'Raita', sizes: [{ label: 'Regular', price: 120 }], isVeg: true, image: 'https://images.unsplash.com/photo-1482049016688-2d3a1b311543?auto=format&fit=crop&w=600&q=80', description: 'Yogurt with crispy gram flour balls.' },
  { name: 'Veg Raita', category: 'Raita', sizes: [{ label: 'Regular', price: 130 }], isVeg: true, image: 'https://images.unsplash.com/photo-1482049016688-2d3a1b311543?auto=format&fit=crop&w=600&q=80', description: 'Yogurt with chopped cucumber, tomato, and onion.' },
  { name: 'Aloo Raita', category: 'Raita', sizes: [{ label: 'Regular', price: 110 }], isVeg: true, image: 'https://images.unsplash.com/photo-1482049016688-2d3a1b311543?auto=format&fit=crop&w=600&q=80', description: 'Yogurt with boiled potato cubes and spices.' },

  // BREAD
  { name: 'Tawa Butter Roti', category: 'Bread', sizes: [{ label: 'Regular', price: 30 }], isVeg: true, image: 'https://images.unsplash.com/photo-1601050688218-0f99457fc633?auto=format&fit=crop&w=600&q=80', description: 'Whole wheat bread cooked on a tawa with butter.' },
  { name: 'Tawa Roti', category: 'Bread', sizes: [{ label: 'Regular', price: 25 }], isVeg: true, image: 'https://images.unsplash.com/photo-1601050688218-0f99457fc633?auto=format&fit=crop&w=600&q=80', description: 'Plain whole wheat bread cooked on a tawa.' },

  // SALAD
  { name: 'Onion Salad', category: 'Salad', sizes: [{ label: 'Regular', price: 99 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Freshly sliced onions with lemon and green chili.' },
  { name: 'Green Salad', category: 'Salad', sizes: [{ label: 'Regular', price: 120 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Fresh garden salad with cucumber, tomato, and onion.' },
  { name: 'Cucumber Salad', category: 'Salad', sizes: [{ label: 'Regular', price: 99 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Freshly sliced cucumbers.' },
  { name: 'Beet Salad', category: 'Salad', sizes: [{ label: 'Regular', price: 130 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Fresh beetroot salad.' },
  { name: 'Russian Salad', category: 'Salad', sizes: [{ label: 'Regular', price: 140 }], isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', description: 'Boiled vegetables in a mayonnaise dressing.' },

  // PASTA
  { name: 'Red Sauce Pasta', category: 'Pasta', sizes: [{ label: 'Regular', price: 139 }], isVeg: true, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', description: 'Pasta in a tangy tomato-based red sauce.' },
  { name: 'Creamy White Sauce Pasta', category: 'Pasta', sizes: [{ label: 'Regular', price: 139 }], isVeg: true, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', description: 'Pasta in a rich and creamy white sauce.' },
  { name: 'Makhani Sauce Pasta', category: 'Pasta', sizes: [{ label: 'Regular', price: 149 }], isVeg: true, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', description: 'Fusion pasta in a creamy Indian butter sauce.' },
  { name: 'Mixed Veg Pasta', category: 'Pasta', sizes: [{ label: 'Regular', price: 159 }], isVeg: true, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', description: 'Pasta with an assortment of crisp vegetables.' },

  // BURGER
  { name: 'Aloo Tikki Burger', category: 'Burger', sizes: [{ label: 'Regular', price: 79 }], isVeg: true, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', description: 'Crispy potato patty burger with mayo and lettuce.' },
  { name: 'Veg Burger', category: 'Burger', sizes: [{ label: 'Regular', price: 89 }], isVeg: true, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', description: 'Classic vegetable patty burger.' },
  { name: 'Paneer Burger', category: 'Burger', sizes: [{ label: 'Regular', price: 129 }], isVeg: true, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', description: 'Burger with a thick slice of spiced paneer.' },
  { name: 'Cheese Burger', category: 'Burger', sizes: [{ label: 'Regular', price: 119 }], isVeg: true, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', description: 'Classic burger with an extra slice of cheese.' },

  // SANDWICH
  { name: 'Veg Grill Sandwich', category: 'Sandwich', sizes: [{ label: 'Regular', price: 99 }], isVeg: true, image: 'https://images.unsplash.com/photo-1528735602780-2552da24510c?auto=format&fit=crop&w=600&q=80', description: 'Grilled sandwich with sliced vegetables and green chutney.' },
  { name: 'Veg Sandwich', category: 'Sandwich', sizes: [{ label: 'Regular', price: 89 }], isVeg: true, image: 'https://images.unsplash.com/photo-1528735602780-2552da24510c?auto=format&fit=crop&w=600&q=80', description: 'Classic cold sandwich with fresh vegetables.' },
  { name: 'Special Paneer Tikka Sandwich', category: 'Sandwich', sizes: [{ label: 'Regular', price: 139 }], isVeg: true, image: 'https://images.unsplash.com/photo-1528735602780-2552da24510c?auto=format&fit=crop&w=600&q=80', description: 'Grilled sandwich with spiced paneer tikka filling.' },
  { name: 'Sweet Corn Cheese Sandwich', category: 'Sandwich', sizes: [{ label: 'Regular', price: 129 }], isVeg: true, image: 'https://images.unsplash.com/photo-1528735602780-2552da24510c?auto=format&fit=crop&w=600&q=80', description: 'Sandwich with sweet corn and melted cheese.' },
  { name: 'Sandwich Pizza', category: 'Sandwich', sizes: [{ label: 'Regular', price: 139 }], isVeg: true, image: 'https://images.unsplash.com/photo-1528735602780-2552da24510c?auto=format&fit=crop&w=600&q=80', description: 'Open sandwich topped with pizza sauce, veggies, and cheese.' },
];

const seedDB = async () => {
  try {
    await connectDB();
    await MenuItem.deleteMany({});
    console.log('Old menu items cleared.');
    
    await MenuItem.insertMany(menuItems);
    console.log('New menu items with direct Unsplash images seeded successfully!');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding menu:', error);
    mongoose.connection.close();
  }
};

seedDB();
