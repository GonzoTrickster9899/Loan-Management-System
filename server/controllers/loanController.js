const Loan = require('../models/Loan');
const ActivityLog = require('../models/ActivityLog');
const { ROLES } = require('../config/roles');
const { catchAsync, sendSuccess, sendError } = require('../utils/apiHelpers');

// ─── Create Loan ──────────────────────────────────────────
exports.createLoan = catchAsync(async (req, res) => {
  const loanData = {
    ...req.body,
    borrower: req.user.role === ROLES.CUSTOMER ? req.user._id : req.body.borrower || req.user._id,
    statusHistory: [
      {
        status: 'draft',
        changedBy: req.user._id,
        comment: 'Loan application created',
      },
    ],
  };

  const loan = await Loan.create(loanData);

  await ActivityLog.create({
    user: req.user._id,
    action: 'LOAN_CREATED',
    details: `Loan ${loan.loanNumber} created for $${loan.amount}`,
    targetModel: 'Loan',
    targetId: loan._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, 201, { loan }, 'Loan application created');
});

// ─── Get All Loans ────────────────────────────────────────
exports.getAllLoans = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status = '',
    loanType = '',
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const query = {};

  // Customers can only see their own loans
  if (req.user.role === ROLES.CUSTOMER) {
    query.borrower = req.user._id;
  }

  if (status) query.status = status;
  if (loanType) query.loanType = loanType;
  if (search) {
    query.$or = [
      { loanNumber: { $regex: search, $options: 'i' } },
      { purpose: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [loans, total] = await Promise.all([
    Loan.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('borrower', 'firstName lastName email')
      .populate('loanOfficer', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .lean(),
    Loan.countDocuments(query),
  ]);

  sendSuccess(res, 200, {
    loans,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ─── Get Single Loan ──────────────────────────────────────
exports.getLoan = catchAsync(async (req, res) => {
  const loan = await Loan.findById(req.params.id)
    .populate('borrower', 'firstName lastName email phone address')
    .populate('loanOfficer', 'firstName lastName email')
    .populate('approvedBy', 'firstName lastName email')
    .populate('statusHistory.changedBy', 'firstName lastName')
    .populate('notes.author', 'firstName lastName');

  if (!loan) {
    return sendError(res, 404, 'Loan not found');
  }

  // Customers can only view their own loans
  if (req.user.role === ROLES.CUSTOMER && loan.borrower._id.toString() !== req.user._id.toString()) {
    return sendError(res, 403, 'You can only view your own loans');
  }

  sendSuccess(res, 200, { loan });
});

// ─── Update Loan ──────────────────────────────────────────
exports.updateLoan = catchAsync(async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) {
    return sendError(res, 404, 'Loan not found');
  }

  // Only allow editing draft or submitted loans
  if (!['draft', 'submitted'].includes(loan.status) && req.user.role === ROLES.CUSTOMER) {
    return sendError(res, 400, 'Cannot edit a loan that is being processed');
  }

  const allowedFields = ['loanType', 'amount', 'termMonths', 'purpose', 'interestRate', 'employmentInfo'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  Object.assign(loan, updates);
  await loan.save();

  await ActivityLog.create({
    user: req.user._id,
    action: 'LOAN_UPDATED',
    details: `Loan ${loan.loanNumber} updated`,
    targetModel: 'Loan',
    targetId: loan._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, 200, { loan }, 'Loan updated');
});

// ─── Submit Loan ──────────────────────────────────────────
exports.submitLoan = catchAsync(async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) return sendError(res, 404, 'Loan not found');
  if (loan.status !== 'draft') return sendError(res, 400, 'Only draft loans can be submitted');

  loan.status = 'submitted';
  loan.statusHistory.push({
    status: 'submitted',
    changedBy: req.user._id,
    comment: 'Application submitted for review',
  });
  await loan.save();

  await ActivityLog.create({
    user: req.user._id,
    action: 'LOAN_SUBMITTED',
    details: `Loan ${loan.loanNumber} submitted`,
    targetModel: 'Loan',
    targetId: loan._id,
  });

  sendSuccess(res, 200, { loan }, 'Loan submitted for review');
});

// ─── Process Loan (Loan Officer) ─────────────────────────
exports.processLoan = catchAsync(async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) return sendError(res, 404, 'Loan not found');
  if (loan.status !== 'submitted') return sendError(res, 400, 'Only submitted loans can be processed');

  loan.status = 'under_review';
  loan.loanOfficer = req.user._id;
  loan.interestRate = req.body.interestRate || loan.interestRate;
  loan.statusHistory.push({
    status: 'under_review',
    changedBy: req.user._id,
    comment: req.body.comment || 'Loan under review by officer',
  });
  await loan.save();

  await ActivityLog.create({
    user: req.user._id,
    action: 'LOAN_REVIEWED',
    details: `Loan ${loan.loanNumber} is under review`,
    targetModel: 'Loan',
    targetId: loan._id,
  });

  sendSuccess(res, 200, { loan }, 'Loan is now under review');
});

// ─── Approve Loan (Manager) ──────────────────────────────
exports.approveLoan = catchAsync(async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) return sendError(res, 404, 'Loan not found');
  if (loan.status !== 'under_review') return sendError(res, 400, 'Only reviewed loans can be approved');

  loan.status = 'approved';
  loan.approvedBy = req.user._id;
  loan.approvedAt = new Date();
  loan.statusHistory.push({
    status: 'approved',
    changedBy: req.user._id,
    comment: req.body.comment || 'Loan approved',
  });
  await loan.save();

  await ActivityLog.create({
    user: req.user._id,
    action: 'LOAN_APPROVED',
    details: `Loan ${loan.loanNumber} approved`,
    targetModel: 'Loan',
    targetId: loan._id,
  });

  sendSuccess(res, 200, { loan }, 'Loan approved');
});

// ─── Reject Loan ─────────────────────────────────────────
exports.rejectLoan = catchAsync(async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) return sendError(res, 404, 'Loan not found');
  if (!['under_review', 'submitted'].includes(loan.status)) {
    return sendError(res, 400, 'This loan cannot be rejected at its current stage');
  }

  loan.status = 'rejected';
  loan.rejectionReason = req.body.reason || 'Application does not meet requirements';
  loan.statusHistory.push({
    status: 'rejected',
    changedBy: req.user._id,
    comment: req.body.reason || 'Loan rejected',
  });
  await loan.save();

  await ActivityLog.create({
    user: req.user._id,
    action: 'LOAN_REJECTED',
    details: `Loan ${loan.loanNumber} rejected: ${loan.rejectionReason}`,
    targetModel: 'Loan',
    targetId: loan._id,
  });

  sendSuccess(res, 200, { loan }, 'Loan rejected');
});

