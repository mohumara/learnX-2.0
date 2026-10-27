/**
 * In-memory tutor filtering.
 *
 * Firestore can't combine several array filters or do partial text matching in one
 * query, so the route fetches all approved tutors (one cheap, auto-indexed query)
 * and applies the remaining filters here. Fine for hundreds of tutors. At larger
 * scale the upgrade path is a search service such as Algolia or Typesense.
 */
export function filterTutors(tutors, q = {}) {
  const keyword = String(q.keyword || '').trim().toLowerCase();
  const city = String(q.city || '').trim().toLowerCase();
  const state = String(q.state || '').trim().toLowerCase();
  const maxRate = Number(q.maxRate) || 0;
  const minRating = Number(q.minRating) || 0;
  const wantOnline = q.online === 'true';
  const wantHome = q.home === 'true';

  return tutors
    .filter((t) => {
      if (q.subject && !t.subjects.includes(q.subject)) return false;
      if (q.skill && !t.skills.includes(q.skill)) return false;
      if (state && t.state.toLowerCase() !== state) return false;
      if (city && !t.city.toLowerCase().includes(city)) return false;
      if (wantOnline && !t.lessonTypes.includes('online')) return false;
      if (wantHome && !t.lessonTypes.includes('home')) return false;
      if (maxRate && t.hourlyRate > maxRate) return false;
      if (minRating && t.rating < minRating) return false;
      if (keyword) {
        const haystack = [t.name, ...t.subjects, ...t.skills].join(' ').toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      return true;
    })
    .sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
}
