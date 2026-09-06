import { createHash } from 'node:crypto';

/**
 * PII normalization + SHA-256 hashing for Meta CAPI user_data.
 *
 * Meta only accepts hashed PII: only digests leave the server, never raw
 * values. Values are normalized BEFORE hashing so the same real-world input
 * (different casing/whitespace) always produces the same digest that Meta's
 * own hashing of the canonical form would produce.
 *
 * Server-only: importing `node:crypto` makes any client bundle fail at build
 * (design D5), so this module is safe to import from route handlers.
 */

/** Emails: trim whitespace and lowercase — Meta matches on the lowercase form. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Phones: reduce to digits, keeping the country code (e.g. `+51 (987) 654-3210` → `519876543210`). */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Names: trim whitespace and lowercase before hashing. */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Splits a full name on the first space into Meta's `fn`/`ln` shape, mirroring
 * `splitFullName` in `@/shared/payments/fullName` but with Meta's field names.
 */
export function splitFullName(fullName: string): { fn?: string; ln?: string } {
  const name = fullName.trim();
  if (!name) return {};

  const firstSpace = name.indexOf(' ');
  if (firstSpace === -1) return { fn: name };

  return {
    fn: name.slice(0, firstSpace),
    ln: name.slice(firstSpace + 1).trim() || undefined,
  };
}

/** SHA-256 hex digest (lowercase) of an already-normalized value. */
export function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Normalizes then hashes an email. */
export function hashEmail(email: string): string {
  return hashValue(normalizeEmail(email));
}

/** Normalizes then hashes a phone. */
export function hashPhone(phone: string): string {
  return hashValue(normalizePhone(phone));
}

/** Normalizes then hashes a single name part. */
export function hashName(name: string): string {
  return hashValue(normalizeName(name));
}

/** Splits and hashes both name parts for Meta's `fn`/`ln` user_data fields. */
export function hashFullName(fullName: string): { fn?: string; ln?: string } {
  const { fn, ln } = splitFullName(fullName);
  const result: { fn?: string; ln?: string } = {};
  if (fn) result.fn = hashName(fn);
  if (ln) result.ln = hashName(ln);
  return result;
}
