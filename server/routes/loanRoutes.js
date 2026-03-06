const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const { protect, restrictTo, hasPermission } = require('../middleware/auth');
const { ROLES, PERMISSIONS } = require('../config/roles');
const { loanValidation } = require('../middleware/validation');

router.use(protect);

// Stats
router.get('/stats', loanController.getLoanStats);

// CRUD
router
  .route('/')
  .get(loanController.getAllLoans)
  .post(loanValidation, loanController.createLoan);

router
  .route('/:id')
  .get(loanController.getLoan)
  .patch(loanController.updateLoan)
  .delete(loanController.deleteLoan);

// Workflow actions
router.patch('/:id/submit', loanController.submitLoan);
router.patch('/:id/process', restrictTo(ROLES.ADMIN, ROLES.LOAN_OFFICER), loanController.processLoan);
router.patch('/:id/approve', restrictTo(ROLES.ADMIN, ROLES.MANAGER), loanController.approveLoan);
router.patch('/:id/reject', restrictTo(ROLES.ADMIN, ROLES.MANAGER, ROLES.LOAN_OFFICER), loanController.rejectLoan);
router.patch('/:id/disburse', restrictTo(ROLES.ADMIN, ROLES.MANAGER), loanController.disburseLoan);

// Notes
router.post('/:id/notes', loanController.addNote);

module.exports = router;
