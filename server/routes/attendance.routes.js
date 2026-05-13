const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const ac = require('../controllers/attendance.controller');

router.get('/today', auth, authorize('superadmin', 'admin', 'receptionist'), ac.getTodayAttendance);
router.get('/user/:userId', auth, ac.getUserAttendance);
router.get('/stats', auth, authorize('superadmin', 'admin'), ac.getStats);

router.post('/check-in', auth, ac.checkIn);
router.post('/check-out', auth, ac.checkOut);

module.exports = router;
