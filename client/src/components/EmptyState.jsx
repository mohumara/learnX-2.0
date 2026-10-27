export default function EmptyState({ icon, title, text }) {
  return (
    <div className="empty-state">
      <i className={`bi ${icon}`}></i>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
