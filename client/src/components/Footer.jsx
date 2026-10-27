import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <footer className="site-footer">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4">
              <span className="brand-mark footer-brand">Learn<span className="brand-accent">X</span></span>
              <p className="footer-tagline">Connecting Nigeria's learners with trusted tutors, for home or online lessons.</p>
              <div className="social-icons">
                <a href="#" aria-label="Facebook"><i className="bi bi-facebook"></i></a>
                <a href="#" aria-label="Twitter / X"><i className="bi bi-twitter-x"></i></a>
                <a href="#" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
                <a href="#" aria-label="LinkedIn"><i className="bi bi-linkedin"></i></a>
              </div>
            </div>
            <div className="col-6 col-lg-2">
              <h5>Quick Links</h5>
              <ul className="footer-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/search">Find a Tutor</Link></li>
                <li><Link to="/register">Become a Tutor</Link></li>
                <li><Link to="/about">About</Link></li>
              </ul>
            </div>
            <div className="col-6 col-lg-3">
              <h5>Company</h5>
              <ul className="footer-links">
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to="/login">Log In</Link></li>
                <li><Link to="/register">Register</Link></li>
              </ul>
            </div>
            <div className="col-lg-3">
              <h5>Contact</h5>
              <ul className="footer-links">
                <li><i className="bi bi-envelope"></i> hello@learnx.ng</li>
                <li><i className="bi bi-telephone"></i> +234 800 000 0000</li>
                <li><i className="bi bi-geo-alt"></i> Nigeria</li>
              </ul>
            </div>
          </div>
          <hr />
          <p className="copyright">© 2026 LearnX. Built by Muhammad Ibrahim Umara. Final Year Project, Al-Ansar University.</p>
        </div>
      </footer>

      <button
        id="backToTop"
        className={showTop ? 'visible' : ''}
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <i className="bi bi-arrow-up"></i>
      </button>
    </>
  );
}
