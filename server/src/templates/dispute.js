import { base } from './base.js';

export default function disputeTemplate({ requestId, learnerName, tutorName, reason, amount }) {
  const formattedAmount = amount ? `₦${Number(amount).toLocaleString()}` : '';
  const content = `
    <h2 style="color: #dc2626; margin-top: 0;">Dispute Raised on Lesson Request</h2>
    <p>A dispute has been raised by learner <strong>${learnerName}</strong> regarding a session with tutor <strong>${tutorName}</strong>.</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 6px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Request ID:</strong> ${requestId}</p>
      ${formattedAmount ? `<p style="margin: 4px 0;"><strong>Amount:</strong> ${formattedAmount}</p>` : ''}
      ${reason ? `<p style="margin: 4px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
    </div>
    <p>Please review the details in the admin portal to resolve the dispute or issue a refund via the Paystack dashboard.</p>
    <p style="margin: 24px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin"
         style="background: #6c3bbd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Open Admin Portal
      </a>
    </p>
  `;
  return base(content);
}
