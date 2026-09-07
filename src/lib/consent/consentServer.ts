import { cookies } from 'next/headers';

import { COOKIE_NAME, resolveConsentState, type ConsentState } from './consent';

/**
 * Server-side consent read via the request cookie store.
 * Used by CAPI/route layers to re-check consent before sending events —
 * client state alone never authorizes server sends.
 */
export async function getConsentState(): Promise<ConsentState> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  return resolveConsentState(value);
}
