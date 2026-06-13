const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { optionalAuth } = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const cc = require('../controllers/coupon.controller');

router.get('/admin', auth, authorize('superadmin'), cc.adminList);
router.post('/admin', auth, authorize('superadmin'), cc.adminCreate);
router.put('/admin/:id', auth, authorize('superadmin'), cc.adminUpdate);
router.patch('/admin/:id/toggle', auth, authorize('superadmin'), cc.adminToggle);
router.delete('/admin/:id', auth, authorize('superadmin'), cc.adminDelete);
router.post('/validate', optionalAuth, cc.validate);
router.get('/public', optionalAuth, cc.publicList);

module.exports = router;
