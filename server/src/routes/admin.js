import { Router } from 'express';
import { auth, db } from '../config/firebase.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { HttpError } from '../utils/httpError.js';
import { oneOf } from '../utils/validate.js';
import * as notify from '../services/notify.js';

const router = Router();
router.use(verifyToken, requireRole('admin'));

const count = async (query) => (await query.count().get()).data().count;

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  // TODO: totalRevenue calculation (requires aggregating platformFee from paid/completed requests)
  const [totalUsers, totalTutors, pendingTutors, totalRequests, pendingDisputes] = await Promise.all([
    count(db.collection('users')),
    count(db.collection('tutors')),
    count(db.collection('tutors').where('status', '==', 'pending')),
    count(db.collection('requests')),
    count(db.collection('requests').where('status', '==', 'disputed'))
  ]);
  res.json({ totalUsers, totalTutors, pendingTutors, totalRequests, pendingDisputes });
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const snap = await db.collection('users').get();
  const users = snap.docs
    .map((d) => ({ uid: d.id, name: d.data().name, email: d.data().email, role: d.data().role, createdAt: d.data().createdAt }))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json({ users });
});

// GET /api/admin/tutors  (every tutor, any status)
router.get('/tutors', async (req, res) => {
  const snap = await db.collection('tutors').get();
  res.json({ tutors: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
});

// PATCH /api/admin/tutors/:id/status  (approve or reject)
router.patch('/tutors/:id/status', async (req, res) => {
  const status = oneOf(req.body.status, 'Status', ['approved', 'rejected']);
  const tutorRef = db.collection('tutors').doc(req.params.id);
  const userRef = db.collection('users').doc(req.params.id);

  const [tutorSnap, userSnap] = await Promise.all([
    tutorRef.get(),
    userRef.get()
  ]);

  if (!tutorSnap.exists) throw new HttpError(404, 'Tutor not found.');

  const tutor = tutorSnap.data();
  if (status === 'approved' && tutor.payoutSetupDone !== true) {
    throw new HttpError(400, 'This tutor must set up bank details before they can be approved.');
  }

  await tutorRef.update({ status });

  const tutorEmail = userSnap.exists ? userSnap.data().email : null;
  const tutorName = tutor.name || (userSnap.exists ? userSnap.data().name : '');

  notify.tutorStatusChanged({ tutorId: req.params.id, status, tutorEmail, tutorName }).catch((err) => {
    console.error('[notify:tutorStatusChanged]', err.message);
  });

  res.json({ id: req.params.id, status });
});

// DELETE /api/admin/users/:uid  (removes the account, tutor profile and related requests)
router.delete('/users/:uid', async (req, res) => {
  const { uid } = req.params;
  const userRef = db.collection('users').doc(uid);
  const snap = await userRef.get();
  if (!snap.exists) throw new HttpError(404, 'User not found.');
  if (snap.data().role === 'admin') throw new HttpError(403, 'Admin accounts cannot be deleted here.');

  const [asLearner, asTutor] = await Promise.all([
    db.collection('requests').where('learnerId', '==', uid).get(),
    db.collection('requests').where('tutorId', '==', uid).get()
  ]);

  const batch = db.batch();
  batch.delete(userRef);
  batch.delete(db.collection('tutors').doc(uid));
  [...asLearner.docs, ...asTutor.docs].forEach((d) => batch.delete(d.ref));
  await batch.commit();

  await auth.deleteUser(uid).catch((err) => {
    if (err.code !== 'auth/user-not-found') throw err;
  });
  res.json({ deleted: uid });
});

export default router;
