import { Router } from 'express';
import { db } from '../config/firebase.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { HttpError } from '../utils/httpError.js';

const router = Router();
const notifications = () => db.collection('notifications');
const withId = (doc) => ({ id: doc.id, ...doc.data() });

router.use(verifyToken, requireRole('learner', 'tutor'));

// GET /api/notifications/mine
router.get('/mine', async (req, res) => {
  const snap = await notifications().where('recipientId', '==', req.user.uid).get();
  const items = snap.docs.map(withId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ notifications: items });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  const ref = notifications().doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, 'Notification not found.');
  if (snap.data().recipientId !== req.user.uid) throw new HttpError(403, 'Permission denied.');
  if (!snap.data().read) await ref.update({ read: true, readAt: new Date().toISOString() });
  res.json({ notification: { id: snap.id, ...snap.data(), read: true } });
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res) => {
  const snap = await notifications().where('recipientId', '==', req.user.uid).get();
  const batch = db.batch();
  snap.docs.filter((doc) => !doc.data().read).forEach((doc) => batch.update(doc.ref, { read: true, readAt: new Date().toISOString() }));
  await batch.commit();
  res.json({ success: true });
});

export default router;
