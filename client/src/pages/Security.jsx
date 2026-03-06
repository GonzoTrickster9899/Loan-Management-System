import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { HiOutlineShieldCheck, HiOutlineLockClosed, HiOutlineDevicePhoneMobile } from 'react-icons/hi2';

const Security = () => {
  const { user, changePassword, refreshUser } = useAuth();

  const [pwLoading, setPwLoading] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [tfaLoading, setTfaLoading] = useState(false);
  const [tfaSetup, setTfaSetup] = useState(null);
  const [tfaCode, setTfaCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    setPwLoading(true);
    try {
      await changePassword(pwForm.currentPassword, pwForm.newPassword);
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setPwLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setTfaLoading(true);
    try {
      const { data } = await api.post('/auth/2fa/enable');
      setTfaSetup(data.data);
    } catch (err) {
      toast.error('Failed to setup 2FA');
    } finally {
      setTfaLoading(false);
    }
  };

  const handleConfirm2FA = async () => {
    setTfaLoading(true);
    try {
      await api.post('/auth/2fa/confirm', { token: tfaCode });
      toast.success('2FA enabled successfully!');
      setTfaSetup(null);
      setTfaCode('');
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setTfaLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) return toast.error('Enter your password to disable 2FA');
    setTfaLoading(true);
    try {
      await api.post('/auth/2fa/disable', { password: disablePassword });
      toast.success('2FA disabled');
      setDisablePassword('');
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setTfaLoading(false);
    }
  };

  return (
    <div className="page-transition max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold">Security Settings</h1>

      {/* Change Password */}
      <div className="card bg-base-100 shadow-sm border border-base-300/50">
        <div className="card-body">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <HiOutlineLockClosed className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Change Password</h2>
              <p className="text-xs text-base-content/50">Update your account password</p>
            </div>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div className="form-control">
              <label className="label"><span className="label-text text-sm">Current Password</span></label>
              <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} className="input input-bordered input-sm" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">New Password</span></label>
                <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} className="input input-bordered input-sm" required />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">Confirm New</span></label>
                <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} className="input input-bordered input-sm" required />
              </div>
            </div>
            <button type="submit" className={`btn btn-primary btn-sm ${pwLoading ? 'loading' : ''}`} disabled={pwLoading}>
              {pwLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Two-Factor Auth */}
      <div className="card bg-base-100 shadow-sm border border-base-300/50">
        <div className="card-body">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <HiOutlineShieldCheck className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-bold text-lg">Two-Factor Authentication</h2>
              <p className="text-xs text-base-content/50">Add an extra layer of security</p>
            </div>
            {user?.twoFactorEnabled ? (
              <span className="badge badge-success badge-sm">Enabled</span>
            ) : (
              <span className="badge badge-ghost badge-sm">Disabled</span>
            )}
          </div>

          {!user?.twoFactorEnabled ? (
            <>
              {!tfaSetup ? (
                <div>
                  <p className="text-sm text-base-content/60 mb-3">
                    Protect your account with an authenticator app like Google Authenticator, Authy, or 1Password.
                  </p>
                  <button onClick={handleEnable2FA} className={`btn btn-secondary btn-sm gap-2 ${tfaLoading ? 'loading' : ''}`} disabled={tfaLoading}>
                    <HiOutlineDevicePhoneMobile className="w-4 h-4" /> Enable 2FA
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-base-content/60 mb-3">Scan this QR code with your authenticator app:</p>
                    <img src={tfaSetup.qrCode} alt="2FA QR Code" className="mx-auto rounded-xl border border-base-300 bg-white p-2" style={{ width: 200 }} />
                    <details className="mt-2">
                      <summary className="text-xs text-base-content/40 cursor-pointer">Can't scan? Enter code manually</summary>
                      <code className="block mt-1 text-xs bg-base-200 p-2 rounded font-mono break-all">{tfaSetup.secret}</code>
                    </details>
                  </div>

                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                    <p className="text-xs font-bold text-warning mb-2">Save your backup codes securely:</p>
                    <div className="grid grid-cols-4 gap-1">
                      {tfaSetup.backupCodes.map((code, i) => (
                        <code key={i} className="text-xs bg-base-200 p-1 rounded text-center font-mono">{code}</code>
                      ))}
                    </div>
                    <p className="text-xs text-base-content/40 mt-2">Each backup code can only be used once.</p>
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm">Enter the 6-digit code from your app:</span></label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tfaCode}
                        onChange={(e) => setTfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="input input-bordered input-sm flex-1 font-mono text-center tracking-widest"
                        maxLength="6"
                      />
                      <button onClick={handleConfirm2FA} className={`btn btn-primary btn-sm ${tfaLoading ? 'loading' : ''}`} disabled={tfaLoading || tfaCode.length < 6}>
                        Verify
                      </button>
                    </div>
                  </div>

                  <button onClick={() => setTfaSetup(null)} className="btn btn-ghost btn-sm">Cancel</button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-success">Two-factor authentication is currently active on your account.</p>
              <div className="divider text-xs">Disable 2FA</div>
              <p className="text-xs text-base-content/50">Enter your password to disable two-factor authentication:</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Your password"
                  className="input input-bordered input-sm flex-1"
                />
                <button onClick={handleDisable2FA} className={`btn btn-error btn-sm btn-outline ${tfaLoading ? 'loading' : ''}`} disabled={tfaLoading}>
                  Disable 2FA
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Sessions Info */}
      <div className="card bg-base-100 shadow-sm border border-base-300/50">
        <div className="card-body">
          <h2 className="font-display font-bold text-lg mb-2">Session Information</h2>
          <div className="text-sm space-y-2 text-base-content/60">
            <p>Your access tokens expire after 15 minutes and are automatically refreshed.</p>
            <p>Changing your password will log you out of all other devices.</p>
            <p>If you suspect unauthorized access, change your password immediately and enable 2FA.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;
