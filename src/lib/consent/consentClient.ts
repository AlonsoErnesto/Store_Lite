'use client';

import { COOKIE_NAME, resolveConsentState, type ConsentChoice, type ConsentState } from './consent';

const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year
const SAME_SITE = 'Lax';

/**
 * Builds the attribute string for the consent cookie.
 *
 * Host-only by design (no `Domain`): consent is platform-scoped and must never
 * leak to tenant subdomains via the shared cookie domain.
 *
 * Pure helper — exported so the exact attributes are unit-testable.
 */
export function buildCookieAttributes(protocol: string): string {
  const secure = protocol === 'https:' ? '; Secure' : '';
  return `Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=${SAME_SITE}${secure}`;
}

function readCookieValue(): string | undefined {
  const prefix = `${COOKIE_NAME}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return undefined;
}

/** Reads the current consent state from the browser cookie. Absent cookie resolves to `pending`. */
export function getConsentState(): ConsentState {
  if (typeof document === 'undefined') return 'pending';
  return resolveConsentState(readCookieValue());
}

/** Persists an explicit consent choice. `pending` is never written — absence means pending. */
export function setConsentState(state: ConsentChoice): void {
  if (typeof document === 'undefined') return;
  const protocol = window.location.protocol;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(state)}; ${buildCookieAttributes(protocol)}`;
}

/** Clears the consent cookie; absence resolves back to `pending` (banner re-appears). */
export function resetConsent(): void {
  if (typeof document === 'undefined') return;
  const protocol = window.location.protocol;
  const secure = protocol === 'https:' ? '; Secure' : '';
  // Max-Age=0 + Expires in the past covers browsers that ignore Max-Age on deletion.
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=${SAME_SITE}${secure}`;
}
