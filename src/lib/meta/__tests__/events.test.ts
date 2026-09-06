import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COOKIE_NAME } from '@/lib/consent/consent';
import type { trackPageView, trackViewContent } from '../events';
import type { initFbq } from '../fbq';

interface EventsModule {
  trackPageView: typeof trackPageView;
  trackViewContent: typeof trackViewContent;
}
interface FbqModule {
  initFbq: typeof initFbq;
}

const TEST_PIXEL = 'TEST_PIXEL';

/** Simulates the loaded Meta library (see fbq.test.ts). */
function createLoadedFbq() {
  const spy = vi.fn();
  Object.assign(spy, {
    callMethod: vi.fn(),
    queue: [] as unknown[][],
    loaded: true,
    version: '2.0',
    push: spy,
  });
  return spy;
}

function clearCookies() {
  document.cookie.split(';').forEach((part) => {
    const name = part.trim().split('=')[0];
    if (name) document.cookie = `${name}=; Path=/; Max-Age=0`;
  });
}

function setConsentCookie(value: string) {
  document.cookie = `${COOKIE_NAME}=${value}; Path=/`;
}

describe('consent-gated event helpers', () => {
  let events: EventsModule;
  let fbq: FbqModule;
  let spy: ReturnType<typeof createLoadedFbq>;

  beforeEach(async () => {
    vi.resetModules();
    clearCookies();
    spy = createLoadedFbq();
    window.fbq = spy as unknown as Window['fbq'];
    fbq = await import('../fbq');
    events = await import('../events');
  });

  afterEach(() => {
    clearCookies();
    delete (window as { fbq?: unknown }).fbq;
  });

  it('fires PageView when consent is accepted', () => {
    setConsentCookie('accepted');
    fbq.initFbq(TEST_PIXEL);

    events.trackPageView();

    expect(spy).toHaveBeenCalledWith('track', 'PageView');
  });

  it('does not fire PageView when consent is declined', () => {
    setConsentCookie('declined');
    fbq.initFbq(TEST_PIXEL);

    events.trackPageView();

    // init legitimately reaches fbq (initFbq); the track command must not.
    expect(spy).not.toHaveBeenCalledWith('track', 'PageView');
  });

  it('does not fire PageView while consent is pending (no cookie)', () => {
    fbq.initFbq(TEST_PIXEL);

    events.trackPageView();

    expect(spy).not.toHaveBeenCalledWith('track', 'PageView');
  });

  it('fires ViewContent with typed custom data when consent is accepted', () => {
    setConsentCookie('accepted');
    fbq.initFbq(TEST_PIXEL);

    events.trackViewContent({ content_type: 'product', content_name: 'Plan' });

    expect(spy).toHaveBeenCalledWith('track', 'ViewContent', {
      content_type: 'product',
      content_name: 'Plan',
    });
  });

  it('passes the eventID through to the underlying track call', () => {
    setConsentCookie('accepted');
    fbq.initFbq(TEST_PIXEL);

    events.trackPageView('evt-abc');

    expect(spy).toHaveBeenCalledWith('track', 'PageView', { eventID: 'evt-abc' });
  });
});
