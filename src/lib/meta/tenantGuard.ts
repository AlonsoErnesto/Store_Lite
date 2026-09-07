import { isTenantHost } from '@/shared/utils/url';

/**
 * Platform-only paths where Meta tracking (pixel + banner) may run.
 *
 * Mirrors `PLATFORM_ONLY_PREFIXES` in proxy.ts plus the legal/landing pages.
 * Exact match or sub-path match; `/auth/customer` is explicitly excluded
 * (platform-hosted but storefront-customer traffic).
 */
export const PLATFORM_TRACKING_PREFIXES = [
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
] as const;

const EXCLUDED_PATH_PREFIX = '/auth/customer';

/**
 * True when `pathname` is a platform tracking path.
 * Prefix boundaries are exact: `/pricing` matches `/pricing` and `/pricing/...`,
 * never `/pricingx`; `/` only matches the exact root.
 */
export function isPlatformTrackingPath(pathname: string): boolean {
  if (pathname === EXCLUDED_PATH_PREFIX || pathname.startsWith(`${EXCLUDED_PATH_PREFIX}/`)) {
    return false;
  }
  return PLATFORM_TRACKING_PREFIXES.some((prefix) => {
    if (prefix === '/') return pathname === '/';
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

/**
 * True when the current host+path combination is eligible for tracking:
 * platform hostname (not a tenant subdomain) and a whitelisted platform path.
 */
export function isPlatformTrackingPage(hostname: string, pathname: string): boolean {
  return !isTenantHost(hostname) && isPlatformTrackingPath(pathname);
}
