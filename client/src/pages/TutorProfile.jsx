import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CheckboxChips from '../components/CheckboxChips';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';
import { useToast } from '../context/ToastContext';
import { getMyTutorProfile, saveMyTutorProfile } from '../services/tutors';
import { DAYS, NIGERIAN_STATES, SKILLS, SUBJECTS } from '../constants';

export default function TutorProfile() {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState('');
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyTutorProfile()
      .then(({ tutor }) => {
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
                    <label className="form-check-label" htmlFor="lessonHome">Home lessons</label>
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
        </div>
      </section>
    </>
  );
}
