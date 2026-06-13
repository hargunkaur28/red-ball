const AcademyAdmission = require('../models/AcademyAdmission');
const MembershipPlan = require('../models/MembershipPlan');

// GET /api/academy/admission-status?sportId=...&userId=...
exports.checkAdmissionStatus = async (req, res) => {
  try {
    const { sportId } = req.query;
    const userId = req.query.userId || req.user?.userId;

    if (!sportId || !userId) {
      return res.status(400).json({ success: false, message: 'sportId and userId are required.' });
    }

    const admission = await AcademyAdmission.findOne({ userId, sportId });

    return res.json({
      success: true,
      admissionPaid: admission ? admission.admissionPaid : false,
      amount: admission ? admission.amount : null,
      admission: admission || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: calculate kids academy total (admission + membership) for a plan + sport
exports.calculateKidsAcademyTotal = async (planId, sportId, userId) => {
  const plan = await MembershipPlan.findById(planId);
  if (!plan) throw new Error('Plan not found');

  let admissionDue = 0;
  if (plan.admissionFeeRequired && plan.admissionFeeAmount > 0) {
    const existing = await AcademyAdmission.findOne({ userId, sportId });
    if (!existing || !existing.admissionPaid) {
      admissionDue = plan.admissionFeeAmount;
    }
  }

  return {
    basePrice: plan.price,
    admissionFee: admissionDue,
    total: plan.price + admissionDue,
  };
};
