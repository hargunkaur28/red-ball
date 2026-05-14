const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const mc = require('../controllers/menu.controller');

const upload = require('../middleware/upload.middleware');

router.get('/', mc.getMenu);
router.get('/:categoryId', mc.getByCategory);
router.post('/items', auth, authorize('superadmin', 'admin', 'manager'), upload.single('imageFile'), mc.createItem);
router.put('/items/:id', auth, authorize('superadmin', 'admin', 'manager'), upload.single('imageFile'), mc.updateItem);
router.delete('/items/:id', auth, authorize('superadmin', 'admin', 'manager'), mc.deleteItem);
router.post('/categories', auth, authorize('superadmin', 'admin', 'manager'), mc.createCategory);
router.put('/categories/:id', auth, authorize('superadmin', 'admin', 'manager'), mc.updateCategory);

module.exports = router;
