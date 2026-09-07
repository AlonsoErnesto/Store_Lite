import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  hashEmail,
  hashFullName,
  hashName,
  hashPhone,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  splitFullName,
} from '../hashPii';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

describe('normalizeEmail', () => {
  it('trims and lowercases the email before hashing', () => {
    expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com');
  });
});

describe('normalizePhone', () => {
  it('reduces the phone to digits including the country code', () => {
    expect(normalizePhone('+51 (987) 654-3210')).toBe('519876543210');
  });
});

describe('normalizeName', () => {
  it('trims and lowercases a full name', () => {
    expect(normalizeName('  Maria Fernanda Quispe ')).toBe('maria fernanda quispe');
  });
});

describe('hashEmail', () => {
  it('hashes the NORMALIZED email, never the raw input', () => {
    expect(hashEmail(' User@Example.COM ')).toBe(sha256('user@example.com'));
  });

  it('is deterministic and emits lowercase 64-char hex', () => {
    const first = hashEmail('User@Example.COM');
    expect(hashEmail('user@example.com')).toBe(first);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('hashPhone', () => {
  it('hashes the digit-only phone including the country code', () => {
    expect(hashPhone('+51 (987) 654-3210')).toBe(sha256('519876543210'));
  });
});

describe('hashName', () => {
  it('hashes the lowercased trimmed name', () => {
    expect(hashName('  Maria ')).toBe(sha256('maria'));
  });
});

describe('splitFullName', () => {
  it('splits on the first space into fn and ln', () => {
    expect(splitFullName('Maria Fernanda Quispe')).toEqual({
      fn: 'Maria',
      ln: 'Fernanda Quispe',
    });
  });

  it('keeps a single name as fn only', () => {
    expect(splitFullName('Ernesto')).toEqual({ fn: 'Ernesto' });
  });

  it('returns an empty object for a blank name', () => {
    expect(splitFullName('   ')).toEqual({});
  });
});

describe('hashFullName', () => {
  it('hashes fn and ln separately, applying name normalization to each', () => {
    expect(hashFullName('Maria Fernanda Quispe')).toEqual({
      fn: sha256('maria'),
      ln: sha256('fernanda quispe'),
    });
  });

  it('returns an empty object when the name is empty', () => {
    expect(hashFullName('')).toEqual({});
  });
});
