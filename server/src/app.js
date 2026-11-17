import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/auth.js';
import tutorRoutes from './routes/tutors.js';
import requestRoutes from './routes/requests.js';
import bookmarkRoutes from './routes/bookmarks.js';
import adminRoutes from './routes/admin.js';
import contactRoutes from './routes/contact.js';
import paymentRoutes from './routes/payments.js';
import bankRoutes from './routes/bank.js';
import chatRoutes from './routes/chats.js';
import notificationRoutes from './routes/notifications.js';
import { notFound, errorHandler } from './middleware/errors.js';

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)) }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tutors', bankRoutes); // bank routes are under /api/tutors/me/bank
app.use('/api/chats', chatRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
