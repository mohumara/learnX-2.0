import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Reveal from '../components/Reveal';
import StatCounter from '../components/StatCounter';
import { useAuth } from '../context/AuthContext';
import { SKILLS, SUBJECTS, DASHBOARD_PATH } from '../constants';

const FEATURES = [
  { icon: 'bi-patch-check-fill', color: 'blue', title: 'Verified Tutors', text: "Every tutor's profile is reviewed by our team before it ever appears in a search result." },
  { icon: 'bi-geo-alt-fill', color: 'green', title: 'Location-Based Matching', text: 'Search by state, city or neighbourhood to find tutors who can actually reach you for home lessons.' },
  { icon: 'bi-camera-video-fill', color: 'amber', title: 'Home & Online Lessons', text: 'Learn face-to-face at home, or connect with a tutor from anywhere in the country online.' },
  { icon: 'bi-cash-coin', color: 'blue', title: 'Affordable Pricing', text: 'Tutors set transparent hourly rates, so you can compare and choose what fits your budget.' },
  { icon: 'bi-mortarboard-fill', color: 'green', title: 'Qualified Teachers', text: 'From certified schoolteachers to skilled professionals, every instructor brings real expertise.' },
  { icon: 'bi-shield-fill-check', color: 'amber', title: 'Safe & Trusted Platform', text: 'Ratings and verification work together to keep every lesson safe for parents and learners.' }
];

const POPULAR_SUBJECTS = [
  ['Mathematics', 'bi-calculator'], ['English', 'bi-chat-square-text'], ['Physics', 'bi-magnet'],
  ['Chemistry', 'bi-droplet-half'], ['Biology', 'bi-flower1'], ['Economics', 'bi-currency-exchange']
];

const POPULAR_SKILLS = [
  ['Programming', 'bi-code-slash'], ['Graphic Design', 'bi-palette2'], ['UI/UX', 'bi-layout-wtf'],
  ['Video Editing', 'bi-camera-reels'], ['Digital Marketing', 'bi-megaphone'], ['Public Speaking', 'bi-mic']
];

const LEARNER_STEPS = [
  ['Search', 'Tell us the subject or skill, your location, and whether you want home or online lessons.'],
  ['Connect', 'Browse verified tutor profiles, compare ratings and rates, then send a lesson request.'],
  ['Start Learning', 'Agree on a schedule and begin lessons, at home or online, on your own terms.']
];

const TUTOR_STEPS = [
  ['Create Profile', 'Showcase your subjects, skills, experience and availability in a few minutes.'],
  ['Get Verified', 'We review your profile so learners can trust who they are hiring.'],
  ['Receive Lesson Requests', 'Get discovered by learners near you or online, and start earning on your schedule.']
];

const TESTIMONIALS = [
  { quote: 'I was nervous about letting a stranger teach my son at home. The verification badge and reviews made the decision easy.', name: 'Rukayat M.', role: 'Parent, Kano', color: 'blue', initials: 'RM' },
  { quote: 'I found a Further Maths tutor two streets away in one evening. My WAEC grade went from a C to an A1.', name: 'Tobi E.', role: 'Student, Lagos', color: 'green', initials: 'TE' },
  { quote: 'Teaching on LearnX after school hours now covers my transport and data for the month. The requests come in steadily.', name: 'David O.', role: 'Physics Tutor, Ibadan', color: 'amber', initials: 'DO' }
];

const FAQS = [
  ['How do I hire a tutor?', 'Search by subject or skill, filter by location and lesson type, then browse verified profiles. Once you find a good fit, send a lesson request directly from their profile.'],
  ['Are tutors verified?', "Yes. Every tutor's profile is reviewed by our admin team before it is listed, so you can hire with confidence."],
  ['Can lessons be online?', "Yes. Choose Online when searching and location won't matter. You can learn from a tutor anywhere in Nigeria."],
  ['How much does it cost?', "Each tutor sets their own hourly rate, so pricing varies by subject, experience and lesson type. You'll always see the rate upfront on their profile."]
];

