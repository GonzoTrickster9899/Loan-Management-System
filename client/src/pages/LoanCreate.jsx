import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { LOAN_TYPES, formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

const LoanCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    loanType: '',
    amount: '',
    termMonths: '',
    purpose: '',
    employmentInfo: {
      employer: '',
      position: '',
      monthlyIncome: '',
      yearsEmployed: '',
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('emp_')) {
      setFormData({
        ...formData,
        employmentInfo: { ...formData.employmentInfo, [name.replace('emp_', '')]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const estimatedPayment = () => {
    const amount = parseFloat(formData.amount) || 0;
    const term = parseInt(formData.termMonths) || 1;
    const rate = 8.5 / 100 / 12;
    if (amount > 0 && term > 0) {
      return (amount * (rate * Math.pow(1 + rate, term))) / (Math.pow(1 + rate, term) - 1);
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/loans', formData);
      toast.success('Loan application created!');
      navigate(`/loans/${data.data.loan._id}`);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.length) errors.forEach((e) => toast.error(e.message));
      else toast.error(err.response?.data?.message || 'Failed to create loan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Apply for a Loan</h1>
        <p className="text-base-content/50 mt-1">Fill out the form below to submit your application</p>
      </div>

      {/* Steps */}
      <ul className="steps w-full">
        <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>Loan Details</li>
        <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Employment Info</li>
        <li className={`step ${step >= 3 ? 'step-primary' : ''}`}>Review</li>
      </ul>

      <form onSubmit={handleSubmit}>
        <div className="card bg-base-100 shadow-sm border border-base-300/50">
          <div className="card-body">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold">Loan Details</h2>
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Loan Type *</span></label>
                  <select name="loanType" value={formData.loanType} onChange={handleChange} className="select select-bordered" required>
                    <option value="">Select type</option>
                    {Object.entries(LOAN_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label"><span className="label-text font-medium">Amount ($) *</span></label>
                    <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="25000" className="input input-bordered" min="100" required />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-medium">Term (Months) *</span></label>
                    <input type="number" name="termMonths" value={formData.termMonths} onChange={handleChange} placeholder="36" className="input input-bordered" min="1" required />
                  </div>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Purpose *</span></label>
                  <textarea name="purpose" value={formData.purpose} onChange={handleChange} placeholder="Describe the purpose of this loan..." className="textarea textarea-bordered h-24" required />
                </div>

                {formData.amount && formData.termMonths && (
                  <div className="alert alert-info">
                    <span>Estimated monthly payment at 8.5% APR: <strong>{formatCurrency(estimatedPayment())}</strong></span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button type="button" className="btn btn-primary" onClick={() => setStep(2)} disabled={!formData.loanType || !formData.amount || !formData.termMonths || !formData.purpose}>
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold">Employment Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label"><span className="label-text font-medium">Employer</span></label>
                    <input type="text" name="emp_employer" value={formData.employmentInfo.employer} onChange={handleChange} placeholder="Company Name" className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-medium">Position</span></label>
                    <input type="text" name="emp_position" value={formData.employmentInfo.position} onChange={handleChange} placeholder="Job Title" className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-medium">Monthly Income ($)</span></label>
                    <input type="number" name="emp_monthlyIncome" value={formData.employmentInfo.monthlyIncome} onChange={handleChange} placeholder="5000" className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-medium">Years Employed</span></label>
                    <input type="number" name="emp_yearsEmployed" value={formData.employmentInfo.yearsEmployed} onChange={handleChange} placeholder="3" className="input input-bordered" />
                  </div>
                </div>
                <div className="flex justify-between">
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                  <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>Next →</button>
                </div>
              </div>
            )}

            {/* Step 3 - Review */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold">Review Application</h2>
                <div className="bg-base-200 rounded-xl p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-base-content/50">Type:</span> <span className="font-medium capitalize">{formData.loanType}</span></div>
                    <div><span className="text-base-content/50">Amount:</span> <span className="font-medium">{formatCurrency(formData.amount)}</span></div>
                    <div><span className="text-base-content/50">Term:</span> <span className="font-medium">{formData.termMonths} months</span></div>
                    <div><span className="text-base-content/50">Est. Payment:</span> <span className="font-medium">{formatCurrency(estimatedPayment())}/mo</span></div>
                  </div>
                  <div className="divider my-1"></div>
                  <div className="text-sm">
                    <span className="text-base-content/50">Purpose:</span>
                    <p className="mt-1">{formData.purpose}</p>
                  </div>
                  {formData.employmentInfo.employer && (
                    <>
                      <div className="divider my-1"></div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-base-content/50">Employer:</span> <span className="font-medium">{formData.employmentInfo.employer}</span></div>
                        <div><span className="text-base-content/50">Position:</span> <span className="font-medium">{formData.employmentInfo.position}</span></div>
                        <div><span className="text-base-content/50">Income:</span> <span className="font-medium">{formatCurrency(formData.employmentInfo.monthlyIncome)}/mo</span></div>
                        <div><span className="text-base-content/50">Experience:</span> <span className="font-medium">{formData.employmentInfo.yearsEmployed} years</span></div>
                      </div>
                    </>
                  )}
                </div>
                <div className="alert alert-warning">
                  <span>This will create a <strong>draft</strong> application. Submit it from the loan detail page when ready.</span>
                </div>
                <div className="flex justify-between">
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                  <button type="submit" className={`btn btn-primary ${loading ? 'loading' : ''}`} disabled={loading}>
                    {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Create Application'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoanCreate;
