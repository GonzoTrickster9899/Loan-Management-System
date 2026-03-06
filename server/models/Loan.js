const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    loanNumber: {
      type: String,
      unique: true,
      required: true,
    },
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Borrower is required'],
    },
    loanOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    loanType: {
      type: String,
      enum: ['personal', 'home', 'auto', 'business', 'education', 'other'],
      required: [true, 'Loan type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Loan amount is required'],
      min: [100, 'Minimum loan amount is $100'],
    },
    interestRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    termMonths: {
      type: Number,
      required: [true, 'Loan term is required'],
      min: [1, 'Minimum term is 1 month'],
    },
    monthlyPayment: {
      type: Number,
      default: 0,
    },
    purpose: {
      type: String,
      required: [true, 'Loan purpose is required'],
      maxlength: [500, 'Purpose cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: [
        'draft',
        'submitted',
        'under_review',
        'approved',
        'rejected',
        'disbursed',
        'active',
        'closed',
        'defaulted',
      ],
      default: 'draft',
    },
    employmentInfo: {
      employer: { type: String, default: '' },
      position: { type: String, default: '' },
      monthlyIncome: { type: Number, default: 0 },
      yearsEmployed: { type: Number, default: 0 },
    },
    documents: [
      {
        name: String,
        type: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    statusHistory: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        comment: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],
    notes: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    rejectionReason: String,
    approvedAt: Date,
    disbursedAt: Date,
    closedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate loan number before saving
loanSchema.pre('save', async function (next) {
  if (this.isNew && !this.loanNumber) {
    const count = await mongoose.model('Loan').countDocuments();
    this.loanNumber = `LN-${String(count + 1).padStart(6, '0')}`;
  }
  // Calculate monthly payment
  if (this.amount && this.interestRate && this.termMonths) {
    const r = this.interestRate / 100 / 12;
    if (r > 0) {
      this.monthlyPayment =
        (this.amount * (r * Math.pow(1 + r, this.termMonths))) /
        (Math.pow(1 + r, this.termMonths) - 1);
    } else {
      this.monthlyPayment = this.amount / this.termMonths;
    }
    this.monthlyPayment = Math.round(this.monthlyPayment * 100) / 100;
  }
  next();
});

loanSchema.index({ borrower: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ loanOfficer: 1 });
loanSchema.index({ loanNumber: 1 });
loanSchema.index({ createdAt: -1 });

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;
