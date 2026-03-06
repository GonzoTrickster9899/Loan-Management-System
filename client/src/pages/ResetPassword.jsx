import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.patch(`/auth/reset-password/${token}`, formData);
      toast.success('Password reset successful!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Token may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-6">
      <div className="card bg-base-100 shadow-xl max-w-md w-full">
        <div className="card-body">
          <h2 className="font-display text-2xl font-bold text-center">Set New Password</h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text">New Password</span></label>
              <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input input-bordered" required />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Confirm Password</span></label>
              <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="input input-bordered" required />
            </div>
            <button type="submit" className={`btn btn-primary w-full ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Reset Password'}
            </button>
          </form>
          <div className="text-center mt-4">
            <Link to="/login" className="text-sm text-primary hover:underline">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
