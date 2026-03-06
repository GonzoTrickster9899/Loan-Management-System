const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { sendEmail } = require('../config/email');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies,
  hashToken,
} = require('../utils/tokenUtils');
const {
  emailVerificationTemplate,
  passwordResetTemplate,
  otpTemplate,
  welcomeTemplate,
} = require('../utils/emailTemplates');
const { catchAsync, sendSuccess, sendError } = require('../utils/apiHelpers');

// ─── Register ─────────────────────────────────────────────
exports.register = catchAsync(async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, 400, 'An account with this email already exists');
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone: phone || '',
  });

  // Generate email verification token
  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  try {
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email - Loan Management System',
      html: emailVerificationTemplate(user.firstName, verificationUrl),
      text: `Welcome ${user.firstName}! Please verify your email by visiting: ${verificationUrl}`,
    });
  } catch (err) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.error('Email send failed:', err);
  }

  // Log activity
  await ActivityLog.create({
    user: user._id,
    action: 'REGISTER',
    details: `New account registered: ${email}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
  });

  sendSuccess(res, 201, {
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
  }, 'Registration successful. Please check your email to verify your account.');
});

// ─── Verify Email ─────────────────────────────────────────
exports.verifyEmail = catchAsync(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return sendError(res, 400, 'Verification token is invalid or has expired');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  // Send welcome email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Welcome to Loan Management System!',
      html: welcomeTemplate(user.firstName, user.role),
    });
  } catch (err) {
    console.error('Welcome email failed:', err);
  }

  await ActivityLog.create({
    user: user._id,
    action: 'EMAIL_VERIFIED',
    details: 'Email address verified',
  });

  sendSuccess(res, 200, null, 'Email verified successfully. You can now log in.');
});

// ─── Login ────────────────────────────────────────────────
exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +twoFactorSecret +twoFactorBackupCodes');

  if (!user) {
    return sendError(res, 401, 'Invalid email or password');
  }

  // Check if account is locked
  if (user.isLocked()) {
    return sendError(res, 423, 'Account is temporarily locked due to too many failed login attempts. Try again in 30 minutes.');
  }

  // Check if account is active
  if (!user.isActive) {
    return sendError(res, 403, 'Your account has been deactivated. Contact an administrator.');
  }

  // Validate password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    await user.incrementLoginAttempts();
    return sendError(res, 401, 'Invalid email or password');
  }

  // Check email verification
  if (!user.isEmailVerified) {
    return sendError(res, 403, 'Please verify your email address before logging in.');
  }

  // Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    // Generate a temporary token for 2FA verification
    const tempToken = crypto.randomBytes(32).toString('hex');
    user.twoFactorTempToken = hashToken(tempToken);
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      status: 'success',
      message: 'Two-factor authentication required',
      requires2FA: true,
      tempToken,
      userId: user._id,
    });
  }

  // Reset login attempts
  await user.resetLoginAttempts();

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token
  user.refreshTokens.push({
    token: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip,
  });

  // Clean expired tokens
  user.refreshTokens = user.refreshTokens.filter((t) => t.expiresAt > new Date());
  await user.save({ validateBeforeSave: false });

  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  // Log activity
  await ActivityLog.create({
    user: user._id,
    action: 'LOGIN',
    details: `User logged in from ${req.ip}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
  });

  sendSuccess(res, 200, {
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
    },
    accessToken,
  }, 'Login successful');
});

