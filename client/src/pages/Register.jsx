import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DASHBOARD_PATH } from '../constants';

export default function Register() {
  const { profile, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ role: 'learner', name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (profile) return <Navigate to={DASHBOARD_PATH[profile.role]} replace />;

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
  };

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (form.password.length < 6) next.password = 'Password must be at least 6 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setBusy(true);
    setFormError('');
    try {
      const me = await register({ ...form, name: form.name.trim(), email: form.email.trim() });
      toast.success('Account created! Welcome to LearnX.');
      // Tutors fill in their profile first; everyone else goes to their dashboard
      navigate(me.role === 'tutor' ? '/tutor/profile' : DASHBOARD_PATH[me.role]);
    } catch (err) {
      setFormError(err.message || 'Could not create your account.');
      setBusy(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="container">
        <Reveal className="auth-card">
          <span className="brand-mark">Learn<span className="brand-accent">X</span></span>
          <h1>Create your account</h1>
          <p className="auth-subtitle">Join LearnX as a learner looking for a tutor, or a tutor looking for students.</p>

          <form onSubmit={handleSubmit} noValidate>
            {formError && <div className="form-error-banner"><i className="bi bi-exclamation-triangle-fill"></i> {formError}</div>}

            <div className="mb-3">
              <label className="form-label">I want to join as a...</label>
              <div className="role-select-group">
                <div className="role-option">
                  <input type="radio" name="role" id="roleLearner" value="learner" checked={form.role === 'learner'} onChange={set('role')} />
                  <label htmlFor="roleLearner"><i className="bi bi-mortarboard"></i> Learner</label>
                </div>
                <div className="role-option">
                  <input type="radio" name="role" id="roleTutor" value="tutor" checked={form.role === 'tutor'} onChange={set('role')} />
                  <label htmlFor="roleTutor"><i className="bi bi-person-workspace"></i> Tutor</label>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="name">Full name</label>
              <input id="name" className={`form-control ${errors.name ? 'is-invalid' : ''}`} value={form.name} onChange={set('name')} placeholder="e.g. Amaka Johnson" />
              {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="email">Email address</label>
              <input id="email" type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} value={form.email} onChange={set('email')} placeholder="you@example.com" />
              {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="password">Password</label>
              <input id="password" type="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} value={form.password} onChange={set('password')} placeholder="At least 6 characters" />
              {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
            </div>

            <button type="submit" className="btn btn-primary-cta w-100 justify-content-center" disabled={busy}>
              {busy ? <><span className="spinner-border spinner-border-sm"></span> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer-link">Already have an account? <Link to="/login">Log in</Link></p>
        </Reveal>
      </div>
    </section>
  );
}
