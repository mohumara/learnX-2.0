import { Router } from 'express';
import { db } from '../config/firebase.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { HttpError } from '../utils/httpError.js';
import { str, oneOf } from '../utils/validate.js';

const router = Router();
const requests = () => db.collection('requests');
const withId = (doc) => ({ id: doc.id, ...doc.data() });
const newestFirst = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

router.use(verifyToken);

// POST /api/requests  (learner sends a lesson request)
router.post('/', requireRole('learner'), async (req, res) => {
  const tutorId = str(req.body.tutorId, 'Tutor', { max: 128 });
  const subject = str(req.body.subject, 'Subject', { max: 60 });
  const message = str(req.body.message, 'Message', { min: 10, max: 500 });

  const tutorSnap = await db.collection('tutors').doc(tutorId).get();
  if (!tutorSnap.exists || tutorSnap.data().status !== 'approved') {
    throw new HttpError(404, 'Tutor not found.');
  }
  const tutor = tutorSnap.data();
  if (![...tutor.subjects, ...tutor.skills].includes(subject)) {
    throw new HttpError(400, 'This tutor does not teach that subject.');
  }

  // Block duplicates: one open request per learner, tutor and subject
  const mine = await requests().where('learnerId', '==', req.user.uid).get();
  const duplicate = mine.docs.some((d) => {
    const r = d.data();
    return r.tutorId === tutorId && r.subject === subject && r.status === 'pending';
  });
  if (duplicate) throw new HttpError(409, 'You already have a pending request for this tutor and subject.');

  const data = {
    learnerId: req.user.uid,
    learnerName: req.user.name,
    tutorId,
    tutorName: tutor.name,
    subject,
    message,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  const ref = await requests().add(data);
  res.status(201).json({ request: { id: ref.id, ...data } });
});

// GET /api/requests/mine  (a learner's sent requests, or a tutor's received ones)
router.get('/mine', requireRole('learner', 'tutor'), async (req, res) => {
  const field = req.user.role === 'learner' ? 'learnerId' : 'tutorId';
  const snap = await requests().where(field, '==', req.user.uid).get();
  res.json({ requests: snap.docs.map(withId).sort(newestFirst) });
});

// PATCH /api/requests/:id  (tutor accepts or declines a pending request)
router.patch('/:id', requireRole('tutor'), async (req, res) => {
  const status = oneOf(req.body.status, 'Status', ['accepted', 'declined']);

  const ref = requests().doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists || snap.data().tutorId !== req.user.uid) throw new HttpError(404, 'Request not found.');
  if (snap.data().status !== 'pending') throw new HttpError(409, 'This request has already been answered.');

  await ref.update({ status });
  res.json({ request: { id: snap.id, ...snap.data(), status } });
});

export default router;
