import { auth } from './firebase';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * Thin fetch wrapper: attaches the Firebase ID token, serialises query params
 * and JSON bodies, and turns error responses into ApiError with the server's message.
 */
async function request(path, { method = 'GET', body, params, authenticated = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authenticated && auth.currentUser) {
    headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
  }

  const query = params
    ? new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== '' && v != null && v !== false)
      ).toString()
    : '';

  let res;
  try {
    res = await fetch(`${BASE}${path}${query ? `?${query}` : ''}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong.', res.status);
  return data;
}

export const api = {
  get: (path, options) => request(path, options),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' })
};
