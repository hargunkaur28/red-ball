const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const otpCtrl = require('../controllers/onetimeplay.controller');

router.get('/', auth, authorize('superadmin', 'admin', 'receptionist'), otpCtrl.getAll);
router.post('/', auth, authorize('superadmin', 'admin', 'receptionist'), otpCtrl.create);
router.get('/:id', auth, authorize('superadmin', 'admin', 'receptionist'), otpCtrl.getById);

module.exports = router;
