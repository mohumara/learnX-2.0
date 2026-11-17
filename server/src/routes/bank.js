import { Router } from 'express';
import { db } from '../config/firebase.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { HttpError } from '../utils/httpError.js';
import { str } from '../utils/validate.js';
import * as paystack from '../services/paystack.js';

const router = Router();
const tutors = () => db.collection('tutors');

/**
 * GET /api/tutors/me/bank
 * Tutor fetches their saved bank details (account number masked).
 */
router.get(['/me/bank', '/bank', '/'], verifyToken, requireRole('tutor'), async (req, res) => {
  const tutorSnap = await tutors().doc(req.user.uid).get();
  if (!tutorSnap.exists) {
    throw new HttpError(404, 'Tutor not found.');
  }

  const tutor = tutorSnap.data();
  const bankName = tutor.bankName || null;
  const bankCode = tutor.bankCode || null;
  const accountName = tutor.accountName || null;
  const accountNumber = tutor.accountNumber
    ? `******${tutor.accountNumber.slice(-4)}`
    : null;
  const payoutSetupDone = Boolean(tutor.payoutSetupDone);

  const bankData = {
    bankName,
    bankCode,
    accountName,
    accountNumber,
    payoutSetupDone
  };

  res.json({
    bank: bankData,
    ...bankData
  });
});

/**
 * POST /api/tutors/me/bank
 * Tutor saves/updates their bank details.
 * Body: { bankCode, accountNumber, bankName }
 * Validates account with Paystack and creates a transfer recipient.
 */
router.post(['/me/bank', '/bank', '/'], verifyToken, requireRole('tutor'), async (req, res) => {
  const bankCode = str(req.body.bankCode, 'Bank code', { max: 20 });
  const accountNumber = str(req.body.accountNumber, 'Account number', { min: 10, max: 10 });
  const bankName = str(req.body.bankName, 'Bank name', { max: 100 });

  if (!/^\d{10}$/.test(accountNumber)) {
    throw new HttpError(400, 'Account number must be a 10-digit NUBAN.');
  }

  // 1. Verify bank account with Paystack
  let accountData;
  try {
    accountData = await paystack.verifyBankAccount(accountNumber, bankCode);
  } catch (err) {
    throw new HttpError(400, err.message || 'Could not verify bank account details with Paystack.');
  }

  const accountName = accountData?.account_name || accountData?.accountName;
  if (!accountName) {
    throw new HttpError(400, 'Could not resolve account name with Paystack.');
  }

  // 2. Create Paystack transfer recipient
  let recipientData;
  try {
    recipientData = await paystack.createRecipient({
      accountName,
      accountNumber,
      bankCode
    });
  } catch (err) {
    throw new HttpError(400, err.message || 'Could not create transfer recipient with Paystack.');
  }

  const recipientCode = recipientData?.recipient_code || recipientData?.recipientCode || null;

  // 3. Update tutor doc
  const tutorRef = tutors().doc(req.user.uid);
  const updateData = {
    bankName,
    bankCode,
    accountNumber, // Full number stored securely in Firestore
    accountName,
    payoutSetupDone: true
  };
  if (recipientCode) {
    updateData.recipientCode = recipientCode;
  }

  await tutorRef.set(updateData, { merge: true });

  // 4. Return masked details
  const maskedAccountNumber = `******${accountNumber.slice(-4)}`;
  const bankData = {
    bankName,
    bankCode,
    accountName,
    accountNumber: maskedAccountNumber,
    payoutSetupDone: true
  };

  res.json({
    bank: bankData,
    ...bankData
  });
});

export default router;
