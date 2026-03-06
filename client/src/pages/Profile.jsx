import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, getInitials } from '../utils/helpers';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || '',
      country: user?.address?.country || '',
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('addr_')) {
      setFormData({
        ...formData,
        address: { ...formData.address, [name.replace('addr_', '')]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold">My Profile</h1>

      <div className="card bg-base-100 shadow-sm border border-base-300/50">
        <div className="card-body">
          <div className="flex items-center gap-4 mb-6">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-16 h-16">
                <span className="text-2xl font-bold">{getInitials(user?.firstName, user?.lastName)}</span>
              </div>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
              <p className="text-base-content/50">{user?.email}</p>
              <span className="badge badge-sm badge-primary mt-1">{ROLE_LABELS[user?.role]}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">First Name</span></label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="input input-bordered" required />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Last Name</span></label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="input input-bordered" required />
              </div>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Phone</span></label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input input-bordered" />
            </div>
            <div className="divider">Address</div>
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Street</span></label>
              <input type="text" name="addr_street" value={formData.address.street} onChange={handleChange} className="input input-bordered" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">City</span></label>
                <input type="text" name="addr_city" value={formData.address.city} onChange={handleChange} className="input input-bordered input-sm" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">State</span></label>
                <input type="text" name="addr_state" value={formData.address.state} onChange={handleChange} className="input input-bordered input-sm" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">ZIP Code</span></label>
                <input type="text" name="addr_zipCode" value={formData.address.zipCode} onChange={handleChange} className="input input-bordered input-sm" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">Country</span></label>
                <input type="text" name="addr_country" value={formData.address.country} onChange={handleChange} className="input input-bordered input-sm" />
              </div>
            </div>
            <button type="submit" className={`btn btn-primary ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
