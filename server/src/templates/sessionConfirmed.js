import { base } from './base.js';

export default function sessionConfirmedTemplate({ recipientName, otherPartyName, isTutor, amount, autoConfirmed, disputeDeadline, requestId }) {
  const formattedAmount = amount ? `₦${Number(amount).toLocaleString()}` : '';
  const content = isTutor
    ? `
      <h2 style="color: #111827; margin-top: 0;">Session Confirmed!</h2>
      <p>Hi ${recipientName || 'there'},</p>
      <p>
        The session with <strong>${otherPartyName}</strong> has been ${autoConfirmed ? 'automatically confirmed' : 'confirmed by the learner'}.
      </p>
      <p>A payout of <strong>${formattedAmount}</strong> has been initiated to your registered bank account.</p>
      <p style="margin: 24px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard"
           style="background: #6c3bbd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          View Earnings
        </a>
      </p>
      <p style="color: #6b7280; font-size: 0.875rem;">Request ID: ${requestId}</p>
    `
    : `
      <h2 style="color: #111827; margin-top: 0;">Session Confirmed</h2>
      <p>Hi ${recipientName || 'there'},</p>
      <p>
        Your session with <strong>${otherPartyName}</strong> was ${autoConfirmed ? 'automatically confirmed after 3 days' : 'marked as completed'}.
      </p>
      ${disputeDeadline ? `<p style="color: #4b5563; font-size: 0.9rem;">If you encountered any issues, you may still raise a dispute until ${new Date(disputeDeadline).toLocaleDateString()}.</p>` : ''}
      <p style="margin: 24px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard"
           style="background: #6c3bbd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Leave a Review
        </a>
      </p>
      <p style="color: #6b7280; font-size: 0.875rem;">Request ID: ${requestId}</p>
    `;

  return base(content);
}
