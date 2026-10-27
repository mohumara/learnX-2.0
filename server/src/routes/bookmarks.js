import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { HttpError } from '../utils/httpError.js';

const router = Router();
router.use(verifyToken, requireRole('learner'));

// GET /api/bookmarks  (full tutor records for everything this learner saved)
router.get('/', async (req, res) => {
  const ids = req.user.bookmarks || [];
  if (!ids.length) return res.json({ tutors: [] });

  const docs = await db.getAll(...ids.map((id) => db.collection('tutors').doc(id)));
  const tutors = docs
    .filter((d) => d.exists && d.data().status === 'approved')
    .map((d) => ({ id: d.id, ...d.data() }));
  res.json({ tutors });
});

// POST /api/bookmarks/:tutorId  (toggle). Returns the new list of bookmarked ids.
router.post('/:tutorId', async (req, res) => {
  const { tutorId } = req.params;
  const userRef = db.collection('users').doc(req.user.uid);
  const current = req.user.bookmarks || [];

  if (current.includes(tutorId)) {
    await userRef.update({ bookmarks: FieldValue.arrayRemove(tutorId) });
    return res.json({ bookmarked: false, bookmarks: current.filter((id) => id !== tutorId) });
  }

  const tutorSnap = await db.collection('tutors').doc(tutorId).get();
  if (!tutorSnap.exists || tutorSnap.data().status !== 'approved') throw new HttpError(404, 'Tutor not found.');

  await userRef.update({ bookmarks: FieldValue.arrayUnion(tutorId) });
  res.json({ bookmarked: true, bookmarks: [...current, tutorId] });
});

export default router;
