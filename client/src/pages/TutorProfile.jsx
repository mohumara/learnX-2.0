import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CheckboxChips from '../components/CheckboxChips';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';
import { useToast } from '../context/ToastContext';
import { getMyTutorProfile, saveMyTutorProfile } from '../services/tutors';
import { getBankDetails, saveBankDetails } from '../services/bank';
import { DAYS, NIGERIAN_STATES, SKILLS, SUBJECTS } from '../constants';

export default function TutorProfile() {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState('');
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Bank details state
  const [bank, setBank] = useState({ bankCode: '', accountNumber: '', bankName: '', accountName: '', payoutSetupDone: false });
  const [savingBank, setSavingBank] = useState(false);
  const [bankError, setBankError] = useState('');

  useEffect(() => {
    Promise.all([getMyTutorProfile(), getBankDetails().catch(() => ({ bank: {} }))])
      .then(([{ tutor }, bankRes]) => {
        setStatus(tutor.status);
        setForm({
          bio: tutor.bio,
          subjects: tutor.subjects,
          skills: tutor.skills,
          state: tutor.state,
          city: tutor.city,
          hourlyRate: tutor.hourlyRate || '',
          lessonTypes: tutor.lessonTypes,
          availability: tutor.availability
        });
        const bankData = bankRes?.bank || bankRes;
        if (bankData && (bankData.bankCode || bankData.payoutSetupDone)) {
          setBank({
            bankCode: bankData.bankCode || '',
            accountNumber: bankData.accountNumber || '',
            bankName: bankData.bankName || '',
            accountName: bankData.accountName || '',
            payoutSetupDone: Boolean(bankData.payoutSetupDone)
          });
        }
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  if (loadError) {
    return <div style={{ paddingTop: 130 }} className="container"><EmptyState icon="bi-wifi-off" title="Couldn't load your profile" text={loadError} /></div>;
  }
  if (!form) return <div style={{ paddingTop: 100 }}><PageLoader /></div>;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setValue = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));
  const toggleLesson = (type) => (e) =>
    setForm((f) => ({
      ...f,
      lessonTypes: e.target.checked ? [...f.lessonTypes, type] : f.lessonTypes.filter((t) => t !== type)
    }));

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    if (bank.accountNumber.trim().length !== 10) {
      setBankError('Account number must be 10 digits.');
      return;
    }
    if (!bank.bankCode) {
      setBankError('Please select your bank.');
      return;
    }
    setSavingBank(true);
    setBankError('');
    try {
      const res = await saveBankDetails({
        bankCode: bank.bankCode,
        accountNumber: bank.accountNumber.trim(),
        bankName: bank.bankName
      });
      const bankData = res?.bank || res;
      setBank({
        bankCode: bankData.bankCode || '',
        accountNumber: bankData.accountNumber || '',
        bankName: bankData.bankName || '',
        accountName: bankData.accountName || '',
        payoutSetupDone: Boolean(bankData.payoutSetupDone)
      });
      toast.success(`Bank details verified for ${bankData.accountName || 'account'}!`);
    } catch (err) {
      setBankError(err.message || 'Failed to verify bank details.');
    } finally {
      setSavingBank(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await saveMyTutorProfile({ ...form, hourlyRate: Number(form.hourlyRate) });
      toast.success('Profile updated successfully.');
    } catch (err) {
      setFormError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        tag="Tutor Profile"
        title="Build a profile that gets you hired"
        text="The more complete your profile, the more learners will trust and find you."
      />

      <section className="dashboard-section">
        <div className="container">
          <div className="dashboard-panel" style={{ maxWidth: 800, margin: '0 auto' }}>
            {status === 'pending' && (
              <div className="form-success-banner" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#B45309' }}>
                <i className="bi bi-hourglass-split"></i> Your profile is waiting for admin approval. You'll appear in search once approved.
              </div>
            )}
            {status === 'rejected' && (
              <div className="form-error-banner"><i className="bi bi-x-circle"></i> Your profile was not approved. Update it and contact support to be reviewed again.</div>
            )}
            {formError && <div className="form-error-banner"><i className="bi bi-exclamation-triangle-fill"></i> {formError}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-4">
                <label className="form-label" htmlFor="bio">Bio</label>
                <textarea id="bio" rows="4" className="form-control" value={form.bio} onChange={set('bio')} placeholder="Tell learners about your teaching experience and style (at least 20 characters)..." />
              </div>

              <div className="mb-4">
                <label className="form-label">Subjects you teach</label>
                <CheckboxChips options={SUBJECTS} value={form.subjects} onChange={setValue('subjects')} idPrefix="subject" />
              </div>

              <div className="mb-4">
                <label className="form-label">Skills you teach</label>
                <CheckboxChips options={SKILLS} value={form.skills} onChange={setValue('skills')} idPrefix="skill" />
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="state">State</label>
                  <select id="state" className="form-select" value={form.state} onChange={set('state')}>
                    <option value="">Select a state</option>
                    {NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="city">City</label>
                  <input id="city" className="form-control" value={form.city} onChange={set('city')} placeholder="e.g. Ikeja" />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label">Lesson type</label>
                <div className="d-flex gap-4">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="lessonHome" checked={form.lessonTypes.includes('home')} onChange={toggleLesson('home')} />
                    <label className="form-check-label" htmlFor="lessonHome">In-person lessons</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="lessonOnline" checked={form.lessonTypes.includes('online')} onChange={toggleLesson('online')} />
                    <label className="form-check-label" htmlFor="lessonOnline">Online lessons</label>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label" htmlFor="rate">Hourly rate (₦)</label>
                <input id="rate" type="number" min="500" step="100" className="form-control" value={form.hourlyRate} onChange={set('hourlyRate')} placeholder="e.g. 4000" />
              </div>

              <div className="mb-4">
                <label className="form-label">Availability</label>
                <CheckboxChips options={DAYS} value={form.availability} onChange={setValue('availability')} idPrefix="day" />
              </div>

              <button type="submit" className="btn btn-primary-cta" disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-check-lg"></i>} Save Profile
              </button>
              <Link to="/tutor/dashboard" className="btn btn-secondary-cta ms-2">Back to Dashboard</Link>
            </form>
          </div>

          <div className="dashboard-panel mt-4" style={{ maxWidth: 800, margin: '2rem auto 0' }}>
            <div className="dashboard-panel-header">
              <h2><i className="bi bi-bank2"></i> Payout Bank Details</h2>
            </div>
            <p className="text-muted small">
              We pay your earnings directly to your verified Nigerian bank account. Required before admin approval.
            </p>

            {bank.payoutSetupDone ? (
              <div className="alert alert-success d-flex align-items-center justify-content-between">
                <div>
                  <i className="bi bi-check-circle-fill me-2"></i>
                  <strong>Verified:</strong> {bank.accountName} ({bank.bankName} - {bank.accountNumber})
                </div>
                <span className="badge bg-success">Active</span>
              </div>
            ) : (
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                You have not connected a verified bank account yet.
              </div>
            )}

            {bankError && <div className="form-error-banner"><i className="bi bi-exclamation-triangle-fill"></i> {bankError}</div>}

            <form onSubmit={handleBankSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="bankSelect">Bank</label>
                  <select
                    id="bankSelect"
                    className="form-select"
                    value={bank.bankCode}
                    onChange={(e) => {
                      const selected = e.target.options[e.target.selectedIndex];
                      setBank((prev) => ({
                        ...prev,
                        bankCode: e.target.value,
                        bankName: selected.text
                      }));
                    }}
                    required
                  >
                    <option value="">Select your bank</option>
                    <option value="044">Access Bank</option>
                    <option value="023">Citibank</option>
                    <option value="050">Ecobank</option>
                    <option value="070">Fidelity Bank</option>
                    <option value="011">First Bank of Nigeria</option>
                    <option value="214">First City Monument Bank (FCMB)</option>
                    <option value="058">Guaranty Trust Bank (GTBank)</option>
                    <option value="030">Heritage Bank</option>
                    <option value="301">Jaiz Bank</option>
                    <option value="082">Keystone Bank</option>
                    <option value="101">Providus Bank</option>
                    <option value="076">Polaris Bank</option>
                    <option value="221">Stanbic IBTC Bank</option>
                    <option value="068">Standard Chartered Bank</option>
                    <option value="232">Sterling Bank</option>
                    <option value="100">Suntrust Bank</option>
                    <option value="032">Union Bank of Nigeria</option>
                    <option value="033">United Bank for Africa (UBA)</option>
                    <option value="215">Unity Bank</option>
                    <option value="035">Wema Bank</option>
                    <option value="057">Zenith Bank</option>
                    <option value="090110">VFD Microfinance Bank</option>
                    <option value="090267">Kuda Bank</option>
                    <option value="100004">Opay</option>
                    <option value="100033">Palmpay</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="accNum">10-Digit NUBAN Account Number</label>
                  <input
                    id="accNum"
                    className="form-control"
                    maxLength={10}
                    placeholder="e.g. 0123456789"
                    value={bank.accountNumber}
                    onChange={(e) => setBank((prev) => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, '') }))}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary-cta" disabled={savingBank}>
                {savingBank ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-shield-check me-1"></i>}
                Verify &amp; Save Bank Account
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
