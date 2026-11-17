import express, { Router } from 'express';
import crypto from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { HttpError } from '../utils/httpError.js';
import { str } from '../utils/validate.js';
import * as paystack from '../services/paystack.js';
import * as notify from '../services/notify.js';

const router = Router();
const requests = () => db.collection('requests');
const withId = (doc) => ({ id: doc.id, ...doc.data() });

async function ensureConversation(requestId, requestData) {
  const ref = db.collection('conversations').doc(requestId);
  const snap = await ref.get();
  if (snap.exists) return { id: snap.id, ...snap.data() };

  const data = {
    requestId,
    learnerId: requestData.learnerId,
    learnerName: requestData.learnerName,
    tutorId: requestData.tutorId,
    tutorName: requestData.tutorName,
    participantIds: [requestData.learnerId, requestData.tutorId],
    subject: requestData.subject,
    lessonType: requestData.lessonType || 'in-person',
    createdAt: new Date().toISOString(),
    lastMessage: '',
    lastMessageAt: null
  };
  await ref.set(data);
  return { id: ref.id, ...data };
}

/**
 * Helper to process tutor payouts upon session confirmation (manual or auto).
 * Handles the ₦1,000 threshold and pendingPayout accumulation.
 */
async function processTutorPayout({ requestId, tutorId, earning }) {
  const tutorRef = db.collection('tutors').doc(tutorId);
  const tutorSnap = await tutorRef.get();
  if (!tutorSnap.exists) return null;
  const tutor = tutorSnap.data();

  const currentPending = Number(tutor.pendingPayout || 0);
  const totalPayout = earning + currentPending;

  // Payout minimum is ₦1,000
  if (totalPayout < 1000) {
    await tutorRef.update({
      pendingPayout: FieldValue.increment(earning)
    });
    return { status: 'accumulated', amount: earning };
  }

  // Obtain or create Paystack recipient
  let recipientCode = tutor.recipientCode;
  if (!recipientCode && tutor.accountNumber && tutor.bankCode && tutor.accountName) {
    try {
      const recipientData = await paystack.createRecipient({
        accountName: tutor.accountName,
        accountNumber: tutor.accountNumber,
        bankCode: tutor.bankCode
      });
      recipientCode = recipientData?.recipient_code || recipientData?.recipientCode;
      if (recipientCode) {
        await tutorRef.update({ recipientCode });
      }
    } catch (err) {
      console.error('[paystack:createRecipient]', err.message);
    }
  }

  if (!recipientCode) {
    await tutorRef.update({
      pendingPayout: FieldValue.increment(earning)
    });
    return { status: 'pending_recipient', amount: earning };
  }

  // Create payout document
  const payoutData = {
    tutorId,
    requestId,
    amount: totalPayout,
    bankCode: tutor.bankCode || null,
    accountNumber: tutor.accountNumber || null,
    recipientCode,
    transferCode: null,
    status: 'processing',
    createdAt: new Date().toISOString(),
    processedAt: null,
    failureReason: null
  };

  const payoutRef = await db.collection('payouts').add(payoutData);

  // Initiate transfer via Paystack
  try {
    const transferRes = await paystack.initiateTransfer({
      amountNgn: totalPayout,
      recipientCode,
      reason: `LearnX payout for session: ${requestId}`
    });
    const transferCode = transferRes?.transfer_code || transferRes?.transferCode || null;
    await payoutRef.update({ transferCode, status: 'processing' });
    return { status: 'processing', payoutId: payoutRef.id, transferCode };
  } catch (err) {
    console.error('[paystack:initiateTransfer]', err.message);
    await payoutRef.update({
      status: 'failed',
      failureReason: err.message
    });
    await tutorRef.update({
      pendingPayout: FieldValue.increment(earning)
    });
    return { status: 'failed', error: err.message };
  }
}

/**
 * Authentication middleware that allows either:
 * - Matching X-Cron-Secret header with env CRON_SECRET
 * - OR a valid admin user bearer token
 */
async function requireAdminOrCronSecret(req, res, next) {
  const cronSecret = req.headers['x-cron-secret'];
  if (process.env.CRON_SECRET && cronSecret && cronSecret === process.env.CRON_SECRET) {
    return next();
  }
  return verifyToken(req, res, (err) => {
    if (err) return next(err);
    if (req.user?.role !== 'admin') {
      return next(new HttpError(403, 'Admin access or valid cron secret required.'));
    }
    next();
  });
}

