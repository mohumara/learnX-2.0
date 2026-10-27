export default function PageHeader({ tag, title, text, children }) {
  return (
    <header className="page-header">
      <div className="container d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          {tag && <span className="section-tag">{tag}</span>}
          <h1>{title}</h1>
          {text && <p>{text}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}
