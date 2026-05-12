const Payment = require('../models/Payment');
const Admission = require('../models/Admission');
const Membership = require('../models/Membership');
const Order = require('../models/Order');
const OneTimePlay = require('../models/OneTimePlay');

exports.overview = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);
    const sevenDays = new Date(Date.now() + 7*24*60*60*1000);

    const [totalMembers, activeMemberships, expiringSoon, todayPayments, pendingFees, pendingOrders] = await Promise.all([
      Admission.countDocuments(),
      Membership.countDocuments({ status: 'active' }),
      Membership.countDocuments({ status: 'active', endDate: { $lte: sevenDays } }),
      Payment.aggregate([{ $match: { status: 'paid', createdAt: { $gte: today, $lte: endOfDay } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Payment.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: { $in: ['new', 'preparing'] } }),
    ]);

    res.json({
      totalMembers, activeMemberships, expiringSoon,
      todayRevenue: todayPayments[0]?.total || 0,
      pendingFees, pendingOrders,
    });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.revenue = async (req, res) => {
  try {
    const range = parseInt(req.query.range) || 30;
    const startDate = new Date(Date.now() - range * 24*60*60*1000);
    const payments = await Payment.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$totalAmount' }, academy: { $sum: { $cond: [{ $in: ['$type', ['membership','one-time-play']] }, '$totalAmount', 0] } }, restaurant: { $sum: { $cond: [{ $eq: ['$type', 'restaurant'] }, '$totalAmount', 0] } } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ revenue: payments });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.memberships = async (req, res) => {
  try {
    const range = parseInt(req.query.range) || 90;
    const startDate = new Date(Date.now() - range*24*60*60*1000);
    const data = await Membership.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    res.json({ memberships: data });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.restaurant = async (req, res) => {
  try {
    const range = parseInt(req.query.range) || 30;
    const startDate = new Date(Date.now() - range*24*60*60*1000);
    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ restaurant: data });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.sportsPopularity = async (req, res) => {
  try {
    const data = await Admission.aggregate([
      { $unwind: '$sportsIncluded' },
      { $group: { _id: '$sportsIncluded', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ sports: data });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};
