/**
 * Notification service for LearnX.
 * Dispatches transactional emails via email.js and templates.
 * All functions are safe to fire-and-forget (wrap sendEmail in try/catch).
 */

import { sendEmail } from './email.js';
import newRequestTemplate from '../templates/newRequest.js';
import requestAcceptedTemplate from '../templates/requestAccepted.js';
import requestDeclinedTemplate from '../templates/requestDeclined.js';
import paymentConfirmedTemplate from '../templates/paymentConfirmed.js';
import sessionConfirmedTemplate from '../templates/sessionConfirmed.js';
import payoutSuccessTemplate from '../templates/payoutSuccess.js';
import payoutFailedTemplate from '../templates/payoutFailed.js';
import disputeTemplate from '../templates/dispute.js';
import tutorApprovedTemplate from '../templates/tutorApproved.js';
import tutorRejectedTemplate from '../templates/tutorRejected.js';
import reviewReceivedTemplate from '../templates/reviewReceived.js';
import newMessageTemplate from '../templates/newMessage.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL || 'admin@learnx.com.ng';

/** 1. Request sent -> Tutor */
export async function newRequest({ tutorEmail, tutorName, learnerName, subject, hours, requestId }) {
  try {
    if (!tutorEmail) return;
    await sendEmail({
      to: tutorEmail,
      subject: `New lesson request from ${learnerName || 'a learner'}`,
      html: newRequestTemplate({ tutorName, learnerName, subject, hours, requestId }),
    });
  } catch (err) {
    console.error('[notify:newRequest]', err.message);
  }
}

/** 2. Request accepted -> Learner */
export async function requestAccepted({ learnerEmail, learnerName, tutorName, subject, requestId }) {
  try {
    if (!learnerEmail) return;
    await sendEmail({
      to: learnerEmail,
      subject: `${tutorName || 'Tutor'} accepted your lesson request`,
      html: requestAcceptedTemplate({ learnerName, tutorName, subject, requestId }),
    });
  } catch (err) {
    console.error('[notify:requestAccepted]', err.message);
  }
}

/** 3. Request declined -> Learner */
export async function requestDeclined({ learnerEmail, learnerName, tutorName, subject, requestId }) {
  try {
    if (!learnerEmail) return;
    await sendEmail({
      to: learnerEmail,
      subject: `${tutorName || 'Tutor'} declined your lesson request`,
      html: requestDeclinedTemplate({ learnerName, tutorName, subject, requestId }),
    });
  } catch (err) {
    console.error('[notify:requestDeclined]', err.message);
  }
}

/** 4. Payment confirmed -> Learner + Tutor */
export async function paymentConfirmed({
  learnerEmail,
  tutorEmail,
  learnerName,
  tutorName,
  subject,
  amount,
  requestId,
}) {
  try {
    const promises = [];
    if (learnerEmail) {
      promises.push(
        sendEmail({
          to: learnerEmail,
          subject: 'Payment confirmed — your session is booked',
          html: paymentConfirmedTemplate({
            recipientName: learnerName,
            otherPartyName: tutorName,
            isLearner: true,
            subject,
            amount,
            requestId,
          }),
        })
      );
    }
    if (tutorEmail) {
      promises.push(
        sendEmail({
          to: tutorEmail,
          subject: 'Payment confirmed — your session is booked',
          html: paymentConfirmedTemplate({
            recipientName: tutorName,
            otherPartyName: learnerName,
            isLearner: false,
            subject,
            amount,
            requestId,
          }),
        })
      );
    }
    await Promise.all(promises);
  } catch (err) {
    console.error('[notify:paymentConfirmed]', err.message);
  }
}

/** 5. Session confirmed -> Tutor (payout notice) & Learner */
export async function sessionConfirmed({
  tutorEmail,
  tutorName,
  learnerEmail,
  learnerName,
  amount,
  autoConfirmed = false,
  disputeDeadline = null,
  requestId,
}) {
  try {
    const promises = [];
    if (tutorEmail) {
      promises.push(
        sendEmail({
          to: tutorEmail,
          subject: `Session confirmed — payout of ₦${Number(amount || 0).toLocaleString()} initiated`,
          html: sessionConfirmedTemplate({
            recipientName: tutorName,
            otherPartyName: learnerName,
            isTutor: true,
            amount,
            autoConfirmed,
            disputeDeadline,
            requestId,
          }),
        })
      );
    }
    if (learnerEmail) {
      promises.push(
        sendEmail({
          to: learnerEmail,
          subject: autoConfirmed ? 'Your session was auto-confirmed' : 'Session completed',
          html: sessionConfirmedTemplate({
            recipientName: learnerName,
            otherPartyName: tutorName,
            isTutor: false,
            amount,
            autoConfirmed,
            disputeDeadline,
            requestId,
          }),
        })
      );
    }
    await Promise.all(promises);
  } catch (err) {
    console.error('[notify:sessionConfirmed]', err.message);
  }
}

