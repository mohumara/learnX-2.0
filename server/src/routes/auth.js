import { Router } from 'express';
import { auth, db } from '../config/firebase.js';
import { verifyToken } from '../middleware/auth.js';
import { SELF_REGISTER_ROLES } from '../constants.js';
import { HttpError } from '../utils/httpError.js';
import { str, isEmail, oneOf } from '../utils/validate.js';

const router = Router();

/** The shape of a user returned to the client (never includes anything sensitive). */
export const toProfile = (u) => ({
  uid: u.uid,
  name: u.name,
  email: u.email,
  role: u.role,
  bookmarks: u.bookmarks || [],
  createdAt: u.createdAt
});

// POST /api/auth/register
// Registration runs on the server so a person can never choose "admin" for themselves.
router.post('/register', async (req, res) => {
  const name = str(req.body.name, 'Name', { min: 2, max: 80 });
  const email = str(req.body.email, 'Email', { max: 120 }).toLowerCase();
  if (!isEmail(email)) throw new HttpError(400, 'Enter a valid email address.');

  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (password.length < 6 || password.length > 100) {
    throw new HttpError(400, 'Password must be at least 6 characters.');
  }
  const role = oneOf(req.body.role, 'Account type', SELF_REGISTER_ROLES);

  let record;
  try {
    record = await auth.createUser({ email, password, displayName: name });
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      throw new HttpError(409, 'An account with this email already exists.');
    }
    throw err;
  }

  const now = new Date().toISOString();
  const batch = db.batch();
  batch.set(db.collection('users').doc(record.uid), { name, email, role, bookmarks: [], createdAt: now });

  if (role === 'tutor') {
    batch.set(db.collection('tutors').doc(record.uid), {
      name, bio: '', subjects: [], skills: [], lessonTypes: [], state: '', city: '',
      hourlyRate: 0, availability: [], status: 'pending', rating: 0, reviewsCount: 0, createdAt: now
    });
  }

  try {
    await batch.commit();
  } catch (err) {
    await auth.deleteUser(record.uid).catch(() => {}); // don't leave a half-created account behind
    throw err;
  }

  res.status(201).json({ uid: record.uid });
});

// GET /api/auth/me
router.get('/me', verifyToken, (req, res) => {
  res.json(toProfile(req.user));
});

// PATCH /api/auth/me  (name only; email changes need re-authentication, left out of the MVP)
router.patch('/me', verifyToken, async (req, res) => {
  const name = str(req.body.name, 'Name', { min: 2, max: 80 });

  const batch = db.batch();
  batch.update(db.collection('users').doc(req.user.uid), { name });
  if (req.user.role === 'tutor') batch.update(db.collection('tutors').doc(req.user.uid), { name });
  await batch.commit();

  res.json(toProfile({ ...req.user, name }));
});

export default router;
