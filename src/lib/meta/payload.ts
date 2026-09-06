import { hashEmail, hashFullName, hashPhone } from './hashPii';

/**
 * Meta Conversions API (CAPI) event payload builder.
 *
 * Pure and deterministic (injectable `now`), so every field is unit-testable:
 * hashed-only PII, request-derived context (ip/ua/cookies), optional fbc
 * synthesis from fbclid, and the shared `event_id` used for pixel↔CAPI dedup.
 *
 * Server-only by construction: it imports `hashPii` (`node:crypto`), so a
 * client bundle cannot build against it.
 */

/** Meta user_data: arrays of SHA-256 hashes for PII (Meta's accepted shape). */
export interface MetaUserData {
  em?: string[];
  fn?: string[];
  ln?: string[];
  ph?: string[];
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
  external_id?: string;
}

export interface MetaEventPayload {
  event_name: string;
  event_time: number; // unix seconds
  event_id: string;
  action_source: 'website';
  event_source_url: string;
  user_data: MetaUserData;
  custom_data: Record<string, unknown>;
}

export interface BuildEventPayloadInput {
  eventName: string;
  eventId: string;
  eventSourceUrl: string;
  email?: string;
  fullName?: string;
  phone?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
  fbclid?: string;
  customData?: Record<string, unknown>;
  /** Injectable clock for deterministic tests; defaults to the current time. */
  now?: Date;
}

/**
 * Synthesizes the `fbc` cookie value from a `fbclid` click id when Meta's
 * `_fbc` cookie is absent (first click of a session): `fb.1.<unix seconds>.<fbclid>`.
 * Time-of-event only — nothing is persisted here.
 */
export function synthesizeFbc(fbclid: string, now?: Date): string {
  const timestamp = Math.floor((now ?? new Date()).getTime() / 1000);
  return `fb.1.${timestamp}.${fbclid}`;
}

/**
 * Extracts `fbclid` from the request URL query first, falling back to the
 * referer URL's query when the landing URL has none.
 */
export function extractFbclid(url: URL, referer?: string | null): string | undefined {
  const fromUrl = url.searchParams.get('fbclid');
  if (fromUrl) return fromUrl;
  if (referer) {
    try {
      return new URL(referer).searchParams.get('fbclid') ?? undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/** Reads a single cookie value out of a raw `Cookie` request header. */
export function getCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (rawName === name) return rawValue.join('=');
  }
  return undefined;
}

/**
 * Builds a CAPI event payload. PII (email, phone, name) is normalized and
 * hashed before it is included; empty values are omitted entirely, never sent
 * as empty arrays or raw strings.
 */
export function buildEventPayload(input: BuildEventPayloadInput): MetaEventPayload {
  const userData: MetaUserData = {};

  const email = input.email?.trim();
  if (email) userData.em = [hashEmail(email)];

  const phone = input.phone?.trim();
  if (phone) userData.ph = [hashPhone(phone)];

  const fullNameHashes = hashFullName(input.fullName ?? '');
  if (fullNameHashes.fn) userData.fn = [fullNameHashes.fn];
  if (fullNameHashes.ln) userData.ln = [fullNameHashes.ln];

  if (input.externalId) userData.external_id = input.externalId;
  if (input.clientIpAddress) userData.client_ip_address = input.clientIpAddress;
  if (input.clientUserAgent) userData.client_user_agent = input.clientUserAgent;
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;
  // Synthesize fbc only when Meta's own cookie is absent and a click id exists.
  if (!input.fbc && input.fbclid) userData.fbc = synthesizeFbc(input.fbclid, input.now);

  return {
    event_name: input.eventName,
    event_time: Math.floor((input.now ?? new Date()).getTime() / 1000),
    event_id: input.eventId,
    action_source: 'website',
    event_source_url: input.eventSourceUrl,
    user_data: userData,
    custom_data: input.customData ?? {},
  };
}
