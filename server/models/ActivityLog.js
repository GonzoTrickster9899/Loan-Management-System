const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'REGISTER',
        'PASSWORD_RESET',
        'PASSWORD_CHANGE',
        'PROFILE_UPDATE',
        'EMAIL_VERIFIED',
        '2FA_ENABLED',
        '2FA_DISABLED',
        'LOAN_CREATED',
        'LOAN_UPDATED',
        'LOAN_SUBMITTED',
        'LOAN_REVIEWED',
        'LOAN_APPROVED',
        'LOAN_REJECTED',
        'LOAN_DISBURSED',
        'USER_CREATED',
        'USER_UPDATED',
        'USER_DELETED',
        'ROLE_CHANGED',
      ],
    },
    details: {
      type: String,
      default: '',
    },
    targetModel: {
      type: String,
      enum: ['User', 'Loan', null],
      default: null,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
