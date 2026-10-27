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
import { formatDate } from '../lib/format';

const STATUS_LABELS = { approved: 'Verified', pending: 'Pending Review', rejected: 'Not Approved' };

export default function TutorDashboard() {
  const { profile } = useAuth();
  const toast = useToast();
  const [tutor, setTutor] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

              <div className="row g-4 mb-4">
                <div className="col-md-4"><StatCard icon="bi-star-fill" color="amber" value={tutor.rating ? tutor.rating.toFixed(1) : 'N/A'} label="Average Rating" /></div>
                <div className="col-md-4"><StatCard icon="bi-hourglass-split" color="blue" value={pending} label="Pending Requests" /></div>
                <div className="col-md-4"><StatCard icon="bi-check-circle-fill" color="green" value={accepted} label="Accepted Requests" /></div>
              </div>

              <div className="dashboard-panel">
                <div className="dashboard-panel-header"><h2><i className="bi bi-inbox"></i> Lesson Requests</h2></div>
                {requests.length === 0 ? (
                  <EmptyState icon="bi-inbox" title="No lesson requests yet" text="When learners request lessons, they'll show up here." />
                ) : (
                  requests.map((r) => (
                    <div className="request-row" key={r.id}>
                      <div className="request-row-main">
                        <strong>{r.learnerName}</strong>
                        <span className="request-subject">{r.subject}</span>
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
