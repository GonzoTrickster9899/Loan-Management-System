const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const ActivityLog = require('../models/ActivityLog');
const { ROLES } = require('../config/roles');
const { catchAsync, sendSuccess, sendError } = require('../utils/apiHelpers');

// ─── Create Customer ──────────────────────────────────────
exports.createCustomer = catchAsync(async (req, res) => {
  const customerData = {
    ...req.body,
    createdBy: req.user._id,
  };

  // If customer role creates own profile, link to user account
  if (req.user.role === ROLES.CUSTOMER) {
    customerData.user = req.user._id;
    customerData.firstName = customerData.firstName || req.user.firstName;
    customerData.lastName = customerData.lastName || req.user.lastName;
    customerData.email = customerData.email || req.user.email;
  }

  const customer = await Customer.create(customerData);

  await ActivityLog.create({
    user: req.user._id,
    action: 'USER_CREATED',
    details: `Customer profile ${customer.customerId} created for ${customer.firstName} ${customer.lastName}`,
    targetModel: 'User',
    targetId: customer._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, 201, { customer }, 'Customer profile created successfully');
});

// ─── Get All Customers ────────────────────────────────────
exports.getAllCustomers = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    kycStatus = '',
    riskLevel = '',
    isActive = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const query = {};

  // Customers can only see their own profile
  if (req.user.role === ROLES.CUSTOMER) {
    query.user = req.user._id;
  }

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { customerId: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  if (kycStatus) query['kyc.status'] = kycStatus;
  if (riskLevel) query['riskProfile.level'] = riskLevel;
  if (isActive === 'true') query.isActive = true;
  if (isActive === 'false') query.isActive = false;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [customers, total] = await Promise.all([
    Customer.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'firstName lastName')
      .populate('kyc.verifiedBy', 'firstName lastName')
      .lean(),
    Customer.countDocuments(query),
  ]);

  sendSuccess(res, 200, {
    customers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ─── Get Single Customer ──────────────────────────────────
exports.getCustomer = catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.params.id)
    .populate('user', 'firstName lastName email role isActive')
    .populate('createdBy', 'firstName lastName')
    .populate('kyc.verifiedBy', 'firstName lastName')
    .populate('riskProfile.assessedBy', 'firstName lastName')
    .populate('documents.verifiedBy', 'firstName lastName');

  if (!customer) {
    return sendError(res, 404, 'Customer not found');
  }

  // Customers can only view their own profile
  if (req.user.role === ROLES.CUSTOMER && customer.user?.toString() !== req.user._id.toString()) {
    return sendError(res, 403, 'You can only view your own profile');
  }

  sendSuccess(res, 200, { customer });
});

// ─── Update Customer ──────────────────────────────────────
exports.updateCustomer = catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return sendError(res, 404, 'Customer not found');
  }

  // Customers can only update their own profile
  if (req.user.role === ROLES.CUSTOMER && customer.user?.toString() !== req.user._id.toString()) {
    return sendError(res, 403, 'You can only edit your own profile');
  }

  // Fields that can be updated
  const allowedFields = [
    'firstName', 'lastName', 'middleName', 'email', 'phone', 'alternatePhone',
    'dateOfBirth', 'gender', 'civilStatus', 'nationality',
    'address', 'permanentAddress', 'sameAsPermanent',
    'employment', 'notes', 'tags', 'isActive',
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })
    .populate('user', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName');

  await ActivityLog.create({
    user: req.user._id,
    action: 'USER_UPDATED',
    details: `Customer profile ${customer.customerId} updated`,
    targetModel: 'User',
    targetId: customer._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, 200, { customer: updatedCustomer }, 'Customer profile updated');
});

// ─── Delete Customer ──────────────────────────────────────
exports.deleteCustomer = catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return sendError(res, 404, 'Customer not found');
  }

  // Check for active loans
  if (customer.user) {
    const activeLoans = await Loan.countDocuments({
      borrower: customer.user,
      status: { $in: ['submitted', 'under_review', 'approved', 'disbursed', 'active'] },
    });
    if (activeLoans > 0) {
      return sendError(res, 400, 'Cannot delete customer with active loans');
    }
  }

  await Customer.findByIdAndDelete(req.params.id);

  await ActivityLog.create({
    user: req.user._id,
    action: 'USER_DELETED',
    details: `Customer profile ${customer.customerId} deleted`,
    targetModel: 'User',
    targetId: customer._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, 200, null, 'Customer deleted');
});

// ═══════════════════════════════════════════════════════════
// KYC VERIFICATION
// ═══════════════════════════════════════════════════════════

