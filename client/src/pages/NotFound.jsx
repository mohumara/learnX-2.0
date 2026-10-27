import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="error-section">
      <div className="container">
        <span className="error-code">404</span>
        <h1 className="mt-3">This page wandered off somewhere</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 420, margin: '10px auto 28px' }}>
          The page you're looking for doesn't exist or may have moved. Let's get you back on track.
        </p>
        <Link to="/" className="btn btn-primary-cta"><i className="bi bi-house-door"></i> Back to Home</Link>
      </div>
    </section>
  );
}
