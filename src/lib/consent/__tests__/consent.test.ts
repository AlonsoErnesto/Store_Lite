import { describe, expect, it } from 'vitest';

import { COOKIE_NAME, resolveConsentState } from '../consent';

describe('resolveConsentState', () => {
  it('returns pending when the cookie is absent', () => {
    expect(resolveConsentState(undefined)).toBe('pending');
    expect(resolveConsentState(null)).toBe('pending');
  });

  it('returns accepted when the cookie holds accepted', () => {
    expect(resolveConsentState('accepted')).toBe('accepted');
  });

  it('returns declined when the cookie holds declined', () => {
    expect(resolveConsentState('declined')).toBe('declined');
  });

  it('returns pending when the cookie holds pending', () => {
    expect(resolveConsentState('pending')).toBe('pending');
  });

  it('normalizes invalid values back to pending', () => {
    expect(resolveConsentState('yes')).toBe('pending');
    expect(resolveConsentState('')).toBe('pending');
    expect(resolveConsentState('ACCEPTED')).toBe('pending');
  });

  it('exposes the spec cookie name sl_consent_status', () => {
    expect(COOKIE_NAME).toBe('sl_consent_status');
  });
});
