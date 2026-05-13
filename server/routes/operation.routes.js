const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const oc = require('../controllers/operation.controller');

router.get('/timeline', auth, oc.getTimeline);
router.get('/schedule', auth, oc.getSchedule);
router.get('/grounds', auth, oc.getGrounds);

router.post('/events', auth, authorize('superadmin', 'admin', 'receptionist'), oc.createEvent);
router.put('/events/:id', auth, authorize('superadmin', 'admin', 'receptionist'), oc.updateEvent);
router.post('/events/:id/reschedule', auth, authorize('superadmin', 'admin', 'receptionist'), oc.rescheduleEvent);
router.delete('/events/:id', auth, authorize('superadmin', 'admin', 'receptionist'), oc.deleteEvent);
router.post('/events/:id/start', auth, authorize('superadmin', 'admin', 'receptionist'), oc.startEvent);
router.post('/events/:id/end', auth, authorize('superadmin', 'admin', 'receptionist'), oc.endEvent);

module.exports = router;
