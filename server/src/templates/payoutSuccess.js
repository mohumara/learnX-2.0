import { base } from './base.js';

export default function payoutSuccessTemplate({ tutorName, amount, bankName, accountNumber, requestId }) {
  const formattedAmount = amount ? `₦${Number(amount).toLocaleString()}` : '';
  const maskedAcc = accountNumber ? `ending in ${accountNumber.slice(-4)}` : '';
  const content = `
    <h2 style="color: #111827; margin-top: 0;">Payout Sent!</h2>
    <p>Hi ${tutorName || 'there'},</p>
    <p>We've processed your payout of <strong>${formattedAmount}</strong> to your ${bankName || 'bank'} account ${maskedAcc}.</p>
    <p>Funds should arrive in your account shortly depending on bank settlement times.</p>
    <p style="margin: 24px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard"
         style="background: #6c3bbd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        View Earnings Dashboard
      </a>
    </p>
    <p style="color: #6b7280; font-size: 0.875rem;">Reference Request ID: ${requestId || 'N/A'}</p>
  `;
  return base(content);
}
