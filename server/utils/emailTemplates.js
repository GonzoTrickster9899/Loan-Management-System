const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 24px; margin-bottom: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%); padding: 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
    .header p { color: #bee3f8; margin: 8px 0 0; font-size: 14px; }
    .body { padding: 32px; color: #2d3748; line-height: 1.6; }
    .body h2 { color: #1a365d; margin-top: 0; }
    .btn { display: inline-block; padding: 14px 32px; background: #2b6cb0; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 16px 0; }
    .btn:hover { background: #2c5282; }
    .footer { padding: 24px 32px; background: #f7fafc; text-align: center; color: #718096; font-size: 12px; border-top: 1px solid #e2e8f0; }
    .code { background: #edf2f7; padding: 16px 24px; border-radius: 8px; font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; color: #1a365d; margin: 16px 0; }
    .warning { background: #fffff0; border-left: 4px solid #ecc94b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏦 Loan Management System</h1>
      <p>Secure • Reliable • Professional</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Loan Management System. All rights reserved.</p>
      <p>This is an automated message. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>
`;

const emailVerificationTemplate = (name, verificationUrl) => {
  return baseTemplate(`
    <h2>Welcome, ${name}! 👋</h2>
    <p>Thank you for registering with our Loan Management System. To complete your registration and activate your account, please verify your email address.</p>
    <div style="text-align: center;">
      <a href="${verificationUrl}" class="btn">Verify Email Address</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #2b6cb0; font-size: 13px;">${verificationUrl}</p>
    <div class="warning">
      <strong>⏰ This link expires in 24 hours.</strong> If you didn't create an account, please ignore this email.
    </div>
  `);
};

const passwordResetTemplate = (name, resetUrl) => {
  return baseTemplate(`
    <h2>Password Reset Request</h2>
    <p>Hello ${name},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #2b6cb0; font-size: 13px;">${resetUrl}</p>
    <div class="warning">
      <strong>⏰ This link expires in 1 hour.</strong> If you didn't request this reset, please change your password immediately and contact support.
    </div>
  `);
};

const otpTemplate = (name, otp) => {
  return baseTemplate(`
    <h2>Your Verification Code</h2>
    <p>Hello ${name},</p>
    <p>Your one-time password for two-factor authentication is:</p>
    <div class="code">${otp}</div>
    <div class="warning">
      <strong>⏰ This code expires in 10 minutes.</strong> Do not share this code with anyone.
    </div>
  `);
};

const welcomeTemplate = (name, role) => {
  return baseTemplate(`
    <h2>Welcome to the Team! 🎉</h2>
    <p>Hello ${name},</p>
    <p>Your email has been verified and your account is now active. Here's a summary of your account:</p>
    <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 0; color: #718096;">Role:</td><td style="padding: 8px 0; font-weight: 600;">${role}</td></tr>
    </table>
    <p>You can now log in and start using the system.</p>
    <div style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/login" class="btn">Go to Login</a>
    </div>
  `);
};

const loanStatusTemplate = (name, loanNumber, status, comment) => {
  const statusColors = {
    approved: '#38a169',
    rejected: '#e53e3e',
    under_review: '#dd6b20',
    disbursed: '#2b6cb0',
  };
  const color = statusColors[status] || '#2b6cb0';

  return baseTemplate(`
    <h2>Loan Application Update</h2>
    <p>Hello ${name},</p>
    <p>Your loan application <strong>${loanNumber}</strong> has been updated:</p>
    <div style="text-align:center; margin: 24px 0;">
      <span style="display:inline-block; padding:8px 24px; background:${color}; color:#fff; border-radius:20px; font-weight:600; text-transform:uppercase; font-size:14px;">${status.replace('_', ' ')}</span>
    </div>
    ${comment ? `<p><strong>Comments:</strong> ${comment}</p>` : ''}
    <div style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/dashboard" class="btn">View Details</a>
    </div>
  `);
};

module.exports = {
  emailVerificationTemplate,
  passwordResetTemplate,
  otpTemplate,
  welcomeTemplate,
  loanStatusTemplate,
};
