/**
 * Paystack service — all Paystack API calls go through here.
 * Uses Node 18+ native fetch (no axios).
 * All amounts to/from Paystack are in KOBO (multiply NGN by 100).
 */

const PAYSTACK_BASE = 'https://api.paystack.co';

function paystackHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function paystackRequest(method, path, body) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: paystackHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();

  if (!res.ok || !data.status) {
    const msg = data?.message || `Paystack request failed: ${path}`;
    throw new Error(msg);
  }

  return data.data;
}

/**
 * Initialize a Paystack transaction (redirect mode).
 * If PAYSTACK_SECRET_KEY is empty/dummy, falls back to a mock simulation mode for testing.
 *
 * @param {object} opts
 * @param {string} opts.email          - Learner's email address
 * @param {number} opts.amountNgn      - Amount in NGN (we convert to kobo internally)
 * @param {string} opts.reference      - Unique reference: `lx_${requestId}_${Date.now()}`
 * @param {object} [opts.metadata]     - Extra data to attach (e.g. { requestId })
 * @returns {{ authorization_url: string, access_code: string, reference: string }}
 */
export async function initializeTransaction({ email, amountNgn, reference, metadata = {} }) {
  if (!process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY.trim() === '') {
    console.log(`[Paystack MOCK] initializeTransaction: reference=${reference}, amount=₦${amountNgn}`);
    return {
      authorization_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/verify?reference=${reference}`,
      access_code: `mock_code_${Date.now()}`,
      reference
    };
  }

  return paystackRequest('POST', '/transaction/initialize', {
    email,
    amount: amountNgn * 100, // kobo
    reference,
    callback_url: `${process.env.CLIENT_URL}/payment/verify`,
    metadata,
    currency: 'NGN',
  });
}

/**
 * Verify a Paystack transaction by reference.
 * If PAYSTACK_SECRET_KEY is empty/dummy, returns simulated success.
 *
 * @param {string} reference
 * @returns {object} Paystack transaction data (status, amount, metadata, …)
 */
export async function verifyTransaction(reference) {
  if (!process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY.trim() === '') {
    console.log(`[Paystack MOCK] verifyTransaction: reference=${reference}`);
    return {
      status: 'success',
      reference,
      amount: null, // mock allows verify route to pass without strict kobo mismatch
      gateway_response: 'Successful (Mock Simulation)',
      paid_at: new Date().toISOString()
    };
  }

  return paystackRequest('GET', `/transaction/verify/${encodeURIComponent(reference)}`);
}

/**
 * Create a Paystack transfer recipient (one-time per tutor).
 *
 * @param {object} opts
 * @param {string} opts.accountName    - Confirmed account holder name (from verifyBankAccount)
 * @param {string} opts.accountNumber  - 10-digit NUBAN account number
 * @param {string} opts.bankCode       - Paystack bank code (e.g. "058" for GTBank)
 * @returns {{ recipient_code: string, ... }}
 */
export async function createRecipient({ accountName, accountNumber, bankCode }) {
  if (!process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY.trim() === '') {
    console.log(`[Paystack MOCK] createRecipient for: ${accountName}`);
    return { recipient_code: `RCP_mock_${Date.now()}` };
  }

  return paystackRequest('POST', '/transferrecipient', {
    type: 'nuban',
    name: accountName,
    account_number: accountNumber,
    bank_code: bankCode,
    currency: 'NGN',
  });
}

/**
 * Initiate a transfer to a tutor (payout).
 *
 * @param {object} opts
 * @param {number} opts.amountNgn      - Amount in NGN (we convert to kobo internally)
 * @param {string} opts.recipientCode  - Paystack recipient code stored on tutor doc
 * @param {string} opts.reason         - Human-readable reason (e.g. "LearnX payout for session: xyz")
 * @returns {{ transfer_code: string, status: string, ... }}
 */
export async function initiateTransfer({ amountNgn, recipientCode, reason }) {
  if (!process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY.trim() === '') {
    console.log(`[Paystack MOCK] initiateTransfer: ₦${amountNgn} to ${recipientCode}`);
    return { transfer_code: `TRF_mock_${Date.now()}`, status: 'success' };
  }

  return paystackRequest('POST', '/transfer', {
    source: 'balance',
    amount: amountNgn * 100, // kobo
    recipient: recipientCode,
    reason,
  });
}

/**
 * Verify a bank account number via Paystack (account name inquiry).
 * If PAYSTACK_SECRET_KEY is empty/dummy, returns simulated name.
 *
 * @param {string} accountNumber  - 10-digit NUBAN
 * @param {string} bankCode       - Paystack bank code
 * @returns {{ account_name: string, account_number: string }}
 */
export async function verifyBankAccount(accountNumber, bankCode) {
  if (!process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY.trim() === '') {
    console.log(`[Paystack MOCK] verifyBankAccount: ${accountNumber} (bank: ${bankCode})`);
    return {
      account_name: 'TEST TUTOR ACCOUNT',
      account_number: accountNumber
    };
  }

  return paystackRequest(
    'GET',
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`
  );
}
