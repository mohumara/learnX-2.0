import { base } from './base.js';

export default function newRequestTemplate({ tutorName, learnerName, subject, hours, requestId }) {
  const content = `
    <h2 style="color: #111827; margin-top: 0;">New Lesson Request</h2>
    <p>Hi ${tutorName || 'there'},</p>
    <p><strong>${learnerName}</strong> has sent you a new lesson request for <strong>${subject}</strong>${hours ? ` (${hours} hour${hours > 1 ? 's' : ''})` : ''}.</p>
    <p style="margin: 24px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard"
         style="background: #6c3bbd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        View Request
      </a>
    </p>
    <p style="color: #6b7280; font-size: 0.875rem;">Request ID: ${requestId}</p>
  `;
  return base(content);
}
