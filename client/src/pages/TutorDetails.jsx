import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import PageLoader from '../components/PageLoader';
import StarRating from '../components/StarRating';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getTutor } from '../services/tutors';
import { sendLessonRequest } from '../services/requests';
import { toggleBookmark } from '../services/bookmarks';
import { formatCurrency } from '../lib/format';

export default function TutorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, setBookmarks } = useAuth();
  const toast = useToast();
  const [tutor, setTutor] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing
  const [modalOpen, setModalOpen] = useState(false);
  const [request, setRequest] = useState({ subject: '', message: '', hours: 1, lessonType: '' });
  const [requestError, setRequestError] = useState('');
  const [sending, setSending] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    setStatus('loading');
    getTutor(id)
      .then(({ tutor }) => {
        setTutor(tutor);
        setRequest({
          subject: [...tutor.subjects, ...tutor.skills][0] || '',
          message: '',
          hours: 1,
          lessonType: tutor.lessonTypes.includes('online') ? 'online' : 'in-person'
        });
        setStatus('ready');
      })
      .catch(() => setStatus('missing'));
  }, [id]);

  if (status === 'loading') return <div style={{ paddingTop: 100 }}><PageLoader /></div>;
  if (status === 'missing') {
    return (
      <section className="dashboard-section" style={{ paddingTop: 130 }}>
        <div className="container">
          <EmptyState icon="bi-person-x" title="Tutor not found" text="This tutor profile may have been removed or is not available." />
        </div>
      </section>
    );
  }

  const isLearner = profile?.role === 'learner';
  const bookmarked = profile?.bookmarks?.includes(tutor.id);
  const teaches = [...tutor.subjects, ...tutor.skills];
  const lessonOptions = [
    tutor.lessonTypes.includes('online') && { value: 'online', label: 'Online' },
    tutor.lessonTypes.includes('home') && { value: 'in-person', label: 'In-person' }
  ].filter(Boolean);

  const handleBookmark = async () => {
    try {
      const result = await toggleBookmark(tutor.id);
      setBookmarks(result.bookmarks);
      toast.success(result.bookmarked ? 'Added to bookmarks.' : 'Removed from bookmarks.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (request.message.trim().length < 10) {
      setRequestError('Please add a short message (at least 10 characters).');
      return;
    }
    setSending(true);
    try {
      await sendLessonRequest({
        tutorId: tutor.id,
        subject: request.subject,
        message: request.message.trim(),
        hours: Number(request.hours),
        lessonType: request.lessonType
      });
      setModalOpen(false);
      setRequest((r) => ({ ...r, message: '', hours: 1 }));
      setRequestError('');
      setShowSuccessBanner(true);
      setTimeout(() => {
        navigate('/learner/dashboard');
      }, 1500);
    } catch (err) {
      setRequestError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="dashboard-section" style={{ paddingTop: 130 }}>
      <div className="container">
        <Link to="/search" className="d-inline-flex align-items-center gap-2 mb-4 text-decoration-none" style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>
          <i className="bi bi-arrow-left"></i> Back to search
        </Link>

        <div className="row g-4">
          <div className="col-lg-4">
            <div className="tutor-profile-card">
              <Avatar name={tutor.name} size="xl" />
              <h2>{tutor.name} <i className="bi bi-patch-check-fill verified-badge-inline"></i></h2>
              <div className="tutor-rating justify-content-center">
                <StarRating rating={tutor.rating} />
                <span className="rating-value">{tutor.rating.toFixed(1)}</span>
                <span className="rating-count">({tutor.reviewsCount} reviews)</span>
              </div>
              <p className="tutor-location justify-content-center"><i className="bi bi-geo-alt"></i> {tutor.city}, {tutor.state}</p>
              <div className="tutor-rate-big">{formatCurrency(tutor.hourlyRate)}<small>/hour</small></div>

              {isLearner ? (
                <>
                  <button type="button" className="btn btn-secondary-cta w-100 mb-2" onClick={handleBookmark}>
                    <i className={`bi ${bookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i> {bookmarked ? 'Bookmarked' : 'Bookmark'}
                  </button>
                  <button type="button" className="btn btn-primary-cta w-100" onClick={() => setModalOpen(true)}>
                    <i className="bi bi-send"></i> Send Lesson Request
                  </button>
                </>
              ) : profile ? (
                <p className="text-muted small mt-3">Only learners can send lesson requests.</p>
              ) : (
                <Link to="/login" className="btn btn-primary-cta w-100">
                  <i className="bi bi-box-arrow-in-right"></i> Log In to Request a Lesson
                </Link>
              )}
            </div>
          </div>

          <div className="col-lg-8">
            <div className="tutor-detail-section">
              <h4>About</h4>
              <p>{tutor.bio || 'This tutor has not written a bio yet.'}</p>
            </div>
            <div className="tutor-detail-section">
              <h4>Subjects &amp; Skills</h4>
              <div className="tutor-tags">
                {teaches.length ? teaches.map((t) => <span className="tag-chip" key={t}>{t}</span>) : <span className="text-muted">Not specified yet.</span>}
              </div>
            </div>
            <div className="tutor-detail-section">
              <h4>Lesson Type</h4>
              <div className="tutor-tags">
                {tutor.lessonTypes.includes('home') && <span className="lesson-pill home"><i className="bi bi-person"></i> In-person Lessons</span>}
                {tutor.lessonTypes.includes('online') && <span className="lesson-pill online"><i className="bi bi-camera-video"></i> Online Lessons</span>}
              </div>
            </div>
            <div className="tutor-detail-section">
              <h4>Availability</h4>
              <div className="tutor-tags">
                {tutor.availability.length ? tutor.availability.map((d) => <span className="tag-chip" key={d}>{d}</span>) : <span className="text-muted">Not specified yet.</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <Modal title={`Send a lesson request to ${tutor.name}`} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSend} noValidate>
            <div className="modal-body">
              {requestError && <div className="form-error-banner"><i className="bi bi-exclamation-triangle-fill"></i> {requestError}</div>}
              <div className="mb-3">
                <label className="form-label" htmlFor="reqSubject">Subject</label>
                <select id="reqSubject" className="form-select" value={request.subject} onChange={(e) => setRequest((r) => ({ ...r, subject: e.target.value }))}>
                  {teaches.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="reqHours">Estimated Hours</label>
                <select
                  id="reqHours"
                  className="form-select"
                  value={request.hours}
                  onChange={(e) => setRequest((r) => ({ ...r, hours: parseFloat(e.target.value) }))}
                >
                  {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8].map((h) => (
                    <option key={h} value={h}>
                      {h} {h === 1 ? 'hour' : 'hours'}
                    </option>
                  ))}
                </select>
                <div className="form-text mt-1">
                  Estimated Total: <strong>{formatCurrency(request.hours * (tutor?.hourlyRate || 0))}</strong> ({formatCurrency(tutor?.hourlyRate || 0)}/hr)
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="reqLessonType">Lesson format</label>
                <select
                  id="reqLessonType"
                  className="form-select"
                  value={request.lessonType}
                  onChange={(e) => setRequest((r) => ({ ...r, lessonType: e.target.value }))}
                >
                  {lessonOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="reqMessage">Message</label>
                <textarea
                  id="reqMessage"
                  rows="4"
                  className="form-control"
                  placeholder={`Tell ${tutor.name.split(' ')[0]} what you'd like help with...`}
                  value={request.message}
                  onChange={(e) => { setRequest((r) => ({ ...r, message: e.target.value })); setRequestError(''); }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary-cta" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary-cta" disabled={sending}>
                {sending ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-send"></i>} Send Request
              </button>
            </div>
          </form>
        </Modal>
      )}
      {showSuccessBanner && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '36px 44px',
              maxWidth: '520px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              textAlign: 'center',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10B981',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                marginBottom: '18px'
              }}
            >
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <h3 style={{ fontWeight: 700, color: '#1F2937', marginBottom: '8px' }}>
              Lesson Request Sent Successfully!
            </h3>
            <p style={{ color: '#6B7280', fontSize: '0.95rem', margin: 0 }}>
              Your tutor will be notified. Taking you to your requests...
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
