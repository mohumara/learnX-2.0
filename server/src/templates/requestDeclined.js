import { base } from './base.js';

export default function requestDeclinedTemplate({ learnerName, tutorName, subject, requestId }) {
  const content = `
    <h2 style="color: #111827; margin-top: 0;">Lesson Request Update</h2>
    <p>Hi ${learnerName || 'there'},</p>
    <p><strong>${tutorName}</strong> was unable to accept your lesson request for <strong>${subject}</strong> at this time.</p>
    <p>Don't worry! There are many other qualified tutors available on LearnX.</p>
    <p style="margin: 24px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/tutors"
         style="background: #6c3bbd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Find Another Tutor
      </a>
    </p>
    <p style="color: #6b7280; font-size: 0.875rem;">Request ID: ${requestId}</p>
  `;
  return base(content);
}
