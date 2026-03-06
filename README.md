# 🏦 LoanVault — Loan Management System

A full-stack **MERN** (MongoDB, Express, React, Node.js) Loan Management System with **DaisyUI** for the UI layer. Features secure authentication, role-based access control (RBAC), two-factor authentication (2FA), a complete loan application workflow, and comprehensive customer (borrower) management with KYC verification.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Configuration](#-environment-configuration)
- [Running the Application](#-running-the-application)
- [Demo Accounts](#-demo-accounts)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Security Features](#-security-features)
- [Production Deployment](#-production-deployment)

---

## ✨ Features

### 🔐 User & Role Management
- **User Authentication**: Registration, login/logout, session management with JWT (access + refresh tokens)
- **Email Verification**: Account activation via email verification links
- **Password Reset**: Secure password recovery via email
- **Multi-Role Access**:
  - **Admin** — Full system access, user management, configuration, reporting
  - **Loan Officer** — Manage/evaluate/process loan applications, verify KYC
  - **Manager/Approver** — Review and approve/reject loan applications, assess risk
  - **Customer/Borrower** — Submit applications, view loan status, create borrower profile
- **RBAC**: Fine-grained role-based access control with permission mapping
- **Two-Factor Authentication (2FA)**: Optional TOTP via authenticator apps (Google Authenticator, Authy, etc.) with backup codes
- **Account Security**: Password hashing (bcrypt, 12 rounds), account lockout after 5 failed attempts, rate limiting

### 👤 Customer (Borrower) Management
- **Customer Profile Creation**
  - Detailed borrower profiles with personal information (name, email, phone, DOB, gender, civil status, nationality)
  - Multi-step creation form with validation
  - PH-localized address fields (barangay, province, city)
  - Current and permanent address management
- **KYC (Know Your Customer) Verification**
  - Document upload system supporting PDF, JPG, PNG (max 5MB)
  - Document categories: Government ID, Proof of Address, Employment Proof, Income Proof, Other
  - PH-specific document types: SSS ID, PhilHealth ID, Postal ID, Voters ID, PRC ID, Barangay Certificate, DTI Registration, ITR
  - Per-document verification/rejection workflow by officers
  - Overall KYC status tracking: Not Started → In Progress → Pending Review → Verified / Rejected
  - View uploaded documents in browser (images and PDFs)
- **Employment Information**
  - Employment status, employer details, position, department
  - Monthly income and years employed
  - Employer contact details
  - Other income sources
- **Customer Risk Profile**
  - Risk level categorization: Low, Medium, High
  - Risk score (0–100) with visual progress indicator
  - Risk factors tracking with positive/negative/neutral impact
  - Assessment history with officer attribution
- **Document Management**
  - Upload and store supporting documents (base64 storage)
  - Organized by category with document type classification
  - View and download uploaded files directly in browser
  - Document status tracking: Pending → Verified / Rejected
  - Rejection reasons for failed documents
- **Customer Loan History**
  - Complete record of all previous and active loans per borrower
  - Summary statistics: total loans, total borrowed, active, completed, rejected, defaulted
  - Direct links to individual loan detail pages
  - Loan details: amount, status, interest rate, term, monthly payment, dates

### 💰 Loan Management
- Multi-step loan application form with estimated monthly payment calculator (15% monthly rate)
- Loan workflow: Draft → Submitted → Under Review → Approved/Rejected → Disbursed
- Role-based loan actions (submit, process, approve, reject, disburse)
- Loan status timeline/history
- Notes system on each loan
- Search and filter loans
- Currency: Philippine Peso (₱)

### 📊 Dashboard & Reporting
- Role-specific dashboards with relevant KPIs
- Loan statistics by status and type
- Customer statistics with KYC and risk breakdowns (admin/officer)
- User distribution charts (admin)
- Activity audit logs

### 🎨 UI/UX
- DaisyUI components with custom light/dark themes
- Responsive sidebar layout with role-filtered navigation
- Theme toggle (light/dark)
- Toast notifications
- Loading states and page transition animations
- Tabbed interfaces for complex views (Customer Detail)
- Modal dialogs for document upload, KYC review, risk assessment
- Google Fonts: Outfit (headings), DM Sans (body), JetBrains Mono (code)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, TailwindCSS, DaisyUI 4, React Router 6, Axios, React Hot Toast, React Icons, Recharts |
| **Backend** | Node.js, Express 4, Mongoose 8, JWT, bcryptjs, Speakeasy (2FA), QRCode, Nodemailer |
| **Database** | MongoDB |
| **Security** | Helmet, CORS, Rate Limiting, HTTP-only Cookies, Token Rotation |

---

## 🏗 Architecture

```
Client (React + DaisyUI)  ←→  API Server (Express)  ←→  MongoDB
     ↕                              ↕
  JWT Tokens                  Nodemailer (SMTP)
  (httpOnly cookies)          Email Verification
                              Password Reset
                              2FA OTP
```

---

## 📦 Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **MongoDB** ≥ 6.0 (local or MongoDB Atlas)
- **Git**

---

## 🚀 Installation & Setup

### 1. Clone / Extract the project

```bash
# If downloaded as zip:
unzip loan-management-system.zip
cd loan-management-system
```

### 2. Install all dependencies

```bash
# Install root, server, and client dependencies
npm run install:all

# Or install individually:
npm install
cd server && npm install
cd ../client && npm install
```

### 3. Configure environment variables

```bash
# Copy the template
cp server/.env.example server/.env

# Edit with your settings
nano server/.env
```

### 4. Seed the database

```bash
cd server
npm run seed
```

This creates demo accounts (see Demo Accounts below).

### 5. Start development servers

```bash
# From root directory — starts both server and client
npm run dev

# Or start separately:
npm run server:dev    # Backend on port 5000
npm run client:dev    # Frontend on port 5173
```

### 6. Open your browser

```
http://localhost:5173
```

---

## ⚙️ Environment Configuration

Edit `server/.env`:

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB — use your connection string
MONGODB_URI=mongodb://localhost:27017/loan_management_db

# JWT — CHANGE THESE IN PRODUCTION!
JWT_SECRET=your_super_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Email (Gmail example — use App Passwords)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@loanmanagement.com
EMAIL_FROM_NAME=Loan Management System

# Client URL
CLIENT_URL=http://localhost:5173

# 2FA
TWO_FA_APP_NAME=LoanVault
```

> **Note:** In development mode, emails are logged to the console instead of being sent via SMTP.

---

## 👥 Demo Accounts

After running `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@loanmanagement.com | Admin@1234 |
| **Loan Officer** | officer@loanmanagement.com | Officer@1234 |
| **Manager** | manager@loanmanagement.com | Manager@1234 |
| **Customer** | customer@loanmanagement.com | Customer@1234 |

> Quick-fill buttons are provided on the login page.

---

## 📡 API Endpoints

### Authentication — `/api/auth`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login | No |
| POST | `/verify-2fa` | Verify 2FA code | No |
| GET | `/verify-email/:token` | Verify email | No |
| POST | `/forgot-password` | Request password reset | No |
| PATCH | `/reset-password/:token` | Reset password | No |
| POST | `/refresh` | Refresh access token | Cookie |
| POST | `/resend-verification` | Resend verification email | No |
| GET | `/me` | Get current user | Yes |
| PATCH | `/update-profile` | Update profile | Yes |
| PATCH | `/change-password` | Change password | Yes |
| POST | `/logout` | Logout | Yes |
| POST | `/2fa/enable` | Start 2FA setup | Yes |
| POST | `/2fa/confirm` | Confirm 2FA setup | Yes |
| POST | `/2fa/disable` | Disable 2FA | Yes |

### Users (Admin) — `/api/users`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all users | Admin |
| POST | `/` | Create user | Admin |
| GET | `/stats` | User statistics | Admin |
| GET | `/activity-logs` | Activity audit log | Admin |
| GET | `/:id` | Get user details | Admin |
| PATCH | `/:id` | Update user | Admin |
| DELETE | `/:id` | Delete user | Admin |

### Loans — `/api/loans`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List loans (filtered by role) | Yes |
| POST | `/` | Create loan application | Yes |
| GET | `/stats` | Loan statistics | Yes |
| GET | `/:id` | Get loan details | Yes |
| PATCH | `/:id` | Update loan | Yes |
| DELETE | `/:id` | Delete loan | Yes |
| PATCH | `/:id/submit` | Submit draft loan | Customer |
| PATCH | `/:id/process` | Start review | Officer/Admin |
| PATCH | `/:id/approve` | Approve loan | Manager/Admin |
| PATCH | `/:id/reject` | Reject loan | Manager/Officer/Admin |
| PATCH | `/:id/disburse` | Disburse loan | Manager/Admin |
| POST | `/:id/notes` | Add note | Yes |

### Customers (Borrowers) — `/api/customers`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all customers | Admin/Officer/Manager |
| POST | `/` | Create customer profile | Yes |
| GET | `/stats` | Customer statistics | Admin/Officer |
| GET | `/my-profile` | Get own customer profile | Customer |
| GET | `/:id` | Get customer details | Yes |
| PATCH | `/:id` | Update customer profile | Yes |
| DELETE | `/:id` | Delete customer | Admin |
| PATCH | `/:id/kyc/submit` | Submit KYC for review | Yes |
| PATCH | `/:id/kyc/review` | Verify or reject KYC | Admin/Officer |
| POST | `/:id/documents` | Upload KYC document | Yes |
| GET | `/:id/documents/:docId` | Get document file (base64) | Yes |
| DELETE | `/:id/documents/:docId` | Delete document | Yes |
| PATCH | `/:id/documents/:docId/review` | Verify or reject document | Admin/Officer |
| PATCH | `/:id/risk-profile` | Update risk assessment | Admin/Officer/Manager |
| GET | `/:id/loan-history` | Get customer loan history | Yes |

---

## 📁 Project Structure

```
loan-management-system/
├── package.json              # Root scripts (concurrently)
├── .gitignore
├── README.md
│
├── server/                   # Express Backend
│   ├── package.json
│   ├── server.js             # Entry point
│   ├── .env.example
│   ├── config/
│   │   ├── database.js       # MongoDB connection
│   │   ├── email.js          # Nodemailer setup
│   │   └── roles.js          # RBAC roles & permissions
│   ├── controllers/
│   │   ├── authController.js     # Auth logic (register, login, 2FA, etc.)
│   │   ├── userController.js     # Admin user management
│   │   ├── loanController.js     # Loan CRUD + workflow
│   │   └── customerController.js # Customer profiles, KYC, documents, risk
│   ├── middleware/
│   │   ├── auth.js           # JWT protection, role checks
│   │   ├── validation.js     # express-validator rules
│   │   └── errorHandler.js   # Global error handler
│   ├── models/
│   │   ├── User.js           # User schema (auth, 2FA, sessions)
│   │   ├── Loan.js           # Loan schema (workflow, history)
│   │   ├── Customer.js       # Customer schema (KYC, documents, risk profile)
│   │   └── ActivityLog.js    # Audit log schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── loanRoutes.js
│   │   └── customerRoutes.js
│   ├── seeds/
│   │   └── seedAdmin.js      # Database seeder
│   └── utils/
│       ├── apiHelpers.js     # Error class, catch async, response helpers
│       ├── tokenUtils.js     # JWT generation, verification, cookies
│       └── emailTemplates.js # HTML email templates
│
└── client/                   # React Frontend
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js    # DaisyUI themes
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx           # Routes
        ├── index.css         # Tailwind + custom styles
        ├── context/
        │   ├── AuthContext.jsx  # Auth state management
        │   └── ThemeContext.jsx # Theme toggle
        ├── components/
        │   ├── common/
        │   │   └── ProtectedRoute.jsx
        │   └── layout/
        │       └── DashboardLayout.jsx  # Sidebar + topbar
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── ForgotPassword.jsx
        │   ├── ResetPassword.jsx
        │   ├── VerifyEmail.jsx
        │   ├── Dashboard.jsx
        │   ├── LoanList.jsx
        │   ├── LoanCreate.jsx
        │   ├── LoanDetail.jsx
        │   ├── CustomerList.jsx      # Customer directory with search & filters
        │   ├── CustomerForm.jsx      # Multi-step create/edit customer profile
        │   ├── CustomerDetail.jsx    # Tabbed view: Info, KYC, Risk, Loan History
        │   ├── UserManagement.jsx
        │   ├── ActivityLogs.jsx
        │   ├── Profile.jsx
        │   ├── Security.jsx
        │   ├── Unauthorized.jsx
        │   └── NotFound.jsx
        └── utils/
            ├── api.js        # Axios instance + interceptors
            └── helpers.js    # Constants, formatters, KYC/risk labels
```

---

## 🔒 Security Features

| Feature | Implementation |
|---------|---------------|
| Password Hashing | bcrypt with 12 salt rounds |
| JWT Tokens | Short-lived access (15min) + long-lived refresh (7d) |
| HTTP-Only Cookies | Tokens stored in secure, httpOnly cookies |
| Token Rotation | Refresh tokens rotated on each use; reuse detection |
| Account Lockout | 5 failed attempts → 30 minute lock |
| Rate Limiting | 100 req/15min (general), 20 req/15min (auth) |
| CORS | Restricted to configured client origin |
| Helmet | HTTP security headers |
| Input Validation | express-validator on all inputs |
| RBAC | Role → Permission mapping enforced server-side |
| 2FA | TOTP via Speakeasy + backup codes |
| Email Verification | SHA-256 hashed tokens, 24hr expiry |
| Password Reset | SHA-256 hashed tokens, 1hr expiry |
| XSS Protection | React auto-escaping + Helmet headers |
| File Validation | MIME type + file size checks on document uploads |
| KYC Compliance | Identity verification workflow with audit trail |

---

## 🌐 Production Deployment

### 1. Build the client

```bash
cd client
npm run build
```

### 2. Configure production environment

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/loandb
JWT_SECRET=<random-64-char-string>
JWT_REFRESH_SECRET=<random-64-char-string>
CLIENT_URL=https://your-domain.com
COOKIE_SECURE=true
```

### 3. Start the server

```bash
cd server
NODE_ENV=production node server.js
```

The Express server serves both the API and the React build in production.

### 4. Recommended deployment platforms

- **Server**: Railway, Render, DigitalOcean App Platform, AWS EC2
- **Database**: MongoDB Atlas (free tier available)
- **Frontend** (optional separate host): Vercel, Netlify

### 5. Production checklist

- [ ] Change all JWT secrets to strong random values
- [ ] Configure real SMTP credentials
- [ ] Enable HTTPS
- [ ] Set `COOKIE_SECURE=true`
- [ ] Set up MongoDB Atlas with IP whitelist
- [ ] Change default admin password
- [ ] Configure proper CORS origins
- [ ] Set up monitoring/logging (PM2, Datadog, etc.)
- [ ] Enable MongoDB replica set for transactions
- [ ] Set up automated backups
- [ ] Migrate document storage from base64/MongoDB to S3 or GCS for production scale
- [ ] Configure file upload size limits at reverse proxy level (Nginx/Cloudflare)

---

## 📄 License

This project is provided for educational and development purposes.

---

Built with ❤️ using the MERN Stack + DaisyUI
