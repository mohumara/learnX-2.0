import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';
import StatCard from '../components/StatCard';
import StatusPill from '../components/StatusPill';
import TutorCard from '../components/TutorCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getMyRequests } from '../services/requests';
import { getBookmarkedTutors, toggleBookmark } from '../services/bookmarks';
import { initializePayment, confirmSession, disputeSession } from '../services/payments';
import { formatDate, formatCurrency } from '../lib/format';
import Modal from '../components/Modal';

export default function LearnerDashboard() {
  const { profile, updateName, setBookmarks } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState(profile.name);
  const [savingName, setSavingName] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [disputeModal, setDisputeModal] = useState({ open: false, requestId: null, reason: '' });
  const [disputing, setDisputing] = useState(false);

  useEffect(() => {
    Promise.all([getMyRequests(), getBookmarkedTutors()])
      .then(([r, b]) => {
        setRequests(r.requests);
        setSaved(b.tutors);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const removeBookmark = async (tutorId) => {
    try {
      const { bookmarks } = await toggleBookmark(tutorId);
      setBookmarks(bookmarks);
      setSaved((list) => list.filter((t) => t.id !== tutorId));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const saveName = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error('Enter your full name.');
    setSavingName(true);
    try {
      await updateName(name.trim());
      toast.success('Account details updated.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingName(false);
    }
  };

  const handlePay = async (requestId) => {
    setPayingId(requestId);
    try {
      const res = await initializePayment(requestId);
      if (res.authorization_url) {
        window.location.href = res.authorization_url;
      } else {
        toast.error('Could not get payment authorization from Paystack.');
      }
    } catch (err) {
      toast.error(err.message || 'Payment initiation failed.');
    } finally {
      setPayingId(null);
    }
  };

  const handleConfirm = async (requestId) => {
    if (!window.confirm('Are you sure you want to confirm that this lesson has taken place? This releases payment to the tutor.')) {
      return;
    }
    setConfirmingId(requestId);
    try {
      const res = await confirmSession(requestId);
      toast.success('Session confirmed! Thank you.');
      setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, ...res.request } : r)));
    } catch (err) {
      toast.error(err.message || 'Failed to confirm session.');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (disputeModal.reason.trim().length < 10) {
      return toast.error('Please provide a reason of at least 10 characters.');
    }
    setDisputing(true);
    try {
      const res = await disputeSession(disputeModal.requestId, disputeModal.reason.trim());
      toast.info('Dispute submitted. Admin will review the case.');
      setRequests((prev) => prev.map((r) => (r.id === disputeModal.requestId ? { ...r, ...res.request } : r)));
      setDisputeModal({ open: false, requestId: null, reason: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to submit dispute.');
    } finally {
      setDisputing(false);
    }
  };

  const accepted = requests.filter((r) => r.status === 'accepted').length;

  return (
    <>
      <PageHeader
        tag="Learner Dashboard"
        title={`Welcome back, ${profile.name.split(' ')[0]}`}
        text="Track your lesson requests and manage your bookmarked tutors."
      />

      <section className="dashboard-section">
        <div className="container">
          {loading ? <PageLoader /> : error ? (
            <EmptyState icon="bi-wifi-off" title="Couldn't load your dashboard" text={error} />
          ) : (
            <>
              <div className="row g-4 mb-4">
                <div className="col-md-4"><StatCard icon="bi-bookmark-heart-fill" color="amber" value={saved.length} label="Bookmarked Tutors" /></div>
                <div className="col-md-4"><StatCard icon="bi-send-fill" color="blue" value={requests.length} label="Requests Sent" /></div>
                <div className="col-md-4"><StatCard icon="bi-check-circle-fill" color="green" value={accepted} label="Accepted Requests" /></div>
              </div>

              <div className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <h2><i className="bi bi-inbox"></i> My Lesson Requests</h2>
                  <Link to="/search" className="btn view-profile-btn"><i className="bi bi-search"></i> Find More Tutors</Link>
                </div>
                {requests.length === 0 ? (
                  <EmptyState icon="bi-inbox" title="No lesson requests yet" text="Find a tutor and send your first lesson request." />
                ) : (
                  requests.map((r) => (
                    <div className="request-row" key={r.id}>
                      <div className="request-row-main">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <strong>{r.tutorName}</strong>
                          <span className="request-subject">{r.subject}</span>
                          {r.hours && <span className="badge bg-light text-dark border">{r.hours} {r.hours === 1 ? 'hr' : 'hrs'}</span>}
                          {r.grossAmount && <span className="badge bg-light text-dark border">{formatCurrency(r.grossAmount)}</span>}
                        </div>
                        <p>{r.message}</p>
                        <span className="request-date">{formatDate(r.createdAt)}</span>

                        {r.status === 'paid' && (
                          <div className="small text-muted mt-2">
                            <i className="bi bi-clock-history"></i> Auto-completes 3 days after payment if not confirmed or disputed.
                          </div>
                        )}
                      </div>

                      <div className="d-flex flex-column align-items-end gap-2">
                        <StatusPill status={r.status} />

                        {r.status === 'accepted' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary-cta"
                            disabled={payingId === r.id}
                            onClick={() => handlePay(r.id)}
                          >
                            {payingId === r.id ? (
                              <span className="spinner-border spinner-border-sm me-1"></span>
                            ) : (
                              <i className="bi bi-credit-card me-1"></i>
                            )}
                            Pay Now
                          </button>
                        )}

                        {r.status === 'paid' && (
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              disabled={confirmingId === r.id}
                              onClick={() => handleConfirm(r.id)}
                            >
                              {confirmingId === r.id ? (
                                <span className="spinner-border spinner-border-sm me-1"></span>
                              ) : (
                                <i className="bi bi-check-circle me-1"></i>
                              )}
                              Confirm Session
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => setDisputeModal({ open: true, requestId: r.id, reason: '' })}
                            >
                              Dispute
                            </button>
                          </div>
                        )}

                        {r.status === 'completed' && (!r.disputeDeadline || new Date() < new Date(r.disputeDeadline)) && (
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-danger p-0"
                            style={{ fontSize: '0.8rem' }}
                            onClick={() => setDisputeModal({ open: true, requestId: r.id, reason: '' })}
                          >
                            Raise Issue
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="dashboard-panel">
                <div className="dashboard-panel-header"><h2><i className="bi bi-bookmark-heart"></i> Bookmarked Tutors</h2></div>
                {saved.length === 0 ? (
                  <EmptyState icon="bi-bookmark-heart" title="No bookmarked tutors" text="Save tutors you like while browsing search results." />
                ) : (
                  <div className="row g-4">
                    {saved.map((t) => (
                      <div className="col-md-6 col-lg-4" key={t.id}>
                        <TutorCard tutor={t} bookmarked onToggleBookmark={removeBookmark} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="dashboard-panel">
                <div className="dashboard-panel-header"><h2><i className="bi bi-person-gear"></i> Account Settings</h2></div>
                <form className="row g-3" onSubmit={saveName} noValidate>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="accName">Full name</label>
                    <input id="accName" className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="accEmail">Email address</label>
                    <input id="accEmail" className="form-control" value={profile.email} disabled />
                  </div>
                  <div className="col-12">
                    <button type="submit" className="btn btn-primary-cta" disabled={savingName}>
                      <i className="bi bi-check-lg"></i> Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </section>

      {disputeModal.open && (
        <Modal title="Raise an issue / Dispute session" onClose={() => setDisputeModal({ open: false, requestId: null, reason: '' })}>
          <form onSubmit={handleDisputeSubmit}>
            <div className="modal-body">
              <p className="small text-muted mb-3">
                If the tutor failed to attend the session or there was a quality issue, please provide details below. Our support team will review this request and assist you.
              </p>
              <div className="mb-3">
                <label className="form-label" htmlFor="disputeReason">Reason for dispute</label>
                <textarea
                  id="disputeReason"
                  rows="4"
                  className="form-control"
                  placeholder="Explain what happened (minimum 10 characters)..."
                  value={disputeModal.reason}
                  onChange={(e) => setDisputeModal((prev) => ({ ...prev, reason: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary-cta"
                onClick={() => setDisputeModal({ open: false, requestId: null, reason: '' })}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-danger" disabled={disputing}>
                {disputing ? <span className="spinner-border spinner-border-sm me-1"></span> : null}
                Submit Dispute
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
