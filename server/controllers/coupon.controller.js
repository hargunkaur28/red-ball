const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');

// GET /api/coupons/admin — all coupons (including archived), sorted newest first
exports.adminList = async (req, res) => {
  try {
    const coupons = await Coupon.find({})
      .sort({ createdAt: -1 })
      .populate('sportIds', 'name')
      .populate('eligibleUserIds', 'name email phone');
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/coupons/admin — create a new coupon
exports.adminCreate = async (req, res) => {
  try {
    const {
      code, title, description, discountType, discountValue, maxDiscountAmount,
      minOrderAmount, targetType, sportIds, appliesToAllSports, visibility,
      eligibleUserIds, startsAt, endsAt, usageLimitTotal, usageLimitPerUser, isActive,
    } = req.body;

    if (!code || !discountType || discountValue == null || !targetType) {
      return res.status(400).json({ success: false, message: 'code, discountType, discountValue, and targetType are required.' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      title,
      description,
      discountType,
      discountValue,
      maxDiscountAmount: maxDiscountAmount ?? null,
      minOrderAmount: minOrderAmount ?? 0,
      targetType,
      sportIds: sportIds || [],
      appliesToAllSports: !!appliesToAllSports,
      visibility: visibility || 'all',
      eligibleUserIds: eligibleUserIds || [],
      startsAt: startsAt ? new Date(startsAt) : undefined,
      endsAt: endsAt ? new Date(endsAt) : undefined,
      usageLimitTotal,
      usageLimitPerUser,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user?.userId,
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A coupon with this code already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/coupons/admin/:id — update a coupon
exports.adminUpdate = async (req, res) => {
  try {
    const {
      code, title, description, discountType, discountValue, maxDiscountAmount,
      minOrderAmount, targetType, sportIds, appliesToAllSports, visibility,
      eligibleUserIds, startsAt, endsAt, usageLimitTotal, usageLimitPerUser, isActive,
    } = req.body;

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });

    if (code !== undefined) coupon.code = code.toUpperCase().trim();
    if (title !== undefined) coupon.title = title;
    if (description !== undefined) coupon.description = description;
    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (maxDiscountAmount !== undefined) coupon.maxDiscountAmount = maxDiscountAmount;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (targetType !== undefined) coupon.targetType = targetType;
    if (sportIds !== undefined) coupon.sportIds = sportIds;
    if (appliesToAllSports !== undefined) coupon.appliesToAllSports = appliesToAllSports;
    if (visibility !== undefined) coupon.visibility = visibility;
    if (eligibleUserIds !== undefined) coupon.eligibleUserIds = eligibleUserIds;
    if (startsAt !== undefined) coupon.startsAt = startsAt ? new Date(startsAt) : undefined;
    if (endsAt !== undefined) coupon.endsAt = endsAt ? new Date(endsAt) : undefined;
    if (usageLimitTotal !== undefined) coupon.usageLimitTotal = usageLimitTotal;
    if (usageLimitPerUser !== undefined) coupon.usageLimitPerUser = usageLimitPerUser;
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();
    res.json({ success: true, coupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A coupon with this code already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/coupons/admin/:id/toggle — flip isActive
exports.adminToggle = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });

    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/coupons/admin/:id — soft delete (set archivedAt)
exports.adminDelete = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });

    coupon.archivedAt = new Date();
    coupon.isActive = false;
    await coupon.save();
    res.json({ success: true, message: 'Coupon archived successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/coupons/validate — validate a coupon and calculate discount
exports.validate = async (req, res) => {
  try {
    const { code, targetType, sportId, orderAmount, userId } = req.body;

    if (!code || !targetType || orderAmount == null) {
      return res.json({ valid: false, message: 'code, targetType, and orderAmount are required.' });
    }

    const effectiveUserId = userId || req.user?.userId;
    const amount = Number(orderAmount);

    // Find coupon
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      return res.json({ valid: false, message: 'Invalid coupon code.' });
    }

    // Not archived
    if (coupon.archivedAt) {
      return res.json({ valid: false, message: 'This coupon is no longer available.' });
    }

    // Active check
    if (!coupon.isActive) {
      return res.json({ valid: false, message: 'This coupon is currently inactive.' });
    }

    // Date range check
    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      return res.json({ valid: false, message: 'This coupon is not yet valid.' });
    }
    if (coupon.endsAt && now > coupon.endsAt) {
      return res.json({ valid: false, message: 'This coupon has expired.' });
    }

    // Target type check
    if (coupon.targetType !== 'both' && coupon.targetType !== targetType) {
      return res.json({ valid: false, message: `This coupon is not applicable for ${targetType} orders.` });
    }

    // Sport match check (for sports targetType)
    if (targetType === 'sports' && sportId && !coupon.appliesToAllSports && coupon.sportIds.length > 0) {
      const sportIdStr = sportId.toString();
      const matchesSport = coupon.sportIds.some((sid) => sid.toString() === sportIdStr);
      if (!matchesSport) {
        return res.json({ valid: false, message: 'This coupon is not applicable for this sport.' });
      }
    }

    // Min order amount check
    if (coupon.minOrderAmount && amount < coupon.minOrderAmount) {
      return res.json({ valid: false, message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon.` });
    }

    // Total usage limit check
    if (coupon.usageLimitTotal != null && coupon.usedCount >= coupon.usageLimitTotal) {
      return res.json({ valid: false, message: 'This coupon has reached its usage limit.' });
    }

    // User eligibility check
    if (coupon.visibility === 'specific-users') {
      if (!effectiveUserId) {
        return res.json({ valid: false, message: 'Please log in to use this coupon.' });
      }
      const isEligible = coupon.eligibleUserIds.some(
        (uid) => uid.toString() === effectiveUserId.toString()
      );
      if (!isEligible) {
        return res.json({ valid: false, message: 'You are not eligible for this coupon.' });
      }
    }

    // Per-user usage limit check
    if (coupon.usageLimitPerUser != null && effectiveUserId) {
      const userUsageCount = await CouponUsage.countDocuments({
        couponId: coupon._id,
        userId: effectiveUserId,
      });
      if (userUsageCount >= coupon.usageLimitPerUser) {
        return res.json({ valid: false, message: 'You have already used this coupon the maximum number of times.' });
      }
    }

    // Calculate discount
    let discountAmount;
    if (coupon.discountType === 'percentage') {
      const percentDiscount = (coupon.discountValue / 100) * amount;
      const cap = coupon.maxDiscountAmount != null ? coupon.maxDiscountAmount : Infinity;
      discountAmount = Math.min(percentDiscount, cap);
    } else {
      // fixed
      discountAmount = Math.min(coupon.discountValue, amount);
    }

    discountAmount = Math.max(0, Math.round(discountAmount * 100) / 100);
    const finalAmount = Math.max(0, amount - discountAmount);

    return res.json({
      valid: true,
      couponId: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalAmount,
    });
  } catch (error) {
    res.status(500).json({ valid: false, message: error.message });
  }
};

// GET /api/coupons/public — public coupons for a targetType
exports.publicList = async (req, res) => {
  try {
    const { targetType } = req.query;
    const now = new Date();

    const filter = {
      isActive: true,
      archivedAt: null,
      visibility: 'all',
      $or: [{ endsAt: null }, { endsAt: { $gt: now } }],
    };

    if (targetType) {
      filter.$and = [
        { targetType: { $in: [targetType, 'both'] } },
      ];
    }

    const coupons = await Coupon.find(filter)
      .select('code title description discountType discountValue maxDiscountAmount minOrderAmount targetType startsAt endsAt')
      .sort({ createdAt: -1 });

    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
