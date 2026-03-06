const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation error',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  handleValidationErrors,
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

const forgotPasswordValidation = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  handleValidationErrors,
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  handleValidationErrors,
];

const updateProfileValidation = [
  body('firstName').optional().trim().isLength({ max: 50 }),
  body('lastName').optional().trim().isLength({ max: 50 }),
  body('phone').optional().trim(),
  handleValidationErrors,
];

const loanValidation = [
  body('loanType')
    .notEmpty()
    .withMessage('Loan type is required')
    .isIn(['personal', 'home', 'auto', 'business', 'education', 'other']),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 100 })
    .withMessage('Minimum amount is $100'),
  body('termMonths')
    .notEmpty()
    .withMessage('Term is required')
    .isInt({ min: 1 })
    .withMessage('Minimum term is 1 month'),
  body('purpose')
    .notEmpty()
    .withMessage('Purpose is required')
    .isLength({ max: 500 }),
  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updateProfileValidation,
  loanValidation,
  handleValidationErrors,
};
