export default function StarRating({ rating = 0 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="stars">
      {Array.from({ length: full }, (_, i) => <i key={`f${i}`} className="bi bi-star-fill"></i>)}
      {half && <i className="bi bi-star-half"></i>}
      {Array.from({ length: empty }, (_, i) => <i key={`e${i}`} className="bi bi-star"></i>)}
    </span>
  );
}
