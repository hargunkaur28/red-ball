const express = require('express');
const router = express.Router();
const blockedScheduleController = require('../controllers/blockedSchedule.controller');
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.use(auth);

router.get('/', blockedScheduleController.getAll);
router.post('/', authorize('superadmin', 'admin', 'receptionist'), blockedScheduleController.create);
router.delete('/:id', authorize('superadmin', 'admin'), blockedScheduleController.delete);

module.exports = router;
