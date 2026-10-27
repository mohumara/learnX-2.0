import { useEffect, useRef, useState } from 'react';

/** Counts up from 0 to `target` once, when it scrolls into view. */
export default function StatCounter({ target, suffix = '', label }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const run = () => {
      const duration = 1600;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        setValue(Math.floor((1 - Math.pow(1 - progress, 3)) * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (!('IntersectionObserver' in window)) {
      setValue(target);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        run();
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div className="stat-item" ref={ref}>
      <span className="stat-number">{value.toLocaleString()}{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
