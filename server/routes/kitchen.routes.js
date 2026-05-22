const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const kc = require('../controllers/kitchen.controller');

router.get('/status', kc.getStatus);
router.put('/status', auth, authorize('superadmin', 'admin', 'manager'), kc.updateStatus);

module.exports = router;
