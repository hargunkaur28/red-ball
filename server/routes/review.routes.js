const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const rc = require('../controllers/review.controller');

router.get('/featured', rc.getPublicFeatured);
router.get('/my-reviews', auth, rc.getMyReviews);
router.get('/', auth, authorize('superadmin', 'admin', 'receptionist'), rc.getAll);
router.post('/', auth, rc.create);
router.put('/:id', auth, rc.updateOwn);
router.delete('/:id', auth, rc.deleteOwn);
router.put('/:id/moderate', auth, authorize('superadmin', 'admin'), rc.moderate);

module.exports = router;
