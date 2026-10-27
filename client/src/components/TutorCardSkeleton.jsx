/** Placeholder cards shown while tutors load. */
export default function TutorCardSkeleton({ count = 6 }) {
  return Array.from({ length: count }, (_, i) => (
    <div className="col-md-6 col-lg-4" key={i}>
      <div className="tutor-card skeleton-card">
        <div className="skeleton skeleton-circle"></div>
        <div className="skeleton skeleton-line" style={{ width: '60%' }}></div>
        <div className="skeleton skeleton-line" style={{ width: '40%' }}></div>
        <div className="skeleton skeleton-line" style={{ width: '80%' }}></div>
        <div className="skeleton skeleton-line" style={{ width: '50%' }}></div>
      </div>
    </div>
  ));
}
