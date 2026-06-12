const Slot = require('../models/Slot');
const SlotBooking = require('../models/SlotBooking');
const Payment = require('../models/Payment');
const Court = require('../models/Court');
const Sport = require('../models/Sport');
const SportDiscount = require('../models/SportDiscount');
const User = require('../models/User');
const ReferencePrice = require('../models/ReferencePrice');
const { calculateGST } = require('../utils/gstCalculator');
const { createRazorpayOrder, verifyPaymentSignature, fetchPaymentDetails } = require('../config/razorpay');

const ALLOWED_MANUAL_PAYMENT_MODES = ['cash', 'upi', 'card', 'bank-transfer'];

// Helper: parse "HH:MM" into minutes since midnight
const timeToMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// Helper: find active discount for a sport on a given date
const getActiveDiscount = async (sportId, checkDate) => {
  const d = new Date(checkDate);
  return SportDiscount.findOne({
    sportId,
    isActive: true,
    startDate: { $lte: d },
    endDate: { $gte: d },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING ADMIN SLOT CRUD
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/slots — Get available slots with filters
exports.getSlots = async (req, res) => {
  try {
    const { date, sport, status, courtId } = req.query;
    const filter = {};

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (sport) filter.sport = sport;
    if (status) filter.status = status;
    if (courtId) filter.courtId = courtId;

    const slots = await Slot.find(filter)
      .populate('bookings')
      .sort({ startTime: 1 });

    const allBookings = slots.reduce((acc, slot) => acc.concat(slot.bookings || []), []);

    res.json({ slots, bookings: allBookings });
  } catch (error) {
    console.error('getSlots error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/slots/:id — Get slot details
exports.getSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id).populate('bookings');
    if (!slot) return res.status(404).json({ message: 'Slot not found.' });
    res.json({ slot });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/slots — Create new slot (Admin only)
exports.createSlot = async (req, res) => {
  try {
    const {
      name, sport, sportId, sportSlug, courtId, courtNameSnapshot,
      capacity, startTime, endTime, duration, date, pricePerSlot,
      pricingType, priceLabel, isBookable, isPeakHour, peakHourMultiplier,
    } = req.body;

    const slot = await Slot.create({
      name,
      sport,
      sportId,
      sportSlug,
      courtId,
      courtNameSnapshot,
      capacity,
      startTime,
      endTime,
      duration,
      date: new Date(date),
      pricePerSlot,
      pricingType: pricingType || 'flat',
      priceLabel: priceLabel || '',
      isBookable: isBookable !== false,
      isPeakHour: isPeakHour || false,
      peakHourMultiplier: peakHourMultiplier || 1,
    });

    const io = req.app.get('io');
    if (io) io.emit('slot:created', slot);

    res.status(201).json({ slot });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A slot already exists for this court/date/time combination.' });
    }
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// PUT /api/slots/:id — Update slot
exports.updateSlot = async (req, res) => {
  try {
    const allowed = ['name', 'capacity', 'pricePerSlot', 'isPeakHour', 'peakHourMultiplier', 'isBookable', 'pricingType', 'priceLabel', 'status', 'startTime', 'endTime', 'duration'];
    const update = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }

    const slot = await Slot.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!slot) return res.status(404).json({ message: 'Slot not found.' });

    const io = req.app.get('io');
    if (io) io.emit('slot:updated', slot);

    res.json({ slot });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/slots/:id — Delete slot
exports.deleteSlot = async (req, res) => {
  try {
    const slot = await Slot.findByIdAndDelete(req.params.id);
    if (!slot) return res.status(404).json({ message: 'Slot not found.' });

    const io = req.app.get('io');
    if (io) io.emit('slot:deleted', { slotId: slot._id });

    res.json({ message: 'Slot deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BULK SLOT CREATION (Superadmin)
// POST /api/slots/admin/bulk
// ─────────────────────────────────────────────────────────────────────────────
exports.bulkCreateSlots = async (req, res) => {
  try {
    const {
      sportId,
      courtIds,         // array of courtId strings; if empty/missing → all open courts for sport
      startDateStr,     // "YYYY-MM-DD"
      endDateStr,       // "YYYY-MM-DD"
      weekdays,         // [0,1,2,3,4,5,6] — 0=Sun ... 6=Sat; empty = all days
      slotStartTime,    // "06:00"
      slotEndTime,      // "22:00"
      slotDurationMin,  // 60
      gapBetweenMin,    // 0
      priceMode,        // "flat" | "dayNight"
      flatPrice,
      dayPrice,
      nightPrice,
      nightCutoffTime,  // "18:00"  defaults to sport nightStartTime
      customSlots,      // [{ startTime, endTime, price? }] — override specific windows
    } = req.body;

    if (!sportId || !startDateStr || !endDateStr || !slotStartTime || !slotEndTime || !slotDurationMin) {
      return res.status(400).json({ message: 'sportId, startDate, endDate, slotStartTime, slotEndTime, slotDurationMin are required.' });
    }

    const sport = await Sport.findById(sportId);
    if (!sport) return res.status(404).json({ message: 'Sport not found.' });

    // Determine courts
    let courts;
    if (courtIds && courtIds.length > 0) {
      courts = await Court.find({ _id: { $in: courtIds }, sportId });
    } else {
      courts = await Court.find({ sportId, isOpen: true });
    }

    const allCourtIds = courts.map((c) => c._id.toString());
    const openCourtIds = courts.filter((c) => c.isOpen).map((c) => c._id.toString());
    const skippedClosedCount = allCourtIds.length - openCourtIds.length;

    // Build list of dates
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const dates = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const dow = cursor.getDay();
      if (!weekdays || weekdays.length === 0 || weekdays.includes(dow)) {
        dates.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    // Build time slots
    const duration = parseInt(slotDurationMin);
    const gap = parseInt(gapBetweenMin) || 0;
    const nightCutoff = timeToMinutes(nightCutoffTime || sport.nightStartTime || '18:00');
    const dayPriceVal = parseFloat(dayPrice) || parseFloat(flatPrice) || sport.daySlotPrice || sport.hourlyPrice;
    const nightPriceVal = parseFloat(nightPrice) || sport.nightSlotPrice || sport.hourlyPrice;

    // Parse custom slot overrides (specific time windows with their own duration/price)
    const customRanges = (customSlots || [])
      .filter((cs) => cs.startTime && cs.endTime)
      .map((cs) => ({
        start: timeToMinutes(cs.startTime),
        end: timeToMinutes(cs.endTime),
        startTime: cs.startTime,
        endTime: cs.endTime,
        price: cs.price != null && cs.price !== '' ? parseFloat(cs.price) : null,
      }))
      .filter((cr) => cr.end > cr.start);

    const timeSlots = []; // { startTime, endTime, duration, price, priceLabel, pricingType }
    let cursor2 = timeToMinutes(slotStartTime);
    const endMinutes = timeToMinutes(slotEndTime);

    while (cursor2 + duration <= endMinutes) {
      const st = `${String(Math.floor(cursor2 / 60)).padStart(2, '0')}:${String(cursor2 % 60).padStart(2, '0')}`;
      const etMin = cursor2 + duration;
      const et = `${String(Math.floor(etMin / 60)).padStart(2, '0')}:${String(etMin % 60).padStart(2, '0')}`;

      // Skip auto-generated slots that overlap with any custom range
      const overlaps = customRanges.some((cr) => cursor2 < cr.end && etMin > cr.start);
      if (!overlaps) {
        const isNight = priceMode === 'dayNight' && cursor2 >= nightCutoff;
        const price = isNight ? nightPriceVal : dayPriceVal;
        const priceLabel = priceMode === 'dayNight' ? (isNight ? 'night' : 'day') : '';
        timeSlots.push({ startTime: st, endTime: et, duration, price, priceLabel, pricingType: priceMode === 'dayNight' ? 'day-night' : 'flat' });
      }
      cursor2 += duration + gap;
    }

    // Append custom override slots
    for (const cr of customRanges) {
      const dur = cr.end - cr.start;
      const isNight = priceMode === 'dayNight' && cr.start >= nightCutoff;
      const autoPrice = isNight ? nightPriceVal : dayPriceVal;
      const price = cr.price != null ? cr.price : autoPrice;
      const priceLabel = priceMode === 'dayNight' ? (isNight ? 'night' : 'day') : '';
      timeSlots.push({
        startTime: cr.startTime,
        endTime: cr.endTime,
        duration: dur,
        price,
        priceLabel,
        pricingType: priceMode === 'dayNight' ? 'day-night' : 'flat',
      });
    }

    let createdCount = 0;
    let skippedDuplicates = 0;
    const errors = [];

    for (const court of courts.filter((c) => c.isOpen)) {
      for (const date of dates) {
        for (const ts of timeSlots) {
          const slotDate = new Date(date);
          slotDate.setHours(12, 0, 0, 0); // noon UTC-safe anchor

          try {
            await Slot.create({
              name: `${court.name} • ${ts.startTime}–${ts.endTime}`,
              sport: sport.slug,
              sportId: sport._id,
              sportSlug: sport.slug,
              courtId: court._id,
              courtNameSnapshot: court.name,
              capacity: 1,
              startTime: ts.startTime,
              endTime: ts.endTime,
              duration: ts.duration,
              date: slotDate,
              pricePerSlot: ts.price,
              pricingType: ts.pricingType,
              priceLabel: ts.priceLabel,
              isBookable: true,
            });
            createdCount++;
          } catch (e) {
            if (e.code === 11000) {
              skippedDuplicates++;
            } else {
              errors.push(`${court.name} ${slotDate.toDateString()} ${ts.startTime}: ${e.message}`);
            }
          }
        }
      }
    }

    const io = req.app.get('io');
    if (io) io.emit('slots:bulk-created', { sportId, createdCount });

    res.status(201).json({
      message: `Bulk creation complete.`,
      createdCount,
      skippedDuplicates,
      skippedClosedCourts: skippedClosedCount,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    console.error('bulkCreateSlots error:', error);
    res.status(500).json({ message: 'Bulk creation failed.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN LIVE SPORTS OVERVIEW
// GET /api/slots/admin/live?date=YYYY-MM-DD
// ─────────────────────────────────────────────────────────────────────────────
exports.adminLiveOverview = async (req, res) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const sports = await Sport.find({ active: true, deletedAt: null }).sort({ name: 1 });

    const overview = await Promise.all(sports.map(async (sport) => {
      const courts = await Court.find({ sportId: sport._id }).sort({ sortOrder: 1, name: 1 });
      const slots = await Slot.find({
        sportId: sport._id,
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      const bookedSlots = slots.filter((s) => s.currentBookings >= s.capacity || s.status === 'full').length;
      const availableSlots = slots.filter((s) => s.isBookable && s.status !== 'full' && s.status !== 'maintenance').length;

      // Pending payments on slot bookings for this sport today
      const pendingPayments = await SlotBooking.countDocuments({
        sportId: sport._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        paymentStatus: { $in: ['pending', 'partial'] },
        isReference: { $ne: true },
      });

      return {
        sport: { _id: sport._id, name: sport.name, slug: sport.slug, thumbnail: sport.thumbnail },
        totalCourts: courts.length,
        openCourts: courts.filter((c) => c.isOpen).length,
        closedCourts: courts.filter((c) => !c.isOpen).length,
        totalSlots: slots.length,
        bookedSlots,
        availableSlots,
        pendingPayments,
      };
    }));

    res.json({ overview, date: dateStr });
  } catch (error) {
    console.error('adminLiveOverview error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN LIVE SPORT DETAIL
// GET /api/slots/admin/live/:sportId?date=YYYY-MM-DD
// ─────────────────────────────────────────────────────────────────────────────
exports.adminLiveSportDetail = async (req, res) => {
  try {
    const { sportId } = req.params;
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const sport = await Sport.findById(sportId);
    if (!sport) return res.status(404).json({ message: 'Sport not found.' });

    const courts = await Court.find({ sportId: sport._id }).sort({ sortOrder: 1, name: 1 });
    const slots = await Slot.find({
      sportId: sport._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ startTime: 1 });

    // Load bookings with customer info
    const bookingsBySlot = {};
    const slotIds = slots.map((s) => s._id);
    const bookings = await SlotBooking.find({ slotId: { $in: slotIds } })
      .select('slotId playerName playerPhone playerEmail paymentStatus status isManualEntry isReference amountDue amountPaid waivedAmount');

    for (const b of bookings) {
      const key = b.slotId.toString();
      if (!bookingsBySlot[key]) bookingsBySlot[key] = [];
      bookingsBySlot[key].push(b);
    }

    // Group slots by court
    const courtMap = {};
    for (const court of courts) {
      courtMap[court._id.toString()] = {
        court: { _id: court._id, name: court.name, isOpen: court.isOpen, statusReason: court.statusReason },
        slots: [],
      };
    }

    // Slots without a court
    const unassigned = [];
    for (const slot of slots) {
      const slotObj = slot.toObject();
      slotObj.bookings = bookingsBySlot[slot._id.toString()] || [];

      const courtKey = slot.courtId?.toString();
      if (courtKey && courtMap[courtKey]) {
        courtMap[courtKey].slots.push(slotObj);
      } else {
        unassigned.push(slotObj);
      }
    }

    const courtGroups = Object.values(courtMap);
    if (unassigned.length > 0) {
      courtGroups.push({ court: { _id: null, name: 'Unassigned', isOpen: true }, slots: unassigned });
    }

    res.json({ sport, courtGroups, date: dateStr });
  } catch (error) {
    console.error('adminLiveSportDetail error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Get available slots for a sport on a date (for booking UI)
// GET /api/slots/public/available?sportSlug=&date=&courtId=
// ─────────────────────────────────────────────────────────────────────────────
exports.getPublicAvailableSlots = async (req, res) => {
  try {
    const { sportSlug, date, courtId } = req.query;
    if (!sportSlug || !date) {
      return res.status(400).json({ message: 'sportSlug and date are required.' });
    }

    const sport = await Sport.findOne({ slug: sportSlug, active: true, deletedAt: null });
    if (!sport) return res.status(404).json({ message: 'Sport not found.' });

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const filter = {
      sportId: sport._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    };
    if (courtId) filter.courtId = courtId;

    const slots = await Slot.find(filter).sort({ startTime: 1 });

    // Apply active discount
    const discount = await getActiveDiscount(sport._id, date);

    // Build set of closed court IDs so we can mark their slots unavailable
    const courts = await Court.find({ sportId: sport._id }).sort({ sortOrder: 1, name: 1 });
    const closedCourtIds = new Set(courts.filter((c) => !c.isOpen && !c.deletedAt).map((c) => c._id.toString()));

    // Check if this user has a reference price for this sport (logged-in only)
    let userRefPrice = null;
    if (req.user) {
      userRefPrice = await ReferencePrice.findOne({
        userId: req.user.userId,
        sportId: sport._id,
        active: true,
      }).lean();
    }

    const publicSlots = slots.map((s) => {
      const courtClosed = s.courtId && closedCourtIds.has(s.courtId.toString());
      const isAvailable = !courtClosed && s.isBookable && s.status !== 'full' && s.status !== 'maintenance';
      const originalPrice = s.pricePerSlot;
      let finalPrice = originalPrice;
      let discountInfo = null;
      let isReferencePrice = false;

      // Reference price wins — no stacking with discounts
      if (userRefPrice && isAvailable) {
        finalPrice = userRefPrice.referencePrice;
        isReferencePrice = true;
      } else if (discount && isAvailable) {
        const discAmt = Math.round((originalPrice * discount.discountPercent) / 100);
        finalPrice = originalPrice - discAmt;
        discountInfo = {
          discountId: discount._id,
          discountPercent: discount.discountPercent,
          discountAmount: discAmt,
          originalPrice,
          finalPrice,
        };
      }

      return {
        _id: s._id,
        name: s.name,
        courtId: s.courtId,
        courtNameSnapshot: s.courtNameSnapshot,
        startTime: s.startTime,
        endTime: s.endTime,
        duration: s.duration,
        pricePerSlot: finalPrice,
        originalPrice,
        priceLabel: s.priceLabel,
        pricingType: s.pricingType,
        status: s.status,
        isAvailable,
        currentBookings: s.currentBookings,
        capacity: s.capacity,
        discount: discountInfo,
        isReferencePrice,
        ...(isReferencePrice && { referencePrice: userRefPrice.referencePrice, waivedAmount: originalPrice - userRefPrice.referencePrice }),
      };
    });

    res.json({ sport, slots: publicSlots, courts, discount: discount || null, isReferenceUser: !!userRefPrice });
  } catch (error) {
    console.error('getPublicAvailableSlots error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Create Razorpay order for a slot booking
// POST /api/slots/public/slot-order
// ─────────────────────────────────────────────────────────────────────────────
exports.createSlotOrder = async (req, res) => {
  try {
    const { slotId } = req.body;
    if (!slotId) return res.status(400).json({ message: 'slotId is required.' });

    const slot = await Slot.findById(slotId);
    if (!slot) return res.status(404).json({ message: 'Slot not found.' });

    if (!slot.isBookable || slot.status === 'maintenance') {
      return res.status(409).json({ message: 'This slot is not available for booking.' });
    }
    if (slot.currentBookings >= slot.capacity) {
      return res.status(409).json({ message: 'Slot is fully booked.' });
    }

    // Reject if court is closed
    if (slot.courtId) {
      const court = await Court.findById(slot.courtId);
      if (court && !court.isOpen) {
        return res.status(409).json({ message: 'This court is currently closed.' });
      }
    }

    // Check if logged-in user has a reference price (reference wins over discounts)
    let userRefPrice = null;
    if (req.user) {
      userRefPrice = await ReferencePrice.findOne({
        userId: req.user.userId,
        sportId: slot.sportId,
        active: true,
      }).lean();
    }

    const originalPrice = slot.pricePerSlot;
    let finalPrice = originalPrice;
    let discountAmt = 0;
    let discountPct = 0;
    let discountDoc = null;
    let isRefBooking = false;
    let waivedAmt = 0;

    if (userRefPrice) {
      finalPrice = userRefPrice.referencePrice;
      isRefBooking = true;
      waivedAmt = originalPrice - finalPrice;
    } else {
      // Calculate final price using current discount snapshot
      discountDoc = await getActiveDiscount(slot.sportId, slot.date);
      if (discountDoc) {
        discountPct = discountDoc.discountPercent;
        discountAmt = Math.round((originalPrice * discountPct) / 100);
        finalPrice = originalPrice - discountAmt;
      }
    }

    // Create pending Payment BEFORE Razorpay order — snapshot binds verify to this slot/amount
    const pendingPayment = await Payment.create({
      type: 'slot-booking',
      studentId: req.user?.userId || null,
      amount: finalPrice,
      gstAmount: 0,
      gstPercent: 0,
      totalAmount: finalPrice,
      amountPaid: 0,
      remainingAmount: finalPrice,
      status: 'pending',
      paymentMode: 'razorpay',
      slotId: slot._id,
      originalAmount: originalPrice,
      isReference: isRefBooking,
      waivedAmount: waivedAmt,
      referenceNote: isRefBooking ? 'Reference online price' : '',
      discountId: discountDoc?._id || null,
      discountPercent: discountPct,
      discountAmount: discountAmt,
    });

    const order = await createRazorpayOrder({
      amount: Math.round(finalPrice * 100),
      currency: 'INR',
      receipt: `slot_${slot._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`,
      notes: { paymentId: pendingPayment._id.toString(), slotId: slot._id.toString(), amount: finalPrice },
    });

    // Bind Razorpay order ID to the pending payment
    pendingPayment.razorpayOrderId = order.id;
    await pendingPayment.save();

    res.json({
      paymentId: pendingPayment._id,
      razorpayOrder: { id: order.id, amount: order.amount, currency: order.currency },
      amount: finalPrice,
      originalAmount: originalPrice,
      discount: discountDoc ? { discountPercent: discountDoc.discountPercent } : null,
      slot: {
        _id: slot._id,
        name: slot.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration,
        courtNameSnapshot: slot.courtNameSnapshot,
      },
    });
  } catch (error) {
    console.error('createSlotOrder error:', error);
    res.status(500).json({ message: 'Failed to create payment order.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Verify Razorpay payment + confirm slot booking
// POST /api/slots/public/slot-verify
// ─────────────────────────────────────────────────────────────────────────────
exports.verifySlotPayment = async (req, res) => {
  try {
    const {
      paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      playerName,
      playerPhone,
      playerEmail,
    } = req.body;

    if (!paymentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: 'paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature are required.' });
    }
    if (!playerName || !playerPhone) {
      return res.status(400).json({ message: 'playerName and playerPhone are required.' });
    }

    // Find payment record by snapshot ID and order ID
    const paymentRecord = await Payment.findOne({ _id: paymentId, razorpayOrderId, type: 'slot-booking' });
    if (!paymentRecord) {
      return res.status(400).json({ message: 'Payment record not found.' });
    }

    // Idempotency: payment already paid with a booking
    if (paymentRecord.status === 'paid' && paymentRecord.referenceId) {
      const existingBooking = await SlotBooking.findById(paymentRecord.referenceId);
      if (existingBooking) {
        return res.json({
          success: true,
          message: 'Payment already processed.',
          booking: existingBooking,
          bookingId: existingBooking.bookingId,
        });
      }
    }

    // Reject conflicting reuse of order with different Razorpay payment
    if (paymentRecord.razorpayPaymentId && paymentRecord.razorpayPaymentId !== razorpayPaymentId) {
      return res.status(400).json({ message: 'This order was already used with a different Razorpay payment.' });
    }

    // For pending payments: verify signature and Razorpay amount
    if (paymentRecord.status === 'pending') {
      const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      if (!isValid) return res.status(400).json({ message: 'Payment verification failed.' });

      try {
        const rzpDetails = await fetchPaymentDetails(razorpayPaymentId);
        if (rzpDetails.status !== 'captured' && rzpDetails.status !== 'authorized') {
          return res.status(400).json({ message: 'Payment not completed by Razorpay.' });
        }
        if (rzpDetails.amount !== Math.round(paymentRecord.totalAmount * 100)) {
          return res.status(400).json({
            message: `Amount mismatch: expected ₹${paymentRecord.totalAmount}, got ₹${rzpDetails.amount / 100}.`,
          });
        }
      } catch (rzpErr) {
        // Razorpay temporarily unreachable — proceed on valid signature
        console.error('Razorpay fetch error (signature-only fallback):', rzpErr.message);
      }
    } else if (paymentRecord.status !== 'paid') {
      return res.status(400).json({ message: `Payment is in an unexpected state: ${paymentRecord.status}.` });
    }

    // Use slot from payment snapshot — never trust client-supplied slotId
    const slotId = paymentRecord.slotId;
    if (!slotId) return res.status(400).json({ message: 'Payment record is missing slot reference.' });

    // Court open check before claiming capacity
    const freshSlot = await Slot.findById(slotId);
    if (!freshSlot) return res.status(404).json({ message: 'Slot not found.' });
    if (freshSlot.courtId) {
      const court = await Court.findById(freshSlot.courtId);
      if (court && !court.isOpen) {
        return res.status(409).json({ message: 'This court is currently closed.' });
      }
    }

    // Atomic capacity claim — prevents double-booking under concurrency
    const claimedSlot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        isBookable: true,
        status: { $ne: 'maintenance' },
        $expr: { $lt: ['$currentBookings', '$capacity'] },
      },
      { $inc: { currentBookings: 1 } },
      { new: true }
    );
    if (!claimedSlot) {
      return res.status(409).json({ message: 'Slot is no longer available. Please choose another slot.' });
    }

    const sport = claimedSlot.sportId ? await Sport.findById(claimedSlot.sportId).select('name slug') : null;

    try {
      // All amounts come from the payment snapshot — not from re-calculating
      const bookingUserId = paymentRecord.studentId || req.user?.userId || null;
      const booking = await SlotBooking.create({
        slotId: claimedSlot._id,
        slotName: claimedSlot.name,
        sportId: claimedSlot.sportId,
        sportSlug: claimedSlot.sportSlug || sport?.slug,
        sportNameSnapshot: sport?.name,
        courtId: claimedSlot.courtId,
        courtNameSnapshot: claimedSlot.courtNameSnapshot,
        userId: bookingUserId,
        bookingType: 'one-time-play',
        playerName,
        playerPhone,
        playerEmail: playerEmail || '',
        numberOfPlayers: 1,
        startTime: claimedSlot.startTime,
        endTime: claimedSlot.endTime,
        duration: claimedSlot.duration,
        price: paymentRecord.totalAmount,
        gstAmount: 0,
        totalAmount: paymentRecord.totalAmount,
        status: 'confirmed',
        paymentStatus: 'paid',
        amountDue: paymentRecord.totalAmount,
        amountPaid: paymentRecord.totalAmount,
        isReference: !!paymentRecord.isReference,
        waivedAmount: paymentRecord.waivedAmount ?? 0,
        originalAmount: paymentRecord.originalAmount,
        discountApplied: paymentRecord.discountAmount > 0,
        discountId: paymentRecord.discountId || null,
        discountPercent: paymentRecord.discountPercent || 0,
        discountAmount: paymentRecord.discountAmount || 0,
        paymentId: paymentRecord._id,
      });

      // Mark payment paid and link to booking
      if (paymentRecord.status !== 'paid') {
        paymentRecord.razorpayPaymentId = razorpayPaymentId;
        paymentRecord.razorpaySignature = razorpaySignature;
        paymentRecord.status = 'paid';
        paymentRecord.amountPaid = paymentRecord.totalAmount;
        paymentRecord.remainingAmount = 0;
      }
      paymentRecord.referenceId = booking._id;
      paymentRecord.customerName = playerName;
      await paymentRecord.save();

      await Slot.findByIdAndUpdate(slotId, { $push: { bookings: booking._id } });

      const io = req.app.get('io');
      if (io) {
        io.emit('booking:created', { booking, paymentStatus: 'paid' });
        io.emit('slot:updated', claimedSlot);
        io.emit('dashboard:refresh');
      }

      return res.status(201).json({
        success: true,
        message: 'Slot booked successfully!',
        booking,
        payment: paymentRecord,
        bookingId: booking.bookingId,
      });
    } catch (createErr) {
      // Rollback the atomic capacity increment on failure
      await Slot.findByIdAndUpdate(slotId, { $inc: { currentBookings: -1 } });
      throw createErr;
    }
  } catch (error) {
    console.error('verifySlotPayment error:', error);
    res.status(500).json({ message: 'Booking confirmation failed.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SUPERADMIN: Manual slot payment entry
// POST /api/slots/admin/manual-booking
// ─────────────────────────────────────────────────────────────────────────────
exports.adminManualBooking = async (req, res) => {
  try {
    const {
      slotId,
      playerName,
      playerPhone,
      playerEmail,
      amountPaid,
      paymentMode,  // cash|upi|card|bank-transfer
      isReference,  // bool — if true, remaining is waived
      referenceNote,
      notes,
      customerUserId, // explicit user link from admin UI search
    } = req.body;

    if (!slotId || !playerName || !playerPhone || amountPaid === undefined || !paymentMode) {
      return res.status(400).json({ message: 'slotId, playerName, playerPhone, amountPaid, paymentMode are required.' });
    }

    // Validate inputs before touching DB
    const paid = parseFloat(amountPaid);
    if (isNaN(paid) || paid < 0) {
      return res.status(400).json({ message: 'amountPaid must be a non-negative number.' });
    }
    if (!ALLOWED_MANUAL_PAYMENT_MODES.includes(paymentMode)) {
      return res.status(400).json({ message: `paymentMode must be one of: ${ALLOWED_MANUAL_PAYMENT_MODES.join(', ')}.` });
    }

    // Resolve linked user account
    // Priority: explicit customerUserId > email match > phone match (non-admin preferred)
    const digitsOnly = (p) => (p || '').replace(/\D/g, '');
    let matchedUser = null;

    if (customerUserId) {
      // Admin explicitly selected a user from the search widget
      matchedUser = await User.findById(customerUserId).select('_id name email phone role');
    }

    if (!matchedUser && playerEmail) {
      const emailNorm = playerEmail.trim().toLowerCase();
      // Prefer non-admin accounts with this email
      matchedUser = await User.findOne({ email: emailNorm, role: { $in: ['user', 'member'] } });
      if (!matchedUser) {
        matchedUser = await User.findOne({ email: emailNorm });
      }
    }

    if (!matchedUser && playerPhone) {
      const trimmed = playerPhone.trim();
      const last10 = digitsOnly(trimmed).slice(-10);
      const phoneMatchers = [{ phone: trimmed }];
      if (last10.length === 10) phoneMatchers.push({ phone: { $regex: last10 + '$' } });

      for (const matcher of phoneMatchers) {
        // First try: only non-admin users
        matchedUser = await User.findOne({ ...matcher, role: { $in: ['user', 'member'] } });
        if (matchedUser) break;
        // Fallback: any role
        const anyUser = await User.findOne(matcher);
        // Skip if the only match is an admin/superadmin (avoid linking to admin accounts)
        if (anyUser && !['admin', 'superadmin'].includes(anyUser.role)) {
          matchedUser = anyUser;
          break;
        }
      }
    }

    // Court open check before capacity claim
    const slot = await Slot.findById(slotId);
    if (!slot) return res.status(404).json({ message: 'Slot not found.' });

    if (!slot.isBookable || slot.status === 'maintenance') {
      return res.status(409).json({ message: 'Slot is not available.' });
    }
    if (slot.courtId) {
      const court = await Court.findById(slot.courtId);
      if (court && !court.isOpen) {
        return res.status(409).json({ message: 'This court is currently closed.' });
      }
    }

    // Atomic capacity claim
    const claimedSlot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        isBookable: true,
        status: { $ne: 'maintenance' },
        $expr: { $lt: ['$currentBookings', '$capacity'] },
      },
      { $inc: { currentBookings: 1 } },
      { new: true }
    );
    if (!claimedSlot) {
      return res.status(409).json({ message: 'Slot is already fully booked.' });
    }

    const slotAmount = claimedSlot.pricePerSlot;
    const waivedAmount = isReference ? Math.max(0, slotAmount - paid) : 0;
    const remainingAmount = isReference ? 0 : Math.max(0, slotAmount - paid);

    let paymentStatus;
    if (paid >= slotAmount || isReference) {
      paymentStatus = 'paid';
    } else if (paid > 0) {
      paymentStatus = 'partial';
    } else {
      paymentStatus = 'pending';
    }

    const sport = claimedSlot.sportId ? await Sport.findById(claimedSlot.sportId).select('name slug') : null;

    try {
      const booking = await SlotBooking.create({
        slotId: claimedSlot._id,
        slotName: claimedSlot.name,
        sportId: claimedSlot.sportId,
        sportSlug: claimedSlot.sportSlug || sport?.slug,
        sportNameSnapshot: sport?.name,
        courtId: claimedSlot.courtId,
        courtNameSnapshot: claimedSlot.courtNameSnapshot,
        userId: matchedUser?._id || undefined,
        bookingType: 'slot-booking',
        playerName,
        playerPhone,
        playerEmail: playerEmail || '',
        numberOfPlayers: 1,
        startTime: claimedSlot.startTime,
        endTime: claimedSlot.endTime,
        duration: claimedSlot.duration,
        price: slotAmount,
        gstAmount: 0,
        totalAmount: slotAmount,
        status: 'confirmed',
        paymentStatus,
        isManualEntry: true,
        isReference: !!isReference,
        amountDue: slotAmount,
        amountPaid: paid,
        waivedAmount,
        createdBy: req.user.userId,
        notes: notes || '',
      });

      const payment = await Payment.create({
        type: 'slot-booking',
        referenceId: booking._id,
        studentId: matchedUser?._id || undefined,
        customerName: playerName,
        amount: slotAmount,
        gstAmount: 0,
        gstPercent: 0,
        totalAmount: slotAmount,
        amountPaid: paid,
        remainingAmount,
        status: paymentStatus,
        paymentMode,
        isReference: !!isReference,
        waivedAmount,
        waiverReason: isReference ? 'Reference/Admin waiver' : '',
        referenceNote: referenceNote || '',
        createdBy: req.user.userId,
        adminNote: notes || '',
        slotId: claimedSlot._id,
        originalAmount: slotAmount,
      });

      booking.paymentId = payment._id;
      await booking.save();

      // Upsert reference price for future online bookings at the same rate
      let referencePriceCreated = false;
      let referencePriceWarning = null;
      if (isReference) {
        if (matchedUser && paid > 0) {
          await ReferencePrice.findOneAndUpdate(
            { userId: matchedUser._id, sportId: claimedSlot.sportId },
            {
              referencePrice: paid,
              sportSlug: claimedSlot.sportSlug || sport?.slug,
              sportNameSnapshot: sport?.name,
              sourceBookingId: booking._id,
              sourcePaymentId: payment._id,
              active: true,
              note: referenceNote || '',
              createdBy: req.user.userId,
            },
            { upsert: true, new: true }
          );
          referencePriceCreated = true;
        } else if (!matchedUser) {
          referencePriceWarning = 'No matching user account found for this phone/email — reference price was NOT saved for online bookings.';
        } else {
          referencePriceWarning = 'amountPaid is 0 — reference price was NOT saved.';
        }
      }

      await Slot.findByIdAndUpdate(slotId, { $push: { bookings: booking._id } });

      const io = req.app.get('io');
      if (io) {
        io.emit('booking:created', { booking, paymentStatus });
        io.emit('slot:updated', claimedSlot);
        io.emit('dashboard:refresh');
        if (paymentStatus === 'partial' || paymentStatus === 'pending') {
          io.emit('payment:pending', { bookingId: booking._id, remainingAmount });
        }
      }

      res.status(201).json({
        booking,
        payment,
        message: 'Manual booking created.',
        matchedUserId: matchedUser?._id || null,
        matchedUserName: matchedUser?.name || null,
        matchedUserEmail: matchedUser?.email || null,
        referencePriceCreated,
        ...(referencePriceWarning && { referencePriceWarning }),
      });
    } catch (createErr) {
      // Rollback the atomic capacity increment on failure
      await Slot.findByIdAndUpdate(slotId, { $inc: { currentBookings: -1 } });
      throw createErr;
    }
  } catch (error) {
    console.error('adminManualBooking error:', error);
    res.status(500).json({ message: 'Manual booking failed.', error: error.message });
  }
};

exports.checkInBooking = async (req, res) => {
  try {
    const booking = await SlotBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    booking.status = 'checked-in';
    booking.checkInTime = new Date();
    await booking.save();

    const io = req.app.get('io');
    if (io) io.emit('booking:checked-in', booking);

    res.json({ booking, message: 'Checked in successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.checkOutBooking = async (req, res) => {
  try {
    const booking = await SlotBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    booking.status = 'completed';
    booking.checkOutTime = new Date();
    await booking.save();

    const io = req.app.get('io');
    if (io) io.emit('booking:checked-out', booking);

    res.json({ booking, message: 'Checked out successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await SlotBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot cancel this booking.' });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancellationTime = new Date();
    await booking.save();

    const slot = await Slot.findById(booking.slotId);
    if (slot) {
      slot.currentBookings = Math.max(0, slot.currentBookings - booking.numberOfPlayers);
      slot.bookings = slot.bookings.filter((id) => id.toString() !== booking._id.toString());
      await slot.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('booking:cancelled', booking);
      if (slot) io.emit('slot:updated', slot);
    }

    res.json({ booking, message: 'Booking cancelled.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized.' });

    const rawBookings = await SlotBooking.find({
      $or: [{ userId }, { playerEmail: req.user?.email }],
      status: { $ne: 'cancelled' },
    })
      .populate('slotId', 'date startTime endTime duration')
      .populate('sportId', 'name slug thumbnail')
      .populate('paymentId', 'paymentMode remainingAmount referenceNote waivedAmount status')
      .sort({ createdAt: -1 })
      .limit(50);

    const bookings = rawBookings.map((b) => {
      const obj = b.toObject();
      // Use ?? so that ₹0 (fully waived) stays 0 instead of falling back to totalAmount
      obj.displayAmount = b.isReference ? (b.amountPaid ?? 0) : (b.totalAmount ?? 0);
      return obj;
    });

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Legacy public booking endpoints — kept for backwards compatibility
exports.createPublicBookingOrder = async (req, res) => {
  try {
    const { slotId, numberOfPlayers = 1, duration } = req.body;
    let slot;
    let service;
    const Service = require('../models/Service');

    try { slot = await Slot.findById(slotId); } catch (e) { /* ignore */ }
    if (!slot) { try { service = await Service.findById(slotId); } catch (e) { /* ignore */ } }
    if (!slot && !service) return res.status(404).json({ message: 'Service or Slot not found.' });

    const players = Math.max(1, parseInt(numberOfPlayers) || 1);
    if (slot && slot.currentBookings + players > slot.capacity) {
      return res.status(409).json({ message: 'Slot capacity is no longer available.' });
    }

    const basePrice = slot ? slot.pricePerSlot * players : service.hourlyPrice * players;
    const finalPrice = (slot && slot.isPeakHour) ? basePrice * slot.peakHourMultiplier : basePrice;
    const order = await createRazorpayOrder({
      amount: Math.round(finalPrice * 100),
      currency: 'INR',
      receipt: `${slot ? 'slot' : 'service'}_${(slot || service)._id.toString().slice(-10)}_${Date.now().toString().slice(-6)}`,
      notes: { slotId: (slot || service)._id.toString(), duration: duration || (slot ? slot.duration : 60) },
    });

    res.json({
      razorpayOrder: { id: order.id, amount: order.amount, currency: order.currency },
      amount: finalPrice,
      gstAmount: 0,
      totalAmount: finalPrice,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create payment order.' });
  }
};

exports.createPublicBooking = async (req, res) => {
  try {
    const {
      slotId, name, email, phone, sport, duration,
      razorpayOrderId, razorpayPaymentId, razorpaySignature,
    } = req.body;

    if (!slotId || !name || !email || !phone) {
      return res.status(400).json({ message: 'Name, email, phone and slot are required.' });
    }

    // Users MUST pay by Razorpay — block cash path
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: 'Payment is required. Please complete Razorpay payment first.' });
    }

    let slot;
    let service;
    const Service = require('../models/Service');

    try { slot = await Slot.findById(slotId); } catch (e) { /* ignore */ }
    if (!slot) { try { service = await Service.findById(slotId); } catch (e) { /* ignore */ } }
    if (!slot && !service) return res.status(404).json({ message: 'Service or Slot not found.' });

    if (slot && slot.currentBookings + 1 > slot.capacity) {
      return res.status(409).json({ message: 'Slot is full. Please choose another slot.' });
    }

    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) return res.status(400).json({ message: 'Payment validation failed.' });

    const basePrice = slot ? slot.pricePerSlot : service.hourlyPrice;
    const finalPrice = (slot && slot.isPeakHour) ? basePrice * slot.peakHourMultiplier : basePrice;

    const booking = await SlotBooking.create({
      slotId: slot ? slot._id : null,
      slotName: slot ? slot.name : service.name,
      sportId: slot?.sportId || null,
      sportSlug: slot?.sportSlug || null,
      courtId: slot?.courtId || null,
      courtNameSnapshot: slot?.courtNameSnapshot || null,
      bookingType: 'one-time-play',
      playerName: name,
      playerEmail: email,
      playerPhone: phone,
      numberOfPlayers: 1,
      startTime: slot ? slot.startTime : 'Flexible',
      endTime: slot ? slot.endTime : 'Flexible',
      duration: duration || (slot ? slot.duration : 60),
      price: finalPrice,
      gstAmount: 0,
      totalAmount: finalPrice,
      paymentStatus: 'paid',
      status: 'confirmed',
      notes: sport ? `QR portal sport: ${sport}` : 'QR portal booking',
    });

    const payment = await Payment.create({
      type: 'slot-booking',
      referenceId: booking._id,
      customerName: name,
      amount: finalPrice,
      gstAmount: 0,
      gstPercent: 0,
      totalAmount: finalPrice,
      amountPaid: finalPrice,
      remainingAmount: 0,
      status: 'paid',
      paymentMode: 'razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    booking.paymentId = payment._id;
    await booking.save();

    if (slot) {
      slot.currentBookings += 1;
      slot.bookings.push(booking._id);
      await slot.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('booking:created', { booking, paymentStatus: booking.paymentStatus });
      if (slot) io.emit('slot:updated', slot);
      io.emit('dashboard:refresh');
    }

    res.status(201).json({
      booking,
      payment,
      message: 'Booking confirmed. Please show this booking ID at entry.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Booking failed.', error: error.message });
  }
};
