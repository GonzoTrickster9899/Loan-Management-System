const User = require('../models/User');
const { verifyAccessToken } = require('../utils/tokenUtils');
const { ROLE_PERMISSIONS } = require('../config/roles');
const { AppError } = require('../utils/apiHelpers');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in cookies first, then Authorization header
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to access this resource.',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'fail',
          message: 'Token expired. Please refresh your token.',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid token. Please log in again.',
      });
    }

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        status: 'fail',
        message: 'Your account has been deactivated. Contact an administrator.',
      });
    }

    // Check if user changed password after the token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: 'fail',
        message: 'Password recently changed. Please log in again.',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Authentication error',
    });
  }
};

// Restrict to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action.',
      });
    }
    next();
  };
};

// Check for specific permission
const hasPermission = (...permissions) => {
  return (req, res, next) => {
    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const hasAllPermissions = permissions.every((p) => userPermissions.includes(p));

    if (!hasAllPermissions) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have the required permissions.',
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo, hasPermission };
