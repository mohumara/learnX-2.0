import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';
import StatCard from '../components/StatCard';
import StatusPill from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getMyTutorProfile } from '../services/tutors';
import { getMyRequests, respondToRequest } from '../services/requests';
import { formatDate, formatCurrency } from '../lib/format';

const STATUS_LABELS = { approved: 'Verified', pending: 'Pending Review', rejected: 'Not Approved' };

export default function TutorDashboard() {
  const { profile } = useAuth();
  const toast = useToast();
  const [tutor, setTutor] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    Promise.all([getMyTutorProfile(), getMyRequests()])
      .then(([t, r]) => {
        setTutor(t.tutor);
        setRequests(r.requests);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const respond = async (id, status) => {
    try {
      await respondToRequest(id, status);
      setRequests((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
      toast[status === 'accepted' ? 'success' : 'info'](`Request ${status}.`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const incomplete = tutor && !tutor.subjects.length && !tutor.skills.length;
  const pending = requests.filter((r) => r.status === 'pending').length;
  const accepted = requests.filter((r) => r.status === 'accepted').length;
  const paymentHistory = requests.filter((r) => r.grossAmount != null || (r.paymentStatus && r.paymentStatus !== 'unpaid'));
  const availableForWithdrawal = paymentHistory
    .filter((r) => r.status === 'completed')
    .reduce((total, r) => total + Number(r.tutorEarning || 0), 0);

  const handleWithdraw = () => {
    if (availableForWithdrawal <= 0) {
      return toast.info('You will be able to withdraw after a learner confirms a paid lesson.');
    }
    if (!window.confirm(`Simulate withdrawal of ${formatCurrency(availableForWithdrawal)}? No real funds will be transferred.`)) return;
    setWithdrawing(true);
    window.setTimeout(() => {
      setWithdrawing(false);
      toast.success(`Simulated withdrawal of ${formatCurrency(availableForWithdrawal)} submitted.`);
    }, 500);
  };

  return (
    <>
      <PageHeader
        tag="Tutor Dashboard"
        title={`Welcome back, ${profile.name.split(' ')[0]}`}
        text="Manage your profile and respond to lesson requests."
      >
        {tutor && <StatusPill status={tutor.status} label={STATUS_LABELS[tutor.status]} />}
      </PageHeader>

      <section className="dashboard-section">
        <div className="container">
          {loading ? <PageLoader /> : error ? (
            <EmptyState icon="bi-wifi-off" title="Couldn't load your dashboard" text={error} />
          ) : (
            <>
              {incomplete && (
                <div className="form-error-banner">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  Your profile is empty. Add your subjects, rate and availability so we can review and list you.
                  <Link to="/tutor/profile" className="ms-auto fw-bold">Complete profile</Link>
                </div>
              )}

              {!tutor.payoutSetupDone && (
                <div className="form-error-banner mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <i className="bi bi-bank2"></i>
                  <strong>Bank details required:</strong> You must configure your payout bank account before your profile can be approved by admins and receive payouts.
                  <Link to="/tutor/profile" className="ms-auto fw-bold">Add bank details</Link>
                </div>
              )}

              <div className="row g-4 mb-4">
                <div className="col-md-3"><StatCard icon="bi-star-fill" color="amber" value={tutor.rating ? tutor.rating.toFixed(1) : 'N/A'} label="Average Rating" /></div>
                <div className="col-md-3"><StatCard icon="bi-hourglass-split" color="blue" value={pending} label="Pending Requests" /></div>
                <div className="col-md-3"><StatCard icon="bi-check-circle-fill" color="green" value={accepted} label="Accepted Requests" /></div>
                <div className="col-md-3"><StatCard icon="bi-wallet2" color="purple" value={formatCurrency(tutor.totalEarnings || 0)} label="Total Earnings" /></div>
              </div>

              <div className="dashboard-panel">
                <div className="dashboard-panel-header"><h2><i className="bi bi-inbox"></i> Lesson Requests</h2></div>
                {requests.length === 0 ? (
                  <EmptyState icon="bi-inbox" title="No lesson requests yet" text="When learners request lessons, they'll show up here." />
                ) : (
                  requests.map((r) => (
                    <div className="request-row" key={r.id}>
                      <div className="request-row-main">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <strong>{r.learnerName}</strong>
                          <span className="request-subject">{r.subject}</span>
                          {r.hours && <span className="badge bg-light text-dark border">{r.hours} {r.hours === 1 ? 'hr' : 'hrs'}</span>}
                          {r.tutorEarning && <span className="badge bg-success-subtle text-success border">Earns {formatCurrency(r.tutorEarning)}</span>}
                        </div>
                        <p>{r.message}</p>
                        <span className="request-date">{formatDate(r.createdAt)}</span>
                      </div>
                      {r.status === 'pending' ? (
                        <div className="request-actions">
                          <button type="button" className="btn accept-btn" onClick={() => respond(r.id, 'accepted')}><i className="bi bi-check-lg"></i> Accept</button>
                          <button type="button" className="btn decline-btn" onClick={() => respond(r.id, 'declined')}><i className="bi bi-x-lg"></i> Decline</button>
                        </div>
                      ) : (
                        <StatusPill status={r.status} />
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <h2><i className="bi bi-wallet2"></i> Payment History</h2>
                  <button type="button" className="btn btn-primary-cta" disabled={withdrawing} onClick={handleWithdraw}>
                    {withdrawing ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-cash-coin me-1"></i>}
                    Withdraw
                  </button>
                </div>
                <p className="text-muted small mb-3">
                  Available to withdraw: <strong>{formatCurrency(availableForWithdrawal)}</strong>
                </p>
                {paymentHistory.length === 0 ? (
                  <EmptyState icon="bi-receipt" title="No payment history yet" text="Earnings from paid lessons will appear here." />
                ) : (
                  paymentHistory.map((r) => (
                    <div className="request-row" key={`payment-${r.id}`}>
                      <div className="request-row-main">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <strong>{r.learnerName}</strong>
                          <span className="request-subject">{r.subject}</span>
                        </div>
                        <p>{r.hours} {r.hours === 1 ? 'hour' : 'hours'} lesson{r.tutorEarning != null ? ` · You earn ${formatCurrency(r.tutorEarning)}` : ''}</p>
                        <span className="request-date">{formatDate(r.paidAt || r.createdAt)}</span>
                      </div>
                      <StatusPill status={r.status} label={r.status === 'paid' ? 'Payment received' : r.status === 'completed' ? 'Ready to withdraw' : r.paymentStatus || r.status} />
                    </div>
                  ))
                )}
              </div>

              <div className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <h2><i className="bi bi-person-workspace"></i> My Profile</h2>
                  <Link to="/tutor/profile" className="btn view-profile-btn"><i className="bi bi-pencil-square"></i> Edit Profile</Link>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                  Keep your bio, subjects, skills, rate and availability up to date. Only approved tutors appear in search results.
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
