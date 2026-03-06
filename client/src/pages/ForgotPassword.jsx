import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { HiOutlineEnvelope, HiOutlineCheckCircle } from 'react-icons/hi2';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-6">
      <div className="card bg-base-100 shadow-xl max-w-md w-full">
        <div className="card-body">
          {!sent ? (
            <>
              <h2 className="font-display text-2xl font-bold text-center">Reset Password</h2>
              <p className="text-base-content/60 text-center text-sm mt-1">Enter your email and we'll send you a reset link</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="form-control">
                  <label className="input input-bordered flex items-center gap-2">
                    <HiOutlineEnvelope className="w-4 h-4 opacity-50" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="grow" required />
                  </label>
                </div>
                <button type="submit" className={`btn btn-primary w-full ${loading ? 'loading' : ''}`} disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <HiOutlineCheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold">Check Your Email</h2>
              <p className="text-base-content/60 mt-2">If an account exists with that email, we've sent password reset instructions.</p>
            </div>
          )}
          <div className="text-center mt-4">
            <Link to="/login" className="text-sm text-primary hover:underline">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
