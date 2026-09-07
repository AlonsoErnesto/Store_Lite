// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MetaEventPayload } from '../payload';

const mockFetch = vi.fn();

const sampleEvent: MetaEventPayload = {
  event_name: 'Purchase',
  event_time: 1_700_000_000,
  event_id: 'evt-123',
  action_source: 'website',
  event_source_url: 'https://store-lite.com/pricing',
  user_data: { em: ['abc'] },
  custom_data: { value: 89.9, currency: 'PEN' },
};

/** Re-imports capi after env stubs so the frozen env snapshot is fresh. */
async function loadCapi() {
  vi.resetModules();
  return import('../capi');
}

const OK_RESPONSE = { ok: true, status: 200, json: async () => ({}) };
const ERROR_500 = { ok: false, status: 500, json: async () => ({}) };
const ERROR_400 = { ok: false, status: 400, json: async () => ({}) };

describe('Meta CAPI client (sendEvent)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', '1234567890123');
    vi.stubEnv('META_CAPI_ACCESS_TOKEN', 'EAA-test-token');
    vi.stubEnv('META_TEST_EVENT_CODE', '');
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('posts to graph.facebook.com/v21.0/{pixelId}/events with token and event body', async () => {
    mockFetch.mockResolvedValue(OK_RESPONSE);
    const { sendEvent } = await loadCapi();

    const result = await sendEvent(sampleEvent);

    expect(result).toEqual({ ok: true, status: 200, attempt: 1 });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://graph.facebook.com/v21.0/1234567890123/events');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.access_token).toBe('EAA-test-token');
    expect(body.data).toEqual([sampleEvent]);
    expect(body).not.toHaveProperty('test_event_code');
  });

  it('adds test_event_code to the body when META_TEST_EVENT_CODE is set', async () => {
    vi.stubEnv('META_TEST_EVENT_CODE', 'TEST-CODE-1');
    mockFetch.mockResolvedValue(OK_RESPONSE);
    const { sendEvent } = await loadCapi();

    await sendEvent(sampleEvent);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.test_event_code).toBe('TEST-CODE-1');
  });

  it('passes an AbortController signal so the request can time out', async () => {
    mockFetch.mockResolvedValue(OK_RESPONSE);
    const { sendEvent } = await loadCapi();

    await sendEvent(sampleEvent);

    const init = mockFetch.mock.calls[0][1];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('retries once on HTTP 5xx and reports failure without rejecting', async () => {
    mockFetch.mockResolvedValueOnce(ERROR_500).mockResolvedValueOnce(ERROR_500);
    vi.useFakeTimers();
    const { sendEvent } = await loadCapi();

    const promise = sendEvent(sampleEvent);
    await vi.advanceTimersByTimeAsync(250);
    const result = await promise;

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: false, status: 500, attempt: 2 });
  });

  it('never retries on HTTP 4xx', async () => {
    mockFetch.mockResolvedValueOnce(ERROR_400);
    const { sendEvent } = await loadCapi();

    const result = await sendEvent(sampleEvent);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: false, status: 400, attempt: 1 });
  });

  it('retries once on network failure and resolves (never rejects)', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));
    mockFetch.mockResolvedValueOnce(OK_RESPONSE);
    vi.useFakeTimers();
    const { sendEvent } = await loadCapi();

    const promise = sendEvent(sampleEvent);
    await vi.advanceTimersByTimeAsync(250);
    const result = await promise;

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: true, status: 200, attempt: 2 });
  });

  it('resolves with failure after both attempts fail on network errors', async () => {
    mockFetch.mockRejectedValue(new TypeError('fetch failed'));
    vi.useFakeTimers();
    const { sendEvent } = await loadCapi();

    const promise = sendEvent(sampleEvent);
    await vi.advanceTimersByTimeAsync(250);
    const result = await promise;

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: false, attempt: 2 });
    expect(result.status).toBeUndefined();
  });

  it('no-ops without a token — never touches fetch', async () => {
    vi.stubEnv('META_CAPI_ACCESS_TOKEN', '');
    const { sendEvent } = await loadCapi();

    const result = await sendEvent(sampleEvent);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, attempt: 0 });
  });

  it('fireEvent swallows send failures and never throws into the caller', async () => {
    mockFetch.mockRejectedValue(new TypeError('fetch failed'));
    vi.useFakeTimers();
    const { fireEvent } = await loadCapi();

    let threw = false;
    try {
      fireEvent('Purchase', {
        eventId: 'evt-123',
        eventSourceUrl: 'https://store-lite.com/pricing',
        email: 'Test@Example.com',
        customData: { value: 89.9, currency: 'PEN' },
      });
      await vi.advanceTimersByTimeAsync(500);
    } catch {
      threw = true;
    }

    expect(threw).toBe(false);
  });
});
