const Admission = require('../models/Admission');
const User = require('../models/User');
const Membership = require('../models/Membership');

// GET /api/admissions
exports.getAll = async (req, res) => {
  try {
    const { status, sport, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (sport) filter.sportsIncluded = sport;

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      filter.studentId = { $in: users.map(u => u._id) };
    }

    const admissions = await Admission.find(filter)
      .populate('studentId', 'name email phone photo')
      .populate('batchId', 'name sport timing')
      .populate('membershipId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Admission.countDocuments(filter);

    res.json({
      admissions,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// POST /api/admissions
exports.create = async (req, res) => {
  try {
    const { name, email, phone, emergencyContact, batchId, planId, sportsIncluded, notes, password } = req.body;

    // Create user account for student
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name, email, phone, password: password || 'RedBall@123', role: 'student',
      });
    } else {
      user.role = 'student';
      await user.save({ validateBeforeSave: false });
    }

    // Create admission
    const admission = await Admission.create({
      studentId: user._id,
      phone,
      emergencyContact,
      batchId,
      sportsIncluded,
      notes,
      status: 'active',
    });

    // Create membership if plan selected
    if (planId) {
      const MembershipPlan = require('../models/MembershipPlan');
      const plan = await MembershipPlan.findById(planId);
      if (plan) {
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
        const membership = await Membership.create({
          studentId: user._id,
          planId: plan._id,
          startDate,
          endDate,
        });
        admission.membershipId = membership._id;
        await admission.save();
      }
    }

    const populatedAdmission = await Admission.findById(admission._id)
      .populate('studentId', 'name email phone photo')
      .populate('batchId', 'name sport timing')
      .populate('membershipId');

    res.status(201).json({ admission: populatedAdmission });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/admissions/:id
exports.getById = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id)
      .populate('studentId', 'name email phone photo')
      .populate('batchId', 'name sport timing')
      .populate('membershipId');

    if (!admission) {
      return res.status(404).json({ message: 'Admission not found.' });
    }

    res.json({ admission });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/admissions/:id
exports.update = async (req, res) => {
  try {
    const { phone, emergencyContact, batchId, sportsIncluded, notes, status } = req.body;

    const admission = await Admission.findByIdAndUpdate(
      req.params.id,
      { phone, emergencyContact, batchId, sportsIncluded, notes, status },
      { new: true, runValidators: true }
    )
      .populate('studentId', 'name email phone photo')
      .populate('batchId', 'name sport timing')
      .populate('membershipId');

    if (!admission) {
      return res.status(404).json({ message: 'Admission not found.' });
    }

    res.json({ admission });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/admissions/:id
exports.remove = async (req, res) => {
  try {
    const admission = await Admission.findByIdAndDelete(req.params.id);
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found.' });
    }
    res.json({ message: 'Admission deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/admissions/pending-fees
exports.getPendingFees = async (req, res) => {
  try {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const expiringMemberships = await Membership.find({
      status: 'active',
      endDate: { $lte: sevenDaysFromNow },
    })
      .populate('studentId', 'name email phone')
      .populate('planId', 'name price');

    const pendingPayments = await require('../models/Payment').find({
      type: 'membership',
      status: 'pending',
    }).populate('studentId', 'name email phone');

    res.json({
      expiringSoon: expiringMemberships,
      pendingPayments,
      totalCount: expiringMemberships.length + pendingPayments.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
