import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Reveal from '../components/Reveal';
import { useToast } from '../context/ToastContext';
import { sendContactMessage } from '../services/contact';

const EMPTY = { name: '', email: '', message: '' };

export default function Contact() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
  };

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (form.message.trim().length < 10) next.message = 'Message must be at least 10 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSending(true);
    try {
      await sendContactMessage(form);
      setForm(EMPTY);
      setSent(true);
      toast.success("Message sent. We'll get back to you soon.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const field = (name) => `form-control ${errors[name] ? 'is-invalid' : ''}`;

  return (
    <>
      <PageHeader tag="Contact" title="We'd love to hear from you" text="Questions, feedback, or a partnership idea? Send us a message." />

      <section className="static-content">
        <div className="container">
          <div className="row g-4">
            <Reveal className="col-lg-7">
              <div className="dashboard-panel">
                {sent && (
                  <div className="form-success-banner">
                    <i className="bi bi-check-circle-fill"></i> Thanks, your message has been sent. We'll reply soon.
                  </div>
                )}
                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="cName">Full name</label>
                    <input id="cName" className={field('name')} value={form.name} onChange={set('name')} placeholder="Your name" />
                    {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="cEmail">Email address</label>
                    <input id="cEmail" type="email" className={field('email')} value={form.email} onChange={set('email')} placeholder="you@example.com" />
                    {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="cMessage">Message</label>
                    <textarea id="cMessage" rows="5" className={field('message')} value={form.message} onChange={set('message')} placeholder="How can we help?" />
                    {errors.message && <div className="invalid-feedback d-block">{errors.message}</div>}
                  </div>
                  <button type="submit" className="btn btn-primary-cta" disabled={sending}>
                    {sending ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-send"></i>} Send Message
                  </button>
                </form>
              </div>
            </Reveal>

            <Reveal className="col-lg-5">
              <div className="contact-info-card">
                <h3 className="mb-4">Other ways to reach us</h3>
                <div className="contact-info-row"><i className="bi bi-envelope"></i><div><strong>Email</strong><span>hello@learnx.ng</span></div></div>
                <div className="contact-info-row"><i className="bi bi-telephone"></i><div><strong>Phone</strong><span>+234 800 000 0000</span></div></div>
                <div className="contact-info-row"><i className="bi bi-geo-alt"></i><div><strong>Location</strong><span>Nigeria</span></div></div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
