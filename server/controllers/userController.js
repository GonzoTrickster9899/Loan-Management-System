const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { ROLES } = require('../config/roles');
const { catchAsync, sendSuccess, sendError } = require('../utils/apiHelpers');

// ─── Get All Users ────────────────────────────────────────
exports.getAllUsers = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    role = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (role && Object.values(ROLES).includes(role)) {
    query.role = role;
  }

  if (status === 'active') query.isActive = true;
  if (status === 'inactive') query.isActive = false;
  if (status === 'verified') query.isEmailVerified = true;
  if (status === 'unverified') query.isEmailVerified = false;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [users, total] = await Promise.all([
    User.find(query).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
    User.countDocuments(query),
  ]);

  sendSuccess(res, 200, {
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ─── Get Single User ──────────────────────────────────────
exports.getUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return sendError(res, 404, 'User not found');
  }
  sendSuccess(res, 200, { user });
});

// ─── Create User (Admin) ─────────────────────────────────
exports.createUser = catchAsync(async (req, res) => {
  const { firstName, lastName, email, password, role, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, 400, 'A user with this email already exists');
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: role || ROLES.CUSTOMER,
    phone: phone || '',
    isEmailVerified: true, // Admin-created users are pre-verified
  });

  await ActivityLog.create({
    user: req.user._id,
    action: 'USER_CREATED',
    details: `Admin created user: ${email} with role ${user.role}`,
    targetModel: 'User',
    targetId: user._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, 201, { user }, 'User created successfully');
});

// ─── Update User (Admin) ─────────────────────────────────
exports.updateUser = catchAsync(async (req, res) => {
  const { firstName, lastName, email, role, phone, isActive, isEmailVerified } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  // Don't allow modifying the last admin's role
  if (user.role === ROLES.ADMIN && role !== ROLES.ADMIN) {
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN, isActive: true });
    if (adminCount <= 1) {
      return sendError(res, 400, 'Cannot change the role of the last active admin');
    }
  }

  const updates = {};
  if (firstName !== undefined) updates.firstName = firstName;
  if (lastName !== undefined) updates.lastName = lastName;
  if (email !== undefined) updates.email = email;
  if (role !== undefined) updates.role = role;
  if (phone !== undefined) updates.phone = phone;
  if (isActive !== undefined) updates.isActive = isActive;
  if (isEmailVerified !== undefined) updates.isEmailVerified = isEmailVerified;

  const oldRole = user.role;
  const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  const actions = [];
  if (role && role !== oldRole) {
    actions.push(`role changed from ${oldRole} to ${role}`);
    await ActivityLog.create({
      user: req.user._id,
      action: 'ROLE_CHANGED',
      details: `Role changed from ${oldRole} to ${role} for ${updatedUser.email}`,
      targetModel: 'User',
      targetId: updatedUser._id,
      ipAddress: req.ip,
    });
  }

  await ActivityLog.create({
    user: req.user._id,
    action: 'USER_UPDATED',
    details: `Admin updated user: ${updatedUser.email}. ${actions.join(', ')}`,
    targetModel: 'User',
    targetId: updatedUser._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, 200, { user: updatedUser }, 'User updated successfully');
});

// ─── Delete User (Admin) ─────────────────────────────────
exports.deleteUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  // Don't allow deleting self
  if (user._id.toString() === req.user._id.toString()) {
    return sendError(res, 400, 'You cannot delete your own account');
  }

  // Don't allow deleting the last admin
  if (user.role === ROLES.ADMIN) {
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
    if (adminCount <= 1) {
      return sendError(res, 400, 'Cannot delete the last admin account');
    }
  }

  await User.findByIdAndDelete(req.params.id);

  await ActivityLog.create({
    user: req.user._id,
    action: 'USER_DELETED',
    details: `Admin deleted user: ${user.email}`,
    targetModel: 'User',
    targetId: user._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, 200, null, 'User deleted successfully');
});

// ─── Get User Stats ──────────────────────────────────────
exports.getUserStats = catchAsync(async (req, res) => {
  const [totalUsers, activeUsers, roleStats, recentUsers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
    User.find().sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const roleCounts = {};
  roleStats.forEach((stat) => {
    roleCounts[stat._id] = stat.count;
  });

  sendSuccess(res, 200, {
    totalUsers,
    activeUsers,
    inactiveUsers: totalUsers - activeUsers,
    roleCounts,
    recentUsers,
  });
});

// ─── Get Activity Logs ───────────────────────────────────
exports.getActivityLogs = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, action = '', userId = '' } = req.query;
  const query = {};

  if (action) query.action = action;
  if (userId) query.user = userId;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [logs, total] = await Promise.all([
    ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'firstName lastName email role')
      .lean(),
    ActivityLog.countDocuments(query),
  ]);

  sendSuccess(res, 200, {
    logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});
