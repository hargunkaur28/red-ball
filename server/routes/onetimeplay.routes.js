const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const otpCtrl = require('../controllers/onetimeplay.controller');

// Specific routes MUST come before generic routes
router.post('/create-razorpay-order', auth, authorize('superadmin', 'admin', 'receptionist'), otpCtrl.createRazorpayOrder);

// Generic routes
router.get('/', auth, authorize('superadmin', 'admin', 'receptionist'), otpCtrl.getAll);
router.post('/', auth, authorize('superadmin', 'admin', 'receptionist'), otpCtrl.create);
router.get('/:id', auth, authorize('superadmin', 'admin', 'receptionist'), otpCtrl.getById);
router.delete('/:id', auth, authorize('superadmin', 'admin', 'receptionist'), otpCtrl.delete);

module.exports = router;
