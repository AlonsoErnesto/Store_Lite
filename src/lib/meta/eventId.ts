/**
 * Generates a shareable event identifier used to deduplicate browser (pixel)
 * and server (CAPI) copies of the same event within Meta's 48h dedup window.
 *
 * Universal: `crypto.randomUUID` is available in browsers (secure context)
 * and in Node >= 19, so the same generator works on both sides.
 */
export function generateEventId(): string {
  return crypto.randomUUID();
}
