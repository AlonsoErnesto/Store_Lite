import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { buildEventPayload, extractFbclid, getCookie, synthesizeFbc } from '../payload';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const NOW = new Date('2026-09-06T12:00:00.000Z');
const NOW_SECONDS = Math.floor(NOW.getTime() / 1000);

const base = {
  eventName: 'Purchase',
  eventId: 'evt-123',
  eventSourceUrl: 'https://store-lite.com/pricing',
  email: ' User@Example.COM ',
  fullName: 'Maria Fernanda Quispe',
  // eslint-disable-next-line sonarjs/no-hardcoded-ip -- test fixture address, not production infra
  clientIpAddress: '190.1.2.3',
  clientUserAgent: 'test-agent',
  fbp: 'fb.1.1.111',
  fbc: 'fb.1.2.222',
  customData: { value: 89.9, currency: 'PEN', plan_type: 'business_pro' },
  now: NOW,
};

describe('buildEventPayload', () => {
  it('builds a website Purchase payload with request-derived fields', () => {
    const payload = buildEventPayload(base);

    expect(payload).toMatchObject({
      event_name: 'Purchase',
      event_id: 'evt-123',
      event_source_url: 'https://store-lite.com/pricing',
      action_source: 'website',
    });
    expect(payload.event_time).toBe(NOW_SECONDS);
    // eslint-disable-next-line sonarjs/no-hardcoded-ip -- test fixture address, not production infra
    expect(payload.user_data.client_ip_address).toBe('190.1.2.3');
    expect(payload.user_data.client_user_agent).toBe('test-agent');
    expect(payload.user_data.fbp).toBe('fb.1.1.111');
    expect(payload.user_data.fbc).toBe('fb.1.2.222');
    expect(payload.custom_data).toEqual({
      value: 89.9,
      currency: 'PEN',
      plan_type: 'business_pro',
    });
  });

  it('sends only hashed PII — the raw email and name never appear in the payload', () => {
    const payload = buildEventPayload(base);
    const serialized = JSON.stringify(payload);

    expect(payload.user_data.em).toEqual([sha256('user@example.com')]);
    expect(payload.user_data.fn).toEqual([sha256('maria')]);
    expect(payload.user_data.ln).toEqual([sha256('fernanda quispe')]);
    expect(serialized).not.toContain('User@Example.COM');
    expect(serialized).not.toContain('Maria');
  });

  it('hashes the phone into user_data.ph when provided', () => {
    const payload = buildEventPayload({ ...base, phone: '+51 (987) 654-3210' });

    expect(payload.user_data.ph).toEqual([sha256('519876543210')]);
    expect(JSON.stringify(payload)).not.toContain('987');
  });

  it('omits empty PII fields instead of sending empty arrays', () => {
    const payload = buildEventPayload({ ...base, email: ' ', fullName: '' });

    expect(payload.user_data.em).toBeUndefined();
    expect(payload.user_data.fn).toBeUndefined();
    expect(payload.user_data.ln).toBeUndefined();
  });

  it('keeps external_id for Meta dedup identity', () => {
    const payload = buildEventPayload({ ...base, externalId: 'user-123' });

    expect(payload.user_data.external_id).toBe('user-123');
  });
});

describe('synthesizeFbc', () => {
  it('builds fbc=fb.1.<timestamp>.<fbclid> from the click id and event time', () => {
    expect(synthesizeFbc('ABC123', NOW)).toBe(`fb.1.${NOW_SECONDS}.ABC123`);
  });
});

describe('extractFbclid', () => {
  it('reads fbclid from the request URL query', () => {
    const url = new URL('https://store-lite.com/pricing?fbclid=URLCLICK1');
    expect(extractFbclid(url)).toBe('URLCLICK1');
  });

  it('falls back to the referer query when the URL has none', () => {
    const url = new URL('https://store-lite.com/pricing');
    expect(extractFbclid(url, 'https://facebook.com/?fbclid=REFCLICK2')).toBe('REFCLICK2');
  });

  it('returns undefined when there is no fbclid anywhere', () => {
    const url = new URL('https://store-lite.com/pricing');
    expect(extractFbclid(url, 'https://facebook.com/')).toBeUndefined();
  });
});

describe('getCookie', () => {
  it('reads a cookie value from a Cookie header', () => {
    expect(getCookie('_fbp=fb.1.1.111; _fbc=fb.1.2.222', '_fbc')).toBe('fb.1.2.222');
  });

  it('returns undefined for a missing cookie or a null header', () => {
    expect(getCookie('_fbp=fb.1.1.111', '_fbc')).toBeUndefined();
    expect(getCookie(null, '_fbp')).toBeUndefined();
  });
});
