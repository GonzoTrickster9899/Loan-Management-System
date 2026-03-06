import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  ROLES, KYC_STATUS_LABELS, KYC_STATUS_COLORS,
  RISK_LEVEL_LABELS, RISK_LEVEL_COLORS,
  GENDER_LABELS, CIVIL_STATUS_LABELS, EMPLOYMENT_STATUS_LABELS,
  DOC_CATEGORY_LABELS, DOC_TYPE_OPTIONS, DOC_STATUS_COLORS,
  LOAN_STATUS_LABELS, LOAN_STATUS_COLORS,
  formatCurrency, formatDate, formatDateTime, formatFileSize, getInitials,
} from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  HiOutlinePencilSquare, HiOutlineTrash, HiOutlineDocumentArrowUp,
  HiOutlineShieldCheck, HiOutlineExclamationTriangle, HiOutlineCheckCircle,
  HiOutlineXCircle, HiOutlineEye, HiOutlineArrowDownTray,
  HiOutlineIdentification, HiOutlineBriefcase, HiOutlineMapPin,
  HiOutlineBanknotes, HiOutlineDocumentText, HiOutlineClipboardDocumentList,
} from 'react-icons/hi2';

const CustomerDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  // Document upload state
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({ category: 'government_id', documentType: '', notes: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Risk profile state
  const [riskModal, setRiskModal] = useState(false);
  const [riskForm, setRiskForm] = useState({ level: '', score: 0, notes: '' });

  // KYC review state
  const [kycReviewModal, setKycReviewModal] = useState(false);
  const [kycAction, setKycAction] = useState('verify');
  const [kycNotes, setKycNotes] = useState('');
  const [kycRejectionReason, setKycRejectionReason] = useState('');

  // Doc review state
  const [docReviewModal, setDocReviewModal] = useState(null);
  const [docAction, setDocAction] = useState('verify');
  const [docRejectionReason, setDocRejectionReason] = useState('');

  // Loan history
  const [loanHistory, setLoanHistory] = useState({ loans: [], summary: {} });
  const [loanLoading, setLoanLoading] = useState(false);

  const fetchCustomer = async () => {
    try {
      const { data } = await api.get(`/customers/${id}`);
      setCustomer(data.data.customer);
    } catch (err) {
      toast.error('Customer not found');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoanHistory = async () => {
    setLoanLoading(true);
    try {
      const { data } = await api.get(`/customers/${id}/loan-history`);
      setLoanHistory(data.data);
    } catch (err) {
      // may not have linked user
    } finally {
      setLoanLoading(false);
    }
  };

  useEffect(() => { fetchCustomer(); }, [id]);
  useEffect(() => { if (activeTab === 'loans') fetchLoanHistory(); }, [activeTab]);

  // ── File handling ─────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      toast.error('Only PDF, JPG, and PNG files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must not exceed 5MB');
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadData.documentType) {
      toast.error('Please select a file and document type');
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result;
        await api.post(`/customers/${id}/documents`, {
          category: uploadData.category,
          documentType: uploadData.documentType,
          fileName: `${uploadData.category}_${Date.now()}`,
          originalName: selectedFile.name,
          mimeType: selectedFile.type,
          fileSize: selectedFile.size,
          fileData: base64,
          notes: uploadData.notes,
        });
        toast.success('Document uploaded!');
        setUploadModal(false);
        setSelectedFile(null);
        setUploadData({ category: 'government_id', documentType: '', notes: '' });
        fetchCustomer();
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/customers/${id}/documents/${docId}`);
      toast.success('Document deleted');
      fetchCustomer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleViewDoc = async (docId) => {
    try {
      const { data } = await api.get(`/customers/${id}/documents/${docId}`);
      const doc = data.data.document;
      // Open in new tab
      const win = window.open('', '_blank');
      if (doc.mimeType.startsWith('image/')) {
        win.document.write(`<html><head><title>${doc.originalName}</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#1e293b"><img src="${doc.fileData}" style="max-width:100%;max-height:100vh;object-fit:contain" /></body></html>`);
      } else {
        // PDF: extract base64 part
        const base64Data = doc.fileData.includes(',') ? doc.fileData.split(',')[1] : doc.fileData;
        win.document.write(`<html><head><title>${doc.originalName}</title></head><body style="margin:0"><iframe src="data:application/pdf;base64,${base64Data}" width="100%" height="100%" style="border:none;position:absolute;inset:0"></iframe></body></html>`);
      }
    } catch (err) {
      toast.error('Failed to load document');
    }
  };

  const handleDocReview = async () => {
    if (!docReviewModal) return;
    try {
      await api.patch(`/customers/${id}/documents/${docReviewModal}/review`, {
        action: docAction,
        rejectionReason: docAction === 'reject' ? docRejectionReason : undefined,
      });
      toast.success(`Document ${docAction === 'verify' ? 'verified' : 'rejected'}`);
      setDocReviewModal(null);
      fetchCustomer();
    } catch (err) {
      toast.error('Review failed');
    }
  };

  // ── KYC actions ───────────────────────────────────────
  const handleSubmitKYC = async () => {
    try {
      await api.patch(`/customers/${id}/kyc/submit`);
      toast.success('KYC submitted for review');
      fetchCustomer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    }
  };

  const handleKYCReview = async () => {
    try {
      await api.patch(`/customers/${id}/kyc/review`, {
        action: kycAction,
        notes: kycNotes,
        rejectionReason: kycAction === 'reject' ? kycRejectionReason : undefined,
      });
      toast.success(`KYC ${kycAction === 'verify' ? 'verified' : 'rejected'}`);
      setKycReviewModal(false);
      fetchCustomer();
    } catch (err) {
      toast.error('KYC review failed');
    }
  };

  // ── Risk profile ──────────────────────────────────────
  const handleUpdateRisk = async () => {
    try {
      await api.patch(`/customers/${id}/risk-profile`, riskForm);
      toast.success('Risk profile updated');
      setRiskModal(false);
      fetchCustomer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete customer ${customer?.customerId}? This cannot be undone.`)) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted');
      navigate('/customers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  if (!customer) return null;

  const isStaff = [ROLES.ADMIN, ROLES.LOAN_OFFICER, ROLES.MANAGER].includes(user?.role);

  return (
    <div className="page-transition space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-14 h-14">
              <span className="text-xl font-bold">{getInitials(customer.firstName, customer.lastName)}</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl font-bold">{customer.firstName} {customer.middleName || ''} {customer.lastName}</h1>
              <span className={`badge badge-sm ${KYC_STATUS_COLORS[customer.kyc?.status]}`}>{KYC_STATUS_LABELS[customer.kyc?.status]}</span>
              <span className={`badge badge-sm ${RISK_LEVEL_COLORS[customer.riskProfile?.level]}`}>{RISK_LEVEL_LABELS[customer.riskProfile?.level]}</span>
            </div>
            <p className="text-base-content/50 text-sm font-mono">{customer.customerId} · {customer.email}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isStaff && (
            <button onClick={() => navigate(`/customers/${id}/edit`)} className="btn btn-primary btn-sm gap-1">
              <HiOutlinePencilSquare className="w-4 h-4" /> Edit
            </button>
          )}
          {user?.role === ROLES.ADMIN && (
            <button onClick={handleDelete} className="btn btn-error btn-sm btn-outline gap-1">
              <HiOutlineTrash className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-100 p-1">
        {[
          { key: 'info', label: 'Profile Info', icon: HiOutlineIdentification },
          { key: 'kyc', label: 'KYC & Documents', icon: HiOutlineDocumentText },
          { key: 'risk', label: 'Risk Profile', icon: HiOutlineExclamationTriangle },
          { key: 'loans', label: 'Loan History', icon: HiOutlineClipboardDocumentList },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`tab gap-2 ${activeTab === tab.key ? 'tab-active' : ''}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════ TAB: Profile Info ════════════ */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div className="card bg-base-100 shadow-sm border border-base-300/50">
            <div className="card-body">
              <h2 className="font-display font-bold flex items-center gap-2 mb-4"><HiOutlineIdentification className="w-5 h-5 text-primary" /> Personal Information</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-base-content/50">Full Name:</span><p className="font-medium">{customer.firstName} {customer.middleName || ''} {customer.lastName}</p></div>
                <div><span className="text-base-content/50">Email:</span><p className="font-medium">{customer.email}</p></div>
                <div><span className="text-base-content/50">Phone:</span><p className="font-medium">{customer.phone}</p></div>
                <div><span className="text-base-content/50">Alt Phone:</span><p className="font-medium">{customer.alternatePhone || 'N/A'}</p></div>
                <div><span className="text-base-content/50">Date of Birth:</span><p className="font-medium">{formatDate(customer.dateOfBirth)} (Age: {customer.age})</p></div>
                <div><span className="text-base-content/50">Gender:</span><p className="font-medium">{GENDER_LABELS[customer.gender]}</p></div>
                <div><span className="text-base-content/50">Civil Status:</span><p className="font-medium">{CIVIL_STATUS_LABELS[customer.civilStatus]}</p></div>
                <div><span className="text-base-content/50">Nationality:</span><p className="font-medium">{customer.nationality}</p></div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="card bg-base-100 shadow-sm border border-base-300/50">
            <div className="card-body">
              <h2 className="font-display font-bold flex items-center gap-2 mb-4"><HiOutlineMapPin className="w-5 h-5 text-primary" /> Address</h2>
              <div className="text-sm space-y-3">
                <div>
                  <p className="text-base-content/50 text-xs uppercase font-semibold">Current Address</p>
                  <p className="font-medium mt-1">
                    {customer.address?.street}{customer.address?.barangay ? `, ${customer.address.barangay}` : ''}, {customer.address?.city}, {customer.address?.province} {customer.address?.zipCode}
                  </p>
                </div>
                {!customer.sameAsPermanent && customer.permanentAddress && (
                  <div>
                    <p className="text-base-content/50 text-xs uppercase font-semibold">Permanent Address</p>
                    <p className="font-medium mt-1">
                      {customer.permanentAddress?.street}{customer.permanentAddress?.barangay ? `, ${customer.permanentAddress.barangay}` : ''}, {customer.permanentAddress?.city}, {customer.permanentAddress?.province} {customer.permanentAddress?.zipCode}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Employment */}
          <div className="card bg-base-100 shadow-sm border border-base-300/50 lg:col-span-2">
            <div className="card-body">
              <h2 className="font-display font-bold flex items-center gap-2 mb-4"><HiOutlineBriefcase className="w-5 h-5 text-primary" /> Employment Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-base-content/50">Status:</span><p className="font-medium">{EMPLOYMENT_STATUS_LABELS[customer.employment?.status]}</p></div>
                <div><span className="text-base-content/50">Employer:</span><p className="font-medium">{customer.employment?.employer || 'N/A'}</p></div>
                <div><span className="text-base-content/50">Position:</span><p className="font-medium">{customer.employment?.position || 'N/A'}</p></div>
                <div><span className="text-base-content/50">Department:</span><p className="font-medium">{customer.employment?.department || 'N/A'}</p></div>
                <div><span className="text-base-content/50">Monthly Income:</span><p className="font-medium text-primary">{formatCurrency(customer.employment?.monthlyIncome || 0)}</p></div>
                <div><span className="text-base-content/50">Years Employed:</span><p className="font-medium">{customer.employment?.yearsEmployed || 0} years</p></div>
                <div><span className="text-base-content/50">Employer Phone:</span><p className="font-medium">{customer.employment?.employerPhone || 'N/A'}</p></div>
                <div><span className="text-base-content/50">Employer Address:</span><p className="font-medium">{customer.employment?.employerAddress || 'N/A'}</p></div>
              </div>
              {(customer.employment?.otherIncomeSource || customer.employment?.otherIncomeAmount > 0) && (
                <div className="mt-3 pt-3 border-t border-base-300/50 grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-content/50">Other Income Source:</span><p className="font-medium">{customer.employment?.otherIncomeSource || 'N/A'}</p></div>
                  <div><span className="text-base-content/50">Other Income:</span><p className="font-medium">{formatCurrency(customer.employment?.otherIncomeAmount || 0)}</p></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════ TAB: KYC & Documents ════════════ */}
      {activeTab === 'kyc' && (
        <div className="space-y-6">
          {/* KYC Status Banner */}
          <div className={`alert ${customer.kyc?.status === 'verified' ? 'alert-success' : customer.kyc?.status === 'rejected' ? 'alert-error' : 'alert-info'}`}>
            <HiOutlineShieldCheck className="w-6 h-6" />
            <div className="flex-1">
              <h3 className="font-bold">KYC Status: {KYC_STATUS_LABELS[customer.kyc?.status]}</h3>
              {customer.kyc?.verifiedAt && <p className="text-sm">Verified on {formatDateTime(customer.kyc.verifiedAt)}{customer.kyc.verifiedBy ? ` by ${customer.kyc.verifiedBy.firstName} ${customer.kyc.verifiedBy.lastName}` : ''}</p>}
              {customer.kyc?.rejectionReason && <p className="text-sm">Reason: {customer.kyc.rejectionReason}</p>}
              {customer.kyc?.notes && <p className="text-sm">Notes: {customer.kyc.notes}</p>}
            </div>
            <div className="flex gap-2">
              {customer.kyc?.status === 'in_progress' && (
                <button onClick={handleSubmitKYC} className="btn btn-sm btn-primary">Submit for Review</button>
              )}
              {customer.kyc?.status === 'pending_review' && isStaff && (
                <button onClick={() => setKycReviewModal(true)} className="btn btn-sm btn-warning">Review KYC</button>
              )}
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex justify-between items-center">
            <h2 className="font-display text-lg font-bold">Documents ({customer.documents?.length || 0})</h2>
            <button onClick={() => setUploadModal(true)} className="btn btn-primary btn-sm gap-2">
              <HiOutlineDocumentArrowUp className="w-4 h-4" /> Upload Document
            </button>
          </div>

          {/* Documents Grid */}
          {customer.documents?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customer.documents.map((doc) => (
                <div key={doc._id} className="card bg-base-100 shadow-sm border border-base-300/50">
                  <div className="card-body p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.originalName}</p>
                        <p className="text-xs text-base-content/40">{DOC_CATEGORY_LABELS[doc.category]} · {doc.documentType}</p>
                        <p className="text-xs text-base-content/40">{formatFileSize(doc.fileSize)} · {formatDate(doc.createdAt)}</p>
                      </div>
                      <span className={`badge badge-xs ${DOC_STATUS_COLORS[doc.status]}`}>{doc.status}</span>
                    </div>
                    {doc.rejectionReason && (
                      <p className="text-xs text-error mt-1">Rejected: {doc.rejectionReason}</p>
                    )}
                    <div className="flex gap-1 mt-2">
                      <button onClick={() => handleViewDoc(doc._id)} className="btn btn-ghost btn-xs gap-1"><HiOutlineEye className="w-3 h-3" /> View</button>
                      {isStaff && doc.status === 'pending' && (
                        <button onClick={() => { setDocReviewModal(doc._id); setDocAction('verify'); }} className="btn btn-ghost btn-xs text-success gap-1"><HiOutlineCheckCircle className="w-3 h-3" /> Review</button>
                      )}
                      {doc.status !== 'verified' && (
                        <button onClick={() => handleDeleteDoc(doc._id)} className="btn btn-ghost btn-xs text-error gap-1"><HiOutlineTrash className="w-3 h-3" /></button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-base-content/40 bg-base-100 rounded-xl border border-base-300/50">
              <HiOutlineDocumentArrowUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No documents uploaded yet</p>
              <button onClick={() => setUploadModal(true)} className="btn btn-primary btn-sm mt-3">Upload First Document</button>
            </div>
          )}
        </div>
      )}

      {/* ════════════ TAB: Risk Profile ════════════ */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-300/50">
            <div className="card-body">
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-display font-bold text-lg">Customer Risk Assessment</h2>
                {isStaff && (
                  <button onClick={() => { setRiskForm({ level: customer.riskProfile?.level || '', score: customer.riskProfile?.score || 0, notes: customer.riskProfile?.notes || '' }); setRiskModal(true); }} className="btn btn-primary btn-sm">
                    {customer.riskProfile?.level === 'unassessed' ? 'Assess Risk' : 'Update Risk'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-6 mb-6">
                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-center ${
                  customer.riskProfile?.level === 'low' ? 'bg-success/10 text-success' :
                  customer.riskProfile?.level === 'medium' ? 'bg-warning/10 text-warning' :
                  customer.riskProfile?.level === 'high' ? 'bg-error/10 text-error' : 'bg-base-200 text-base-content/30'
                }`}>
                  <div>
                    <p className="text-3xl font-display font-bold">{customer.riskProfile?.score || 0}</p>
                    <p className="text-xs font-medium uppercase">{RISK_LEVEL_LABELS[customer.riskProfile?.level] || 'Unassessed'}</p>
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  {customer.riskProfile?.assessedBy && <p className="text-base-content/50">Assessed by: <span className="font-medium text-base-content">{customer.riskProfile.assessedBy.firstName} {customer.riskProfile.assessedBy.lastName}</span></p>}
                  {customer.riskProfile?.assessedAt && <p className="text-base-content/50">Date: <span className="font-medium text-base-content">{formatDateTime(customer.riskProfile.assessedAt)}</span></p>}
                  {customer.riskProfile?.notes && <p className="text-base-content/50">Notes: <span className="text-base-content">{customer.riskProfile.notes}</span></p>}
                </div>
              </div>

              {/* Risk Factors */}
              {customer.riskProfile?.factors?.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm mb-2">Risk Factors</h3>
                  <div className="space-y-2">
                    {customer.riskProfile.factors.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm bg-base-200 rounded-lg p-3">
                        <span className={`badge badge-xs ${f.impact === 'positive' ? 'badge-success' : f.impact === 'negative' ? 'badge-error' : 'badge-ghost'}`}>{f.impact}</span>
                        <span className="font-medium">{f.factor}</span>
                        {f.detail && <span className="text-base-content/50">— {f.detail}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════ TAB: Loan History ════════════ */}
      {activeTab === 'loans' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {loanHistory.summary?.total > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Total Loans', value: loanHistory.summary.total, color: 'primary' },
                { label: 'Total Borrowed', value: formatCurrency(loanHistory.summary.totalAmountBorrowed), color: 'info' },
                { label: 'Active', value: loanHistory.summary.activeLoans, color: 'success' },
                { label: 'Completed', value: loanHistory.summary.completedLoans, color: 'accent' },
                { label: 'Rejected', value: loanHistory.summary.rejectedLoans, color: 'error' },
              ].map((s) => (
                <div key={s.label} className={`p-3 rounded-xl bg-base-100 border border-base-300/50 text-center`}>
                  <p className="text-xl font-display font-bold">{s.value}</p>
                  <p className="text-xs text-base-content/50">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="card bg-base-100 shadow-sm border border-base-300/50">
            <div className="card-body">
              <h2 className="font-display font-bold text-lg mb-4">Loan Records</h2>
              {loanLoading ? (
                <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg text-primary"></span></div>
              ) : loanHistory.loans?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr><th>Loan #</th><th>Type</th><th>Amount</th><th>Rate</th><th>Term</th><th>Monthly</th><th>Status</th><th>Date</th><th></th></tr>
                    </thead>
                    <tbody>
                      {loanHistory.loans.map((loan) => (
                        <tr key={loan._id} className="hover">
                          <td><Link to={`/loans/${loan._id}`} className="font-mono text-sm text-primary hover:underline">{loan.loanNumber}</Link></td>
                          <td className="capitalize">{loan.loanType}</td>
                          <td className="font-mono">{formatCurrency(loan.amount)}</td>
                          <td>{loan.interestRate}%</td>
                          <td>{loan.termMonths}mo</td>
                          <td className="font-mono">{formatCurrency(loan.monthlyPayment)}</td>
                          <td><span className={`badge badge-sm ${LOAN_STATUS_COLORS[loan.status]}`}>{LOAN_STATUS_LABELS[loan.status]}</span></td>
                          <td className="text-xs text-base-content/50">{formatDate(loan.createdAt)}</td>
                          <td><Link to={`/loans/${loan._id}`} className="btn btn-ghost btn-xs">View</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-base-content/40">
                  <HiOutlineBanknotes className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No loan records found for this customer</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════ MODALS ════════ */}

      {/* Upload Document Modal */}
      {uploadModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-display font-bold text-lg">Upload Document</h3>
            <div className="mt-4 space-y-3">
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">Category *</span></label>
                <select value={uploadData.category} onChange={(e) => setUploadData({ ...uploadData, category: e.target.value, documentType: '' })} className="select select-bordered select-sm">
                  {Object.entries(DOC_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">Document Type *</span></label>
                <select value={uploadData.documentType} onChange={(e) => setUploadData({ ...uploadData, documentType: e.target.value })} className="select select-bordered select-sm">
                  <option value="">Select type</option>
                  {(DOC_TYPE_OPTIONS[uploadData.category] || []).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">File (PDF, JPG, PNG — max 5MB) *</span></label>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png" className="file-input file-input-bordered file-input-sm w-full" />
                {selectedFile && <p className="text-xs text-base-content/50 mt-1">{selectedFile.name} ({formatFileSize(selectedFile.size)})</p>}
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">Notes</span></label>
                <input type="text" value={uploadData.notes} onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })} className="input input-bordered input-sm" placeholder="Optional notes..." />
              </div>
              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => { setUploadModal(false); setSelectedFile(null); }}>Cancel</button>
                <button className={`btn btn-primary ${uploading ? 'loading' : ''}`} onClick={handleUpload} disabled={uploading || !selectedFile || !uploadData.documentType}>
                  {uploading ? <span className="loading loading-spinner loading-sm"></span> : 'Upload'}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setUploadModal(false)}></div>
        </dialog>
      )}

      {/* KYC Review Modal */}
      {kycReviewModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-display font-bold text-lg">Review KYC</h3>
            <div className="mt-4 space-y-3">
              <div className="form-control">
                <label className="label"><span className="label-text">Action</span></label>
                <div className="flex gap-3">
                  <label className="label cursor-pointer gap-2"><input type="radio" name="kycAction" checked={kycAction === 'verify'} onChange={() => setKycAction('verify')} className="radio radio-success radio-sm" /><span className="label-text">Verify</span></label>
                  <label className="label cursor-pointer gap-2"><input type="radio" name="kycAction" checked={kycAction === 'reject'} onChange={() => setKycAction('reject')} className="radio radio-error radio-sm" /><span className="label-text">Reject</span></label>
                </div>
              </div>
              {kycAction === 'reject' && (
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">Rejection Reason</span></label>
                  <textarea value={kycRejectionReason} onChange={(e) => setKycRejectionReason(e.target.value)} className="textarea textarea-bordered textarea-sm" />
                </div>
              )}
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">Notes</span></label>
                <textarea value={kycNotes} onChange={(e) => setKycNotes(e.target.value)} className="textarea textarea-bordered textarea-sm" />
              </div>
              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => setKycReviewModal(false)}>Cancel</button>
                <button className={`btn ${kycAction === 'verify' ? 'btn-success' : 'btn-error'}`} onClick={handleKYCReview}>
                  {kycAction === 'verify' ? 'Verify KYC' : 'Reject KYC'}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setKycReviewModal(false)}></div>
        </dialog>
      )}

      {/* Document Review Modal */}
      {docReviewModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-display font-bold text-lg">Review Document</h3>
            <div className="mt-4 space-y-3">
              <div className="flex gap-3">
                <label className="label cursor-pointer gap-2"><input type="radio" checked={docAction === 'verify'} onChange={() => setDocAction('verify')} className="radio radio-success radio-sm" /><span className="label-text">Verify</span></label>
                <label className="label cursor-pointer gap-2"><input type="radio" checked={docAction === 'reject'} onChange={() => setDocAction('reject')} className="radio radio-error radio-sm" /><span className="label-text">Reject</span></label>
              </div>
              {docAction === 'reject' && (
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">Rejection Reason</span></label>
                  <textarea value={docRejectionReason} onChange={(e) => setDocRejectionReason(e.target.value)} className="textarea textarea-bordered textarea-sm" />
                </div>
              )}
              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => setDocReviewModal(null)}>Cancel</button>
                <button className={`btn ${docAction === 'verify' ? 'btn-success' : 'btn-error'}`} onClick={handleDocReview}>
                  {docAction === 'verify' ? 'Verify' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDocReviewModal(null)}></div>
        </dialog>
      )}

      {/* Risk Profile Modal */}
      {riskModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-display font-bold text-lg">Update Risk Profile</h3>
            <div className="mt-4 space-y-3">
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">Risk Level *</span></label>
                <select value={riskForm.level} onChange={(e) => setRiskForm({ ...riskForm, level: e.target.value })} className="select select-bordered select-sm">
                  <option value="">Select level</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">Risk Score (0–100)</span></label>
                <input type="number" value={riskForm.score} onChange={(e) => setRiskForm({ ...riskForm, score: parseInt(e.target.value) || 0 })} className="input input-bordered input-sm" min="0" max="100" />
                <progress className={`progress mt-1 ${riskForm.score <= 33 ? 'progress-success' : riskForm.score <= 66 ? 'progress-warning' : 'progress-error'}`} value={riskForm.score} max="100"></progress>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">Notes</span></label>
                <textarea value={riskForm.notes} onChange={(e) => setRiskForm({ ...riskForm, notes: e.target.value })} className="textarea textarea-bordered textarea-sm" placeholder="Assessment notes..." />
              </div>
              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => setRiskModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleUpdateRisk} disabled={!riskForm.level}>Save</button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setRiskModal(false)}></div>
        </dialog>
      )}
    </div>
  );
};

export default CustomerDetail;
