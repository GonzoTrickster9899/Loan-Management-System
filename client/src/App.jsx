import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import { ROLES } from './utils/helpers';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import LoanList from './pages/LoanList';
import LoanCreate from './pages/LoanCreate';
import LoanDetail from './pages/LoanDetail';
import UserManagement from './pages/UserManagement';
import ActivityLogs from './pages/ActivityLogs';
import Profile from './pages/Profile';
import Security from './pages/Security';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import CustomerList from './pages/CustomerList';
import CustomerForm from './pages/CustomerForm';
import CustomerDetail from './pages/CustomerDetail';

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
              },
            }}
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Loans */}
              <Route path="/loans" element={<LoanList />} />
              <Route
                path="/loans/new"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.CUSTOMER, ROLES.LOAN_OFFICER]}>
                    <LoanCreate />
                  </ProtectedRoute>
                }
              />
              <Route path="/loans/:id" element={<LoanDetail />} />

              {/* Admin */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/logs"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <ActivityLogs />
                  </ProtectedRoute>
                }
              />

              {/* Profile & Security */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/security" element={<Security />} />

              {/* Customer Management */}
              <Route
                path="/customers"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.LOAN_OFFICER, ROLES.MANAGER]}>
                    <CustomerList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers/new"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.LOAN_OFFICER, ROLES.CUSTOMER]}>
                    <CustomerForm />
                  </ProtectedRoute>
                }
              />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route
                path="/customers/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.LOAN_OFFICER]}>
                    <CustomerForm />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
