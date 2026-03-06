import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { ROLES, LOAN_STATUS_LABELS, LOAN_STATUS_COLORS, LOAN_TYPES, formatCurrency, formatDate, formatDateTime } from '../utils/helpers';
import toast from 'react-hot-toast';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlinePaperAirplane, HiOutlineCog6Tooth, HiOutlineBanknotes, HiOutlineTrash } from 'react-icons/hi2';

const LoanDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [comment, setComment] = useState('');
  const [note, setNote] = useState('');
  const [interestRate, setInterestRate] = useState('');

  const fetchLoan = async () => {
    try {
      const { data } = await api.get(`/loans/${id}`);
      setLoan(data.data.loan);
      setInterestRate(data.data.loan.interestRate || '');
    } catch (err) {
      toast.error('Loan not found');
      navigate('/loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLoan(); }, [id]);

  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      const body = {};
      if (comment) body.comment = comment;
      if (action === 'reject') body.reason = comment;
      if (action === 'process') body.interestRate = parseFloat(interestRate) || 0;

      await api.patch(`/loans/${id}/${action}`, body);
      toast.success(`Loan ${action}ed successfully`);
      setComment('');
      fetchLoan();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} loan`);
    } finally {
      setActionLoading('');
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      await api.post(`/loans/${id}/notes`, { content: note });
      setNote('');
      fetchLoan();
      toast.success('Note added');
    } catch (err) {
      toast.error('Failed to add note');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this loan?')) return;
    try {
      await api.delete(`/loans/${id}`);
      toast.success('Loan deleted');
      navigate('/loans');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  if (!loan) return null;

  const canSubmit = loan.status === 'draft' && (user.role === ROLES.CUSTOMER || user.role === ROLES.ADMIN);
  const canProcess = loan.status === 'submitted' && [ROLES.ADMIN, ROLES.LOAN_OFFICER].includes(user.role);
  const canApprove = loan.status === 'under_review' && [ROLES.ADMIN, ROLES.MANAGER].includes(user.role);
  const canReject = ['submitted', 'under_review'].includes(loan.status) && [ROLES.ADMIN, ROLES.MANAGER, ROLES.LOAN_OFFICER].includes(user.role);
  const canDisburse = loan.status === 'approved' && [ROLES.ADMIN, ROLES.MANAGER].includes(user.role);
  const canDelete = loan.status === 'draft' || user.role === ROLES.ADMIN;

  return (
    <div className="page-transition max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold">{loan.loanNumber}</h1>
            <span className={`badge ${LOAN_STATUS_COLORS[loan.status]}`}>{LOAN_STATUS_LABELS[loan.status]}</span>
          </div>
          <p className="text-base-content/50 mt-1">{LOAN_TYPES[loan.loanType]} Loan · Created {formatDate(loan.createdAt)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canSubmit && (
            <button onClick={() => handleAction('submit')} className={`btn btn-primary btn-sm gap-1 ${actionLoading === 'submit' ? 'loading' : ''}`}>
              <HiOutlinePaperAirplane className="w-4 h-4" /> Submit
            </button>
          )}
          {canDisburse && (
            <button onClick={() => handleAction('disburse')} className={`btn btn-accent btn-sm gap-1 ${actionLoading === 'disburse' ? 'loading' : ''}`}>
              <HiOutlineBanknotes className="w-4 h-4" /> Disburse
            </button>
          )}
          {canDelete && (
            <button onClick={handleDelete} className="btn btn-error btn-sm btn-outline gap-1">
              <HiOutlineTrash className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loan Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-300/50">
            <div className="card-body">
              <h2 className="font-display font-bold text-lg mb-4">Loan Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-base-content/50">Amount:</span><p className="font-bold text-xl mt-1">{formatCurrency(loan.amount)}</p></div>
                <div><span className="text-base-content/50">Monthly Payment:</span><p className="font-bold text-xl mt-1">{formatCurrency(loan.monthlyPayment)}</p></div>
                <div><span className="text-base-content/50">Interest Rate:</span><p className="font-medium mt-1">{loan.interestRate}% APR</p></div>
                <div><span className="text-base-content/50">Term:</span><p className="font-medium mt-1">{loan.termMonths} months</p></div>
                <div className="col-span-2"><span className="text-base-content/50">Purpose:</span><p className="mt-1">{loan.purpose}</p></div>
              </div>
            </div>
          </div>

          {/* Borrower Info */}
          {loan.borrower && user.role !== ROLES.CUSTOMER && (
            <div className="card bg-base-100 shadow-sm border border-base-300/50">
              <div className="card-body">
                <h2 className="font-display font-bold text-lg mb-4">Borrower Information</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-content/50">Name:</span><p className="font-medium">{loan.borrower.firstName} {loan.borrower.lastName}</p></div>
                  <div><span className="text-base-content/50">Email:</span><p className="font-medium">{loan.borrower.email}</p></div>
                  {loan.borrower.phone && <div><span className="text-base-content/50">Phone:</span><p className="font-medium">{loan.borrower.phone}</p></div>}
                </div>
                {loan.employmentInfo?.employer && (
                  <>
                    <div className="divider"></div>
                    <h3 className="font-medium text-sm text-base-content/50">Employment</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm mt-2">
                      <div><span className="text-base-content/50">Employer:</span><p className="font-medium">{loan.employmentInfo.employer}</p></div>
                      <div><span className="text-base-content/50">Position:</span><p className="font-medium">{loan.employmentInfo.position}</p></div>
                      <div><span className="text-base-content/50">Income:</span><p className="font-medium">{formatCurrency(loan.employmentInfo.monthlyIncome)}/mo</p></div>
                      <div><span className="text-base-content/50">Experience:</span><p className="font-medium">{loan.employmentInfo.yearsEmployed} years</p></div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {(canProcess || canApprove || canReject) && (
            <div className="card bg-base-100 shadow-sm border border-base-300/50">
              <div className="card-body">
                <h2 className="font-display font-bold text-lg mb-4">Actions</h2>
                {canProcess && (
                  <div className="form-control mb-3">
                    <label className="label"><span className="label-text font-medium">Set Interest Rate (%)</span></label>
                    <input type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="8.5" className="input input-bordered input-sm" step="0.1" min="0" max="100" />
                  </div>
                )}
                <div className="form-control mb-4">
                  <label className="label"><span className="label-text font-medium">Comment / Reason</span></label>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="textarea textarea-bordered textarea-sm h-20" placeholder="Add a comment..." />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {canProcess && (
                    <button onClick={() => handleAction('process')} className={`btn btn-info btn-sm gap-1 ${actionLoading === 'process' ? 'loading' : ''}`}>
                      <HiOutlineCog6Tooth className="w-4 h-4" /> Start Review
                    </button>
                  )}
                  {canApprove && (
                    <button onClick={() => handleAction('approve')} className={`btn btn-success btn-sm gap-1 ${actionLoading === 'approve' ? 'loading' : ''}`}>
                      <HiOutlineCheckCircle className="w-4 h-4" /> Approve
                    </button>
                  )}
                  {canReject && (
                    <button onClick={() => handleAction('reject')} className={`btn btn-error btn-sm gap-1 ${actionLoading === 'reject' ? 'loading' : ''}`}>
                      <HiOutlineXCircle className="w-4 h-4" /> Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="card bg-base-100 shadow-sm border border-base-300/50">
            <div className="card-body">
              <h2 className="font-display font-bold text-lg mb-4">Notes</h2>
              <div className="flex gap-2 mb-4">
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note..." className="input input-bordered input-sm flex-1" onKeyDown={(e) => e.key === 'Enter' && handleAddNote()} />
                <button onClick={handleAddNote} className="btn btn-primary btn-sm">Add</button>
              </div>
              <div className="space-y-3">
                {loan.notes?.length > 0 ? loan.notes.map((n, i) => (
                  <div key={i} className="bg-base-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm">{n.author?.firstName} {n.author?.lastName}</p>
                      <p className="text-xs text-base-content/40">{formatDateTime(n.createdAt)}</p>
                    </div>
                    <p className="text-sm mt-1">{n.content}</p>
                  </div>
                )) : (
                  <p className="text-sm text-base-content/40">No notes yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Status History */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-300/50">
            <div className="card-body">
              <h2 className="font-display font-bold text-lg mb-4">Status Timeline</h2>
              <ul className="timeline timeline-vertical timeline-compact">
                {loan.statusHistory?.map((entry, i) => (
                  <li key={i}>
                    {i > 0 && <hr className="bg-primary" />}
                    <div className="timeline-start text-xs text-base-content/40">{formatDate(entry.changedAt)}</div>
                    <div className="timeline-middle">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                    </div>
                    <div className="timeline-end timeline-box text-sm">
                      <p className="font-medium capitalize">{entry.status?.replace('_', ' ')}</p>
                      {entry.comment && <p className="text-xs text-base-content/50 mt-0.5">{entry.comment}</p>}
                      {entry.changedBy && <p className="text-xs text-base-content/30 mt-0.5">by {entry.changedBy.firstName} {entry.changedBy.lastName}</p>}
                    </div>
                    {i < loan.statusHistory.length - 1 && <hr className="bg-primary" />}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {loan.rejectionReason && (
            <div className="alert alert-error">
              <div>
                <h3 className="font-bold text-sm">Rejection Reason</h3>
                <p className="text-sm">{loan.rejectionReason}</p>
              </div>
            </div>
          )}

          <div className="card bg-base-100 shadow-sm border border-base-300/50">
            <div className="card-body text-sm">
              <h3 className="font-display font-bold mb-3">Quick Info</h3>
              <div className="space-y-2">
                {loan.loanOfficer && <div className="flex justify-between"><span className="text-base-content/50">Officer:</span><span>{loan.loanOfficer.firstName} {loan.loanOfficer.lastName}</span></div>}
                {loan.approvedBy && <div className="flex justify-between"><span className="text-base-content/50">Approved By:</span><span>{loan.approvedBy.firstName} {loan.approvedBy.lastName}</span></div>}
                {loan.approvedAt && <div className="flex justify-between"><span className="text-base-content/50">Approved:</span><span>{formatDate(loan.approvedAt)}</span></div>}
                {loan.disbursedAt && <div className="flex justify-between"><span className="text-base-content/50">Disbursed:</span><span>{formatDate(loan.disbursedAt)}</span></div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDetail;
