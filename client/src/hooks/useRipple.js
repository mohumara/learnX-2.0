import { useEffect } from 'react';

const SELECTORS =
  '.btn-primary-cta, .btn-secondary-cta, .btn-get-started, .search-btn, .cta-btn, .view-profile-btn, .accept-btn, .decline-btn';

/** One delegated click listener that adds the ripple animation (see animations.css) to primary buttons. */
export default function useRipple() {
  useEffect(() => {
    const onClick = (e) => {
      const btn = e.target.closest(SELECTORS);
      if (!btn) return;

      btn.style.position = btn.style.position || 'relative';
      btn.style.overflow = 'hidden';

      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
}
