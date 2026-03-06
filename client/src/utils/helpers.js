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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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
