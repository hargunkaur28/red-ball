const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const sessionConfigController = require('../controllers/sessionConfig.controller');

// GET  /api/session-config      — List all session configs
router.get('/', auth, authorize('superadmin', 'admin'), sessionConfigController.getSessionConfigs);

// PUT  /api/session-config      — Create or update a session config
router.put('/', auth, authorize('superadmin', 'admin'), sessionConfigController.upsertSessionConfig);

// DELETE /api/session-config/:id — Delete a session config (except global default)
router.delete('/:id', auth, authorize('superadmin', 'admin'), sessionConfigController.deleteSessionConfig);

module.exports = router;
