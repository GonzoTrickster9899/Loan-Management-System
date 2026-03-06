import { Link } from 'react-router-dom';
import { HiOutlineShieldExclamation } from 'react-icons/hi2';

const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-base-200 p-6">
    <div className="text-center max-w-md">
      <HiOutlineShieldExclamation className="w-20 h-20 text-error mx-auto mb-6 opacity-60" />
      <h1 className="font-display text-3xl font-bold mb-3">Access Denied</h1>
      <p className="text-base-content/60 mb-6">You don't have permission to access this page. Please contact your administrator if you believe this is an error.</p>
      <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
    </div>
  </div>
);

export default Unauthorized;
