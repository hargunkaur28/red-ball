const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const ac = require('../controllers/academyAdmission.controller');

router.get('/admission-status', auth, ac.checkAdmissionStatus);

module.exports = router;
