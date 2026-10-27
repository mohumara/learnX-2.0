import { HttpError } from './httpError.js';

export const isEmail = (value) =>
  typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/** Trim a string and enforce length limits, or throw a 400. */
export function str(value, label, { min = 1, max = 200 } = {}) {
  const v = typeof value === 'string' ? value.trim() : '';
  if (v.length < min) {
    throw new HttpError(400, min <= 1 ? `${label} is required.` : `${label} must be at least ${min} characters.`);
  }
  if (v.length > max) throw new HttpError(400, `${label} must be at most ${max} characters.`);
  return v;
}

/** Require a value to be one of an allowed list. */
export function oneOf(value, label, allowed) {
  if (!allowed.includes(value)) throw new HttpError(400, `${label} must be one of: ${allowed.join(', ')}.`);
  return value;
}

/** Require an array whose items all come from an allowed list. Returns it de-duplicated. */
export function subset(value, label, allowed) {
  if (!Array.isArray(value)) throw new HttpError(400, `${label} must be a list.`);
  const invalid = value.filter((v) => !allowed.includes(v));
  if (invalid.length) throw new HttpError(400, `${label} contains invalid values: ${invalid.join(', ')}.`);
  return [...new Set(value)];
}
