const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const controller = require('../controllers/oneTimeAccess.controller');

// Optional authentication middleware to allow guests to create orders/verify purchases
const optionalAuth = async (req, res, next) => {
  const hasBearerToken = req.headers.authorization?.startsWith('Bearer ');
  if (!hasBearerToken) return next();
  return auth(req, res, next);
};

router.get('/my-passes', auth, controller.getMyPasses);
router.post('/purchase-order', optionalAuth, controller.purchaseOrder);
router.post('/verify-purchase', optionalAuth, controller.verifyPurchase);
router.get('/admin/passes', auth, authorize('superadmin', 'admin', 'manager', 'receptionist'), controller.getAdminPasses);

module.exports = router;
