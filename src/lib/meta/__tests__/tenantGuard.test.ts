import { describe, expect, it } from 'vitest';

import {
  isPlatformTrackingPage,
  isPlatformTrackingPath,
  PLATFORM_TRACKING_PREFIXES,
} from '../tenantGuard';

describe('isPlatformTrackingPath', () => {
  it('exposes the exact platform whitelist from the proxy', () => {
    expect(PLATFORM_TRACKING_PREFIXES).toEqual([
      '/',
      '/auth',
      '/pricing',
      '/created',
      '/list-business',
      '/onboarding',
      '/devoluciones',
      '/privacidad',
      '/terminos',
      '/libro-reclamaciones',
    ]);
  });

  it('allows the exact root and every whitelisted prefix', () => {
    for (const prefix of PLATFORM_TRACKING_PREFIXES) {
      expect(isPlatformTrackingPath(prefix)).toBe(true);
    }
  });

  it('allows sub-paths under whitelisted prefixes', () => {
    expect(isPlatformTrackingPath('/pricing/checkout')).toBe(true);
    expect(isPlatformTrackingPath('/auth/register')).toBe(true);
    expect(isPlatformTrackingPath('/terminos')).toBe(true);
    expect(isPlatformTrackingPath('/libro-reclamaciones/nuevo')).toBe(true);
  });

  it('rejects storefront paths outside the whitelist', () => {
    expect(isPlatformTrackingPath('/mi-tienda')).toBe(false);
    expect(isPlatformTrackingPath('/mi-tienda/productos')).toBe(false);
    expect(isPlatformTrackingPath('/join')).toBe(false);
    expect(isPlatformTrackingPath('/create-business')).toBe(false);
  });

  it('rejects lookalike paths at prefix boundaries', () => {
    expect(isPlatformTrackingPath('/authenticate')).toBe(false);
    expect(isPlatformTrackingPath('/pricingx')).toBe(false);
    expect(isPlatformTrackingPath('/terminosv2')).toBe(false);
  });

  it('rejects /auth/customer even though /auth is whitelisted', () => {
    expect(isPlatformTrackingPath('/auth/customer')).toBe(false);
    expect(isPlatformTrackingPath('/auth/customer/orders/123')).toBe(false);
  });
});

describe('isPlatformTrackingPage', () => {
  it('allows platform hostnames on whitelisted paths', () => {
    expect(isPlatformTrackingPage('localhost', '/pricing')).toBe(true);
    expect(isPlatformTrackingPage('store-lite.com', '/')).toBe(true);
  });

  it('denies tenant hostnames regardless of path', () => {
    expect(isPlatformTrackingPage('mitienda.localhost', '/pricing')).toBe(false);
    expect(isPlatformTrackingPage('mi-tienda.store-lite.com', '/')).toBe(false);
  });

  it('denies customer auth pages on the platform hostname', () => {
    expect(isPlatformTrackingPage('localhost', '/auth/customer')).toBe(false);
  });

  it('denies storefront paths on the platform hostname (path-based tenancy)', () => {
    expect(isPlatformTrackingPage('localhost', '/mi-tienda/dashboard')).toBe(false);
  });
});
