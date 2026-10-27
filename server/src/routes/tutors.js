import { Router } from 'express';
import { db } from '../config/firebase.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { SUBJECTS, SKILLS, DAYS, LESSON_TYPES } from '../constants.js';
import { HttpError } from '../utils/httpError.js';
import { str, subset } from '../utils/validate.js';
import { filterTutors } from '../services/tutorSearch.js';

const router = Router();
const tutors = () => db.collection('tutors');
const withId = (doc) => ({ id: doc.id, ...doc.data() });

// GET /api/tutors  (public). Only approved (verified) tutors are ever listed.
router.get('/', async (req, res) => {
  const snap = await tutors().where('status', '==', 'approved').get();
  res.json({ tutors: filterTutors(snap.docs.map(withId), req.query) });
});

// GET /api/tutors/me  (the logged-in tutor's own profile, any status)
router.get('/me', verifyToken, requireRole('tutor'), async (req, res) => {
  const snap = await tutors().doc(req.user.uid).get();
  if (!snap.exists) throw new HttpError(404, 'Tutor profile not found.');
  res.json({ tutor: withId(snap) });
});

// PUT /api/tutors/me
// Whitelisted fields only: a tutor can never set their own status or rating.
router.put('/me', verifyToken, requireRole('tutor'), async (req, res) => {
  const b = req.body;
  const subjects = subset(b.subjects ?? [], 'Subjects', SUBJECTS);
  const skills = subset(b.skills ?? [], 'Skills', SKILLS);
  const lessonTypes = subset(b.lessonTypes ?? [], 'Lesson types', LESSON_TYPES);
  const availability = subset(b.availability ?? [], 'Availability', DAYS);

  if (!subjects.length && !skills.length) throw new HttpError(400, 'Select at least one subject or skill.');
  if (!lessonTypes.length) throw new HttpError(400, 'Choose home lessons, online lessons, or both.');
  if (!availability.length) throw new HttpError(400, 'Select at least one day you are available.');

  const bio = str(b.bio, 'Bio', { min: 20, max: 1000 });
  const state = str(b.state, 'State', { max: 40 });
  const city = str(b.city, 'City', { max: 60 });

  const hourlyRate = Number(b.hourlyRate);
  if (!Number.isFinite(hourlyRate) || hourlyRate < 500 || hourlyRate > 1000000) {
    throw new HttpError(400, 'Hourly rate must be between ₦500 and ₦1,000,000.');
  }

  const ref = tutors().doc(req.user.uid);
  await ref.update({
    bio, subjects, skills, lessonTypes, availability, state, city, hourlyRate: Math.round(hourlyRate)
  });
  res.json({ tutor: withId(await ref.get()) });
});

// GET /api/tutors/:id  (public, approved tutors only)
router.get('/:id', async (req, res) => {
  const snap = await tutors().doc(req.params.id).get();
  if (!snap.exists || snap.data().status !== 'approved') throw new HttpError(404, 'Tutor not found.');
  res.json({ tutor: withId(snap) });
});

export default router;
