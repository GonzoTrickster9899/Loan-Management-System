const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updateProfileValidation,
} = require('../middleware/validation');

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/verify-2fa', authController.verify2FA);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.patch('/reset-password/:token', resetPasswordValidation, authController.resetPassword);
router.post('/refresh', authController.refreshToken);
router.post('/resend-verification', authController.resendVerification);

// Protected routes
router.use(protect);
router.get('/me', authController.getMe);
router.patch('/update-profile', updateProfileValidation, authController.updateProfile);
router.patch('/change-password', authController.changePassword);
router.post('/logout', authController.logout);

// 2FA routes
router.post('/2fa/enable', authController.enable2FA);
router.post('/2fa/confirm', authController.confirm2FA);
router.post('/2fa/disable', authController.disable2FA);

module.exports = router;
