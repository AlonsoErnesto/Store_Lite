import { describe, expect, it } from 'vitest';

import { generateEventId } from '../eventId';

// RFC 4122 v4 shape — the format Meta accepts for event dedup (48h window).
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('generateEventId', () => {
  it('returns a UUID v4 string (8-4-4-4-12 hex shape with version/variant nibbles)', () => {
    expect(generateEventId()).toMatch(UUID_V4_RE);
  });

  it('generates a unique id on every call', () => {
    const unique = new Set(Array.from({ length: 1000 }, () => generateEventId()));
    expect(unique.size).toBe(1000);
  });

  it('does not repeat for consecutive calls', () => {
    expect(generateEventId()).not.toBe(generateEventId());
  });
});
