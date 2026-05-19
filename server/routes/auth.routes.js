const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');
const authController = require('../controllers/auth.controller');

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], validate, authController.login);

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], validate, authController.register);

router.post('/google', authController.googleAuth);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email required'),
], validate, authController.forgotPassword);

router.post('/reset-password', [
  body('email').isEmail().withMessage('Valid email required'),
  body('otp').notEmpty().withMessage('OTP required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], validate, authController.resetPassword);

router.get('/me', auth, authController.getMe);

module.exports = router;
