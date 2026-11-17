import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DASHBOARD_PATH } from '../constants';
import Avatar from './Avatar';
import { useNotifications } from '../context/NotificationContext';

// Links depend on who is signed in, so a tutor never sees "Find a Tutor".
const LINKS = {
  guest: [['/', 'Home'], ['/search', 'Find a Tutor'], ['/about', 'About'], ['/contact', 'Contact']],
  learner: [['/', 'Home'], ['/search', 'Find a Tutor'], ['/learner/dashboard', 'My Requests'], ['/chats', 'Chats'], ['/about', 'About'], ['/contact', 'Contact']],
  tutor: [['/', 'Home'], ['/tutor/dashboard', 'Lesson Requests'], ['/chats', 'Chats'], ['/tutor/profile', 'My Profile'], ['/about', 'About'], ['/contact', 'Contact']],
  admin: [['/', 'Home'], ['/admin', 'Admin Dashboard'], ['/about', 'About'], ['/contact', 'Contact']]
};

export default function Navbar() {
  const { profile, loading, logout } = useAuth();
  const { notifications, unreadCount, markAllRead, openNotification } = useNotifications();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setUserOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onDown = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) setNotificationsOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const links = LINKS[profile?.role || 'guest'];

  return (
    <nav className={`navbar navbar-expand-lg fixed-top ${scrolled ? 'scrolled' : ''}`} id="mainNav">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <span className="brand-mark">Learn<span className="brand-accent">X</span></span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`}>
          <ul className="navbar-nav mx-auto">
            {links.map(([to, label]) => (
              <li className="nav-item" key={to}>
                <NavLink to={to} end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="d-flex gap-2 nav-actions align-items-center">
            {loading ? null : profile ? (
              <>
                {['learner', 'tutor'].includes(profile.role) && (
                  <div className="notif-mount" ref={notificationsRef}>
                    <button className="notif-bell" type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}>
                      <i className="bi bi-bell"></i>
                      {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </button>
                    {notificationsOpen && (
                      <div className="notif-dropdown dropdown-menu dropdown-menu-end show" data-bs-popper="static">
                        <div className="notif-dropdown-header">
                          <strong>Notifications</strong>
                          {unreadCount > 0 && <button className="mark-read-btn" type="button" onClick={() => markAllRead()}>Mark all read</button>}
                        </div>
                        {notifications.length === 0 ? <p className="notif-empty">No notifications yet.</p> : notifications.slice(0, 8).map((notification) => (
                          <button
                            type="button"
                            className={`notif-item ${notification.read ? '' : 'unread'}`}
                            key={notification.id}
                            onClick={() => openNotification(notification)}
                          >
                            <p>{notification.title}</p>
                            <span>{notification.message}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="dropdown user-menu" ref={userRef}>
                  <button className="user-menu-btn" type="button" aria-expanded={userOpen} onClick={() => setUserOpen((o) => !o)}>
                    <Avatar name={profile.name} size="sm" />
                    <span className="user-menu-name">{profile.name.split(' ')[0]}</span>
                    <i className="bi bi-chevron-down"></i>
                  </button>
                  <ul className={`dropdown-menu dropdown-menu-end ${userOpen ? 'show' : ''}`} data-bs-popper="static">
                    <li>
                      <Link className="dropdown-item" to={DASHBOARD_PATH[profile.role]}>
                        <i className="bi bi-speedometer2"></i> Dashboard
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item" type="button" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right"></i> Log Out
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-login">Log In</Link>
                <Link to="/register" className="btn btn-get-started">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
