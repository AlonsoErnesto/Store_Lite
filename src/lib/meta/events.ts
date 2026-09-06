import { getConsentState } from '@/lib/consent/consentClient';

import { trackEvent } from './fbq';

/**
 * Meta event names. The browser pixel and the server CAPI client both use
 * these exact strings so Meta can deduplicate on (event_name, event_id).
 */
export const META_EVENTS = {
  pageView: 'PageView',
  viewContent: 'ViewContent',
  initiateCheckout: 'InitiateCheckout',
  purchase: 'Purchase',
} as const;

export type MetaEventName = (typeof META_EVENTS)[keyof typeof META_EVENTS];

/** Typed custom_data payloads for the browser-side events. */
export interface ViewContentData {
  content_type: 'product';
  content_name: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
}

export interface InitiateCheckoutData {
  value?: number;
  currency?: string;
  contents?: { id: string; quantity: number }[];
}

export interface PurchaseData {
  value: number;
  currency: string;
  contents?: { id: string; quantity: number }[];
}

/**
 * Fires a PageView. No-op unless consent is `accepted` and the pixel was
 * initialized (race safety lives in fbq.ts). `eventID` is optional: PageView
 * is browser-only, so a dedup id is not required, but the parameter keeps
 * the helper API uniform with the CAPI-shared events.
 */
export function trackPageView(eventID?: string): void {
  if (getConsentState() !== 'accepted') return;
  trackEvent(META_EVENTS.pageView, undefined, eventID);
}

/**
 * Fires a ViewContent with typed custom data. No-op unless consent is
 * `accepted` and the pixel was initialized.
 */
export function trackViewContent(data: ViewContentData, eventID?: string): void {
  if (getConsentState() !== 'accepted') return;
  trackEvent(META_EVENTS.viewContent, { ...data }, eventID);
}
