import { getInitials } from '../lib/format';

const COLORS = ['blue', 'green', 'amber'];

export default function Avatar({ name, size = '' }) {
  const color = COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
  return <span className={`avatar avatar-${color} ${size ? `avatar-${size}` : ''}`.trim()}>{getInitials(name)}</span>;
}