/**
 * POST /api/payments/initialize (learner)
 * Computes amount server-side from request hours and tutor rate.
 * Calls Paystack initialize and saves reference to request.
 */
router.post('/initialize', verifyToken, requireRole('learner'), async (req, res) => {
  const requestId = str(req.body.requestId, 'Request ID', { max: 128 });
  const reqRef = requests().doc(requestId);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) {
    throw new HttpError(404, 'Request not found.');
  }

  const requestData = reqSnap.data();

  if (requestData.learnerId !== req.user.uid) {
    throw new HttpError(403, 'You do not have permission to pay for this request.');
  }

  if (requestData.status !== 'accepted') {
    throw new HttpError(400, 'Only accepted requests can be paid.');
  }

  if (requestData.paymentStatus && requestData.paymentStatus !== 'unpaid') {
    throw new HttpError(400, 'This request has already been paid or processed.');
  }

  const tutorSnap = await db.collection('tutors').doc(requestData.tutorId).get();
  if (!tutorSnap.exists || tutorSnap.data().status !== 'approved') {
    throw new HttpError(400, 'Tutor is not available.');
  }
  const tutorData = tutorSnap.data();

  const hours = Number(requestData.hours);
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new HttpError(400, 'Invalid lesson hours on request.');
  }

  const hourlyRate = Number(tutorData.hourlyRate);
  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) {
    throw new HttpError(400, 'Tutor hourly rate is invalid.');
  }

  const grossAmount = hours * hourlyRate;
  const platformFee = Math.round(grossAmount * 0.05);
  const tutorEarning = grossAmount - platformFee;

  const reference = `lx_${requestId}_${Date.now()}`;

  let paystackData;
  try {
    paystackData = await paystack.initializeTransaction({
      email: req.user.email,
      amountNgn: grossAmount,
      reference,
      metadata: { requestId }
    });
  } catch (err) {
    throw new HttpError(400, err.message || 'Payment initialization failed.');
  }

  await reqRef.update({
    paymentRef: reference,
    grossAmount,
    platformFee,
    tutorEarning
  });

  res.json({
    authorization_url: paystackData.authorization_url,
    reference,
    grossAmount,
    platformFee,
    tutorEarning
  });
});

/**
 * GET /api/payments/verify/:reference (learner)
 * Verifies transaction with Paystack and transitions request to 'paid'.
 */
router.get('/verify/:reference', verifyToken, requireRole('learner'), async (req, res) => {
  const reference = str(req.params.reference, 'Reference');
  const snap = await requests().where('paymentRef', '==', reference).limit(1).get();
  if (snap.empty) {
    throw new HttpError(404, 'Payment reference not found.');
  }

  const reqDoc = snap.docs[0];
  const requestData = reqDoc.data();

  if (requestData.learnerId !== req.user.uid) {
    throw new HttpError(403, 'You do not have permission to verify this payment.');
  }

  let paystackData;
  try {
    paystackData = await paystack.verifyTransaction(reference);
  } catch (err) {
    throw new HttpError(400, err.message || 'Failed to verify transaction with Paystack.');
  }

  if (paystackData.status === 'success') {
    // Anti-tamper check (amounts in kobo; skip if amount is null in simulation mode)
    const expectedKobo = requestData.grossAmount * 100;
    if (paystackData.amount != null && paystackData.amount !== expectedKobo) {
      throw new HttpError(400, 'Payment amount mismatch.');
    }

    let updatedRequest = { id: reqDoc.id, ...requestData };
    if (requestData.status !== 'paid') {
      const paidAt = new Date().toISOString();
      await reqDoc.ref.update({
        status: 'paid',
        paymentStatus: 'paid',
        paidAt
      });
      updatedRequest = {
        ...updatedRequest,
        status: 'paid',
        paymentStatus: 'paid',
        paidAt
      };

      // Fire-and-forget notification
      (async () => {
        try {
          const tutorUserDoc = await db.collection('users').doc(requestData.tutorId).get();
          const tutorEmail = tutorUserDoc.exists ? tutorUserDoc.data().email : null;
          await notify.paymentConfirmed({
            learnerEmail: req.user.email,
            tutorEmail,
            learnerName: req.user.name || requestData.learnerName,
            tutorName: requestData.tutorName,
            subject: requestData.subject,
            amount: requestData.grossAmount,
            requestId: reqDoc.id
          });
        } catch (err) {
          console.error('[notify:paymentConfirmed]', err.message);
        }
      })();
    }

    const conversation = await ensureConversation(reqDoc.id, updatedRequest);
    return res.json({ success: true, request: updatedRequest, conversationId: conversation.id });
  } else {
    return res.json({
      success: false,
      reason: paystackData.gateway_response || paystackData.status || 'Payment verification failed'
    });
  }
});

