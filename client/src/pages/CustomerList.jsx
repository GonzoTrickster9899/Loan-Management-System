import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  KYC_STATUS_LABELS, KYC_STATUS_COLORS,
  RISK_LEVEL_LABELS, RISK_LEVEL_COLORS,
  formatDate, getInitials,
} from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  HiOutlineMagnifyingGlass, HiOutlinePlusCircle, HiOutlineEye,
  HiOutlineIdentification, HiOutlineShieldCheck, HiOutlineExclamationTriangle,
} from 'react-icons/hi2';

const CustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', kycStatus: '', riskLevel: '' });

  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await api.get('/customers', { params });
      setCustomers(data.data.customers);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/customers/stats');
      setStats(data.data);
    } catch (err) {
      // stats are optional
    }
  };

  useEffect(() => { fetchCustomers(); fetchStats(); }, []);
  useEffect(() => { fetchCustomers(); }, [filters]);

  const StatMini = ({ label, value, icon: Icon, color }) => (
    <div className="flex items-center gap-3 p-4 bg-base-100 rounded-xl border border-base-300/50">
      <div className={`w-10 h-10 rounded-lg bg-${color}/10 flex items-center justify-center`}>
        <Icon className={`w-5 h-5 text-${color}`} />
      </div>
      <div>
        <p className="text-2xl font-display font-bold">{value}</p>
        <p className="text-xs text-base-content/50">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="page-transition space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Customer Management</h1>
          <p className="text-base-content/50 text-sm mt-1">Manage borrower profiles and KYC verification</p>
        </div>
        <button onClick={() => navigate('/customers/new')} className="btn btn-primary gap-2">
          <HiOutlinePlusCircle className="w-5 h-5" /> New Customer
        </button>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatMini label="Total Customers" value={stats.totalCustomers} icon={HiOutlineIdentification} color="primary" />
          <StatMini label="KYC Verified" value={stats.kycCounts?.verified || 0} icon={HiOutlineShieldCheck} color="success" />
          <StatMini label="KYC Pending" value={(stats.kycCounts?.pending_review || 0) + (stats.kycCounts?.in_progress || 0)} icon={HiOutlineExclamationTriangle} color="warning" />
          <StatMini label="High Risk" value={stats.riskCounts?.high || 0} icon={HiOutlineExclamationTriangle} color="error" />
        </div>
      )}

      {/* Filters */}
      <div className="card bg-base-100 shadow-sm border border-base-300/50">
        <div className="card-body p-4">
          <div className="flex flex-wrap gap-3">
            <label className="input input-bordered input-sm flex items-center gap-2 flex-1 min-w-[200px]">
              <HiOutlineMagnifyingGlass className="w-4 h-4 opacity-50" />
              <input
                type="text"
                placeholder="Search by name, email, ID, phone..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="grow"
              />
            </label>
            <select className="select select-bordered select-sm" value={filters.kycStatus} onChange={(e) => setFilters({ ...filters, kycStatus: e.target.value })}>
              <option value="">All KYC Status</option>
              {Object.entries(KYC_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="select select-bordered select-sm" value={filters.riskLevel} onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}>
              <option value="">All Risk Levels</option>
              {Object.entries(RISK_LEVEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card bg-base-100 shadow-sm border border-base-300/50">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex justify-center py-16"><span className="loading loading-spinner loading-lg text-primary"></span></div>
          ) : customers.length === 0 ? (
            <div className="text-center py-16 text-base-content/40">
              <HiOutlineIdentification className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg">No customers found</p>
              <button onClick={() => navigate('/customers/new')} className="btn btn-primary btn-sm mt-3">Add First Customer</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>ID</th>
                    <th>Contact</th>
                    <th>KYC Status</th>
                    <th>Risk</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c._id} className="hover cursor-pointer" onClick={() => navigate(`/customers/${c._id}`)}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-primary/10 text-primary rounded-full w-10 h-10">
                              <span className="text-xs font-bold">{getInitials(c.firstName, c.lastName)}</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium">{c.firstName} {c.middleName ? c.middleName + ' ' : ''}{c.lastName}</p>
                            <p className="text-xs text-base-content/40">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-sm text-primary">{c.customerId}</td>
                      <td className="text-sm">{c.phone}</td>
                      <td>
                        <span className={`badge badge-sm ${KYC_STATUS_COLORS[c.kyc?.status] || 'badge-ghost'}`}>
                          {KYC_STATUS_LABELS[c.kyc?.status] || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-sm ${RISK_LEVEL_COLORS[c.riskProfile?.level] || 'badge-ghost'}`}>
                          {RISK_LEVEL_LABELS[c.riskProfile?.level] || 'Unassessed'}
                        </span>
                      </td>
                      <td className="text-sm text-base-content/50">{formatDate(c.createdAt)}</td>
                      <td>
                        <Link to={`/customers/${c._id}`} className="btn btn-ghost btn-xs" onClick={(e) => e.stopPropagation()}>
                          <HiOutlineEye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="flex justify-center py-4">
              <div className="join">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`join-item btn btn-sm ${p === pagination.page ? 'btn-primary' : ''}`} onClick={() => fetchCustomers(p)}>{p}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerList;
