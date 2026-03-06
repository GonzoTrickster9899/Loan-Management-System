import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash, HiOutlineShieldCheck } from 'react-icons/hi2';

const Login = () => {
  const { login, verify2FA } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [needs2FA, setNeeds2FA] = useState(false);
  const [twoFAData, setTwoFAData] = useState({ userId: '', tempToken: '' });
  const [otpCode, setOtpCode] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.requires2FA) {
        setNeeds2FA(true);
        setTwoFAData({ userId: result.userId, tempToken: result.tempToken });
        toast('Enter your 2FA verification code', { icon: '🔐' });
      } else {
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verify2FA(twoFAData.userId, otpCode, twoFAData.tempToken);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || '2FA verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <circle cx="400" cy="400" r="200" fill="none" stroke="white" strokeWidth="1" />
            <circle cx="400" cy="400" r="300" fill="none" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="relative z-10 text-center text-primary-content max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl font-display font-bold">LV</span>
          </div>
          <h1 className="font-display text-4xl font-bold mb-4">LoanVault</h1>
          <p className="text-lg opacity-80 leading-relaxed">
            Secure, scalable loan management. Streamline applications, approvals, and tracking — all in one platform.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[
              ['256-bit', 'Encryption'],
              ['RBAC', 'Access Control'],
              ['2FA', 'Authentication'],
            ].map(([title, sub]) => (
              <div key={title} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="font-bold text-xl">{title}</p>
                <p className="text-xs opacity-70 mt-1">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-base-100">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-display font-bold text-primary-content">LV</span>
            </div>
            <h1 className="font-display text-2xl font-bold">LoanVault</h1>
          </div>

          {!needs2FA ? (
            <>
              <div className="mb-8">
                <h2 className="font-display text-3xl font-bold text-base-content">Welcome back</h2>
                <p className="text-base-content/60 mt-2">Sign in to your account to continue</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Email</span></label>
                  <label className="input input-bordered flex items-center gap-3">
                    <HiOutlineEnvelope className="w-4 h-4 opacity-50" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@company.com"
                      className="grow"
                      required
                    />
                  </label>
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Password</span></label>
                  <label className="input input-bordered flex items-center gap-3">
                    <HiOutlineLockClosed className="w-4 h-4 opacity-50" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="grow"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="opacity-50 hover:opacity-100">
                      {showPassword ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                    </button>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <label className="label cursor-pointer gap-2">
                    <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" />
                    <span className="label-text text-sm">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>

                <button type="submit" className={`btn btn-primary w-full ${loading ? 'loading' : ''}`} disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Sign In'}
                </button>
              </form>

              <p className="text-center mt-6 text-sm text-base-content/60">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary font-semibold hover:underline">Create one</Link>
              </p>

              {/* Demo credentials */}
              <div className="mt-8 p-4 bg-base-200 rounded-xl">
                <p className="text-xs font-semibold text-base-content/50 mb-2">DEMO ACCOUNTS</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    ['Admin', 'admin@loanmanagement.com'],
                    ['Officer', 'officer@loanmanagement.com'],
                    ['Manager', 'manager@loanmanagement.com'],
                    ['Customer', 'customer@loanmanagement.com'],
                  ].map(([role, email]) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({ email, password: `${role}@1234` })}
                      className="btn btn-ghost btn-xs justify-start font-mono"
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-base-content/40 mt-1">Password: [Role]@1234</p>
              </div>
            </>
          ) : (
            <>
              <div className="mb-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <HiOutlineShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h2 className="font-display text-2xl font-bold">Two-Factor Authentication</h2>
                <p className="text-base-content/60 mt-2">Enter the code from your authenticator app</p>
              </div>

              <form onSubmit={handle2FAVerify} className="space-y-5">
                <div className="form-control">
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="input input-bordered text-center text-3xl tracking-[0.5em] font-mono"
                    maxLength="6"
                    required
                    autoFocus
                  />
                </div>

                <button type="submit" className={`btn btn-primary w-full ${loading ? 'loading' : ''}`} disabled={loading || otpCode.length < 6}>
                  {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Verify'}
                </button>

                <button type="button" onClick={() => { setNeeds2FA(false); setOtpCode(''); }} className="btn btn-ghost w-full">
                  Back to Login
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
