/**
 * Thin Resend wrapper.
 * Uses FROM_EMAIL + FROM_NAME env vars.
 * This module is the ONLY place that talks to Resend.
 */

import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey && apiKey.trim() ? new Resend(apiKey) : null;
const fromAddress = `${process.env.FROM_NAME || 'LearnX'} <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`;

/**
 * Send a transactional email.
 * If RESEND_API_KEY is not configured, logs to console in development instead of throwing.
 *
 * @param {object} opts
 * @param {string|string[]} opts.to      - Recipient email address(es)
 * @param {string}          opts.subject - Email subject line
 * @param {string}          opts.html    - HTML body
 * @returns {Promise<void>}
 */
export async function sendEmail({ to, subject, html }) {
  if (!resend) {
    const recipients = Array.isArray(to) ? to.join(', ') : to;
    console.log(`[Email MOCK] To: ${recipients} | Subject: "${subject}"`);
    return;
  }

  await resend.emails.send({
    from: fromAddress,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });
}
