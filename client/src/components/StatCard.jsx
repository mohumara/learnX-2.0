export default function StatCard({ icon, color, value, label }) {
  return (
    <div className="stat-card">
      <div className={`stat-card-icon icon-${color}`}><i className={`bi ${icon}`}></i></div>
      <div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}
