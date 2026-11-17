import { base } from './base.js';

export default function requestAcceptedTemplate({ learnerName, tutorName, subject, requestId }) {
  const content = `
    <h2 style="color: #111827; margin-top: 0;">Lesson Request Accepted!</h2>
    <p>Hi ${learnerName || 'there'},</p>
    <p>Great news! <strong>${tutorName}</strong> has accepted your lesson request for <strong>${subject}</strong>.</p>
    <p>You can now chat with your tutor and proceed to payment to confirm your booking.</p>
    <p style="margin: 24px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard"
         style="background: #6c3bbd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Go to Dashboard & Pay
      </a>
    </p>
    <p style="color: #6b7280; font-size: 0.875rem;">Request ID: ${requestId}</p>
  `;
  return base(content);
}
