const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const sc = require('../controllers/slot.controller');

// Slot endpoints
router.get('/', sc.getSlots);
router.get('/:id', sc.getSlot);
router.post('/', auth, authorize('superadmin', 'admin'), sc.createSlot);
router.put('/:id', auth, authorize('superadmin', 'admin'), sc.updateSlot);
router.delete('/:id', auth, authorize('superadmin', 'admin'), sc.deleteSlot);

// Booking endpoints - SPECIFIC routes BEFORE generic /:id routes
router.get('/bookings/my-bookings', auth, sc.getMyBookings);
router.post('/:id/book', auth, sc.bookSlot);
router.post('/bookings/:id/check-in', auth, authorize('superadmin', 'admin', 'receptionist'), sc.checkInBooking);
router.post('/bookings/:id/check-out', auth, authorize('superadmin', 'admin', 'receptionist'), sc.checkOutBooking);
router.post('/bookings/:id/cancel', auth, sc.cancelBooking);

module.exports = router;
