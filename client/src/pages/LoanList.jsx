import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { ROLES, LOAN_STATUS_LABELS, LOAN_STATUS_COLORS, LOAN_TYPES, formatCurrency, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import { HiOutlineFunnel, HiOutlineMagnifyingGlass, HiOutlinePlusCircle } from 'react-icons/hi2';

const LoanList = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', loanType: '', search: '' });

  const fetchLoans = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await api.get('/loans', { params });
      setLoans(data.data.loans);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error('Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLoans(); }, [filters]);

  return (
    <div className="page-transition space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">
            {user.role === ROLES.CUSTOMER ? 'My Loans' : 'All Loan Applications'}
          </h1>
          <p className="text-base-content/50 text-sm mt-1">{pagination.total} total records</p>
        </div>
        {user.role === ROLES.CUSTOMER && (
          <Link to="/loans/new" className="btn btn-primary gap-2">
            <HiOutlinePlusCircle className="w-5 h-5" /> New Application
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-sm border border-base-300/50">
        <div className="card-body p-4">
          <div className="flex flex-wrap gap-3">
            <label className="input input-bordered input-sm flex items-center gap-2 flex-1 min-w-[200px]">
              <HiOutlineMagnifyingGlass className="w-4 h-4 opacity-50" />
              <input
                type="text"
                placeholder="Search by loan # or purpose..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="grow"
              />
            </label>
            <select className="select select-bordered select-sm" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Status</option>
              {Object.entries(LOAN_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select className="select select-bordered select-sm" value={filters.loanType} onChange={(e) => setFilters({ ...filters, loanType: e.target.value })}>
              <option value="">All Types</option>
              {Object.entries(LOAN_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card bg-base-100 shadow-sm border border-base-300/50">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex justify-center py-16"><span className="loading loading-spinner loading-lg text-primary"></span></div>
          ) : loans.length === 0 ? (
            <div className="text-center py-16 text-base-content/40">
              <p className="text-lg">No loans found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Loan #</th>
                    {user.role !== ROLES.CUSTOMER && <th>Borrower</th>}
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Term</th>
                    <th>Rate</th>
                    <th>Status</th>
                    <th>Applied</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => (
                    <tr key={loan._id} className="hover">
                      <td className="font-mono text-sm">{loan.loanNumber}</td>
                      {user.role !== ROLES.CUSTOMER && (
                        <td>{loan.borrower?.firstName} {loan.borrower?.lastName}</td>
                      )}
                      <td className="capitalize">{loan.loanType}</td>
                      <td className="font-mono font-medium">{formatCurrency(loan.amount)}</td>
                      <td>{loan.termMonths}mo</td>
                      <td>{loan.interestRate}%</td>
                      <td>
                        <span className={`badge badge-sm ${LOAN_STATUS_COLORS[loan.status]}`}>
                          {LOAN_STATUS_LABELS[loan.status]}
                        </span>
                      </td>
                      <td className="text-sm text-base-content/50">{formatDate(loan.createdAt)}</td>
                      <td>
                        <Link to={`/loans/${loan._id}`} className="btn btn-ghost btn-xs">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center py-4">
              <div className="join">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`join-item btn btn-sm ${p === pagination.page ? 'btn-primary' : ''}`}
                    onClick={() => fetchLoans(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanList;
