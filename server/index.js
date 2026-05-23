require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const admissionRoutes = require('./routes/admission.routes');
const membershipRoutes = require('./routes/membership.routes');
const paymentRoutes = require('./routes/payment.routes');
const onetimeplayRoutes = require('./routes/onetimeplay.routes');
const oneTimeAccessRoutes = require('./routes/oneTimeAccess.routes');
const slotRoutes = require('./routes/slot.routes');
const operationRoutes = require('./routes/operation.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const menuRoutes = require('./routes/menu.routes');
const orderRoutes = require('./routes/order.routes');
const tableRoutes = require('./routes/table.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const serviceRoutes = require('./routes/service.routes');
const blockedScheduleRoutes = require('./routes/blockedSchedule.routes');
const bookingRoutes = require('./routes/booking.routes');
const reviewRoutes = require('./routes/review.routes');
const sportRoutes = require('./routes/sport.routes');
const superadminRoutes = require('./routes/superadmin.routes');
const kitchenRoutes = require('./routes/kitchen.routes');
const contactRoutes = require('./routes/contactRoutes');
const adminCommunicationRoutes = require('./routes/adminCommunicationRoutes');
const academySettingsRoutes = require('./routes/academySettings.routes');

// Import cron jobs
const startExpiryReminder = require('./jobs/expiryReminder.job');
const startLowStockAlert = require('./jobs/lowStockAlert.job');
const startAutoCheckout = require('./jobs/autoCheckout.job');
const startExpireOneTimeAccess = require('./jobs/expireOneTimeAccess.job');
const startTestExpiryCheckerModule = require('./jobs/testExpiryChecker.job');
const { stopTestExpiryChecker } = startTestExpiryCheckerModule;
const startTestExpiryChecker = startTestExpiryCheckerModule;

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://red-ball-delta.vercel.app',
      process.env.CLIENT_URL,
    ].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
});

app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('join-managers', () => {
    socket.join('restaurant-managers');
    console.log(`👨‍🍳 Manager joined: ${socket.id}`);
  });

  socket.on('join-order', (orderId) => {
    socket.join(`order-${orderId}`);
  });

  socket.on('join-kitchen-updates', () => {
    socket.join('kitchen-updates');
  });

  socket.on('order:accept', async ({ orderId }) => {
    io.to('restaurant-managers').emit('order:updated', { orderId, status: 'preparing' });
    io.to(`order-${orderId}`).emit('order:status', { orderId, status: 'preparing' });
  });

  socket.on('order:ready', async ({ orderId }) => {
    io.to('restaurant-managers').emit('order:updated', { orderId, status: 'ready' });
    io.to(`order-${orderId}`).emit('order:status', { orderId, status: 'ready' });
  });

  socket.on('order:delivered', async ({ orderId }) => {
    io.to('restaurant-managers').emit('order:updated', { orderId, status: 'delivered' });
    io.to(`order-${orderId}`).emit('order:status', { orderId, status: 'delivered' });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://red-ball-delta.vercel.app',
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(require('cookie-parser')());

// Static Files
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api', membershipRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/onetimeplay', onetimeplayRoutes);
app.use('/api/onetimeaccess', oneTimeAccessRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/blocked-schedules', blockedScheduleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/sports', sportRoutes);
app.use('/api/super-admin', superadminRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/super-admin/communication', adminCommunicationRoutes);
app.use('/api/academy-settings', academySettingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  // Seed superadmin if not exists
  const User = require('./models/User');
  const existingAdmin = await User.findOne({ role: 'superadmin' });
  if (!existingAdmin) {
    await User.create({
      name: 'Super Admin',
      email: 'admin@redball.com',
      phone: '9999999999',
      password: 'Admin@123',
      role: 'superadmin',
    });
    console.log('🔐 Default superadmin created: admin@redball.com / Admin@123');
  }

  // Seed restaurant manager if not exists
  const existingManager = await User.findOne({ role: 'manager' });
  if (!existingManager) {
    await User.create({
      name: 'Restaurant Manager',
      email: 'restaurant@redball.com',
      phone: '8888888888',
      password: 'Manager@123',
      role: 'manager',
    });
    console.log('👨‍🍳 Default restaurant manager created: restaurant@redball.com / Manager@123');
  }

  // Seed receptionist if not exists
  const existingReception = await User.findOne({ role: 'receptionist' });
  if (!existingReception) {
    await User.create({
      name: 'Reception Desk',
      email: 'reception@redball.com',
      phone: '7777777777',
      password: 'Reception@123',
      role: 'receptionist',
    });
    console.log('💁 Default receptionist created: reception@redball.com / Reception@123');
  }

  // Seed test plans
  const seedTestPlans = require('./jobs/seedTestPlans');
  await seedTestPlans(existingAdmin?._id);

  // Seed sports
  const seedSports = require('./jobs/seedSports');
  await seedSports();

  // Start cron jobs
  startExpiryReminder();
  startLowStockAlert();
  startAutoCheckout(io);
  startExpireOneTimeAccess(io);
  startTestExpiryChecker(io);

  // --- TEMP SCRIPT ---
  try {
    const fs = require('fs');
    const Attendance = require('./models/Attendance');
    const User = require('./models/User');
    const hargun = await User.findOne({ email: 'hargun@gmail.com' });
    if (hargun) {
      const atts = await Attendance.find({ userId: hargun._id }).sort({ checkInTime: -1 }).limit(2).lean();
      fs.writeFileSync('d:\\red-ball\\server\\check-output.txt', JSON.stringify(atts, null, 2));
    }
  } catch (err) {}
  // ---

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io ready`);
  });

  // Graceful shutdown handlers
  process.on('SIGTERM', () => {
    console.log('⏹️ SIGTERM received, shutting down gracefully...');
    stopTestExpiryChecker();
    server.close(() => {
      console.log('🛑 Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('⏹️ SIGINT received, shutting down gracefully...');
    stopTestExpiryChecker();
    server.close(() => {
      console.log('🛑 Server closed');
      process.exit(0);
    });
  });
};

startServer().catch(console.error);