/**
 * POST /api/payments/webhook (no auth)
 * Handles Paystack webhooks (charge.success, transfer.success, transfer.failed).
 * Uses express.raw middleware on this route to verify HMAC signature.
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const secret = process.env.PAYSTACK_SECRET_KEY || '';

  let rawBody;
  if (Buffer.isBuffer(req.body)) {
    rawBody = req.body;
  } else if (typeof req.body === 'string') {
    rawBody = Buffer.from(req.body, 'utf8');
  } else {
    rawBody = Buffer.from(JSON.stringify(req.body), 'utf8');
  }

  const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  if (!signature || hash !== signature) {
    return res.status(400).send('Invalid signature');
  }

  let payload;
  try {
    payload = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString('utf8')) : req.body;
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  try {
    if (payload.event === 'charge.success') {
      const reference = payload.data?.reference;
      if (reference) {
        const snap = await requests().where('paymentRef', '==', reference).limit(1).get();
        if (!snap.empty) {
          const doc = snap.docs[0];
          const rData = doc.data();
          if (rData.status === 'accepted' || rData.status === 'pending') {
            const paidAt = new Date().toISOString();
            await doc.ref.update({
              status: 'paid',
              paymentStatus: 'paid',
              paidAt
            });
            await ensureConversation(doc.id, { ...rData, status: 'paid', paymentStatus: 'paid', paidAt });

            // Fire-and-forget notification
            (async () => {
              try {
                const [tutorUserDoc, learnerUserDoc] = await Promise.all([
                  db.collection('users').doc(rData.tutorId).get(),
                  db.collection('users').doc(rData.learnerId).get()
                ]);
                await notify.paymentConfirmed({
                  learnerEmail: learnerUserDoc.exists ? learnerUserDoc.data().email : null,
                  tutorEmail: tutorUserDoc.exists ? tutorUserDoc.data().email : null,
                  learnerName: rData.learnerName,
                  tutorName: rData.tutorName,
                  subject: rData.subject,
                  amount: rData.grossAmount,
                  requestId: doc.id
                });
              } catch (err) {
                console.error('[webhook:paymentConfirmed]', err.message);
              }
            })();
          }
        }
      }
    } else if (payload.event === 'transfer.success') {
      const transferCode = payload.data?.transfer_code;
      if (transferCode) {
        const snap = await db.collection('payouts').where('transferCode', '==', transferCode).limit(1).get();
        if (!snap.empty) {
          const payoutDoc = snap.docs[0];
          const payoutData = payoutDoc.data();
          if (payoutData.status !== 'success') {
            await payoutDoc.ref.update({
              status: 'success',
              processedAt: new Date().toISOString()
            });

            const tutorRef = db.collection('tutors').doc(payoutData.tutorId);
            await tutorRef.update({
              totalEarnings: FieldValue.increment(payoutData.amount || 0),
              pendingPayout: 0
            });

            // Notify tutor
            (async () => {
              try {
                const [tutorUserDoc, tutorDoc] = await Promise.all([
                  db.collection('users').doc(payoutData.tutorId).get(),
                  tutorRef.get()
                ]);
                await notify.payoutSuccess({
                  tutorEmail: tutorUserDoc.exists ? tutorUserDoc.data().email : null,
                  tutorName: tutorDoc.exists ? tutorDoc.data().name : 'Tutor',
                  amount: payoutData.amount,
                  bankName: payoutData.bankName,
                  accountNumber: payoutData.accountNumber,
                  requestId: payoutData.requestId
                });
              } catch (err) {
                console.error('[webhook:payoutSuccess]', err.message);
              }
            })();
          }
        }
      }
    } else if (payload.event === 'transfer.failed') {
      const transferCode = payload.data?.transfer_code;
      if (transferCode) {
        const snap = await db.collection('payouts').where('transferCode', '==', transferCode).limit(1).get();
        if (!snap.empty) {
          const payoutDoc = snap.docs[0];
          const payoutData = payoutDoc.data();
          const failureReason = payload.data?.reason || 'Transfer failed';
          if (payoutData.status !== 'failed') {
            await payoutDoc.ref.update({
              status: 'failed',
              failureReason,
              processedAt: new Date().toISOString()
            });

            // Notify tutor + admin
            (async () => {
              try {
                const [tutorUserDoc, tutorDoc] = await Promise.all([
                  db.collection('users').doc(payoutData.tutorId).get(),
                  db.collection('tutors').doc(payoutData.tutorId).get()
                ]);
                await notify.payoutFailed({
                  tutorEmail: tutorUserDoc.exists ? tutorUserDoc.data().email : null,
                  tutorName: tutorDoc.exists ? tutorDoc.data().name : 'Tutor',
                  amount: payoutData.amount,
                  reason: failureReason,
                  requestId: payoutData.requestId
                });
              } catch (err) {
                console.error('[webhook:payoutFailed]', err.message);
              }
            })();
          }
        }
      }
    }
  } catch (err) {
    console.error('[webhook:error]', err.message);
  }

  // Always return 200 to Paystack
  res.status(200).json({ received: true });
});

/**
 * PATCH /api/requests/:id/confirm (learner)
 * Also mapped to /:id/confirm and /confirm/:id for route mounting flexibility.
 * Marks request completed, triggers tutor payout, sets 7-day dispute deadline.
 */
