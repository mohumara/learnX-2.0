import { capitalize } from '../lib/format';

const ICONS = {
  approved: 'bi-patch-check-fill',
  pending: 'bi-hourglass-split',
  rejected: 'bi-x-circle'
};

/** Coloured pill for request statuses and tutor approval statuses. */
export default function StatusPill({ status, label }) {
  return (
    <span className={`status-pill status-${status}`}>
      {ICONS[status] && <i className={`bi ${ICONS[status]}`}></i>}
      {label || capitalize(status)}
    </span>
  );
}
