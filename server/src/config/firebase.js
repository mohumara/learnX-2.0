import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Loads the Firebase service account from either:
 *   I.  FIREBASE_SERVICE_ACCOUNT (full JSON as a string), used on hosts like Render
 *   II. FIREBASE_SERVICE_ACCOUNT_PATH (a local file), used in development
 */
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    // Hosting dashboards often turn real newlines in the key into literal "\n"
    if (account.private_key) account.private_key = account.private_key.replace(/\\n/g, '\n');
    return account;
  }

  const path = resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json');
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new Error(
      `Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT, or put the key file at ${path}.`
    );
  }
}

if (!getApps().length) {
  initializeApp({ credential: cert(loadServiceAccount()) });
}

export const auth = getAuth();
export const db = getFirestore();
