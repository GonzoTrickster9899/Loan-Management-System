import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { ROLES, ROLE_LABELS, LOAN_STATUS_LABELS, LOAN_STATUS_COLORS, formatCurrency, formatDate } from '../utils/helpers';
import { HiOutlineBanknotes, HiOutlineDocumentText, HiOutlineUsers, HiOutlineCheckCircle, HiOutlineClock, HiOutlineXCircle, HiOutlinePlusCircle } from 'react-icons/hi2';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'primary', trend }) => (
  <div className="card bg-base-100 shadow-sm border border-base-300/50 card-hover">
    <div className="card-body p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-base-content/50 font-medium">{title}</p>
          <h3 className="text-2xl font-display font-bold mt-1">{value}</h3>
          {subtitle && <p className="text-xs text-base-content/40 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl bg-${color}/10 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}`} />
        </div>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [loanStats, setLoanStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loanRes] = await Promise.all([
          api.get('/loans/stats'),
          ...(user.role === ROLES.ADMIN ? [api.get('/users/stats').then((r) => setUserStats(r.data.data))] : []),
        ]);
        setLoanStats(loanRes.data.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const getStatusCount = (status) => {
    const found = loanStats?.statusStats?.find((s) => s._id === status);
    return found?.count || 0;
  };

  const getStatusAmount = (status) => {
    const found = loanStats?.statusStats?.find((s) => s._id === status);
    return found?.totalAmount || 0;
  };

  return (
    <div className="page-transition space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">
            Welcome back, {user.firstName}
          </h1>
          <p className="text-base-content/50 mt-1">
            {ROLE_LABELS[user.role]} Dashboard — Here's your overview
          </p>
        </div>
        {user.role === ROLES.CUSTOMER && (
          <Link to="/loans/new" className="btn btn-primary gap-2">
            <HiOutlinePlusCircle className="w-5 h-5" /> Apply for Loan
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Loans"
          value={loanStats?.totalLoans || 0}
          subtitle={formatCurrency(loanStats?.totalAmount || 0)}
          icon={HiOutlineDocumentText}
          color="primary"
        />
        <StatCard
          title="Approved"
          value={getStatusCount('approved') + getStatusCount('disbursed')}
          subtitle={formatCurrency(getStatusAmount('approved') + getStatusAmount('disbursed'))}
          icon={HiOutlineCheckCircle}
          color="success"
        />
        <StatCard
          title="Pending Review"
          value={getStatusCount('submitted') + getStatusCount('under_review')}
          subtitle="Awaiting action"
          icon={HiOutlineClock}
          color="warning"
        />
        {user.role === ROLES.ADMIN && userStats ? (
          <StatCard
            title="Total Users"
            value={userStats.totalUsers}
            subtitle={`${userStats.activeUsers} active`}
            icon={HiOutlineUsers}
            color="info"
          />
        ) : (
          <StatCard
            title="Rejected"
            value={getStatusCount('rejected')}
            subtitle={formatCurrency(getStatusAmount('rejected'))}
            icon={HiOutlineXCircle}
            color="error"
          />
        )}
      </div>

      {/* Recent Loans Table */}
      <div className="card bg-base-100 shadow-sm border border-base-300/50">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold">Recent Loans</h2>
            <Link to="/loans" className="btn btn-ghost btn-sm text-primary">View All →</Link>
          </div>

          {loanStats?.recentLoans?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Loan #</th>
                    {user.role !== ROLES.CUSTOMER && <th>Borrower</th>}
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loanStats.recentLoans.map((loan) => (
                    <tr key={loan._id} className="hover">
                      <td>
                        <Link to={`/loans/${loan._id}`} className="font-mono text-sm text-primary hover:underline">
                          {loan.loanNumber}
                        </Link>
                      </td>
                      {user.role !== ROLES.CUSTOMER && (
                        <td>{loan.borrower?.firstName} {loan.borrower?.lastName}</td>
                      )}
                      <td className="capitalize">{loan.loanType}</td>
                      <td className="font-mono">{formatCurrency(loan.amount)}</td>
                      <td>
                        <span className={`badge badge-sm ${LOAN_STATUS_COLORS[loan.status]}`}>
                          {LOAN_STATUS_LABELS[loan.status]}
                        </span>
                      </td>
                      <td className="text-base-content/50">{formatDate(loan.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-base-content/40">
              <HiOutlineBanknotes className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No loan applications yet</p>
              {user.role === ROLES.CUSTOMER && (
                <Link to="/loans/new" className="btn btn-primary btn-sm mt-3">Apply Now</Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Admin: Role Distribution */}
      {user.role === ROLES.ADMIN && userStats && (
        <div className="card bg-base-100 shadow-sm border border-base-300/50">
          <div className="card-body">
            <h2 className="font-display text-lg font-bold mb-4">User Distribution</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(userStats.roleCounts || {}).map(([role, count]) => (
                <div key={role} className="text-center p-4 rounded-xl bg-base-200">
                  <p className="text-2xl font-bold font-display">{count}</p>
                  <p className="text-xs text-base-content/50 mt-1">{ROLE_LABELS[role] || role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
