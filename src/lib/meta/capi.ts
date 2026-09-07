import { env } from '@/config/env';

import { buildEventPayload, type BuildEventPayloadInput, type MetaEventPayload } from './payload';

/**
 * Meta Conversions API (CAPI) client — server-only, fire-and-forget.
 *
 * - Posts to `graph.facebook.com/v21.0/{pixelId}/events` (design D8).
 * - ~10s AbortController timeout per attempt; one best-effort retry on network
 *   errors or HTTP 5xx (250ms backoff), never on 4xx (bad requests won't heal).
 * - Final failures are swallowed: tracking must NEVER affect the originating
 *   request (spec: "CAPI failure tolerated", design D4).
 * - No token configured → no-op (env-gated rollout).
 *
 * Server-only guard: `sendEvent` refuses to run in a windowed context (design
 * D5 belt-and-braces — the `node:crypto` import in `hashPii` already fails any
 * client bundle at build). The guard sits INSIDE the functions, not at module
 * top, so importing the module (e.g. in tests) stays safe.
 */

export const GRAPH_API_VERSION = 'v21.0';
export const GRAPH_API_BASE = 'https://graph.facebook.com';
export const CAPI_TIMEOUT_MS = 10_000;
export const CAPI_RETRY_BACKOFF_MS = 250;

export interface SendEventResult {
  ok: boolean;
  status?: number;
  attempt: number;
}

function assertServerContext(): void {
  if (typeof window !== 'undefined') {
    throw new Error('Meta CAPI is server-only; sendEvent must not run in a browser context');
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends one CAPI event to Graph API. Resolves with a result object — it never
 * rejects for network/timeout/HTTP failures (the caller observes `ok`/`status`).
 */
export async function sendEvent(event: MetaEventPayload): Promise<SendEventResult> {
  const token = env.metaCapiAccessToken;
  if (!token) return { ok: false, attempt: 0 };

  assertServerContext();

  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${env.metaPixelId}/events`;
  const body: Record<string, unknown> = {
    data: [event],
    access_token: token,
  };
  if (env.metaTestEventCode) body.test_event_code = env.metaTestEventCode;

  let lastStatus: number | undefined;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const outcome = await postOnce(url, body);
    lastStatus = outcome.status;

    if (outcome.status !== undefined && outcome.status < 500) {
      // 2xx/3xx success, or a 4xx the token/body will never fix — no retry.
      return { ok: outcome.status < 400, status: outcome.status, attempt };
    }
    // Network error or HTTP 5xx → best-effort retry once.
    if (attempt === 1) await delay(CAPI_RETRY_BACKOFF_MS);
  }
  return { ok: false, status: lastStatus, attempt: 2 };
}

async function postOnce(url: string, body: Record<string, unknown>): Promise<{ status?: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CAPI_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return { status: response.status };
  } catch {
    // Network error or abort — reported via absence of status (retryable).
    return { status: undefined };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Builds and sends a CAPI event fire-and-forget. NEVER throws into the
 * caller and never rejects: the send runs detached and every failure is
 * swallowed (design D4). The returned promise is only meaningful to a caller
 * that wants to mirror the repo's `.catch(() => {})` fire-and-forget style.
 */
export function fireEvent(
  eventName: string,
  input: Omit<BuildEventPayloadInput, 'eventName'> & { eventId: string },
): Promise<void> {
  try {
    const event = buildEventPayload({ eventName, ...input });
    return sendEvent(event).then(
      () => undefined, // resolve for the caller even on failure
      () => undefined, // never reject — tracking must not surface
    );
  } catch {
    // Payload building is total, but even a surprise must not break the caller.
    return Promise.resolve();
  }
}
