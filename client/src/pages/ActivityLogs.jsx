import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatDateTime } from '../utils/helpers';
import toast from 'react-hot-toast';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (actionFilter) params.action = actionFilter;
      const { data } = await api.get('/users/activity-logs', { params });
      setLogs(data.data.logs);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [actionFilter]);

  const actionColors = {
    LOGIN: 'badge-info', LOGOUT: 'badge-ghost', REGISTER: 'badge-success',
    LOAN_CREATED: 'badge-primary', LOAN_APPROVED: 'badge-success', LOAN_REJECTED: 'badge-error',
    USER_CREATED: 'badge-accent', ROLE_CHANGED: 'badge-warning', PASSWORD_RESET: 'badge-warning',
    '2FA_ENABLED': 'badge-success', '2FA_DISABLED': 'badge-warning',
  };

  return (
    <div className="page-transition space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Activity Logs</h1>
        <p className="text-base-content/50 text-sm mt-1">System-wide audit trail</p>
      </div>

      <div className="flex gap-3">
        <select className="select select-bordered select-sm" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value="">All Actions</option>
          {['LOGIN','LOGOUT','REGISTER','LOAN_CREATED','LOAN_APPROVED','LOAN_REJECTED','USER_CREATED','ROLE_CHANGED','PASSWORD_RESET','PASSWORD_CHANGE','2FA_ENABLED','2FA_DISABLED'].map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-300/50">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex justify-center py-16"><span className="loading loading-spinner loading-lg text-primary"></span></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr><th>Time</th><th>User</th><th>Action</th><th>Details</th><th>IP</th></tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="hover">
                      <td className="text-xs whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                      <td className="text-sm">{log.user?.firstName} {log.user?.lastName}<br /><span className="text-xs text-base-content/40">{log.user?.email}</span></td>
                      <td><span className={`badge badge-sm ${actionColors[log.action] || 'badge-ghost'}`}>{log.action?.replace(/_/g, ' ')}</span></td>
                      <td className="text-xs text-base-content/60 max-w-xs truncate">{log.details}</td>
                      <td className="text-xs font-mono text-base-content/40">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="flex justify-center py-4">
              <div className="join">
                {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`join-item btn btn-sm ${p === pagination.page ? 'btn-primary' : ''}`} onClick={() => fetchLogs(p)}>{p}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
