const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const ac = require('../controllers/admin.controller');

router.get('/users', auth, authorize('superadmin', 'admin'), ac.getAll);
router.post('/users', auth, authorize('superadmin', 'admin'), ac.create);
router.put('/users/:id', auth, authorize('superadmin', 'admin'), ac.update);
router.put('/users/:id/toggle-active', auth, authorize('superadmin', 'admin'), ac.toggleActive);

module.exports = router;
