const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const ac = require('../controllers/analytics.controller');

router.get('/overview', auth, authorize('superadmin', 'admin', 'receptionist'), ac.getOverview);
router.get('/revenue', auth, authorize('superadmin', 'admin'), ac.getRevenue);
router.get('/memberships', auth, authorize('superadmin', 'admin'), ac.getMemberships);
router.get('/sports-popularity', auth, authorize('superadmin', 'admin'), ac.getSportsPopularity);
router.get('/restaurant', auth, authorize('superadmin', 'admin', 'manager'), ac.getRestaurantAnalytics);
router.get('/recent-activity', auth, authorize('superadmin', 'admin', 'receptionist'), ac.getRecentActivity);

module.exports = router;
