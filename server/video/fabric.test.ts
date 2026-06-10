import { describe, it, expect, vi, afterEach } from 'vitest';

describe('buildFabricInput', () => {
  it('mapper felter + default 480p', async () => {
    const { buildFabricInput } = await import('./fabric');
    const input = buildFabricInput({ imageUrl: 'http://img', audioUrl: 'http://a' });
    expect(input.image_url).toBe('http://img');
    expect(input.audio_url).toBe('http://a');
    expect(input.resolution).toBe('480p');
  });
  it('respekterer 720p', async () => {
    const { buildFabricInput } = await import('./fabric');
    expect(buildFabricInput({ imageUrl: 'i', audioUrl: 'a', resolution: '720p' }).resolution).toBe('720p');
  });
});

describe('generateAvatar', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('fejler klart uden FAL_KEY', async () => {
    vi.resetModules();
    vi.stubEnv('FAL_KEY', '');
    const { generateAvatar } = await import('./fabric');
    await expect(generateAvatar({ imageUrl: 'i', audioUrl: 'a' })).rejects.toThrow(/FAL_KEY/);
  });
});
