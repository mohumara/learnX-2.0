import { base } from './base.js';

export default function newMessageTemplate({ recipientName, senderName, messagePreview, requestId }) {
  const content = `
    <h2 style="color: #111827; margin-top: 0;">New Message</h2>
    <p>Hi ${recipientName || 'there'},</p>
    <p>You have received a new message from <strong>${senderName}</strong>:</p>
    <blockquote style="background: #f9fafb; border-left: 4px solid #6c3bbd; margin: 16px 0; padding: 12px 16px; color: #374151;">
      ${messagePreview || 'You have a new message waiting in LearnX.'}
    </blockquote>
    <p style="margin: 24px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/chat/${requestId || ''}"
         style="background: #6c3bbd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Reply on LearnX
      </a>
    </p>
  `;
  return base(content);
}
