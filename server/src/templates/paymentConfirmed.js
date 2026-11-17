import { base } from './base.js';

export default function paymentConfirmedTemplate({ recipientName, otherPartyName, isLearner, subject, amount, requestId }) {
  const formattedAmount = amount ? `₦${Number(amount).toLocaleString()}` : '';
  const content = `
    <h2 style="color: #111827; margin-top: 0;">Payment Confirmed!</h2>
    <p>Hi ${recipientName || 'there'},</p>
    <p>
      ${isLearner
        ? `Your payment of <strong>${formattedAmount}</strong> for your lesson on <strong>${subject}</strong> with <strong>${otherPartyName}</strong> has been confirmed!`
        : `<strong>${otherPartyName}</strong> has completed payment of <strong>${formattedAmount}</strong> for the lesson on <strong>${subject}</strong>.`}
    </p>
    <p>Your session is now booked. Please coordinate directly via chat to arrange meeting details.</p>
    <p style="margin: 24px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard"
         style="background: #6c3bbd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Open Dashboard & Chat
      </a>
    </p>
    <p style="color: #6b7280; font-size: 0.875rem;">Request ID: ${requestId}</p>
  `;
  return base(content);
}
