import { describe, expect, it } from 'vitest';
import { simuler } from './simulation';

// Le rythme visé (« long », choisi par Etienne) pour un joueur actif qui tape 2 fois par seconde :
// bazou ~4 min, garage ~1 h 20, lot ~5 h 20, prestige ~12 h.
// Si un changement de chiffres fait sortir de ces bornes, c'est que le rythme a changé.
describe('équilibre', () => {
  it('chaque palier prend le bon temps', () => {
    const min = (s?: number) => (s ?? Infinity) / 60;
    const t = simuler(2, 16 * 3600);
    expect(min(t.bazou)).toBeGreaterThan(2);
    expect(min(t.bazou)).toBeLessThan(6);
    expect(min(t.roule)).toBeLessThan(18);
    expect(min(t.garage)).toBeGreaterThan(60);
    expect(min(t.garage)).toBeLessThan(110);
    expect(min(t.concession)).toBeGreaterThan(260);
    expect(min(t.concession)).toBeLessThan(380);
    expect(min(t.prestige)).toBeGreaterThan(600);
    expect(min(t.prestige)).toBeLessThan(840);
  }, 60_000);
});
