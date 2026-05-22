// --- PUBLIC MEMBERSHIP PORTAL ---

exports.publicPurchaseOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = await MembershipPlan.findById(planId);
    
    if (!plan || !plan.isActive) {
      return res.status(404).json({ success: false, message: 'Membership plan not found or inactive.' });
    }

    const { calculateGST } = require('../utils/gstCalculator');
    const gst = calculateGST(plan.price, plan.gstPercent || 18);

    const { createRazorpayOrder } = require('../config/razorpay');
    const rzpOrder = await createRazorpayOrder({
      amount: Math.round(gst.totalAmount * 100), // in paise
      currency: 'INR',
      receipt: `PUBLIC_MEMB_${Date.now()}`
    });

    res.json({
      success: true,
      rzpOrder: {
        id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency
      },
      plan,
      totalAmount: gst.totalAmount,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('publicPurchaseOrder error:', error);
    res.status(500).json({ success: false, message: 'Failed to create purchase order.', error: error.message });
  }
};

exports.publicVerifyPayment = async (req, res) => {
  try {
    const { planId, razorpayOrderId, razorpayPaymentId, razorpaySignature, customerDetails = {} } = req.body;
    
    const plan = await MembershipPlan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Membership plan not found' });

    // 1. Verify Razorpay signature
    const { verifyPaymentSignature, fetchPaymentDetails } = require('../config/razorpay');
    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) return res.status(400).json({ success: false, message: 'Invalid payment signature' });

    // 2. Fetch payment details
    const paymentDetails = await fetchPaymentDetails(razorpayPaymentId);
    if (paymentDetails.status !== 'captured') {
      return res.status(400).json({ success: false, message: 'Payment not captured by Razorpay' });
    }

    // 3. Idempotency Check
    const existingPayment = await Payment.findOne({
      $or: [{ razorpayPaymentId }, { razorpayOrderId }],
      status: 'paid'
    });
    if (existingPayment) {
      return res.json({ success: true, message: 'Payment already processed' });
    }

    const { calculateGST } = require('../utils/gstCalculator');
    const gst = calculateGST(plan.price, plan.gstPercent || 18);
    const { getDurationMs } = require('../utils/dateUtils');
    const { runTransaction } = require('../utils/transactionHandler');
    const User = require('../models/User');

    // 4. Match User or Create New (Commerce Integrity Rule 3)
    let targetUserId = req.user?.userId; // If authenticated
    let user = null;

    if (!targetUserId && customerDetails.email) {
      user = await User.findOne({ email: customerDetails.email.toLowerCase() });
      if (!user && customerDetails.phone) {
         user = await User.findOne({ phone: customerDetails.phone });
      }

      if (!user) {
        // Auto-create user
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('User@123', 10);
        user = await User.create({
          name: customerDetails.name,
          email: customerDetails.email.toLowerCase(),
          phone: customerDetails.phone,
          password: hashedPassword,
          role: 'user',
          isActive: true
        });
      }
      targetUserId = user._id;
    } else if (targetUserId) {
      user = await User.findById(targetUserId);
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'User identification failed.' });
    }

    // 5. Execute inside a transaction
    const result = await runTransaction(async (session) => {
      const opts = session ? { session } : {};

      // Commerce Integrity Rule 8: Duplicate Check / Extension Logic
      // Find an active membership for the exact same plan
      let activeMembership = await Membership.findOne({
        studentId: targetUserId,
        planId: plan._id,
        status: 'active'
      }, null, opts);

      let startDate = new Date();
      if (activeMembership && activeMembership.endDate > new Date()) {
        // Renewal flow: start from previous end date
        startDate = new Date(activeMembership.endDate);
      }
      const endDate = new Date(startDate.getTime() + getDurationMs(plan));

      // Commerce Integrity Rule 6: Snapshot Data (Store name via plan reference, but Payment has snapshot fields)
      const [payment] = await Payment.create([{
        studentId: targetUserId,
        customerName: user.name,
        type: 'membership',
        referenceId: plan._id,
        amount: gst.amount,
        gstAmount: gst.gstAmount,
        gstPercent: gst.gstPercent,
        totalAmount: gst.totalAmount,
        amountPaid: gst.totalAmount,
        remainingAmount: 0,
        status: 'paid',
        paymentMode: 'razorpay',
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      }], opts);

      let membershipRec;

      if (activeMembership) {
        // Extend existing
        activeMembership.endDate = endDate;
        activeMembership.paymentId = payment._id;
        activeMembership.renewalHistory.push({
          date: new Date(),
          planId: plan._id,
          paymentId: payment._id,
          note: 'Public Online Renewal'
        });
        await activeMembership.save(opts);
        membershipRec = activeMembership;
      } else {
        // Create new
        [membershipRec] = await Membership.create([{
          studentId: targetUserId,
          planId: plan._id,
          startDate,
          endDate,
          status: 'active',
          paymentId: payment._id
        }], opts);
      }

      // NO AUTOMATIC ATTENDANCE/CHECKIN (Commerce Integrity Rule 5)

      return { payment, membership: membershipRec };
    });

    // Generate token if it was a guest purchase so they can log in
    let token = null;
    if (!req.user) {
      const jwt = require('jsonwebtoken');
      token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.ACCESS_SECRET || process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '15m' }
      );
    }

    const { invalidateEntitlementCache } = require('../utils/entitlementEngine');
    invalidateEntitlementCache(targetUserId);

    res.json({ 
      success: true, 
      message: 'Membership purchased successfully!', 
      membership: result.membership,
      token
    });

  } catch (error) {
    console.error('publicVerifyPayment error:', error);
    res.status(500).json({ success: false, message: 'Verification failed.', error: error.message });
  }
};
