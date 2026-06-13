const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const kc = require('../controllers/kitchen.controller');

router.get('/status', kc.getStatus);
router.put('/status', auth, authorize('superadmin', 'admin', 'manager'), kc.updateStatus);

router.get('/delivery-settings', kc.getDeliverySettings);
router.put('/delivery-settings', auth, authorize('superadmin', 'admin', 'manager'), kc.updateDeliverySettings);

module.exports = router;
