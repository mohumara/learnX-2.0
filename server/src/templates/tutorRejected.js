import { base } from './base.js';

export default function tutorRejectedTemplate({ tutorName, reason }) {
  const content = `
    <h2 style="color: #111827; margin-top: 0;">LearnX Application Status</h2>
    <p>Hi ${tutorName || 'there'},</p>
    <p>Thank you for your interest in becoming a tutor on LearnX. Unfortunately, we were unable to approve your application at this time.</p>
    ${reason ? `<p style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px; border-radius: 6px; color: #4b5563;"><strong>Note:</strong> ${reason}</p>` : ''}
    <p>If you have any questions or feel this decision was made in error, please contact our support team.</p>
    <p style="margin: 24px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/contact"
         style="background: #6c3bbd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Contact Support
      </a>
    </p>
  `;
  return base(content);
}
