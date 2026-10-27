import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Reveal from '../components/Reveal';

const VALUES = [
  ['bi-patch-check-fill', 'Trust First', "Verification isn't an afterthought. It's the whole reason LearnX exists."],
  ['bi-geo-alt-fill', 'Built for Nigeria', 'Designed around local realities: home lessons, patchy connectivity, and real Naira pricing.'],
  ['bi-people-fill', 'Two-Sided Fairness', "A platform that's just as good for tutors earning income as it is for learners finding help."]
];

export default function About() {
  return (
    <>
      <PageHeader
        tag="About Us"
        title="Built to make finding a tutor in Nigeria simple again"
        text="LearnX is a marketplace, not a school and not a course platform. It connects learners with real, verified tutors."
      />

      <section className="static-content">
        <div className="container">
          <div className="row align-items-center g-5">
            <Reveal className="col-lg-6">
              <h2>Our story</h2>
              <p>
                Finding a qualified tutor in many parts of Nigeria still means asking around the neighbourhood
                and hoping for the best. LearnX exists to close that gap, giving parents, students and adult
                learners a trustworthy way to find tutors and skill instructors nearby, or online from anywhere
                in the country.
              </p>
              <p>
                We don't sell courses. Every tutor on LearnX is a real person, reviewed before their profile
                goes live, ready to teach one-on-one at home or online.
              </p>
            </Reveal>
            <Reveal className="col-lg-6">
              <h2>Who we serve</h2>
              <p>
                Parents hiring a tutor for their children. Secondary and university students preparing for exams.
                Adults picking up a new skill. And on the other side, teachers, private tutors and skill
                instructors looking to reach more students and earn extra income on their own schedule.
              </p>
            </Reveal>
          </div>

          <Reveal className="section-heading mt-5">
            <span className="section-tag">Our Values</span>
            <h2>What guides how we build LearnX</h2>
          </Reveal>

          <div className="row g-4">
            {VALUES.map(([icon, title, text]) => (
              <Reveal className="col-md-4" key={title}>
                <div className="value-card">
                  <i className={`bi ${icon}`}></i>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-banner">
        <div className="container">
          <Reveal className="cta-content">
            <h2>Ready to get started?</h2>
            <p>Find a tutor near you, or start teaching and earning on your own schedule.</p>
            <Link to="/search" className="btn cta-btn"><i className="bi bi-search"></i> Find a Tutor</Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
