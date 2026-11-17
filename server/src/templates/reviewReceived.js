import { base } from './base.js';

export default function reviewReceivedTemplate({ tutorName, learnerName, rating, comment }) {
  const stars = '★'.repeat(Math.max(1, Math.min(5, Math.round(rating || 5)))) + '☆'.repeat(Math.max(0, 5 - Math.round(rating || 5)));
  const content = `
    <h2 style="color: #111827; margin-top: 0;">New Review Received!</h2>
    <p>Hi ${tutorName || 'there'},</p>
    <p><strong>${learnerName}</strong> just left you a review:</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 6px; margin: 16px 0;">
      <div style="color: #f59e0b; font-size: 1.25rem; margin-bottom: 8px;">${stars} <span style="font-size: 0.9rem; color: #4b5563;">(${rating}/5)</span></div>
      ${comment ? `<p style="margin: 0; font-style: italic; color: #374151;">"${comment}"</p>` : ''}
    </div>
    <p style="margin: 24px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard"
         style="background: #6c3bbd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        View on Profile
      </a>
    </p>
  `;
  return base(content);
}
