import { Router } from 'express';
import { db } from '../config/firebase.js';
import { HttpError } from '../utils/httpError.js';
import { str, isEmail } from '../utils/validate.js';

const router = Router();

// POST /api/contact  (public). Messages are stored in the "contactMessages" collection.
router.post('/', async (req, res) => {
  const name = str(req.body.name, 'Name', { min: 2, max: 80 });
  const email = str(req.body.email, 'Email', { max: 120 });
  if (!isEmail(email)) throw new HttpError(400, 'Enter a valid email address.');
  const message = str(req.body.message, 'Message', { min: 10, max: 1000 });

  await db.collection('contactMessages').add({ name, email, message, createdAt: new Date().toISOString() });
  res.status(201).json({ ok: true });
});

export default router;
