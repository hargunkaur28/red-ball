const Payment = require('../models/Payment');
const Admission = require('../models/Admission');
const Membership = require('../models/Membership');
const Order = require('../models/Order');
const User = require('../models/User');
const OneTimePlay = require('../models/OneTimePlay');
const Slot = require('../models/Slot');
const SlotBooking = require('../models/SlotBooking');

// GET /api/analytics/overview — Dashboard summary cards
exports.getOverview = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalMembers,
      activeMemberships,
      expiringSoon,
      pendingFees,
      todayRevenue,
      pendingOrders,
      totalAdmissions,
      todayAdmissions,
    ] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      Membership.countDocuments({ status: 'active' }),
      Membership.countDocuments({ status: 'active', endDate: { $lte: sevenDays, $gte: new Date() } }),
      Payment.countDocuments({ 
        status: { $in: ['pending', 'partial'] },
        $or: [
          { type: { $ne: 'restaurant' } },
          { type: 'restaurant', status: 'paid' }
        ]
      }),
      Payment.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: today, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments({ status: { $in: ['new', 'preparing'] } }),
      Admission.countDocuments(),
      Admission.countDocuments({ createdAt: { $gte: today } }),
    ]);

    // Pending fees total amount (sum remaining amounts of pending and partial payments)
    const pendingFeesAmount = await Payment.aggregate([
      { 
        $match: { 
          status: { $in: ['pending', 'partial'] },
          $or: [
            { type: { $ne: 'restaurant' } },
            { type: 'restaurant', status: 'paid' }
          ]
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { 
            $sum: { 
              $cond: [
                { $ne: ['$remainingAmount', undefined] }, 
                '$remainingAmount', 
                '$totalAmount'
              ] 
            } 
          } 
        } 
      },
    ]);

    res.json({
      totalMembers,
      activeMemberships,
      expiringSoon,
      pendingFees,
      pendingFeesAmount: pendingFeesAmount[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
      pendingOrders,
      totalAdmissions,
      todayAdmissions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/analytics/revenue — Revenue over time
exports.getRevenue = async (req, res) => {
  try {
    const { range = 30 } = req.query;
    const startDate = new Date(Date.now() - parseInt(range) * 24 * 60 * 60 * 1000);

    const revenue = await Payment.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Revenue by type
    const revenueByType = await Payment.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ revenue, revenueByType });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/analytics/memberships — Membership trends
exports.getMemberships = async (req, res) => {
  try {
    const { range = 90 } = req.query;
    const startDate = new Date(Date.now() - parseInt(range) * 24 * 60 * 60 * 1000);

    const active = await Membership.countDocuments({ status: 'active' });
    const pending = await Membership.countDocuments({ status: 'pending' });
    const expired = await Membership.countDocuments({ status: 'expired' });
    const frozen = await Membership.countDocuments({ status: 'frozen' });

    const trend = await Membership.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ active, pending, expired, frozen, trend });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/analytics/sports-popularity
exports.getSportsPopularity = async (req, res) => {
  try {
    const sports = await Admission.aggregate([
      { $unwind: '$sportsIncluded' },
      { $group: { _id: '$sportsIncluded', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // One-time play popularity
    const otpSports = await OneTimePlay.aggregate([
      { $group: { _id: '$sport', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { count: -1 } },
    ]);

    res.json({ membershipSports: sports, oneTimePlaySports: otpSports });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/analytics/restaurant — Restaurant analytics
exports.getRestaurantAnalytics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
    const todaySales = await Order.aggregate([
      { $match: { status: 'delivered', createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const ordersByStatus = await Order.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Top selling items (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const topItems = await Order.aggregate([
      { $match: { status: 'delivered', createdAt: { $gte: thirtyDaysAgo } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', totalQty: { $sum: '$items.quantity' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalQty: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      todayOrders,
      todaySales: todaySales[0]?.total || 0,
      ordersByStatus,
      topItems,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/analytics/recent-activity — Recent activity feed
exports.getRecentActivity = async (req, res) => {
  try {
    const [recentAdmissions, recentPayments, recentOrders] = await Promise.all([
      Admission.find().populate('studentId', 'name').sort({ createdAt: -1 }).limit(5),
      Payment.find({ status: 'paid' }).populate('studentId', 'name').sort({ createdAt: -1 }).limit(5),
      Order.find().populate('customerId', 'name').populate('tableId', 'label').sort({ createdAt: -1 }).limit(5),
    ]);

    const activity = [
      ...recentAdmissions.map(a => ({
        type: 'admission',
        text: `${a.studentId?.name || 'Unknown'} admitted`,
        time: a.createdAt,
        status: a.paymentStatus,
      })),
      ...recentPayments.map(p => ({
        type: 'payment',
        text: `₹${p.totalAmount} ${p.type} payment`,
        time: p.createdAt,
        status: p.status,
      })),
      ...recentOrders.map(o => ({
        type: 'order',
        text: `Order #${o.orderNumber} — ${o.customerId?.name || 'Guest'}`,
        time: o.createdAt,
        status: o.status,
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 15);

    res.json({ activity });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/analytics/occupancy — Live occupancy data
exports.getOccupancy = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [activePlayers, checkedIn, ongoingSessions, slots] = await Promise.all([
      SlotBooking.aggregate([
        { $match: { status: 'checked-in', createdAt: { $gte: today, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: '$numberOfPlayers' } } }
      ]),
      SlotBooking.countDocuments({ status: 'checked-in', createdAt: { $gte: today, $lte: endOfDay } }),
      SlotBooking.countDocuments({ status: 'checked-in' }),
      Slot.find().limit(10),
    ]);

    const arenas = slots.map(s => ({
      name: s.name,
      players: s.currentBookings || 0,
      capacity: s.capacity || 1,
      status: s.status,
    }));

    const totalCapacity = arenas.reduce((sum, a) => sum + a.capacity, 0);
    const totalPlayers = arenas.reduce((sum, a) => sum + a.players, 0);
    const load = totalCapacity > 0 ? `${Math.round((totalPlayers / totalCapacity) * 100)}%` : '0%';

    res.json({
      activePlayers: activePlayers[0]?.total || 0,
      checkedIn,
      ongoingSessions,
      load,
      arenas,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