export default function Home() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('home');
  const [openFaq, setOpenFaq] = useState(0);

  const isGuest = !profile;
  const goesToDashboard = profile && profile.role !== 'learner';

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (subject) params.set(SKILLS.includes(subject) ? 'skill' : 'subject', subject);
    if (city.trim()) params.set('city', city.trim());
    params.set('type', type);
    navigate(`/search?${params}`);
  };

  return (
    <>
      {/* Hero */}
      <header className="hero">
        <div className="container">
          <div className="row align-items-center">
            <Reveal className="col-lg-6 hero-copy">
              <span className="eyebrow"><i className="bi bi-geo-alt-fill"></i> Built for Nigeria, tutor by tutor</span>
              <h1>Find trusted tutors near you, or teach and earn extra income</h1>
              <p className="lead-text">
                LearnX connects parents, students and lifelong learners with verified tutors and skill
                instructors across Nigeria, for home lessons in your neighbourhood or online lessons
                from anywhere. No courses to buy. Just real people, ready to teach.
              </p>
              <div className="hero-actions">
                {goesToDashboard ? (
                  <Link to={DASHBOARD_PATH[profile.role]} className="btn btn-primary-cta">
                    <i className="bi bi-speedometer2"></i> Go to Dashboard
                  </Link>
                ) : (
                  <Link to="/search" className="btn btn-primary-cta"><i className="bi bi-search"></i> Find a Tutor</Link>
                )}
                {isGuest && (
                  <Link to="/register" className="btn btn-secondary-cta"><i className="bi bi-mortarboard"></i> Become a Tutor</Link>
                )}
              </div>
              <div className="hero-trust">
                <div className="trust-item"><i className="bi bi-patch-check-fill"></i> Verified tutors</div>
                <div className="trust-item"><i className="bi bi-house-heart"></i> Home & online lessons</div>
                <div className="trust-item"><i className="bi bi-shield-check"></i> Safe by design</div>
              </div>
            </Reveal>

            <div className="col-lg-6 hero-visual">
              <div className="visual-stage">
                <div className="stage-core"><i className="bi bi-mortarboard-fill"></i></div>
                <div className="float-card card-tutor-1">
                  <div className="avatar avatar-blue">CN</div>
                  <div><strong>Chidinma N.</strong><span>Mathematics · Lagos</span></div>
                  <i className="bi bi-patch-check-fill verified-badge"></i>
                </div>
                <div className="float-card card-tutor-2">
                  <div className="avatar avatar-green">AB</div>
                  <div><strong>Abdullahi B.</strong><span>Physics · Online</span></div>
                  <i className="bi bi-patch-check-fill verified-badge"></i>
                </div>
                <div className="float-card card-tutor-3">
                  <div className="avatar avatar-amber">FO</div>
                  <div><strong>Funmilayo O.</strong><span>UI/UX Design · Ibadan</span></div>
                  <i className="bi bi-patch-check-fill verified-badge"></i>
                </div>
                <div className="float-chip chip-rating"><i className="bi bi-star-fill"></i> 4.9 average rating</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search preview */}
      <section className="search-section">
        <div className="container">
          <Reveal as="form" className="search-card" onSubmit={handleSearch}>
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="search-label" htmlFor="homeSubject">What do you want to learn?</label>
                <div className="input-icon">
                  <i className="bi bi-book"></i>
                  <select id="homeSubject" className="form-select" value={subject} onChange={(e) => setSubject(e.target.value)}>
                    <option value="">Any subject or skill</option>
                    <optgroup label="Subjects">{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</optgroup>
                    <optgroup label="Skills">{SKILLS.map((s) => <option key={s}>{s}</option>)}</optgroup>
                  </select>
                </div>
              </div>
              <div className="col-md-3">
                <label className="search-label" htmlFor="homeCity">Location</label>
                <div className="input-icon">
                  <i className="bi bi-geo-alt"></i>
                  <input id="homeCity" className="form-control" placeholder="City or area" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
              </div>
              <div className="col-md-3">
                <span className="search-label">Lesson Type</span>
                <div className="lesson-toggle" role="group" aria-label="Lesson type">
                  <input type="radio" className="btn-check" name="lessonType" id="typeHome" checked={type === 'home'} onChange={() => setType('home')} />
                  <label className="btn toggle-btn" htmlFor="typeHome"><i className="bi bi-house-door"></i> Home</label>
                  <input type="radio" className="btn-check" name="lessonType" id="typeOnline" checked={type === 'online'} onChange={() => setType('online')} />
                  <label className="btn toggle-btn" htmlFor="typeOnline"><i className="bi bi-camera-video"></i> Online</label>
                </div>
              </div>
              <div className="col-md-2">
                <button type="submit" className="btn search-btn w-100"><i className="bi bi-search"></i> Search</button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Why LearnX */}
      <section className="why-section">
        <div className="container">
          <Reveal className="section-heading">
            <span className="section-tag">Why LearnX</span>
            <h2>A safer, simpler way to find who teaches you next</h2>
            <p>Every feature below exists because hiring a tutor in Nigeria has always meant guesswork. We removed it.</p>
          </Reveal>
          <div className="row g-4">
            {FEATURES.map((f) => (
              <Reveal className="col-md-6 col-lg-4" key={f.title}>
                <div className="feature-card">
                  <div className={`feature-icon icon-${f.color}`}><i className={`bi ${f.icon}`}></i></div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Popular subjects and skills */}
      <section className="subjects-section">
        <div className="container">
          <Reveal className="section-heading">
            <span className="section-tag">What you can learn</span>
            <h2>Popular subjects and in-demand skills</h2>
            <p>Whether it's WAEC prep or a new career skill, there's a tutor on LearnX for it.</p>
          </Reveal>
          <div className="row g-5">
            <div className="col-lg-6">
              <h3 className="subject-group-title"><i className="bi bi-journal-bookmark-fill"></i> Popular Subjects</h3>
              <Reveal className="subject-grid">
                {POPULAR_SUBJECTS.map(([name, icon]) => (
                  <Link key={name} to={`/search?subject=${encodeURIComponent(name)}`} className="subject-chip">
                    <i className={`bi ${icon}`}></i> {name}
                  </Link>
                ))}
              </Reveal>
            </div>
            <div className="col-lg-6">
              <h3 className="subject-group-title"><i className="bi bi-stars"></i> Popular Skills</h3>
              <Reveal className="subject-grid">
                {POPULAR_SKILLS.map(([name, icon]) => (
                  <Link key={name} to={`/search?skill=${encodeURIComponent(name)}`} className="subject-chip">
                    <i className={`bi ${icon}`}></i> {name}
                  </Link>
                ))}
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-section">
        <div className="container">
          <Reveal className="section-heading">
            <span className="section-tag">How It Works</span>
            <h2>Two paths, both simple</h2>
            <p>Whether you're here to learn or to teach, you'll be set up in three steps.</p>
          </Reveal>
          <div className="row g-5">
            {[
              ['For Learners', 'bi-person-raised-hand', LEARNER_STEPS, ''],
              ['For Tutors', 'bi-mortarboard', TUTOR_STEPS, 'marker-green']
            ].map(([label, icon, steps, markerClass]) => (
              <div className="col-lg-6" key={label}>
                <div className="how-track">
                  <div className="how-track-label"><i className={`bi ${icon}`}></i> {label}</div>
                  {steps.map(([title, text], i) => (
                    <Reveal className="how-step" key={title}>
                      <div className={`step-marker ${markerClass}`}>{i + 1}</div>
                      <div><h4>{title}</h4><p>{text}</p></div>
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics (illustrative launch figures) */}
      <section className="stats-section">
        <div className="container">
          <div className="row g-4 text-center">
            <div className="col-6 col-lg-3"><StatCounter target={500} suffix="+" label="Tutors" /></div>
            <div className="col-6 col-lg-3"><StatCounter target={2000} suffix="+" label="Students" /></div>
            <div className="col-6 col-lg-3"><StatCounter target={1500} suffix="+" label="Lessons" /></div>
            <div className="col-6 col-lg-3"><StatCounter target={20} suffix="+" label="Subjects" /></div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <Reveal className="section-heading">
            <span className="section-tag">Real Stories</span>
            <h2>What parents, students and tutors say</h2>
          </Reveal>
          <div className="row g-4">
            {TESTIMONIALS.map((t) => (
              <Reveal className="col-lg-4" key={t.name}>
                <div className="testimonial-card">
                  <i className="bi bi-quote quote-icon"></i>
                  <p>"{t.quote}"</p>
                  <div className="testimonial-author">
                    <div className={`avatar avatar-${t.color}`}>{t.initials}</div>
                    <div><strong>{t.name}</strong><span>{t.role}</span></div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Become a tutor CTA (hidden for learners and admins) */}
      {(isGuest || profile?.role === 'tutor') && (
        <section className="cta-banner">
          <div className="container">
            <Reveal className="cta-content">
              <h2>Have a subject or skill to teach? Turn it into income.</h2>
              <p>Join verified tutors already earning on LearnX. Set your own rates and choose your own hours.</p>
              <Link to={isGuest ? '/register' : '/tutor/profile'} className="btn cta-btn">
                <i className="bi bi-arrow-right-circle"></i> {isGuest ? 'Start Teaching Today' : 'Update Your Profile'}
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="faq-section">
        <div className="container">
          <Reveal className="section-heading">
            <span className="section-tag">Questions</span>
            <h2>Frequently asked questions</h2>
          </Reveal>
          <Reveal className="accordion faq-accordion">
            {FAQS.map(([question, answer], i) => (
              <div className="accordion-item" key={question}>
                <h3 className="accordion-header">
                  <button
                    className={`accordion-button ${openFaq === i ? '' : 'collapsed'}`}
                    type="button"
                    aria-expanded={openFaq === i}
                    onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  >
                    {question}
                  </button>
                </h3>
                <div className={`accordion-collapse collapse ${openFaq === i ? 'show' : ''}`}>
                  <div className="accordion-body">{answer}</div>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
}
