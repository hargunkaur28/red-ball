const mongoose = require('mongoose');
const SlotBooking = require('../models/SlotBooking');
const Slot = require('../models/Slot');
const Payment = require('../models/Payment');

const PRIVILEGED_ROLES = ['superadmin', 'manager', 'admin', 'receptionist'];

exports.getAll = async (req, res) => {
  try {
    const { date, status, sport } = req.query;
    const filter = {};
    if (status) filter.status = status;

    // Regular users can only see their own bookings
    if (!PRIVILEGED_ROLES.includes(req.user.role)) {
      filter.userId = req.user.userId;
    }

    const bookings = await SlotBooking.find(filter)
      .populate('slotId')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings.' });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const booking = await SlotBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    if (booking.status === 'checked-in') {
      return res.status(400).json({ success: false, message: 'Player already checked-in' });
    }

    booking.status = 'checked-in';
    booking.checkInTime = new Date();
    await booking.save();
    
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reschedule = async (req, res) => {
  try {
    const { newSlotId } = req.body;
    const booking = await SlotBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    const newSlot = await Slot.findById(newSlotId);
    if (!newSlot) return res.status(404).json({ success: false, message: 'New slot not found' });

    // Update the booking with new slot info
    booking.slotId = newSlotId;
    booking.startTime = newSlot.startTime;
    booking.endTime = newSlot.endTime;
    // ... other updates
    
    await booking.save();
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancel = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await SlotBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancellationTime = new Date();
    await booking.save();
    
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = await SlotBooking.findById(req.params.id).populate('slotId').populate('userId');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    // Regular users can only view their own booking
    if (!PRIVILEGED_ROLES.includes(req.user.role)) {
      if (booking.userId?._id?.toString() !== req.user.userId.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch booking.' });
  }
};