// ─── Disburse Loan ───────────────────────────────────────
exports.disburseLoan = catchAsync(async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) return sendError(res, 404, 'Loan not found');
  if (loan.status !== 'approved') return sendError(res, 400, 'Only approved loans can be disbursed');

  loan.status = 'disbursed';
  loan.disbursedAt = new Date();
  loan.statusHistory.push({
    status: 'disbursed',
    changedBy: req.user._id,
    comment: 'Loan disbursed',
  });
  await loan.save();

  await ActivityLog.create({
    user: req.user._id,
    action: 'LOAN_DISBURSED',
    details: `Loan ${loan.loanNumber} disbursed`,
    targetModel: 'Loan',
    targetId: loan._id,
  });

  sendSuccess(res, 200, { loan }, 'Loan disbursed');
});

// ─── Add Note to Loan ────────────────────────────────────
exports.addNote = catchAsync(async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) return sendError(res, 404, 'Loan not found');

  loan.notes.push({
    author: req.user._id,
    content: req.body.content,
  });
  await loan.save();

  sendSuccess(res, 200, { loan }, 'Note added');
});

// ─── Delete Loan ─────────────────────────────────────────
exports.deleteLoan = catchAsync(async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) return sendError(res, 404, 'Loan not found');

  if (loan.status !== 'draft' && req.user.role !== ROLES.ADMIN) {
    return sendError(res, 400, 'Only draft loans can be deleted');
  }

  await Loan.findByIdAndDelete(req.params.id);

  sendSuccess(res, 200, null, 'Loan deleted');
});

// ─── Loan Stats (Dashboard) ─────────────────────────────
exports.getLoanStats = catchAsync(async (req, res) => {
  const matchStage = {};
  if (req.user.role === ROLES.CUSTOMER) {
    matchStage.borrower = req.user._id;
  }

  const [statusStats, typeStats, totalAmount, recentLoans] = await Promise.all([
    Loan.aggregate([
      { $match: matchStage },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]),
    Loan.aggregate([
      { $match: matchStage },
      { $group: { _id: '$loanType', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]),
    Loan.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Loan.find(matchStage)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('borrower', 'firstName lastName')
      .lean(),
  ]);

  sendSuccess(res, 200, {
    statusStats,
    typeStats,
    totalAmount: totalAmount[0]?.total || 0,
    totalLoans: totalAmount[0]?.count || 0,
    recentLoans,
  });
});
