import { afterEach, describe, expect, it, vi } from 'vitest';

describe('mode dev sans le Jalon 5', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('cache le garage, le concessionnaire pis leurs quêtes', async () => {
    vi.stubEnv('VITE_JALON5', 'off');
    vi.resetModules();
    const { UPGRADES } = await import('./upgrades');
    const { QUESTS } = await import('./quests');
    const { BUILDINGS } = await import('./buildings');
    expect(UPGRADES.some((u) => u.requires === 'garage' || u.requires === 'concession')).toBe(false);
    expect(UPGRADES.some((u) => u.id === 'circulaires')).toBe(true);
    expect(QUESTS.at(-1)?.id).toBe('peinture');
    expect(BUILDINGS).toEqual([]);
  });

  it('garde tout par défaut', async () => {
    const { QUESTS } = await import('./quests');
    const { BUILDINGS } = await import('./buildings');
    expect(QUESTS.at(-1)?.id).toBe('empire');
    expect(BUILDINGS).toHaveLength(2);
  });
});
