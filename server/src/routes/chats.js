import { Router } from 'express';
import { db } from '../config/firebase.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { HttpError } from '../utils/httpError.js';
import { str } from '../utils/validate.js';
import { createNotification } from '../services/notifications.js';

const router = Router();
const conversations = () => db.collection('conversations');
const withId = (doc) => ({ id: doc.id, ...doc.data() });

router.use(verifyToken, requireRole('learner', 'tutor'));

async function getConversationForUser(id, uid) {
  const snap = await conversations().doc(id).get();
  if (!snap.exists) throw new HttpError(404, 'Conversation not found.');
  const conversation = snap.data();
  if (!conversation.participantIds?.includes(uid)) throw new HttpError(403, 'Permission denied.');
  return { snap, conversation };
}

// GET /api/chats/mine
router.get('/mine', async (req, res) => {
  const snap = await conversations().where('participantIds', 'array-contains', req.user.uid).get();
  const chats = snap.docs.map(withId).sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt));
  res.json({ chats });
});

// GET /api/chats/:id
router.get('/:id', async (req, res) => {
  const { snap, conversation } = await getConversationForUser(req.params.id, req.user.uid);
  res.json({ chat: { id: snap.id, ...conversation } });
});

// GET /api/chats/:id/messages
router.get('/:id/messages', async (req, res) => {
  const { snap } = await getConversationForUser(req.params.id, req.user.uid);
  const messages = await snap.ref.collection('messages').get();
  res.json({ messages: messages.docs.map(withId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) });
});

// POST /api/chats/:id/messages
router.post('/:id/messages', async (req, res) => {
  const text = str(req.body.text, 'Message', { max: 1000 });
  const { snap, conversation } = await getConversationForUser(req.params.id, req.user.uid);
  const message = {
    senderId: req.user.uid,
    senderName: req.user.name,
    senderRole: req.user.role,
    text,
    createdAt: new Date().toISOString()
  };
  const ref = await snap.ref.collection('messages').add(message);
  await snap.ref.update({ lastMessage: text, lastMessageAt: message.createdAt });
  const recipientId = conversation.learnerId === req.user.uid ? conversation.tutorId : conversation.learnerId;
  await createNotification({
    recipientId,
    type: 'new_message',
    title: 'New lesson message',
    message: `${req.user.name} sent you a message about ${conversation.subject}.`,
    requestId: conversation.requestId,
    link: `/chats/${snap.id}`
  });
  res.status(201).json({ message: { id: ref.id, ...message } });
});

export default router;
