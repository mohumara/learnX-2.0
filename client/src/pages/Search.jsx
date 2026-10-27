import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import TutorCard from '../components/TutorCard';
import TutorCardSkeleton from '../components/TutorCardSkeleton';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { searchTutors } from '../services/tutors';
import { toggleBookmark } from '../services/bookmarks';
import { NIGERIAN_STATES, SKILLS, SUBJECTS } from '../constants';

const EMPTY_FILTERS = {
  keyword: '', subject: '', skill: '', state: '', city: '',
  online: false, home: false, maxRate: '', minRating: ''
};

export default function Search() {
  const [params] = useSearchParams();
  const { profile, setBookmarks } = useAuth();
  const toast = useToast();

  // The landing page and subject chips link here with ?subject=, ?skill=, ?city= and ?type=
  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
    subject: params.get('subject') || '',
    skill: params.get('skill') || '',
    city: params.get('city') || '',
    online: params.get('type') === 'online',
    home: params.get('type') === 'home'
  });
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Re-run the search shortly after the filters stop changing
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await searchTutors(filters);
        if (!cancelled) {
          setTutors(data.tutors);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters]);

  const set = (field) => (e) =>
    setFilters((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleBookmark = async (tutorId) => {
    try {
      const { bookmarked, bookmarks } = await toggleBookmark(tutorId);
      setBookmarks(bookmarks);
      toast.success(bookmarked ? 'Added to bookmarks.' : 'Removed from bookmarks.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isLearner = profile?.role === 'learner';

  return (
    <>
      <PageHeader
        tag="Find a Tutor"
        title="Search verified tutors across Nigeria"
        text="Filter by subject, skill, location, lesson type and more. Every tutor listed has been approved by our team."
      />

      <section className="dashboard-section" style={{ paddingTop: 10 }}>
        <div className="container">
          <form className="search-filters-bar" onSubmit={(e) => e.preventDefault()}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="search-label" htmlFor="keyword">Keyword</label>
                <div className="input-icon">
                  <i className="bi bi-search"></i>
                  <input id="keyword" className="form-control" placeholder="Name, subject or skill" value={filters.keyword} onChange={set('keyword')} />
                </div>
              </div>
              <div className="col-md-2">
                <label className="search-label" htmlFor="subject">Subject</label>
                <select id="subject" className="form-select" value={filters.subject} onChange={set('subject')}>
                  <option value="">All Subjects</option>
                  {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <label className="search-label" htmlFor="skill">Skill</label>
                <select id="skill" className="form-select" value={filters.skill} onChange={set('skill')}>
                  <option value="">All Skills</option>
                  {SKILLS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <label className="search-label" htmlFor="state">State</label>
                <select id="state" className="form-select" value={filters.state} onChange={set('state')}>
                  <option value="">All States</option>
                  {NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="search-label" htmlFor="city">City</label>
                <input id="city" className="form-control" placeholder="e.g. Ikeja" value={filters.city} onChange={set('city')} />
              </div>
            </div>

            <div className="filter-toggle-row">
              <label className="filter-check"><input type="checkbox" checked={filters.online} onChange={set('online')} /> Online lessons</label>
              <label className="filter-check"><input type="checkbox" checked={filters.home} onChange={set('home')} /> Home lessons</label>

              <div className="filter-check">
                Max rate:
                <select className="form-select form-select-sm" style={{ width: 'auto' }} value={filters.maxRate} onChange={set('maxRate')}>
                  <option value="">Any</option>
                  <option value="3000">₦3,000/hr</option>
                  <option value="4000">₦4,000/hr</option>
                  <option value="5000">₦5,000/hr</option>
                  <option value="10000">₦10,000/hr</option>
                </select>
              </div>

              <div className="filter-check">
                Min rating:
                <select className="form-select form-select-sm" style={{ width: 'auto' }} value={filters.minRating} onChange={set('minRating')}>
                  <option value="">Any</option>
                  <option value="4">4.0+</option>
                  <option value="4.5">4.5+</option>
                  <option value="4.8">4.8+</option>
                </select>
              </div>

              <button type="button" className="btn btn-secondary-cta ms-auto" onClick={() => setFilters(EMPTY_FILTERS)}>
                <i className="bi bi-x-circle"></i> Clear Filters
              </button>
            </div>
          </form>

          <div className="results-header">
            <h2>{loading ? 'Searching...' : `${tutors.length} tutor${tutors.length === 1 ? '' : 's'} found`}</h2>
          </div>

          <div className="row g-4">
            {loading ? (
              <TutorCardSkeleton />
            ) : error ? (
              <EmptyState icon="bi-wifi-off" title="Couldn't load tutors" text={error} />
            ) : tutors.length === 0 ? (
              <EmptyState icon="bi-search" title="No tutors match your filters" text="Try widening your search: remove a filter or search a broader subject." />
            ) : (
              tutors.map((tutor) => (
                <div className="col-md-6 col-lg-4" key={tutor.id}>
                  <TutorCard
                    tutor={tutor}
                    bookmarked={profile?.bookmarks?.includes(tutor.id)}
                    onToggleBookmark={isLearner ? handleBookmark : undefined}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}
