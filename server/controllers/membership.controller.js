const MembershipPlan = require('../models/MembershipPlan');
const Membership = require('../models/Membership');
const Payment = require('../models/Payment');
const Admission = require('../models/Admission');
const Attendance = require('../models/Attendance');
const { calculateGST } = require('../utils/gstCalculator');
const { getDurationMs } = require('../utils/dateUtils');
const { verifyPaymentSignature } = require('../config/razorpay');
const { DEFAULT_ALLOWED_DURATION_MINUTES } = require('../utils/sessionCalculator');
const { invalidateEntitlementCache, calculateEntitlement, validateCheckIn } = require('../utils/entitlementEngine');
const { getEffectiveConfig } = require('../utils/sessionCalculator');

// GET /api/plans
exports.getPlans = async (req, res) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true }).sort({ price: 1 });
    res.json({ plans });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/plans
exports.createPlan = async (req, res) => {
  try {
    const plan = await MembershipPlan.create({ ...req.body, createdBy: req.user.userId });
    res.status(201).json({ plan });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// PUT /api/plans/:id
exports.updatePlan = async (req, res) => {
  try {
    const plan = await MembershipPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ message: 'Plan not found.' });
    res.json({ plan });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/plans/:id (soft delete)
exports.deletePlan = async (req, res) => {
  try {
    await MembershipPlan.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Plan archived.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/memberships/:studentId
exports.getStudentMembership = async (req, res) => {
  try {
    const memberships = await Membership.find({ studentId: req.params.studentId })
      .populate('planId')
      .populate('paymentId')
      .sort({ createdAt: -1 });
    
    res.json({ 
      membership: memberships[0] || null, // For backward compatibility
      memberships: memberships 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/memberships/assign
exports.assignMembership = async (req, res) => {
  try {
    const { studentId, planId, paymentMode } = req.body;
    const plan = await MembershipPlan.findById(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found.' });

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + getDurationMs(plan));
    const gst = calculateGST(plan.price, plan.gstPercent || 18);
    const isPaidNow = paymentMode && paymentMode !== 'online';

    // Create payment
    const payment = await Payment.create({
      studentId,
      type: 'membership',
      referenceId: plan._id,
      amount: gst.amount,
      gstAmount: gst.gstAmount,
      gstPercent: gst.gstPercent,
      totalAmount: gst.totalAmount,
      status: isPaidNow ? 'paid' : 'pending',
      paymentMode: isPaidNow ? paymentMode : undefined,
    });

    // Create membership — active only if paid
    const membership = await Membership.create({
      studentId,
      planId,
      startDate,
      endDate,
      status: isPaidNow ? 'active' : 'pending',
      paymentId: payment._id,
    });

    invalidateEntitlementCache(studentId);

    res.status(201).json({ membership, payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// PUT /api/memberships/:id/renew — RENEWAL WORKFLOW
exports.renewMembership = async (req, res) => {
  try {
    const { paymentMode, amountPaid, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const membership = await Membership.findById(req.params.id).populate('planId');
    if (!membership) return res.status(404).json({ message: 'Membership not found.' });

    const plan = membership.planId;
    const gst = calculateGST(plan.price, plan.gstPercent || 18);

    // Verify Razorpay signature if provided
    const isRazorpay = paymentMode === 'razorpay' && razorpayOrderId && razorpayPaymentId && razorpaySignature;
    if (isRazorpay) {
      const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      if (!isValid) return res.status(400).json({ message: 'Invalid payment signature.' });
    }

    // Razorpay verified → full payment, else use provided amountPaid
    const parsedAmountPaid = isRazorpay
      ? gst.totalAmount
      : (amountPaid !== undefined ? parseFloat(amountPaid) : (paymentMode && paymentMode !== 'online' ? gst.totalAmount : 0));
    const remainingAmount = Math.max(0, gst.totalAmount - parsedAmountPaid);

    let paymentState = 'pending';
    if (remainingAmount === 0) paymentState = 'paid';
    else if (parsedAmountPaid > 0) paymentState = 'partial';

    const isFullyPaid = paymentState === 'paid';

    // Create renewal payment
    const payment = await Payment.create({
      studentId: membership.studentId,
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

    if (isFullyPaid) {
      // Extend from current end date or from now if expired
      const baseDate = membership.endDate > new Date() ? membership.endDate : new Date();
      const newEndDate = new Date(baseDate.getTime() + getDurationMs(plan));

      membership.endDate = newEndDate;
      membership.status = 'active';
      membership.paymentId = payment._id;
      membership.renewalHistory.push({ date: new Date(), planId: plan._id, paymentId: payment._id });
      await membership.save();

      // Update admission payment status
      await Admission.findOneAndUpdate(
        { membershipId: membership._id },
        { paymentStatus: paymentState }
      );
    } else {
      membership.renewalHistory.push({ date: new Date(), planId: plan._id, paymentId: payment._id, note: 'Pending/Partial Payment' });
      await membership.save();
    }

    invalidateEntitlementCache(membership.studentId);

    const io = req.app.get('io');
    if (io) io.emit('dashboard:refresh');

    res.json({ membership, payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// PUT /api/memberships/:id/freeze
exports.freezeMembership = async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id);
    if (!membership) return res.status(404).json({ message: 'Membership not found.' });

    membership.status = 'frozen';
    membership.frozenAt = new Date();
    await membership.save();

    invalidateEntitlementCache(membership.studentId);

    res.json({ membership });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/memberships/:id/unfreeze
exports.unfreezeMembership = async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id);
    if (!membership) return res.status(404).json({ message: 'Membership not found.' });

    if (membership.frozenAt) {
      const frozenDays = Math.ceil((Date.now() - membership.frozenAt.getTime()) / (1000 * 60 * 60 * 24));
      membership.frozenDays = (membership.frozenDays || 0) + frozenDays;
      membership.endDate = new Date(membership.endDate.getTime() + frozenDays * 24 * 60 * 60 * 1000);
    }

    membership.status = 'active';
    membership.frozenAt = null;
    await membership.save();

    invalidateEntitlementCache(membership.studentId);

    res.json({ membership });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/memberships/all — All memberships for admin view
exports.getAllMemberships = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const memberships = await Membership.find(filter)
      .populate('studentId', 'name email phone')
      .populate('planId', 'name duration price sportsIncluded')
      .populate('paymentId', 'invoiceNumber status totalAmount')
      .sort({ createdAt: -1 });

    res.json({ memberships });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/memberships/validate/:id
exports.validateMembershipQR = async (req, res) => {
  try {
    const membershipId = req.params.id;
    const membership = await Membership.findById(membershipId)
      .populate('studentId', 'name phone')
      .populate('planId', 'name sports accessAreas');

    if (!membership) {
      return res.status(404).json({ message: 'Invalid QR: Membership not found' });
    }

    if (membership.status !== 'active') {
      return res.status(400).json({ 
        message: `Membership is ${membership.status}. Cannot check-in.`,
        membership 
      });
    }

    // Check if expired based on endDate
    if (new Date(membership.endDate) < new Date()) {
      return res.status(400).json({ 
        message: 'Membership has expired. Please renew.',
        membership 
      });
    }

    const entitlement = await calculateEntitlement(membership.studentId._id);
    const activeSessions = await Attendance.find({
      userId: membership.studentId._id,
      checkOutTime: null,
      sessionStatus: 'Active'
    }).sort({ checkInTime: -1 });

    res.json({
      valid: true,
      membership,
      student: membership.studentId,
      plan: membership.planId,
      entitlement,
      activeSessions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error validating QR', error: error.message });
  }
};

// POST /api/memberships/:id/check-in
exports.checkInMembership = async (req, res) => {
  try {
    const membershipId = req.params.id;
    const membership = await Membership.findById(membershipId).populate('studentId').populate('planId');

    if (!membership) {
      return res.status(404).json({ message: 'Membership not found.' });
    }

    if (membership.status !== 'active') {
      return res.status(400).json({ message: 'Invalid or inactive membership.' });
    }

    if (new Date(membership.endDate) < new Date()) {
      membership.status = 'expired';
      await membership.save();
      return res.status(400).json({ message: 'Membership has expired. Please renew.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entitlement = await calculateEntitlement(membership.studentId._id);
    if (entitlement.entitlementType === 'none') {
      return res.status(400).json({ message: 'No active entitlement found.' });
    }

    // Determine sport to check into
    const sportToUse = req.body.sport || (entitlement.allowedSports.length > 0 ? entitlement.allowedSports[0] : null);

    if (sportToUse) {
      const validation = await validateCheckIn(membership.studentId._id, sportToUse);
      if (!validation.allowed) {
        return res.status(409).json({ message: validation.reason, attendance: validation.activeSessions[0] });
      }
    } else {
      // Fallback for weird edge cases
      const activeSessions = await Attendance.find({ userId: membership.studentId._id, checkOutTime: null, sessionStatus: 'Active' });
      if (entitlement.concurrentSessionLimit !== null && activeSessions.length >= entitlement.concurrentSessionLimit) {
        return res.status(409).json({ message: 'Already checked in. Duplicate scan blocked.', attendance: activeSessions[0] });
      }
    }

    const config = await getEffectiveConfig(sportToUse);

    // Create attendance record
    const attendance = await Attendance.create({
      userId: membership.studentId._id,
      date: today,
      checkInTime: new Date(),
      status: 'present',
      sessionStatus: 'Active',
      allowedDurationMinutes: config.allowedDurationMinutes,
      feeCollectionStatus: 'Not Applicable',
      checkInMethod: 'membership-id',
      sport: sportToUse || membership.planId?.sportsIncluded?.join(', '),
      entitlementType: entitlement.entitlementType,
      currentSessionConfig: config,
      configVersionSnapshot: config.configVersion || 1,
      sportNameSnapshot: sportToUse || membership.planId?.sportsIncluded?.join(', '),
      membershipPlanSnapshot: membership.planId?.name,
      relatedBookingId: membership._id,
      relatedBookingType: 'membership',
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('attendance:check-in', {
        userId: membership.studentId._id,
        name: membership.studentId.name,
        membershipId,
        timestamp: attendance.checkInTime,
      });
      io.emit('dashboard:refresh');
    }

    res.json({
      message: 'Check-in successful!',
      attendance,
      membership,
    });

  } catch (error) {
    res.status(500).json({ message: 'Check-in failed.', error: error.message });
  }
};
