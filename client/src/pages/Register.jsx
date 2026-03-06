import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash, HiOutlineUser, HiOutlineCheckCircle } from 'react-icons/hi2';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const passwordRequirements = [
    { test: (p) => p.length >= 8, label: 'At least 8 characters' },
    { test: (p) => /[A-Z]/.test(p), label: 'One uppercase letter' },
    { test: (p) => /[a-z]/.test(p), label: 'One lowercase letter' },
    { test: (p) => /\d/.test(p), label: 'One number' },
    { test: (p) => /[@$!%*?&#]/.test(p), label: 'One special character (@$!%*?&#)' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      await register(formData);
      setSuccess(true);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.length) {
        errors.forEach((e) => toast.error(e.message));
      } else {
        toast.error(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 p-6">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body text-center">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <HiOutlineCheckCircle className="w-10 h-10 text-success" />
            </div>
            <h2 className="font-display text-2xl font-bold">Registration Successful!</h2>
            <p className="text-base-content/60 mt-2">
              We've sent a verification link to your email address. Please check your inbox and verify your account.
            </p>
            <div className="card-actions mt-6">
              <Link to="/login" className="btn btn-primary w-full">Go to Login</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding - same as login */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative z-10 text-center text-primary-content max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl font-display font-bold">LV</span>
          </div>
          <h1 className="font-display text-4xl font-bold mb-4">Join LoanVault</h1>
          <p className="text-lg opacity-80">Create your account and start managing loans with confidence.</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-base-100 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold">Create Account</h2>
            <p className="text-base-content/60 mt-2">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">First Name</span></label>
                <label className="input input-bordered flex items-center gap-2">
                  <HiOutlineUser className="w-4 h-4 opacity-50" />
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" className="grow" required />
                </label>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Last Name</span></label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" className="input input-bordered" required />
              </div>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Email</span></label>
              <label className="input input-bordered flex items-center gap-2">
                <HiOutlineEnvelope className="w-4 h-4 opacity-50" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@company.com" className="grow" required />
              </label>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Password</span></label>
              <label className="input input-bordered flex items-center gap-2">
                <HiOutlineLockClosed className="w-4 h-4 opacity-50" />
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="grow" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="opacity-50 hover:opacity-100">
                  {showPassword ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                </button>
              </label>
              {formData.password && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, i) => (
                    <p key={i} className={`text-xs flex items-center gap-1 ${req.test(formData.password) ? 'text-success' : 'text-base-content/40'}`}>
                      <span>{req.test(formData.password) ? '✓' : '○'}</span> {req.label}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Confirm Password</span></label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="input input-bordered" required />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <label className="label"><span className="label-text-alt text-error">Passwords do not match</span></label>
              )}
            </div>

            <button type="submit" className={`btn btn-primary w-full mt-2 ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-base-content/60">
            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
