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

  const hours = Number(req.body.hours);
  if (!Number.isFinite(hours) || hours < 0.5 || hours > 8 || (hours * 2) % 1 !== 0) {
    throw new HttpError(400, 'Hours must be between 0.5 and 8 in 0.5 increments.');
  }

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
    hours,
    status: 'pending',
    paymentRef: null,
    paymentStatus: 'unpaid',
    grossAmount: null,
    platformFee: null,
    tutorEarning: null,
    paidAt: null,
    confirmedAt: null,
    autoConfirmed: false,
    disputedAt: null,
    disputeDeadline: null,
    reviewId: null,
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

// PATCH /api/requests/:id  (tutor accepts or declines, or learner edits a pending request)
// confirm and dispute endpoints live in routes/payments.js
router.patch('/:id', requireRole('tutor', 'learner'), async (req, res) => {
  const ref = requests().doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, 'Request not found.');
  const requestData = snap.data();

  if (requestData.status !== 'pending') {
    throw new HttpError(409, 'Only pending requests can be modified.');
  }

  // Tutor flow: accept or decline
  if (req.user.role === 'tutor') {
    if (requestData.tutorId !== req.user.uid) throw new HttpError(403, 'Permission denied.');
    const status = oneOf(req.body.status, 'Status', ['accepted', 'declined']);
    await ref.update({ status });
    return res.json({ request: { id: snap.id, ...requestData, status } });
  }

  // Learner flow: edit message, subject, or hours
  if (req.user.role === 'learner') {
    if (requestData.learnerId !== req.user.uid) throw new HttpError(403, 'Permission denied.');

    const updates = {};
    if (req.body.message !== undefined) {
      updates.message = str(req.body.message, 'Message', { min: 10, max: 500 });
    }
    if (req.body.hours !== undefined) {
      const hours = Number(req.body.hours);
      if (!Number.isFinite(hours) || hours < 0.5 || hours > 8 || (hours * 2) % 1 !== 0) {
        throw new HttpError(400, 'Hours must be between 0.5 and 8 in 0.5 increments.');
      }
      updates.hours = hours;
    }
    if (req.body.subject !== undefined) {
      updates.subject = str(req.body.subject, 'Subject', { max: 60 });
    }

    if (Object.keys(updates).length === 0) {
      throw new HttpError(400, 'No fields to update provided.');
    }

    await ref.update(updates);
    const updatedSnap = await ref.get();
    return res.json({ request: { id: updatedSnap.id, ...updatedSnap.data() } });
  }
});

// DELETE /api/requests/:id  (learner cancels a pending request)
router.delete('/:id', requireRole('learner'), async (req, res) => {
  const ref = requests().doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, 'Request not found.');
  const requestData = snap.data();

  if (requestData.learnerId !== req.user.uid) {
    throw new HttpError(403, 'You do not have permission to cancel this request.');
  }

  if (requestData.status !== 'pending') {
    throw new HttpError(400, 'Only pending requests can be cancelled.');
  }

  await ref.update({ status: 'cancelled' });
  res.json({ success: true, message: 'Request cancelled successfully.' });
});

export default router;
