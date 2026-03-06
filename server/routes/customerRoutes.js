const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect, restrictTo } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

router.use(protect);

// Stats (admin, officer)
router.get('/stats', restrictTo(ROLES.ADMIN, ROLES.LOAN_OFFICER), customerController.getCustomerStats);

// Current customer's own profile
router.get('/my-profile', restrictTo(ROLES.CUSTOMER), customerController.getMyProfile);

// CRUD
router
  .route('/')
  .get(restrictTo(ROLES.ADMIN, ROLES.LOAN_OFFICER, ROLES.MANAGER), customerController.getAllCustomers)
  .post(customerController.createCustomer);

router
  .route('/:id')
  .get(customerController.getCustomer)
  .patch(customerController.updateCustomer)
  .delete(restrictTo(ROLES.ADMIN), customerController.deleteCustomer);

// KYC
router.patch('/:id/kyc/submit', customerController.submitKYC);
router.patch('/:id/kyc/review', restrictTo(ROLES.ADMIN, ROLES.LOAN_OFFICER), customerController.reviewKYC);

// Documents
router.post('/:id/documents', customerController.uploadDocument);
router.get('/:id/documents/:docId', customerController.getDocumentFile);
router.delete('/:id/documents/:docId', customerController.deleteDocument);
router.patch(
  '/:id/documents/:docId/review',
  restrictTo(ROLES.ADMIN, ROLES.LOAN_OFFICER),
  customerController.reviewDocument
);

// Risk Profile
router.patch(
  '/:id/risk-profile',
  restrictTo(ROLES.ADMIN, ROLES.LOAN_OFFICER, ROLES.MANAGER),
  customerController.updateRiskProfile
);

// Loan History
router.get('/:id/loan-history', customerController.getCustomerLoanHistory);

module.exports = router;
