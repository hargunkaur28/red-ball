const Admission = require('../models/Admission');
const User = require('../models/User');
const Membership = require('../models/Membership');
const MembershipPlan = require('../models/MembershipPlan');
const Payment = require('../models/Payment');
const { calculateGST } = require('../utils/gstCalculator');
const { getDurationMs } = require('../utils/dateUtils');
const { verifyPaymentSignature } = require('../config/razorpay');

// GET /api/admissions
exports.getAll = async (req, res) => {
  try {
    const { status, sport, search, paymentStatus, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (sport) filter.sportsIncluded = sport;

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      filter.studentId = { $in: users.map(u => u._id) };
    }

    const admissions = await Admission.find(filter)
      .populate('studentId', 'name email phone photo gender address')
      .populate('batchId', 'name sport timing')
      .populate({
        path: 'membershipId',
        populate: [
          { path: 'planId', select: 'name duration price sportsIncluded' },
          { path: 'paymentId', select: 'invoiceNumber status totalAmount paymentMode' },
        ],
      })
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
// WORKFLOW: Creates user → admission → membership(PENDING) → payment(PENDING or PAID)
exports.create = async (req, res) => {
  try {
    const {
      name, email, phone, gender, address,
      emergencyContact, batchId, planId,
      sportsIncluded, notes, password,
      paymentMode, amountPaid,
      razorpayOrderId, razorpayPaymentId, razorpaySignature,
    } = req.body;

    // Verify Razorpay signature if UPI payment
    const isRazorpay = paymentMode === 'razorpay' && razorpayOrderId && razorpayPaymentId && razorpaySignature;
    if (isRazorpay) {
      const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid payment signature. Admission not created.' });
      }
    }

    // STEP 1: Create or find user account
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name, email, phone, gender, address,
        password: password || 'RedBall@123',
        role: 'student',
      });
    } else {
      // Upgrade existing user to student
      user.role = 'student';
      if (phone) user.phone = phone;
      if (gender) user.gender = gender;
      if (address) user.address = address;
      await user.save({ validateBeforeSave: false });
    }

    // STEP 2: Create admission record (paymentStatus = pending by default)
    const admission = await Admission.create({
      studentId: user._id,
      phone,
      gender,
      address,
      emergencyContact,
      batchId: batchId || undefined,
      sportsIncluded,
      notes,
      status: 'active',
      paymentStatus: planId ? 'pending' : 'paid', // CRITICAL: pending if plan selected, else paid
    });

    // STEP 3: Create membership + payment if plan selected
    if (planId) {
      const plan = await MembershipPlan.findById(planId);
      if (plan) {
        const startDate = new Date();
        const durationMs = getDurationMs(plan);
        const endDate = new Date(startDate.getTime() + durationMs);
        const gst = calculateGST(plan.price, plan.gstPercent || 18);

        // Razorpay verified → full payment. Otherwise use provided amountPaid.
        const parsedAmountPaid = isRazorpay
          ? gst.totalAmount
          : (amountPaid !== undefined ? parseFloat(amountPaid) : (paymentMode && paymentMode !== 'online' ? gst.totalAmount : 0));
        const remainingAmount = Math.max(0, gst.totalAmount - parsedAmountPaid);

        let paymentState = 'pending';
        if (remainingAmount === 0) paymentState = 'paid';
        else if (parsedAmountPaid > 0) paymentState = 'partial';

        const isFullyPaid = paymentState === 'paid';

        // Create payment record
        const payment = await Payment.create({
          studentId: user._id,
          type: 'membership',
          referenceId: plan._id,
          amount: gst.amount,
          gstAmount: gst.gstAmount,
          gstPercent: gst.gstPercent,
          totalAmount: gst.totalAmount,
          amountPaid: Math.min(parsedAmountPaid, gst.totalAmount),
          remainingAmount,
          status: paymentState,
          paymentMode: isRazorpay ? 'razorpay' : (paymentMode || 'cash'),
          ...(isRazorpay && { razorpayOrderId, razorpayPaymentId, razorpaySignature }),
        });

        // Create membership — ONLY active if payment is FULLY successful
        const membership = await Membership.create({
          studentId: user._id,
          planId: plan._id,
          startDate,
          endDate,
          status: isFullyPaid ? 'active' : 'pending',
          paymentId: payment._id,
        });

        admission.membershipId = membership._id;
        admission.paymentStatus = paymentState;
        await admission.save();

        // Emit realtime update
        const io = req.app.get('io');
        if (io) {
          io.emit('admission:new', { admissionId: admission._id, studentName: name });
          if (!isFullyPaid) {
            io.emit('fees:pending', {
              studentId: user._id,
              studentName: name,
              amount: gst.totalAmount,
              type: 'membership',
            });
          }
        }
      }
    }

    const populatedAdmission = await Admission.findById(admission._id)
      .populate('studentId', 'name email phone photo gender address')
      .populate('batchId', 'name sport timing')
      .populate({
        path: 'membershipId',
        populate: [
          { path: 'planId' },
          { path: 'paymentId' },
        ],
      });

    res.status(201).json({ admission: populatedAdmission });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/admissions/:id
