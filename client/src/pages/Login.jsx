import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DASHBOARD_PATH } from '../constants';

const DEMOS = [
  ['Admin', 'admin@learnx.ng', 'admin123', 'bi-shield-lock'],
  ['Learner', 'learner@learnx.ng', 'learner123', 'bi-mortarboard'],
  ['Tutor', 'chidinma@learnx.ng', 'tutor123', 'bi-person-workspace']
];

// Firebase reports wrong email and wrong password with the same generic codes
const BAD_CREDENTIALS = ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'];

export default function Login() {
  const { profile, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (profile) return <Navigate to={DASHBOARD_PATH[profile.role]} replace />;

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Enter your password.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setFormError('');
    try {
      const me = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${me.name.split(' ')[0]}!`);
      navigate(DASHBOARD_PATH[me.role]);
    } catch (err) {
      setFormError(BAD_CREDENTIALS.includes(err.code) ? 'Incorrect email or password.' : err.message || 'Could not log in.');
      setBusy(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="container">
        <Reveal className="auth-card">
          <span className="brand-mark">Learn<span className="brand-accent">X</span></span>
          <h1>Welcome back</h1>
          <p className="auth-subtitle">Log in to manage your lessons, requests and profile.</p>

          <form onSubmit={handleSubmit} noValidate>
            {formError && <div className="form-error-banner"><i className="bi bi-exclamation-triangle-fill"></i> {formError}</div>}
            <div className="mb-3">
              <label className="form-label" htmlFor="email">Email address</label>
              <input id="email" type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} value={form.email} onChange={set('email')} placeholder="you@example.com" />
              {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="password">Password</label>
              <input id="password" type="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} value={form.password} onChange={set('password')} placeholder="••••••••" />
              {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
            </div>
            <button type="submit" className="btn btn-primary-cta w-100 justify-content-center" disabled={busy}>
              {busy ? <><span className="spinner-border spinner-border-sm"></span> Logging in...</> : 'Log In'}
            </button>
          </form>

          <div className="auth-divider">or try a demo account</div>
          <div className="demo-accounts">
            {DEMOS.map(([role, email, password, icon]) => (
              <button type="button" className="demo-account-btn" key={role} onClick={() => setForm({ email, password })}>
                <span><strong>{role}</strong><span>{email}</span></span>
                <i className={`bi ${icon}`}></i>
              </button>
            ))}
          </div>

          <p className="auth-footer-link">Don't have an account? <Link to="/register">Create one</Link></p>
        </Reveal>
      </div>
    </section>
  );
}
