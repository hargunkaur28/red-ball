const Slot = require('../models/Slot');
const SlotBooking = require('../models/SlotBooking');
const { calculateGST } = require('../utils/gstCalculator');

// GET /api/slots — Get available slots with filters
exports.getSlots = async (req, res) => {
  try {
    const { date, sport, status } = req.query;
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

    const slots = await Slot.find(filter)
      .populate('bookings')
      .sort({ startTime: 1 });

    // Extract all bookings from all slots
    const allBookings = slots.reduce((acc, slot) => {
      return acc.concat(slot.bookings || []);
    }, []);

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
    const { name, sport, capacity, startTime, endTime, duration, date, pricePerSlot, isPeakHour, peakHourMultiplier } = req.body;

    const slot = await Slot.create({
      name,
      sport,
      capacity,
      startTime,
      endTime,
      duration,
      date: new Date(date),
      pricePerSlot,
      isPeakHour: isPeakHour || false,
      peakHourMultiplier: peakHourMultiplier || 1,
    });

    const io = req.app.get('io');
    if (io) io.emit('slot:created', slot);

    res.status(201).json({ slot });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// PUT /api/slots/:id — Update slot
exports.updateSlot = async (req, res) => {
  try {
    const { name, capacity, pricePerSlot, isPeakHour, peakHourMultiplier } = req.body;

    const slot = await Slot.findByIdAndUpdate(
      req.params.id,
      { name, capacity, pricePerSlot, isPeakHour, peakHourMultiplier },
      { new: true }
    );

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

// POST /api/slots/:id/book — Book a slot
exports.bookSlot = async (req, res) => {
  try {
    const { playerName, playerPhone, playerEmail, numberOfPlayers, startTime, endTime, duration, notes } = req.body;
    const slotId = req.params.id;
    const numPlayers = parseInt(numberOfPlayers) || 1;
    
    console.log('🎫 Booking slot:', { slotId, playerName, numPlayers });
    
    const slot = await Slot.findById(slotId);

    if (!slot) {
      console.log('❌ Slot not found:', slotId);
      return res.status(404).json({ message: 'Slot not found.' });
    }
    
    console.log(`📊 Slot ${slot.name}: ${slot.currentBookings}/${slot.capacity} booked`);
    
    if (slot.currentBookings >= slot.capacity) {
      console.log('❌ Slot is full');
      return res.status(400).json({ message: 'Slot is full.' });
    }

    // Calculate price
    const basePrice = slot.pricePerSlot * numPlayers;
    const finalPrice = slot.isPeakHour ? basePrice * slot.peakHourMultiplier : basePrice;
    const gst = calculateGST(finalPrice);

    // Create booking
    const booking = await SlotBooking.create({
      slotId: slot._id,
      slotName: slot.name,
      userId: req.user?.userId,
      bookingType: req.body.bookingType || 'slot-booking',
      playerName,
      playerPhone,
      playerEmail,
      numberOfPlayers: numPlayers,
      startTime: startTime || slot.startTime,
      endTime: endTime || slot.endTime,
      duration: duration || slot.duration,
      price: finalPrice,
      gstAmount: gst.gstAmount,
      totalAmount: gst.totalAmount,
      notes,
    });

    // Update slot
    slot.currentBookings += numPlayers;
    slot.bookings.push(booking._id);
    await slot.save();
    
    console.log(`✅ Slot booked! New occupancy: ${slot.currentBookings}/${slot.capacity}`);

    const io = req.app.get('io');
    if (io) {
      io.emit('slot:booked', { slotId: slot._id, booking });
      io.emit('slot:updated', slot);
    }

    res.status(201).json({ booking, slot });
  } catch (error) {
    console.error('❌ bookSlot error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ message: error.message || 'Server error.' });
  }
};

// POST /api/slots/bookings/:id/check-in — Check in a booking
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

// POST /api/slots/bookings/:id/check-out — Check out a booking
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

// POST /api/slots/bookings/:id/cancel — Cancel a booking
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

    // Update slot availability
    const slot = await Slot.findById(booking.slotId);
    if (slot) {
      slot.currentBookings = Math.max(0, slot.currentBookings - booking.numberOfPlayers);
      slot.bookings = slot.bookings.filter(id => id.toString() !== booking._id.toString());
      await slot.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('booking:cancelled', booking);
      io.emit('slot:updated', slot);
    }

    res.json({ booking, message: 'Booking cancelled.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/slots/bookings/my-bookings — Get user's bookings
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized.' });

    const bookings = await SlotBooking.find({ 
      $or: [
        { userId: userId },
        { playerEmail: req.user?.email }
      ]
    }).sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error('getMyBookings error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
