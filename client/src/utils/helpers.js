export const ROLES = {
  ADMIN: 'admin',
  LOAN_OFFICER: 'loan_officer',
  MANAGER: 'manager',
  CUSTOMER: 'customer',
};

export const ROLE_LABELS = {
  admin: 'Admin',
  loan_officer: 'Loan Officer',
  manager: 'Manager / Approver',
  customer: 'Customer / Borrower',
};

export const ROLE_COLORS = {
  admin: 'badge-error',
  loan_officer: 'badge-info',
  manager: 'badge-warning',
  customer: 'badge-success',
};

export const LOAN_STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  disbursed: 'Disbursed',
  active: 'Active',
  closed: 'Closed',
  defaulted: 'Defaulted',
};

export const LOAN_STATUS_COLORS = {
  draft: 'badge-ghost',
  submitted: 'badge-info',
  under_review: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-error',
  disbursed: 'badge-primary',
  active: 'badge-accent',
  closed: 'badge-neutral',
  defaulted: 'badge-error',
};

export const LOAN_TYPES = {
  personal: 'Personal',
  home: 'Home',
  auto: 'Auto',
  business: 'Business',
  education: 'Education',
  other: 'Other',
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export const hasPermission = (userRole, allowedRoles) => {
  return allowedRoles.includes(userRole);
};

// ─── Customer / KYC Constants ─────────────────────────────

export const KYC_STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  pending_review: 'Pending Review',
  verified: 'Verified',
  rejected: 'Rejected',
};

export const KYC_STATUS_COLORS = {
  not_started: 'badge-ghost',
  in_progress: 'badge-info',
  pending_review: 'badge-warning',
  verified: 'badge-success',
  rejected: 'badge-error',
};

export const RISK_LEVEL_LABELS = {
  unassessed: 'Unassessed',
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
};

export const RISK_LEVEL_COLORS = {
  unassessed: 'badge-ghost',
  low: 'badge-success',
  medium: 'badge-warning',
  high: 'badge-error',
};

export const GENDER_LABELS = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer Not to Say',
};

export const CIVIL_STATUS_LABELS = {
  single: 'Single',
  married: 'Married',
  divorced: 'Divorced',
  widowed: 'Widowed',
  separated: 'Separated',
};

export const EMPLOYMENT_STATUS_LABELS = {
  employed: 'Employed',
  self_employed: 'Self-Employed',
  business_owner: 'Business Owner',
  unemployed: 'Unemployed',
  retired: 'Retired',
  student: 'Student',
};

export const DOC_CATEGORY_LABELS = {
  government_id: 'Government ID',
  proof_of_address: 'Proof of Address',
  employment_proof: 'Employment Proof',
  income_proof: 'Income Proof',
  other: 'Other',
};

export const DOC_TYPE_OPTIONS = {
  government_id: ['Passport', 'Drivers License', 'National ID', 'SSS ID', 'PhilHealth ID', 'Postal ID', 'Voters ID', 'PRC ID'],
  proof_of_address: ['Utility Bill', 'Bank Statement', 'Barangay Certificate', 'Lease Agreement'],
  employment_proof: ['Certificate of Employment', 'Company ID', 'Business Permit', 'DTI Registration'],
  income_proof: ['Payslip', 'ITR', 'Bank Statement', 'Remittance Receipt'],
  other: ['Other Document'],
};

export const DOC_STATUS_COLORS = {
  pending: 'badge-warning',
  verified: 'badge-success',
  rejected: 'badge-error',
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