// ─── Upload KYC Document ──────────────────────────────────
exports.uploadDocument = catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return sendError(res, 404, 'Customer not found');
  }

  const { category, documentType, fileName, originalName, mimeType, fileSize, fileData, notes } = req.body;

  if (!category || !documentType || !fileData) {
    return sendError(res, 400, 'Category, document type, and file data are required');
  }

  // Validate file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(mimeType)) {
    return sendError(res, 400, 'Only PDF, JPG, and PNG files are allowed');
  }

  // Validate file size (5MB max)
  if (fileSize > 5 * 1024 * 1024) {
    return sendError(res, 400, 'File size must not exceed 5MB');
  }

  const document = {
    category,
    documentType,
    fileName: fileName || `${category}_${Date.now()}`,
    originalName,
    mimeType,
    fileSize,
    fileData,
    notes: notes || '',
    status: 'pending',
  };

  customer.documents.push(document);

  // Update KYC status if it was not_started
  if (customer.kyc.status === 'not_started') {
    customer.kyc.status = 'in_progress';
  }

  await customer.save();

  // Return without fileData
  const savedDoc = customer.documents[customer.documents.length - 1].toObject();
  delete savedDoc.fileData;

  sendSuccess(res, 201, { document: savedDoc }, 'Document uploaded successfully');
});

// ─── Get Document File (for download/viewing) ────────────
exports.getDocumentFile = catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.params.id).select('+documents.fileData');
  if (!customer) {
    return sendError(res, 404, 'Customer not found');
  }

  const doc = customer.documents.id(req.params.docId);
  if (!doc) {
    return sendError(res, 404, 'Document not found');
  }

  // Return base64 file data
  sendSuccess(res, 200, {
    document: {
      _id: doc._id,
      category: doc.category,
      documentType: doc.documentType,
      fileName: doc.fileName,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      fileData: doc.fileData,
      status: doc.status,
    },
  });
});

// ─── Delete Document ──────────────────────────────────────
exports.deleteDocument = catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return sendError(res, 404, 'Customer not found');
  }

  const doc = customer.documents.id(req.params.docId);
  if (!doc) {
    return sendError(res, 404, 'Document not found');
  }

  if (doc.status === 'verified') {
    return sendError(res, 400, 'Cannot delete a verified document');
  }

  customer.documents.pull(req.params.docId);
  await customer.save();

  sendSuccess(res, 200, null, 'Document deleted');
});

// ─── Verify / Reject Document ────────────────────────────
exports.reviewDocument = catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return sendError(res, 404, 'Customer not found');
  }

  const doc = customer.documents.id(req.params.docId);
  if (!doc) {
    return sendError(res, 404, 'Document not found');
  }

  const { action, rejectionReason, notes } = req.body;

  if (!['verify', 'reject'].includes(action)) {
    return sendError(res, 400, 'Action must be "verify" or "reject"');
  }

  if (action === 'verify') {
    doc.status = 'verified';
    doc.verifiedBy = req.user._id;
    doc.verifiedAt = new Date();
    if (notes) doc.notes = notes;
  } else {
    doc.status = 'rejected';
    doc.rejectionReason = rejectionReason || 'Document does not meet requirements';
    if (notes) doc.notes = notes;
  }

  await customer.save();

  sendSuccess(res, 200, { document: doc }, `Document ${action === 'verify' ? 'verified' : 'rejected'}`);
});

// ─── Submit KYC for Review ───────────────────────────────
exports.submitKYC = catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return sendError(res, 404, 'Customer not found');
  }

  // Check minimum documents
  const hasGovernmentId = customer.documents.some((d) => d.category === 'government_id');
  if (!hasGovernmentId) {
    return sendError(res, 400, 'At least one government-issued ID is required for KYC submission');
  }

  customer.kyc.status = 'pending_review';
  customer.kyc.submittedAt = new Date();
  await customer.save();

  sendSuccess(res, 200, { customer }, 'KYC submitted for review');
});

