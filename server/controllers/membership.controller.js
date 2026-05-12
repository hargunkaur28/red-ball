const MembershipPlan = require('../models/MembershipPlan');
const Membership = require('../models/Membership');

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

// DELETE /api/plans/:id
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
    const membership = await Membership.findOne({ studentId: req.params.studentId })
      .populate('planId')
      .populate('paymentId')
      .sort({ createdAt: -1 });
    res.json({ membership });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/memberships/assign
exports.assignMembership = async (req, res) => {
  try {
    const { studentId, planId } = req.body;
    const plan = await MembershipPlan.findById(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found.' });

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const membership = await Membership.create({ studentId, planId, startDate, endDate });
    res.status(201).json({ membership });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/memberships/:id/renew
exports.renewMembership = async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id).populate('planId');
    if (!membership) return res.status(404).json({ message: 'Membership not found.' });

    const plan = membership.planId;
    const newEndDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

    membership.endDate = newEndDate;
    membership.status = 'active';
    membership.renewalHistory.push({ date: new Date(), planId: plan._id });
    await membership.save();

    res.json({ membership });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
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

    res.json({ membership });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