/** 6. Payout success -> Tutor */
export async function payoutSuccess({ tutorEmail, tutorName, amount, bankName, accountNumber, requestId }) {
  try {
    if (!tutorEmail) return;
    await sendEmail({
      to: tutorEmail,
      subject: `₦${Number(amount || 0).toLocaleString()} has been sent to your account`,
      html: payoutSuccessTemplate({ tutorName, amount, bankName, accountNumber, requestId }),
    });
  } catch (err) {
    console.error('[notify:payoutSuccess]', err.message);
  }
}

/** 7. Payout failed -> Tutor + Admin */
export async function payoutFailed({ tutorEmail, adminEmail, tutorName, amount, reason, requestId }) {
  try {
    const recipients = [
      ...(tutorEmail ? [{ to: tutorEmail, isAdmin: false, recipientName: tutorName }] : []),
      { to: adminEmail || ADMIN_EMAIL, isAdmin: true, recipientName: 'Admin' },
    ];

    await Promise.all(
      recipients.map((r) =>
        sendEmail({
          to: r.to,
          subject: "Payout failed — we're looking into it",
          html: payoutFailedTemplate({
            recipientName: r.recipientName,
            isAdmin: r.isAdmin,
            tutorName,
            amount,
            reason,
            requestId,
          }),
        })
      )
    );
  } catch (err) {
    console.error('[notify:payoutFailed]', err.message);
  }
}

/** 8. Dispute raised -> Admin */
export async function disputeRaised({ adminEmail, requestId, learnerName, tutorName, reason, amount }) {
  try {
    await sendEmail({
      to: adminEmail || ADMIN_EMAIL,
      subject: `Dispute raised on request ${requestId}`,
      html: disputeTemplate({ requestId, learnerName, tutorName, reason, amount }),
    });
  } catch (err) {
    console.error('[notify:disputeRaised]', err.message);
  }
}
// Alias for flexibility
export const dispute = disputeRaised;

/** 9. Tutor approved -> Tutor */
export async function tutorApproved({ tutorEmail, tutorName }) {
  try {
    if (!tutorEmail) return;
    await sendEmail({
      to: tutorEmail,
      subject: "🎉 You're approved — start receiving students!",
      html: tutorApprovedTemplate({ tutorName }),
    });
  } catch (err) {
    console.error('[notify:tutorApproved]', err.message);
  }
}

/** 10. Tutor rejected -> Tutor */
export async function tutorRejected({ tutorEmail, tutorName, reason }) {
  try {
    if (!tutorEmail) return;
    await sendEmail({
      to: tutorEmail,
      subject: "Your LearnX application wasn't approved",
      html: tutorRejectedTemplate({ tutorName, reason }),
    });
  } catch (err) {
    console.error('[notify:tutorRejected]', err.message);
  }
}

/** Handler invoked by admin.js: notify.tutorStatusChanged({ tutorId, status, tutorEmail, tutorName, reason }) */
export async function tutorStatusChanged({ tutorId, status, tutorEmail, tutorName, reason }) {
  if (status === 'approved') {
    return tutorApproved({ tutorEmail, tutorName });
  } else if (status === 'rejected') {
    return tutorRejected({ tutorEmail, tutorName, reason });
  }
}

/** 11. Review left -> Tutor */
export async function reviewReceived({ tutorEmail, tutorName, learnerName, rating, comment }) {
  try {
    if (!tutorEmail) return;
    await sendEmail({
      to: tutorEmail,
      subject: `${learnerName || 'A learner'} left you a review`,
      html: reviewReceivedTemplate({ tutorName, learnerName, rating, comment }),
    });
  } catch (err) {
    console.error('[notify:reviewReceived]', err.message);
  }
}

/** 12. New message -> Recipient */
export async function newMessage({ recipientEmail, recipientName, senderName, messagePreview, requestId }) {
  try {
    if (!recipientEmail) return;
    await sendEmail({
      to: recipientEmail,
      subject: `You have a new message from ${senderName || 'someone on LearnX'}`,
      html: newMessageTemplate({ recipientName, senderName, messagePreview, requestId }),
    });
  } catch (err) {
    console.error('[notify:newMessage]', err.message);
  }
}
