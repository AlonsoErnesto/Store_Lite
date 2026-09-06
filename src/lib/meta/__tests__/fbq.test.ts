import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { initFbq, trackEvent } from '../fbq';

interface FbqModule {
  initFbq: typeof initFbq;
  trackEvent: typeof trackEvent;
}

/**
 * Simulates the fully-loaded Meta library: a callable that carries the
 * `callMethod` marker `fbevents.js` installs when it takes over the queue.
 */
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

describe('fbq wrapper', () => {
  let fbq: FbqModule;

  beforeEach(async () => {
    vi.resetModules();
    delete (window as { fbq?: unknown }).fbq;
    fbq = await import('../fbq');
  });

  afterEach(() => {
    delete (window as { fbq?: unknown }).fbq;
  });

  it('defines a queue and queues init + track when the library has not loaded yet', () => {
    fbq.initFbq('TEST_PIXEL');
    fbq.trackEvent('PageView');

    expect(window.fbq?.queue).toEqual([
      ['init', 'TEST_PIXEL'],
      ['track', 'PageView'],
    ]);
    expect(window.fbq?.loaded).toBe(true);
  });

  it('calls the loaded library directly for init and track', () => {
    const spy = createLoadedFbq();
    window.fbq = spy as unknown as Window['fbq'];

    fbq.initFbq('TEST_PIXEL');
    fbq.trackEvent('PageView', { value: 5 });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith('init', 'TEST_PIXEL');
    expect(spy).toHaveBeenCalledWith('track', 'PageView', { value: 5 });
  });

  it('does not fire events before initFbq runs', () => {
    const spy = createLoadedFbq();
    window.fbq = spy as unknown as Window['fbq'];

    fbq.trackEvent('PageView');

    expect(spy).not.toHaveBeenCalled();
  });

  it('merges the eventID into the track payload', () => {
    const spy = createLoadedFbq();
    window.fbq = spy as unknown as Window['fbq'];

    fbq.initFbq('TEST_PIXEL');
    fbq.trackEvent('Purchase', { value: 100, currency: 'PEN' }, 'evt-123');

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith('track', 'Purchase', {
      value: 100,
      currency: 'PEN',
      eventID: 'evt-123',
    });
  });

  it('initializes only once even when called repeatedly', () => {
    const spy = createLoadedFbq();
    window.fbq = spy as unknown as Window['fbq'];

    fbq.initFbq('TEST_PIXEL');
    fbq.initFbq('TEST_PIXEL');
    fbq.initFbq('OTHER_PIXEL');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('init', 'TEST_PIXEL');
  });

  it('does not init without a pixel id', () => {
    fbq.initFbq('');

    expect(window.fbq).toBeUndefined();
  });

  it('no-ops safely when window is undefined (SSR render)', async () => {
    vi.stubGlobal('window', undefined);
    vi.resetModules();
    const serverFbq = await import('../fbq');

    expect(() => {
      serverFbq.initFbq('TEST_PIXEL');
      serverFbq.trackEvent('PageView');
    }).not.toThrow();
    vi.unstubAllGlobals();
  });
});
