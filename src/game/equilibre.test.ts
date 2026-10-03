import { describe, expect, it } from 'vitest';
import { simuler } from './simulation';

// Le rythme visé (« moyen ») pour un joueur actif qui tape 2 fois par seconde :
// bazou ~4 min, garage ~45 min, lot ~2 h 30, prestige ~6 h.
// Si un changement de chiffres fait sortir de ces bornes, c'est que le rythme a changé.
describe('équilibre', () => {
  it('chaque palier prend le bon temps', () => {
    const min = (s?: number) => (s ?? Infinity) / 60;
    const t = simuler(2, 10 * 3600);
    expect(min(t.bazou)).toBeGreaterThan(2);
    expect(min(t.bazou)).toBeLessThan(6);
    expect(min(t.roule)).toBeLessThan(15);
    expect(min(t.garage)).toBeGreaterThan(30);
    expect(min(t.garage)).toBeLessThan(60);
    expect(min(t.concession)).toBeGreaterThan(120);
    expect(min(t.concession)).toBeLessThan(200);
    expect(min(t.prestige)).toBeGreaterThan(300);
    expect(min(t.prestige)).toBeLessThan(420);
  }, 60_000);
});