router.patch(['/requests/:id/confirm', '/:id/confirm', '/confirm/:id'], verifyToken, requireRole('learner'), async (req, res) => {
  const reqRef = requests().doc(req.params.id);
  const snap = await reqRef.get();
  if (!snap.exists) {
    throw new HttpError(404, 'Request not found.');
  }

  const requestData = snap.data();
  if (requestData.learnerId !== req.user.uid) {
    throw new HttpError(403, 'You do not have permission to confirm this session.');
  }

  if (requestData.status !== 'paid') {
    throw new HttpError(400, 'Only paid requests can be confirmed.');
  }

  const now = new Date();
  const confirmedAt = now.toISOString();
  const disputeDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await reqRef.update({
    status: 'completed',
    confirmedAt,
    autoConfirmed: false,
    disputeDeadline
  });

  // Payout logic
  if (requestData.tutorEarning) {
    await processTutorPayout({
      requestId: req.params.id,
      tutorId: requestData.tutorId,
      earning: requestData.tutorEarning
    });
  }

  // Fire-and-forget notification
  (async () => {
    try {
      const [tutorUserDoc, learnerUserDoc] = await Promise.all([
        db.collection('users').doc(requestData.tutorId).get(),
        db.collection('users').doc(requestData.learnerId).get()
      ]);
      await notify.sessionConfirmed({
        tutorEmail: tutorUserDoc.exists ? tutorUserDoc.data().email : null,
        tutorName: requestData.tutorName,
        learnerEmail: learnerUserDoc.exists ? learnerUserDoc.data().email : req.user.email,
        learnerName: req.user.name || requestData.learnerName,
        amount: requestData.tutorEarning,
        autoConfirmed: false,
        disputeDeadline,
        requestId: req.params.id
      });
    } catch (err) {
      console.error('[notify:sessionConfirmed]', err.message);
    }
  })();

  res.json({
    request: {
      id: req.params.id,
      ...requestData,
      status: 'completed',
      confirmedAt,
      autoConfirmed: false,
      disputeDeadline
    }
  });
});

/**
 * PATCH /api/requests/:id/dispute (learner)
 * Also mapped to /:id/dispute and /dispute/:id.
 * Validates dispute window:
 *   - status == 'paid' && paidAt within 3 days
 *   - OR status == 'completed' && now < disputeDeadline
 */
