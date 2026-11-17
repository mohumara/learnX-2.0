import { base } from './base.js';

export default function tutorApprovedTemplate({ tutorName }) {
  const content = `
    <h2 style="color: #111827; margin-top: 0;">🎉 You're Approved!</h2>
    <p>Hi ${tutorName || 'there'},</p>
    <p>Congratulations! Your LearnX tutor application has been approved. Your profile is now live and learners can discover you and send lesson requests.</p>
    <p style="margin: 24px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard"
         style="background: #6c3bbd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Go to Your Dashboard
      </a>
    </p>
    <p>Welcome to the LearnX community!</p>
  `;
  return base(content);
}
