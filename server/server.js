const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const loanRoutes = require('./routes/loanRoutes');
const customerRoutes = require('./routes/customerRoutes');

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// ─── Security Middleware ──────────────────────────────────
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { status: 'fail', message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: 'fail', message: 'Too many authentication attempts. Try again in 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Body Parsing ─────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ─── CORS ─────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Logging ──────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── API Routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/customers', customerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Loan Management API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── Serve Frontend in Production ─────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist/index.html'));
  });
}

// ─── 404 Handler ──────────────────────────────────────────
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Error Handler ────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥', err.name, err.message);
  process.exit(1);
});

module.exports = app;
