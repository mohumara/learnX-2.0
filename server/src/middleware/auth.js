import { auth, db } from '../config/firebase.js';
import { HttpError } from '../utils/httpError.js';

/**
 * Verifies the Firebase ID token sent as "Authorization: Bearer <token>",
 * then loads the user's profile (including their role) from Firestore.
 * On success, req.user = { uid, name, email, role, bookmarks, ... }.
 */
export async function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Authentication required.'));

  let decoded;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    return next(new HttpError(401, 'Invalid or expired session. Please log in again.'));
  }

  const snap = await db.collection('users').doc(decoded.uid).get();
  if (!snap.exists) return next(new HttpError(401, 'Account profile not found.'));

  req.user = { uid: decoded.uid, ...snap.data() };
  next();
}

/** Restrict a route to one or more roles. Use after verifyToken. */
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new HttpError(403, 'You do not have permission to do that.'));
  }
  next();
};
