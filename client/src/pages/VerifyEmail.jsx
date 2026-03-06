import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | error

  useEffect(() => {
    const verify = async () => {
      try {
        await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
      } catch {
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-6">
      <div className="card bg-base-100 shadow-xl max-w-md w-full">
        <div className="card-body text-center">
          {status === 'verifying' && (
            <>
              <span className="loading loading-spinner loading-lg text-primary mx-auto"></span>
              <h2 className="font-display text-2xl font-bold mt-4">Verifying Email...</h2>
            </>
          )}
          {status === 'success' && (
            <>
              <HiOutlineCheckCircle className="w-16 h-16 text-success mx-auto" />
              <h2 className="font-display text-2xl font-bold mt-4">Email Verified!</h2>
              <p className="text-base-content/60 mt-2">Your account is now active. You can sign in.</p>
              <Link to="/login" className="btn btn-primary mt-4">Go to Login</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <HiOutlineXCircle className="w-16 h-16 text-error mx-auto" />
              <h2 className="font-display text-2xl font-bold mt-4">Verification Failed</h2>
              <p className="text-base-content/60 mt-2">The link may be expired or invalid.</p>
              <Link to="/login" className="btn btn-primary mt-4">Go to Login</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
