/**
 * Generates a shareable event identifier used to deduplicate browser (pixel)
 * and server (CAPI) copies of the same event within Meta's 48h dedup window.
 *
 * Universal: `crypto.randomUUID` is available in browsers (secure contexts)
 * and in Node.js 19.0.0+, so the same generator works on both sides. The
 * project runtime is Node 24, well within range.
 */
export function generateEventId(): string {
  return crypto.randomUUID();
}