exports.getById = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id)
      .populate('studentId', 'name email phone photo gender address')
      .populate('batchId', 'name sport timing')
      .populate({
        path: 'membershipId',
        populate: [
          { path: 'planId' },
          { path: 'paymentId' },
        ],
      });

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
    const { phone, gender, address, emergencyContact, batchId, sportsIncluded, notes, status } = req.body;

    const admission = await Admission.findByIdAndUpdate(
      req.params.id,
      { phone, gender, address, emergencyContact, batchId, sportsIncluded, notes, status },
      { new: true, runValidators: true }
    )
      .populate('studentId', 'name email phone photo gender address')
      .populate('batchId', 'name sport timing')
      .populate({
        path: 'membershipId',
        populate: [{ path: 'planId' }, { path: 'paymentId' }],
      });

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

// GET /api/admissions/pending-fees — CRITICAL for dashboard alerts
exports.getPendingFees = async (req, res) => {
  try {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Pending payment admissions
    const pendingAdmissions = await Admission.find({ paymentStatus: 'pending' })
      .populate('studentId', 'name email phone')
      .populate({
        path: 'membershipId',
        populate: { path: 'planId', select: 'name price' },
      });

    // Expiring memberships (within 7 days max)
    const potentialExpiring = await Membership.find({
      status: 'active',
      endDate: { $lte: sevenDaysFromNow, $gte: new Date() },
    })
      .populate('studentId', 'name email phone')
      .populate('planId', 'name price duration durationUnit durationValue');

    const nowMs = Date.now();
    const expiringMemberships = potentialExpiring.filter(m => {
      if (!m.planId) return false;
      const msLeft = m.endDate.getTime() - nowMs;
      
      if (m.planId.durationUnit === 'minutes') {
        return msLeft <= 2 * 60 * 1000; // within 2 mins
      } else if (m.planId.durationUnit === 'hours') {
        return msLeft <= 10 * 60 * 1000; // within 10 mins
      } else {
        return msLeft <= 7 * 24 * 60 * 60 * 1000; // within 7 days
      }
    });

    // Expired memberships (past due, still marked active)
    const expiredMemberships = await Membership.find({
      status: 'active',
      endDate: { $lt: new Date() },
    })
      .populate('studentId', 'name email phone')
      .populate('planId', 'name price duration');

    // Auto-expire overdue memberships
    if (expiredMemberships.length > 0) {
      await Membership.updateMany(
        { status: 'active', endDate: { $lt: new Date() } },
        { $set: { status: 'expired' } }
      );
    }

    // Pending and partial payments (all types)
    const pendingPayments = await Payment.find({ status: { $in: ['pending', 'partial'] } })
      .populate('studentId', 'name email phone');

    res.json({
      pendingAdmissions,
      expiringMemberships,
      expiredMemberships,
      pendingPayments,
      totalPendingFees: pendingPayments.reduce((sum, p) => sum + (p.remainingAmount !== undefined ? p.remainingAmount : p.totalAmount), 0),
      totalCount: pendingAdmissions.length + expiringMemberships.length + pendingPayments.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
