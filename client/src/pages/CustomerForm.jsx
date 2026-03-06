import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import {
  GENDER_LABELS, CIVIL_STATUS_LABELS, EMPLOYMENT_STATUS_LABELS, formatCurrency,
} from '../utils/helpers';
import toast from 'react-hot-toast';

const CustomerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', middleName: '', email: '', phone: '', alternatePhone: '',
    dateOfBirth: '', gender: '', civilStatus: 'single', nationality: 'Filipino',
    address: { street: '', barangay: '', city: '', province: '', zipCode: '', country: 'Philippines' },
    permanentAddress: { street: '', barangay: '', city: '', province: '', zipCode: '', country: 'Philippines' },
    sameAsPermanent: true,
    employment: {
      status: 'employed', employer: '', position: '', department: '',
      monthlyIncome: '', yearsEmployed: '', employerAddress: '', employerPhone: '',
      otherIncomeSource: '', otherIncomeAmount: '',
    },
    notes: '',
  });

  useEffect(() => {
    if (isEdit) {
      const fetchCustomer = async () => {
        try {
          const { data } = await api.get(`/customers/${id}`);
          const c = data.data.customer;
          setFormData({
            firstName: c.firstName || '', lastName: c.lastName || '', middleName: c.middleName || '',
            email: c.email || '', phone: c.phone || '', alternatePhone: c.alternatePhone || '',
            dateOfBirth: c.dateOfBirth ? c.dateOfBirth.split('T')[0] : '',
            gender: c.gender || '', civilStatus: c.civilStatus || 'single',
            nationality: c.nationality || 'Filipino',
            address: c.address || { street: '', barangay: '', city: '', province: '', zipCode: '', country: 'Philippines' },
            permanentAddress: c.permanentAddress || { street: '', barangay: '', city: '', province: '', zipCode: '', country: 'Philippines' },
            sameAsPermanent: c.sameAsPermanent !== false,
            employment: {
              status: c.employment?.status || 'employed',
              employer: c.employment?.employer || '',
              position: c.employment?.position || '',
              department: c.employment?.department || '',
              monthlyIncome: c.employment?.monthlyIncome || '',
              yearsEmployed: c.employment?.yearsEmployed || '',
              employerAddress: c.employment?.employerAddress || '',
              employerPhone: c.employment?.employerPhone || '',
              otherIncomeSource: c.employment?.otherIncomeSource || '',
              otherIncomeAmount: c.employment?.otherIncomeAmount || '',
            },
            notes: c.notes || '',
          });
        } catch (err) {
          toast.error('Failed to load customer');
          navigate('/customers');
        } finally {
          setFetchLoading(false);
        }
      };
      fetchCustomer();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('addr_')) {
      setFormData({ ...formData, address: { ...formData.address, [name.replace('addr_', '')]: value } });
    } else if (name.startsWith('perm_')) {
      setFormData({ ...formData, permanentAddress: { ...formData.permanentAddress, [name.replace('perm_', '')]: value } });
    } else if (name.startsWith('emp_')) {
      setFormData({ ...formData, employment: { ...formData.employment, [name.replace('emp_', '')]: value } });
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData };
      if (payload.sameAsPermanent) {
        payload.permanentAddress = { ...payload.address };
      }
      if (isEdit) {
        await api.patch(`/customers/${id}`, payload);
        toast.success('Customer updated!');
      } else {
        const { data } = await api.post('/customers', payload);
        toast.success('Customer created!');
        navigate(`/customers/${data.data.customer._id}`);
        return;
      }
      navigate(`/customers/${id}`);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.length) errors.forEach((e) => toast.error(e.message));
      else toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  }

  const addressFields = (prefix, data) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="form-control md:col-span-2">
        <label className="label"><span className="label-text text-sm">Street / House No.</span></label>
        <input type="text" name={`${prefix}_street`} value={data.street} onChange={handleChange} className="input input-bordered input-sm" />
      </div>
      <div className="form-control">
        <label className="label"><span className="label-text text-sm">Barangay</span></label>
        <input type="text" name={`${prefix}_barangay`} value={data.barangay} onChange={handleChange} className="input input-bordered input-sm" />
      </div>
      <div className="form-control">
        <label className="label"><span className="label-text text-sm">City / Municipality</span></label>
        <input type="text" name={`${prefix}_city`} value={data.city} onChange={handleChange} className="input input-bordered input-sm" />
      </div>
      <div className="form-control">
        <label className="label"><span className="label-text text-sm">Province</span></label>
        <input type="text" name={`${prefix}_province`} value={data.province} onChange={handleChange} className="input input-bordered input-sm" />
      </div>
      <div className="form-control">
        <label className="label"><span className="label-text text-sm">ZIP Code</span></label>
        <input type="text" name={`${prefix}_zipCode`} value={data.zipCode} onChange={handleChange} className="input input-bordered input-sm" />
      </div>
    </div>
  );

  return (
    <div className="page-transition max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{isEdit ? 'Edit Customer Profile' : 'New Customer Profile'}</h1>
        <p className="text-base-content/50 mt-1">Fill in borrower details for KYC processing</p>
      </div>

      {/* Steps */}
      <ul className="steps w-full">
        <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>Personal Info</li>
        <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Address</li>
        <li className={`step ${step >= 3 ? 'step-primary' : ''}`}>Employment</li>
        <li className={`step ${step >= 4 ? 'step-primary' : ''}`}>Review</li>
      </ul>

      <form onSubmit={handleSubmit}>
        <div className="card bg-base-100 shadow-sm border border-base-300/50">
          <div className="card-body">

            {/* ── STEP 1: Personal Info ──────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm font-medium">First Name *</span></label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="input input-bordered input-sm" required />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm font-medium">Middle Name</span></label>
                    <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className="input input-bordered input-sm" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm font-medium">Last Name *</span></label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="input input-bordered input-sm" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm font-medium">Email *</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="input input-bordered input-sm" required />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm font-medium">Phone *</span></label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="09XX XXX XXXX" className="input input-bordered input-sm" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm font-medium">Alternate Phone</span></label>
                    <input type="text" name="alternatePhone" value={formData.alternatePhone} onChange={handleChange} className="input input-bordered input-sm" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm font-medium">Date of Birth *</span></label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="input input-bordered input-sm" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm font-medium">Gender *</span></label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="select select-bordered select-sm" required>
                      <option value="">Select</option>
                      {Object.entries(GENDER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm font-medium">Civil Status</span></label>
                    <select name="civilStatus" value={formData.civilStatus} onChange={handleChange} className="select select-bordered select-sm">
                      {Object.entries(CIVIL_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm font-medium">Nationality</span></label>
                    <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className="input input-bordered input-sm" />
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setStep(2)} disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.dateOfBirth || !formData.gender}>Next →</button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Address ─────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold">Current Address</h2>
                {addressFields('addr', formData.address)}

                <div className="divider"></div>
                <label className="label cursor-pointer justify-start gap-3">
                  <input type="checkbox" name="sameAsPermanent" checked={formData.sameAsPermanent} onChange={handleChange} className="checkbox checkbox-primary checkbox-sm" />
                  <span className="label-text">Permanent address is the same as current address</span>
                </label>

                {!formData.sameAsPermanent && (
                  <>
                    <h2 className="font-display text-lg font-bold">Permanent Address</h2>
                    {addressFields('perm', formData.permanentAddress)}
                  </>
                )}

                <div className="flex justify-between mt-2">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>← Back</button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setStep(3)}>Next →</button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Employment ──────────────────────── */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold">Employment Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm font-medium">Employment Status</span></label>
                    <select name="emp_status" value={formData.employment.status} onChange={handleChange} className="select select-bordered select-sm">
                      {Object.entries(EMPLOYMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm font-medium">Employer Name</span></label>
                    <input type="text" name="emp_employer" value={formData.employment.employer} onChange={handleChange} className="input input-bordered input-sm" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm font-medium">Position / Title</span></label>
                    <input type="text" name="emp_position" value={formData.employment.position} onChange={handleChange} className="input input-bordered input-sm" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm font-medium">Department</span></label>
                    <input type="text" name="emp_department" value={formData.employment.department} onChange={handleChange} className="input input-bordered input-sm" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm font-medium">Monthly Income (₱)</span></label>
                    <input type="number" name="emp_monthlyIncome" value={formData.employment.monthlyIncome} onChange={handleChange} className="input input-bordered input-sm" min="0" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm font-medium">Years Employed</span></label>
                    <input type="number" name="emp_yearsEmployed" value={formData.employment.yearsEmployed} onChange={handleChange} className="input input-bordered input-sm" min="0" />
                  </div>
                  <div className="form-control md:col-span-2">
                    <label className="label"><span className="label-text text-sm font-medium">Employer Address</span></label>
                    <input type="text" name="emp_employerAddress" value={formData.employment.employerAddress} onChange={handleChange} className="input input-bordered input-sm" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm font-medium">Employer Phone</span></label>
                    <input type="text" name="emp_employerPhone" value={formData.employment.employerPhone} onChange={handleChange} className="input input-bordered input-sm" />
                  </div>
                </div>
                <div className="divider text-xs">Other Income (Optional)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm">Other Income Source</span></label>
                    <input type="text" name="emp_otherIncomeSource" value={formData.employment.otherIncomeSource} onChange={handleChange} className="input input-bordered input-sm" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm">Other Monthly Income (₱)</span></label>
                    <input type="number" name="emp_otherIncomeAmount" value={formData.employment.otherIncomeAmount} onChange={handleChange} className="input input-bordered input-sm" min="0" />
                  </div>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">Notes</span></label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} className="textarea textarea-bordered textarea-sm h-20" placeholder="Additional notes about this customer..." />
                </div>
                <div className="flex justify-between mt-2">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(2)}>← Back</button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setStep(4)}>Next →</button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Review ─────────────────────────── */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold">Review Customer Profile</h2>
                <div className="bg-base-200 rounded-xl p-5 space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-base-content/50 text-xs uppercase mb-2">Personal Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div><span className="text-base-content/50">Name:</span> <span className="font-medium">{formData.firstName} {formData.middleName} {formData.lastName}</span></div>
                      <div><span className="text-base-content/50">Email:</span> <span className="font-medium">{formData.email}</span></div>
                      <div><span className="text-base-content/50">Phone:</span> <span className="font-medium">{formData.phone}</span></div>
                      <div><span className="text-base-content/50">DOB:</span> <span className="font-medium">{formData.dateOfBirth}</span></div>
                      <div><span className="text-base-content/50">Gender:</span> <span className="font-medium">{GENDER_LABELS[formData.gender]}</span></div>
                      <div><span className="text-base-content/50">Civil Status:</span> <span className="font-medium">{CIVIL_STATUS_LABELS[formData.civilStatus]}</span></div>
                    </div>
                  </div>
                  <div className="divider my-1"></div>
                  <div>
                    <h3 className="font-semibold text-base-content/50 text-xs uppercase mb-2">Address</h3>
                    <p>{formData.address.street}{formData.address.barangay ? `, ${formData.address.barangay}` : ''}, {formData.address.city}, {formData.address.province} {formData.address.zipCode}</p>
                  </div>
                  <div className="divider my-1"></div>
                  <div>
                    <h3 className="font-semibold text-base-content/50 text-xs uppercase mb-2">Employment</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-base-content/50">Status:</span> <span className="font-medium">{EMPLOYMENT_STATUS_LABELS[formData.employment.status]}</span></div>
                      <div><span className="text-base-content/50">Employer:</span> <span className="font-medium">{formData.employment.employer || 'N/A'}</span></div>
                      <div><span className="text-base-content/50">Position:</span> <span className="font-medium">{formData.employment.position || 'N/A'}</span></div>
                      <div><span className="text-base-content/50">Monthly Income:</span> <span className="font-medium">{formatCurrency(formData.employment.monthlyIncome || 0)}</span></div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-2">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(3)}>← Back</button>
                  <button type="submit" className={`btn btn-primary ${loading ? 'loading' : ''}`} disabled={loading}>
                    {loading ? <span className="loading loading-spinner loading-sm"></span> : (isEdit ? 'Update Customer' : 'Create Customer')}
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

export default CustomerForm;
