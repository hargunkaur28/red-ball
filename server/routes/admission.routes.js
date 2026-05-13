const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const admissionController = require('../controllers/admission.controller');

// Pending fees — accessible by receptionist too (they need to see alerts)
router.get('/pending-fees', auth, authorize('superadmin', 'admin', 'receptionist'), admissionController.getPendingFees);

router.get('/', auth, authorize('superadmin', 'admin', 'receptionist'), admissionController.getAll);
router.post('/', auth, authorize('superadmin', 'admin', 'receptionist'), admissionController.create);
router.get('/:id', auth, authorize('superadmin', 'admin', 'receptionist'), admissionController.getById);
router.put('/:id', auth, authorize('superadmin', 'admin'), admissionController.update);
router.delete('/:id', auth, authorize('superadmin', 'admin'), admissionController.remove);

module.exports = router;
