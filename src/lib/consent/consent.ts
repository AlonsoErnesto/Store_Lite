/**
 * Consent state model for platform analytics tracking.
 *
 * Pure module — safe to import from both client and server code.
 * The cookie itself is read/written by `consentClient` (browser) and
 * `consentServer` (next/headers); this module only defines the contract.
 */

export const COOKIE_NAME = 'sl_consent_status';

export const CONSENT_VALUES = ['accepted', 'declined', 'pending'] as const;

export type ConsentState = (typeof CONSENT_VALUES)[number];

/** Values the cookie can actually be set to. `pending` is never written (absence means pending). */
export type ConsentChoice = Exclude<ConsentState, 'pending'>;

export function isConsentState(value: unknown): value is ConsentState {
  return value === 'accepted' || value === 'declined' || value === 'pending';
}

/**
 * Resolves a raw cookie value to a valid consent state.
 * Absent or invalid values default to `pending`.
 */
export function resolveConsentState(raw: string | null | undefined): ConsentState {
  return isConsentState(raw) ? raw : 'pending';
}
