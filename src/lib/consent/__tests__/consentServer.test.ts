import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCookieGet } = vi.hoisted(() => ({ mockCookieGet: vi.fn() }));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ get: mockCookieGet })),
}));

import { getConsentState } from '../consentServer';

describe('getConsentState (server)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieGet.mockReturnValue(undefined);
  });

  it('returns accepted when the consent cookie is present', async () => {
    mockCookieGet.mockReturnValue({ value: 'accepted' });

    await expect(getConsentState()).resolves.toBe('accepted');
  });

  it('returns declined when the consent cookie is declined', async () => {
    mockCookieGet.mockReturnValue({ value: 'declined' });

    await expect(getConsentState()).resolves.toBe('declined');
  });

  it('returns pending when the consent cookie is absent', async () => {
    await expect(getConsentState()).resolves.toBe('pending');
  });

  it('returns pending for an invalid cookie value', async () => {
    mockCookieGet.mockReturnValue({ value: 'maybe' });

    await expect(getConsentState()).resolves.toBe('pending');
  });
});