// ─── Verify / Reject KYC ────────────────────────────────
exports.reviewKYC = catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return sendError(res, 404, 'Customer not found');
  }

  const { action, rejectionReason, notes } = req.body;

  if (!['verify', 'reject'].includes(action)) {
    return sendError(res, 400, 'Action must be "verify" or "reject"');
  }

  if (action === 'verify') {
    customer.kyc.status = 'verified';
    customer.kyc.verifiedAt = new Date();
    customer.kyc.verifiedBy = req.user._id;
    if (notes) customer.kyc.notes = notes;
  } else {
    customer.kyc.status = 'rejected';
    customer.kyc.rejectionReason = rejectionReason || 'KYC does not meet requirements';
    if (notes) customer.kyc.notes = notes;
  }

  await customer.save();

  await ActivityLog.create({
    user: req.user._id,
    action: 'USER_UPDATED',
    details: `KYC ${action === 'verify' ? 'verified' : 'rejected'} for ${customer.customerId}`,
    targetModel: 'User',
    targetId: customer._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, 200, { customer }, `KYC ${action === 'verify' ? 'verified' : 'rejected'}`);
});

// ═══════════════════════════════════════════════════════════
// RISK PROFILE
// ═══════════════════════════════════════════════════════════

exports.updateRiskProfile = catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return sendError(res, 404, 'Customer not found');
  }

  const { level, score, factors, notes } = req.body;

  if (!level || !['low', 'medium', 'high'].includes(level)) {
    return sendError(res, 400, 'Valid risk level is required (low, medium, high)');
  }

  customer.riskProfile = {
    level,
    score: score || customer.riskProfile.score,
    assessedBy: req.user._id,
    assessedAt: new Date(),
    factors: factors || customer.riskProfile.factors,
    notes: notes || customer.riskProfile.notes,
  };

  await customer.save();

  await ActivityLog.create({
    user: req.user._id,
    action: 'USER_UPDATED',
    details: `Risk profile updated to "${level}" for ${customer.customerId}`,
    targetModel: 'User',
    targetId: customer._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, 200, { customer }, 'Risk profile updated');
});

// ═══════════════════════════════════════════════════════════
// CUSTOMER LOAN HISTORY
// ═══════════════════════════════════════════════════════════

exports.getCustomerLoanHistory = catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return sendError(res, 404, 'Customer not found');
  }

  if (!customer.user) {
    return sendSuccess(res, 200, { loans: [], summary: { total: 0 } }, 'No linked user account');
  }

  const loans = await Loan.find({ borrower: customer.user })
    .sort({ createdAt: -1 })
    .populate('loanOfficer', 'firstName lastName')
    .populate('approvedBy', 'firstName lastName')
    .lean();

  // Build summary
  const summary = {
    total: loans.length,
    totalAmountBorrowed: loans.reduce((sum, l) => sum + (l.amount || 0), 0),
    activeLoans: loans.filter((l) => ['approved', 'disbursed', 'active'].includes(l.status)).length,
    completedLoans: loans.filter((l) => l.status === 'closed').length,
    rejectedLoans: loans.filter((l) => l.status === 'rejected').length,
    defaultedLoans: loans.filter((l) => l.status === 'defaulted').length,
    statusBreakdown: {},
  };

  loans.forEach((l) => {
    summary.statusBreakdown[l.status] = (summary.statusBreakdown[l.status] || 0) + 1;
  });

  sendSuccess(res, 200, { loans, summary });
});

// ═══════════════════════════════════════════════════════════
// STATS & DASHBOARD
// ═══════════════════════════════════════════════════════════

exports.getCustomerStats = catchAsync(async (req, res) => {
  const [
    totalCustomers,
    activeCustomers,
    kycStats,
    riskStats,
    recentCustomers,
  ] = await Promise.all([
    Customer.countDocuments(),
    Customer.countDocuments({ isActive: true }),
    Customer.aggregate([
      { $group: { _id: '$kyc.status', count: { $sum: 1 } } },
    ]),
    Customer.aggregate([
      { $group: { _id: '$riskProfile.level', count: { $sum: 1 } } },
    ]),
    Customer.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('customerId firstName lastName email kyc.status riskProfile.level createdAt')
      .lean(),
  ]);

  const kycCounts = {};
  kycStats.forEach((s) => { kycCounts[s._id] = s.count; });

  const riskCounts = {};
  riskStats.forEach((s) => { riskCounts[s._id] = s.count; });

  sendSuccess(res, 200, {
    totalCustomers,
    activeCustomers,
    inactiveCustomers: totalCustomers - activeCustomers,
    kycCounts,
    riskCounts,
    recentCustomers,
  });
});

// ─── Get My Customer Profile (for customer role) ─────────
exports.getMyProfile = catchAsync(async (req, res) => {
  const customer = await Customer.findOne({ user: req.user._id })
    .populate('createdBy', 'firstName lastName')
    .populate('kyc.verifiedBy', 'firstName lastName');

  if (!customer) {
    return sendSuccess(res, 200, { customer: null }, 'No customer profile found');
  }

  sendSuccess(res, 200, { customer });
});
