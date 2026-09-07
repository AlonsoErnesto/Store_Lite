/**
 * Neutral Meta event-name constants.
 *
 * Hoisted out of the client-boundary `events.ts` so server code (CAPI client,
 * route handlers) can reference the exact same strings the browser pixel uses.
 * Meta deduplicates on (event_name, event_id) within 48h, so both sides MUST
 * agree on the literals — this module is the single source of truth.
 */
export const META_EVENTS = {
  pageView: 'PageView',
  viewContent: 'ViewContent',
  initiateCheckout: 'InitiateCheckout',
  purchase: 'Purchase',
} as const;

export type MetaEventName = (typeof META_EVENTS)[keyof typeof META_EVENTS];
