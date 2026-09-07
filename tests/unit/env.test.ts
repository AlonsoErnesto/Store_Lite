import { afterEach, describe, expect, it, vi } from 'vitest';

describe('env — Meta Pixel / CAPI configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('maps NEXT_PUBLIC_META_PIXEL_ID and defaults to empty strings', async () => {
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', '1234567890123');
    vi.stubEnv('META_CAPI_ACCESS_TOKEN', '');
    vi.stubEnv('META_TEST_EVENT_CODE', '');
    vi.resetModules();

    const { env } = await import('@/config/env');

    expect(env.metaPixelId).toBe('1234567890123');
    expect(env.metaCapiAccessToken).toBe('');
    expect(env.metaTestEventCode).toBe('');
  });

  it('reads the optional test event code when set', async () => {
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', '');
    vi.stubEnv('META_CAPI_ACCESS_TOKEN', '');
    vi.stubEnv('META_TEST_EVENT_CODE', 'TEST123');
    vi.resetModules();

    const { env } = await import('@/config/env');

    expect(env.metaTestEventCode).toBe('TEST123');
  });

  it('warns when META_CAPI_ACCESS_TOKEN is missing but the app keeps running', async () => {
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', '1234567890123');
    vi.stubEnv('META_CAPI_ACCESS_TOKEN', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.resetModules();

    const { env } = await import('@/config/env');

    expect(env.metaCapiAccessToken).toBe('');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('META_CAPI_ACCESS_TOKEN'));
  });

  it('warns when the public pixel id is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', '');
    vi.stubEnv('META_CAPI_ACCESS_TOKEN', 'secret');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.resetModules();

    const { env } = await import('@/config/env');

    expect(env.metaPixelId).toBe('');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('NEXT_PUBLIC_META_PIXEL_ID'));
  });
});
