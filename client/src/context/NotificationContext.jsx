import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notifications';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const initialized = useRef(false);
  const knownIds = useRef(new Set());

  const load = useCallback(async () => {
    if (!profile || !['learner', 'tutor'].includes(profile.role)) return;
    const { notifications: incoming } = await getMyNotifications();
    if (initialized.current) {
      const newAlerts = incoming.filter((item) => !item.read && !knownIds.current.has(item.id));
      if (newAlerts.length) setAlerts((items) => [...items, ...newAlerts]);
    }
    knownIds.current = new Set(incoming.map((item) => item.id));
    initialized.current = true;
    setNotifications(incoming);
  }, [profile]);

  useEffect(() => {
    initialized.current = false;
    knownIds.current = new Set();
    setNotifications([]);
    setAlerts([]);
    if (!profile || !['learner', 'tutor'].includes(profile.role)) return undefined;
    load().catch(() => {});
    const interval = window.setInterval(() => load().catch(() => {}), 5000);
    return () => window.clearInterval(interval);
  }, [profile, load]);

  const markRead = useCallback(async (id) => {
    await markNotificationRead(id);
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item));
    setAlerts((items) => items.filter((item) => item.id !== id));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    setAlerts([]);
  }, []);

  const openNotification = useCallback(async (notification) => {
    if (!notification.read) await markRead(notification.id);
    navigate(notification.link);
  }, [markRead, navigate]);

  const dismissAlert = useCallback((id) => {
    setAlerts((items) => items.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(() => ({
    notifications,
    alerts,
    unreadCount: notifications.filter((item) => !item.read).length,
    markRead,
    markAllRead,
    openNotification,
    dismissAlert
  }), [notifications, alerts, markRead, markAllRead, openNotification, dismissAlert]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="notification-alert-queue" aria-live="polite">
        {alerts.map((notification) => (
          <section className="notification-alert" key={notification.id}>
            <button type="button" className="btn-close" aria-label="Dismiss" onClick={() => dismissAlert(notification.id)}></button>
            <div className="notification-alert-icon"><i className="bi bi-bell-fill"></i></div>
            <div className="notification-alert-content">
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-sm btn-primary-cta" onClick={() => openNotification(notification)}>View</button>
                <button type="button" className="btn btn-sm btn-secondary-cta" onClick={() => markRead(notification.id)}>Mark as read</button>
              </div>
            </div>
          </section>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
