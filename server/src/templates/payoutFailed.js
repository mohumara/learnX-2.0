import { base } from './base.js';

export default function payoutFailedTemplate({ recipientName, isAdmin, tutorName, amount, reason, requestId }) {
  const formattedAmount = amount ? `₦${Number(amount).toLocaleString()}` : '';
  const content = isAdmin
    ? `
      <h2 style="color: #dc2626; margin-top: 0;">Alert: Payout Transfer Failed</h2>
      <p>A payout transfer of <strong>${formattedAmount}</strong> for tutor <strong>${tutorName}</strong> has failed.</p>
      ${reason ? `<p style="background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 6px; color: #991b1b;"><strong>Reason:</strong> ${reason}</p>` : ''}
      <p style="color: #6b7280; font-size: 0.875rem;">Request ID: ${requestId}</p>
    `
    : `
      <h2 style="color: #dc2626; margin-top: 0;">Payout Issue Update</h2>
      <p>Hi ${recipientName || 'there'},</p>
      <p>We encountered an issue processing your payout of <strong>${formattedAmount}</strong>.</p>
      <p>Our team has been notified and is looking into it. Please verify that your bank account details on LearnX are accurate.</p>
      <p style="margin: 24px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard"
           style="background: #6c3bbd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Check Bank Details
        </a>
      </p>
      <p style="color: #6b7280; font-size: 0.875rem;">Request ID: ${requestId}</p>
    `;

  return base(content);
}
