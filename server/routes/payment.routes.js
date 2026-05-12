const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const pc = require('../controllers/payment.controller');

router.get('/', auth, authorize('superadmin', 'admin', 'receptionist'), pc.getAll);
router.post('/create-order', auth, pc.createOrder);
router.post('/verify', auth, pc.verifyPayment);
router.post('/manual', auth, authorize('superadmin', 'admin', 'receptionist'), pc.manualPayment);
router.put('/:id/refund', auth, authorize('superadmin', 'admin'), pc.refundPayment);
router.get('/:id/invoice', auth, pc.getInvoice);
router.get('/:id/invoice/print', auth, pc.printInvoice);

module.exports = router;
