const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const tc = require('../controllers/table.controller');

router.get('/', auth, authorize('superadmin', 'admin', 'manager'), tc.getAll);
router.post('/', auth, authorize('superadmin', 'admin', 'manager'), tc.create);
router.put('/:id', auth, authorize('superadmin', 'admin', 'manager'), tc.update);
router.get('/:tableId/qr', auth, authorize('superadmin', 'admin', 'manager'), tc.generateQR);
router.get('/public-list', tc.getPublicList);
router.get('/:tableId/public', tc.getPublicTable);

module.exports = router;
