const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.get('/', serviceController.getAll);

router.use(auth);

router.post('/', authorize('superadmin', 'admin'), serviceController.create);
router.put('/:id', authorize('superadmin', 'admin'), serviceController.update);
router.delete('/:id', authorize('superadmin', 'admin'), serviceController.delete);
router.patch('/:id/toggle', authorize('superadmin', 'admin'), serviceController.toggleStatus);

module.exports = router;
