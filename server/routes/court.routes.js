const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const cc = require('../controllers/court.controller');

// Public read — anyone can see courts (to show available/closed state during booking)
router.get('/', cc.getCourts);

// Superadmin write
router.post('/', auth, authorize('superadmin'), cc.createCourt);
router.put('/:id', auth, authorize('superadmin'), cc.updateCourt);
router.patch('/:id/toggle', auth, authorize('superadmin'), cc.toggleCourt);
router.delete('/:id', auth, authorize('superadmin'), cc.deleteCourt);

module.exports = router;
