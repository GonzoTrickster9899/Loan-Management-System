const mongoose = require('mongoose');

// ─── KYC Document Sub-Schema ──────────────────────────────
const kycDocumentSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['government_id', 'proof_of_address', 'employment_proof', 'income_proof', 'other'],
      required: true,
    },
    documentType: {
      type: String,
      required: true,
      // e.g. 'passport', 'drivers_license', 'national_id', 'utility_bill', 'payslip', etc.
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    // Store file as base64 in DB for simplicity (production: use S3/GCS)
    fileData: {
      type: String,
      select: false, // Don't return by default in queries
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: Date,
    rejectionReason: String,
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// ─── Customer Schema ──────────────────────────────────────
const customerSchema = new mongoose.Schema(
  {
    // Link to user account (if customer has registered)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    // Unique customer identifier
    customerId: {
      type: String,
      unique: true,
    },

    // ── Personal Information ────────────────────────────────
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: 50,
    },
    middleName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      required: [true, 'Gender is required'],
    },
    civilStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed', 'separated'],
      default: 'single',
    },
    nationality: {
      type: String,
      default: 'Filipino',
    },

    // ── Address Information ─────────────────────────────────
    address: {
      street: { type: String, default: '' },
      barangay: { type: String, default: '' },
      city: { type: String, default: '' },
      province: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: 'Philippines' },
    },
    permanentAddress: {
      street: { type: String, default: '' },
      barangay: { type: String, default: '' },
      city: { type: String, default: '' },
      province: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: 'Philippines' },
    },
    sameAsPermanent: {
      type: Boolean,
      default: true,
    },

    // ── Employment Information ──────────────────────────────
    employment: {
      status: {
        type: String,
        enum: ['employed', 'self_employed', 'business_owner', 'unemployed', 'retired', 'student'],
        default: 'employed',
      },
      employer: { type: String, default: '' },
      position: { type: String, default: '' },
      department: { type: String, default: '' },
      monthlyIncome: { type: Number, default: 0 },
      yearsEmployed: { type: Number, default: 0 },
      employerAddress: { type: String, default: '' },
      employerPhone: { type: String, default: '' },
      otherIncomeSource: { type: String, default: '' },
      otherIncomeAmount: { type: Number, default: 0 },
    },

    // ── KYC (Know Your Customer) ────────────────────────────
    kyc: {
      status: {
        type: String,
        enum: ['not_started', 'in_progress', 'pending_review', 'verified', 'rejected'],
        default: 'not_started',
      },
      submittedAt: Date,
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      rejectionReason: String,
      notes: { type: String, default: '' },
    },

    // ── Documents ───────────────────────────────────────────
    documents: [kycDocumentSchema],

    // ── Risk Profile ────────────────────────────────────────
    riskProfile: {
      level: {
        type: String,
        enum: ['low', 'medium', 'high', 'unassessed'],
        default: 'unassessed',
      },
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      assessedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      assessedAt: Date,
      factors: [
        {
          factor: String,
          impact: { type: String, enum: ['positive', 'negative', 'neutral'] },
          detail: String,
        },
      ],
      notes: { type: String, default: '' },
    },

    // ── Metadata ────────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [String],
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtuals ─────────────────────────────────────────────
customerSchema.virtual('fullName').get(function () {
  const middle = this.middleName ? ` ${this.middleName}` : '';
  return `${this.firstName}${middle} ${this.lastName}`;
});

customerSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
});

// Virtual: total monthly income (salary + other)
customerSchema.virtual('totalMonthlyIncome').get(function () {
  return (this.employment?.monthlyIncome || 0) + (this.employment?.otherIncomeAmount || 0);
});

// Virtual: linked loans (populated separately)
customerSchema.virtual('loans', {
  ref: 'Loan',
  localField: 'user',
  foreignField: 'borrower',
  options: { sort: { createdAt: -1 } },
});

// ── Auto-generate customerId ────────────────────────────
customerSchema.pre('validate', async function (next) {
  if (this.isNew && !this.customerId) {
    const count = await mongoose.model('Customer').countDocuments();
    this.customerId = `CUS-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// ── Indexes ──────────────────────────────────────────────
customerSchema.index({ customerId: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ 'kyc.status': 1 });
customerSchema.index({ 'riskProfile.level': 1 });
customerSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });
customerSchema.index({ createdAt: -1 });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
