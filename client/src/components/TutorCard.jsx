import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import StarRating from './StarRating';
import { formatCurrency } from '../lib/format';

/** Tutor summary card. Pass `onToggleBookmark` to show the bookmark button (learners only). */
export default function TutorCard({ tutor, bookmarked = false, onToggleBookmark }) {
  const tags = [...tutor.subjects, ...tutor.skills].slice(0, 3);

  return (
    <div className="tutor-card">
      <div className="tutor-card-top">
        <Avatar name={tutor.name} size="lg" />
        {onToggleBookmark && (
          <button
            type="button"
            className={`bookmark-btn ${bookmarked ? 'active' : ''}`}
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark tutor'}
            onClick={() => onToggleBookmark(tutor.id)}
          >
            <i className={`bi ${bookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
          </button>
        )}
      </div>

      <h3>
        {tutor.name} <i className="bi bi-patch-check-fill verified-badge-inline" title="Verified"></i>
      </h3>

      <div className="tutor-rating">
        <StarRating rating={tutor.rating} />
        <span className="rating-value">{tutor.rating.toFixed(1)}</span>
        <span className="rating-count">({tutor.reviewsCount})</span>
      </div>

      <div className="tutor-tags">
        {tags.map((t) => <span className="tag-chip" key={t}>{t}</span>)}
      </div>

      <p className="tutor-location">
        <i className="bi bi-geo-alt"></i> {tutor.city}, {tutor.state}
        {tutor.lessonTypes.includes('online') && <span className="lesson-pill online">Online</span>}
        {tutor.lessonTypes.includes('home') && <span className="lesson-pill home">Home</span>}
      </p>

      <div className="tutor-card-footer">
        <span className="tutor-rate">{formatCurrency(tutor.hourlyRate)}<small>/hr</small></span>
        <Link to={`/tutors/${tutor.id}`} className="btn view-profile-btn">View Profile</Link>
      </div>
    </div>
  );
}