// ─── Verify 2FA ───────────────────────────────────────────
exports.verify2FA = catchAsync(async (req, res) => {
  const { userId, token, tempToken } = req.body;

  const user = await User.findById(userId).select('+twoFactorSecret +twoFactorBackupCodes');
  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  // Verify TOTP token
  const isValid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 2,
  });

  // Check backup codes if TOTP fails
  let usedBackupCode = false;
  if (!isValid && user.twoFactorBackupCodes) {
    const hashedToken = hashToken(token);
    const codeIndex = user.twoFactorBackupCodes.indexOf(hashedToken);
    if (codeIndex > -1) {
      user.twoFactorBackupCodes.splice(codeIndex, 1);
      usedBackupCode = true;
    }
  }

  if (!isValid && !usedBackupCode) {
    return sendError(res, 401, 'Invalid verification code');
  }

  await user.resetLoginAttempts();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshTokens.push({
    token: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip,
  });
  user.refreshTokens = user.refreshTokens.filter((t) => t.expiresAt > new Date());
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, refreshToken);

  await ActivityLog.create({
    user: user._id,
    action: 'LOGIN',
    details: `User logged in with 2FA from ${req.ip}${usedBackupCode ? ' (backup code used)' : ''}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
  });

  sendSuccess(res, 200, {
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
    },
    accessToken,
  }, 'Login successful');
});

// ─── Refresh Token ────────────────────────────────────────
exports.refreshToken = catchAsync(async (req, res) => {
  const oldRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!oldRefreshToken) {
    return sendError(res, 401, 'No refresh token provided');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(oldRefreshToken);
  } catch (err) {
    clearTokenCookies(res);
    return sendError(res, 401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    clearTokenCookies(res);
    return sendError(res, 401, 'User not found or inactive');
  }

  // Verify refresh token exists in user's stored tokens
  const hashedOldToken = hashToken(oldRefreshToken);
  const tokenIndex = user.refreshTokens.findIndex((t) => t.token === hashedOldToken);

  if (tokenIndex === -1) {
    // Token reuse detected - clear all tokens
    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });
    clearTokenCookies(res);
    return sendError(res, 401, 'Token reuse detected. All sessions have been revoked.');
  }

  // Remove old token
  user.refreshTokens.splice(tokenIndex, 1);

  // Generate new tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshTokens.push({
    token: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip,
  });

  await user.save({ validateBeforeSave: false });
  setTokenCookies(res, accessToken, refreshToken);

  sendSuccess(res, 200, { accessToken }, 'Token refreshed');
});

// ─── Logout ───────────────────────────────────────────────
exports.logout = catchAsync(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken && req.user) {
    const hashedToken = hashToken(refreshToken);
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { refreshTokens: { token: hashedToken } },
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'LOGOUT',
      details: 'User logged out',
      ipAddress: req.ip,
    });
  }

  clearTokenCookies(res);
  sendSuccess(res, 200, null, 'Logged out successfully');
});

// ─── Forgot Password ─────────────────────────────────────
exports.forgotPassword = catchAsync(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    // Don't reveal if email exists
    return sendSuccess(res, 200, null, 'If an account exists with that email, a reset link has been sent.');
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset - Loan Management System',
      html: passwordResetTemplate(user.firstName, resetUrl),
      text: `Reset your password: ${resetUrl}`,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return sendError(res, 500, 'There was an error sending the email. Try again later.');
  }

  sendSuccess(res, 200, null, 'If an account exists with that email, a reset link has been sent.');
});

// ─── Reset Password ──────────────────────────────────────
exports.resetPassword = catchAsync(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return sendError(res, 400, 'Password reset token is invalid or has expired');
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();

  await ActivityLog.create({
    user: user._id,
    action: 'PASSWORD_RESET',
    details: 'Password was reset via email link',
    ipAddress: req.ip,
  });

  clearTokenCookies(res);
  sendSuccess(res, 200, null, 'Password reset successful. Please log in with your new password.');
});

// ─── Change Password ─────────────────────────────────────
exports.changePassword = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(req.body.currentPassword))) {
    return sendError(res, 401, 'Current password is incorrect');
  }

  user.password = req.body.newPassword;
  user.refreshTokens = [];
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshTokens.push({
    token: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip,
  });
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, refreshToken);

  await ActivityLog.create({
    user: user._id,
    action: 'PASSWORD_CHANGE',
    details: 'Password changed',
    ipAddress: req.ip,
  });

  sendSuccess(res, 200, { accessToken }, 'Password changed successfully');
});

// ─── Get Current User ────────────────────────────────────
exports.getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  sendSuccess(res, 200, { user });
});

// ─── Update Profile ──────────────────────────────────────
exports.updateProfile = catchAsync(async (req, res) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'address', 'avatar'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  await ActivityLog.create({
    user: user._id,
    action: 'PROFILE_UPDATE',
    details: `Profile updated: ${Object.keys(updates).join(', ')}`,
    ipAddress: req.ip,
  });

  sendSuccess(res, 200, { user }, 'Profile updated');
});

// ─── Enable 2FA ──────────────────────────────────────────
exports.enable2FA = catchAsync(async (req, res) => {
  const secret = speakeasy.generateSecret({
    name: `${process.env.TWO_FA_APP_NAME}:${req.user.email}`,
    length: 20,
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  // Generate backup codes
  const backupCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString('hex')
  );

  // Save temporarily (user must verify first)
  const user = await User.findById(req.user._id);
  user.twoFactorSecret = secret.base32;
  user.twoFactorBackupCodes = backupCodes.map((code) => hashToken(code));
  await user.save({ validateBeforeSave: false });

  sendSuccess(res, 200, {
    qrCode: qrCodeUrl,
    secret: secret.base32,
    backupCodes,
  }, 'Scan the QR code with your authenticator app, then verify with a code.');
});

// ─── Confirm 2FA Setup ───────────────────────────────────
exports.confirm2FA = catchAsync(async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user._id).select('+twoFactorSecret');

  if (!user.twoFactorSecret) {
    return sendError(res, 400, 'Please initiate 2FA setup first');
  }

  const isValid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 2,
  });

  if (!isValid) {
    return sendError(res, 400, 'Invalid verification code. Please try again.');
  }

  user.twoFactorEnabled = true;
  await user.save({ validateBeforeSave: false });

  await ActivityLog.create({
    user: user._id,
    action: '2FA_ENABLED',
    details: 'Two-factor authentication enabled',
    ipAddress: req.ip,
  });

  sendSuccess(res, 200, null, 'Two-factor authentication enabled successfully');
});

// ─── Disable 2FA ─────────────────────────────────────────
exports.disable2FA = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(req.body.password))) {
    return sendError(res, 401, 'Incorrect password');
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorBackupCodes = undefined;
  await user.save({ validateBeforeSave: false });

  await ActivityLog.create({
    user: user._id,
    action: '2FA_DISABLED',
    details: 'Two-factor authentication disabled',
    ipAddress: req.ip,
  });

  sendSuccess(res, 200, null, 'Two-factor authentication disabled');
});

// ─── Resend Email Verification ───────────────────────────
exports.resendVerification = catchAsync(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return sendSuccess(res, 200, null, 'If an account exists, a verification email has been sent.');
  }

  if (user.isEmailVerified) {
    return sendError(res, 400, 'Email is already verified');
  }

  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify Your Email - Loan Management System',
    html: emailVerificationTemplate(user.firstName, verificationUrl),
  });

  sendSuccess(res, 200, null, 'Verification email sent');
});
