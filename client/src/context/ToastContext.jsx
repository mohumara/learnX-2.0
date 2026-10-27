import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);
const ICONS = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type) => {
    const id = Date.now() + Math.random();
    const patch = (changes) => setToasts((all) => all.map((t) => (t.id === id ? { ...t, ...changes } : t)));

    setToasts((all) => [...all, { id, message, type, show: false }]);
    setTimeout(() => patch({ show: true }), 20);
    setTimeout(() => patch({ show: false }), 3200);
    setTimeout(() => setToasts((all) => all.filter((t) => t.id !== id)), 3500);
  }, []);

  const api = useMemo(
    () => ({
      success: (m) => push(m, 'success'),
      error: (m) => push(m, 'error'),
      info: (m) => push(m, 'info')
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`app-toast app-toast-${t.type} ${t.show ? 'show' : ''}`}>
            <i className={`bi ${ICONS[t.type]}`}></i>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
