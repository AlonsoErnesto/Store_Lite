import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COOKIE_NAME } from '../consent';
import {
  buildCookieAttributes,
  getConsentState,
  resetConsent,
  setConsentState,
} from '../consentClient';

const COOKIE_PREFIX = `${COOKIE_NAME}=`;

/** Reads a raw cookie value straight from the DOM store (independent of production parsing). */
function readCookieValue(): string | undefined {
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(COOKIE_PREFIX)) {
      return trimmed.slice(COOKIE_PREFIX.length);
    }
  }
  return undefined;
}

function clearAllCookies() {
  document.cookie.split(';').forEach((part) => {
    const name = part.trim().split('=')[0];
    if (name) document.cookie = `${name}=; Path=/; Max-Age=0`;
  });
}

describe('consentClient', () => {
  beforeEach(() => {
    clearAllCookies();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getConsentState', () => {
    it('resolves pending when no consent cookie exists', () => {
      expect(getConsentState()).toBe('pending');
    });

    it('reads back an accepted cookie written by setConsentState', () => {
      setConsentState('accepted');

      expect(getConsentState()).toBe('accepted');
    });

    it('reads back a declined cookie written by setConsentState', () => {
      setConsentState('declined');

      expect(getConsentState()).toBe('declined');
    });

    it('resolves pending for an invalid cookie value', () => {
      document.cookie = `${COOKIE_NAME}=garbage`;

      expect(getConsentState()).toBe('pending');
    });
  });

  describe('setConsentState', () => {
    it('writes the accepted value into document.cookie', () => {
      setConsentState('accepted');

      expect(readCookieValue()).toBe('accepted');
    });

    it('writes host-only attributes without a Domain', () => {
      const setter = vi.spyOn(document, 'cookie', 'set');

      setConsentState('accepted');

      expect(setter).toHaveBeenCalledWith(
        `${COOKIE_NAME}=accepted; Path=/; Max-Age=31536000; SameSite=Lax`,
      );
    });
  });

  describe('resetConsent', () => {
    it('removes the cookie so state returns to pending', () => {
      setConsentState('accepted');
      expect(getConsentState()).toBe('accepted');

      resetConsent();

      expect(readCookieValue()).toBeUndefined();
      expect(getConsentState()).toBe('pending');
    });
  });

  describe('buildCookieAttributes', () => {
    it('adds Secure only when the protocol is https', () => {
      expect(buildCookieAttributes('https:')).toContain('; Secure');
      expect(buildCookieAttributes('http:')).not.toContain('Secure');
    });

    it('never includes a Domain attribute (host-only cookie)', () => {
      expect(buildCookieAttributes('https:')).not.toContain('Domain');
      expect(buildCookieAttributes('http:')).not.toContain('Domain');
    });
  });
});
