const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.NODE_ENV === 'development') {
    // In development, log emails to console
    return {
      sendMail: async (mailOptions) => {
        console.log('\n📧 ═══════════════════════════════════════');
        console.log('  EMAIL SENT (Development Mode)');
        console.log('═══════════════════════════════════════');
        console.log(`  To:      ${mailOptions.to}`);
        console.log(`  Subject: ${mailOptions.subject}`);
        console.log(`  Body:    ${mailOptions.text || '(HTML email)'}`);
        console.log('═══════════════════════════════════════\n');
        return { messageId: 'dev-' + Date.now() };
      },
    };
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Email could not be sent');
  }
};

module.exports = { sendEmail };