router.patch(['/requests/:id/dispute', '/:id/dispute', '/dispute/:id'], verifyToken, requireRole('learner'), async (req, res) => {
  const reqRef = requests().doc(req.params.id);
  const snap = await reqRef.get();
  if (!snap.exists) {
    throw new HttpError(404, 'Request not found.');
  }

  const requestData = snap.data();
  if (requestData.learnerId !== req.user.uid) {
    throw new HttpError(403, 'You do not have permission to dispute this request.');
  }

  const now = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  const isPaidValid =
    requestData.status === 'paid' &&
    requestData.paidAt &&
    (now - new Date(requestData.paidAt).getTime() <= threeDaysMs);

  const isCompletedValid =
    requestData.status === 'completed' &&
    requestData.disputeDeadline &&
    (now < new Date(requestData.disputeDeadline).getTime());

  if (!isPaidValid && !isCompletedValid) {
    if (requestData.status === 'paid') {
      throw new HttpError(400, 'The 3-day dispute window for this paid session has expired.');
    }
    if (requestData.status === 'completed') {
      throw new HttpError(400, 'The dispute window for this completed session has closed.');
    }
    throw new HttpError(400, 'Only sessions in paid or completed status can be disputed.');
  }

  const reason = typeof req.body.reason === 'string' && req.body.reason.trim()
    ? req.body.reason.trim()
    : 'Session disputed by learner';

  const disputedAt = new Date().toISOString();
  await reqRef.update({
    status: 'disputed',
    disputedAt,
    disputeReason: reason
  });

  // Put associated payouts on hold
  const payoutSnap = await db.collection('payouts').where('requestId', '==', req.params.id).get();
  for (const doc of payoutSnap.docs) {
    const pData = doc.data();
    if (['processing', 'success', 'pending'].includes(pData.status)) {
      await doc.ref.update({ status: 'on_hold' });
    }
  }

  // Fire-and-forget notification to admin
  (async () => {
    try {
      await notify.dispute({
        requestId: req.params.id,
        learnerName: req.user.name || requestData.learnerName,
        tutorName: requestData.tutorName,
        reason,
        amount: requestData.grossAmount || requestData.tutorEarning
      });
    } catch (err) {
      console.error('[notify:dispute]', err.message);
    }
  })();

  res.json({
    request: {
      id: req.params.id,
      ...requestData,
      status: 'disputed',
      disputedAt,
      disputeReason: reason
    }
  });
});

/**
 * GET /api/admin/process-auto-confirms
 * Also mapped to /process-auto-confirms.
 * Finds requests with status 'paid' and paidAt < 3 days ago.
 * Auto-confirms them and initiates payouts.
 */
router.get(['/admin/process-auto-confirms', '/process-auto-confirms'], requireAdminOrCronSecret, async (req, res) => {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  // Query paid requests and filter in-memory to prevent requiring composite index
  const snap = await requests().where('status', '==', 'paid').get();
  const eligibleDocs = snap.docs.filter((d) => d.data().paidAt && d.data().paidAt < threeDaysAgo);

  let count = 0;
  for (const doc of eligibleDocs) {
    const requestData = doc.data();
    const confirmedAt = new Date().toISOString();
    const disputeDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await doc.ref.update({
      status: 'completed',
      confirmedAt,
      autoConfirmed: true,
      disputeDeadline
    });

    // Payout logic
    if (requestData.tutorEarning) {
      await processTutorPayout({
        requestId: doc.id,
        tutorId: requestData.tutorId,
        earning: requestData.tutorEarning
      });
    }

    // Fire-and-forget notifications
    (async () => {
      try {
        const [tutorUserDoc, learnerUserDoc] = await Promise.all([
          db.collection('users').doc(requestData.tutorId).get(),
          db.collection('users').doc(requestData.learnerId).get()
        ]);
        await notify.sessionConfirmed({
          tutorEmail: tutorUserDoc.exists ? tutorUserDoc.data().email : null,
          tutorName: requestData.tutorName,
          learnerEmail: learnerUserDoc.exists ? learnerUserDoc.data().email : null,
          learnerName: requestData.learnerName,
          amount: requestData.tutorEarning,
          autoConfirmed: true,
          disputeDeadline,
          requestId: doc.id
        });
      } catch (err) {
        console.error('[notify:autoConfirm]', err.message);
      }
    })();

    count++;
  }

  res.json({ processed: count });
});

export default router;
