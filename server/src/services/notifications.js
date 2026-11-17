import { db } from '../config/firebase.js';

export async function createNotification({ recipientId, type, title, message, requestId, link }) {
  const data = {
    recipientId,
    type,
    title,
    message,
    requestId,
    link,
    read: false,
    createdAt: new Date().toISOString(),
    readAt: null
  };
  const ref = await db.collection('notifications').add(data);
  return { id: ref.id, ...data };
}
