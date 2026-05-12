const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const ac = require('../controllers/analytics.controller');

router.get('/overview', auth, authorize('superadmin', 'admin'), ac.overview);
router.get('/revenue', auth, authorize('superadmin', 'admin'), ac.revenue);
router.get('/memberships', auth, authorize('superadmin', 'admin'), ac.memberships);
router.get('/restaurant', auth, authorize('superadmin', 'admin'), ac.restaurant);
router.get('/sports-popularity', auth, authorize('superadmin', 'admin'), ac.sportsPopularity);

module.exports = router;
