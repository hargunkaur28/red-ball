const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const superadminController = require('../controllers/superadmin.controller');

// Super admin specific queries for memberships and one-time play
router.get('/memberships', auth, authorize('superadmin'), superadminController.getMemberships);
router.get('/overtime-sessions', auth, authorize('superadmin'), superadminController.getOvertimeSessions);
router.get('/one-time', auth, authorize('superadmin'), superadminController.getOneTimeEntries);
router.get('/users', auth, authorize('superadmin'), superadminController.getUsers);
router.get('/user-search', auth, authorize('superadmin'), superadminController.userSearch);
router.patch('/payments/:id/status', auth, authorize('superadmin'), superadminController.updatePaymentStatus);
router.get('/pending-payments', auth, authorize('superadmin'), superadminController.getPendingPayments);
router.get('/reports/slot-revenue-export', auth, authorize('superadmin'), superadminController.exportSlotRevenue);
router.post('/backfill-reference-prices', auth, authorize('superadmin'), superadminController.backfillReferencePrices);

module.exports = router;
