import { describe, expect, it } from 'vitest';
import { simuler } from './simulation';

// Le rythme visé (« long », choisi par Etienne) pour un joueur actif qui tape 2 fois par seconde :
// bazou ~4 min, garage ~1 h 10, cabane ~2 h 40, lot ~4 h 35, bar ~7 h 10, aréna ~9 h 30, prestige ~11 h 30
// (avec les fêtes de fin de saison, x1,5).
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
    expect(min(t.cabane)).toBeGreaterThan(130);
    expect(min(t.cabane)).toBeLessThan(240);
    expect(min(t.concession)).toBeGreaterThan(260);
    expect(min(t.concession)).toBeLessThan(380);
    expect(min(t.bar)).toBeGreaterThan(400);
    expect(min(t.bar)).toBeLessThan(520);
    expect(min(t.arena)).toBeGreaterThan(540);
    expect(min(t.arena)).toBeLessThan(660);
    expect(min(t.prestige)).toBeGreaterThan(600);
    expect(min(t.prestige)).toBeLessThan(840);
  }, 60_000);
});
