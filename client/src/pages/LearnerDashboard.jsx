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
import { formatDate } from '../lib/format';

export default function LearnerDashboard() {
  const { profile, updateName, setBookmarks } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState(profile.name);
  const [savingName, setSavingName] = useState(false);

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
                        <strong>{r.tutorName}</strong>
                        <span className="request-subject">{r.subject}</span>
                        <p>{r.message}</p>
                        <span className="request-date">{formatDate(r.createdAt)}</span>
                      </div>
                      <StatusPill status={r.status} />
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
    </>
  );
}
