import { describe, expect, it } from 'vitest';
import { simuler } from './simulation';

// Le rythme visé (« moyen » au début, « long » ensuite, choisi par Etienne) pour un vrai joueur actif :
// 4 tapes par seconde, boost x2 toujours allumé, pis le magasin à Réjean quand c'est pas cher.
// bazou ~7 min, y roule ~16 min, garage ~1 h 15, cabane ~2 h 30, lot ~4 h, bar ~7 h 50, aréna ~10 h 30, prestige ~11 h
// (avec les fêtes de fin de saison, x1,5).
// Si un changement de chiffres fait sortir de ces bornes, c'est que le rythme a changé.
describe('équilibre', () => {
  it('chaque palier prend le bon temps', () => {
    const min = (s?: number) => (s ?? Infinity) / 60;
    const t = simuler(4, 16 * 3600);
    expect(min(t.bazou)).toBeGreaterThan(5);
    expect(min(t.bazou)).toBeLessThan(10);
    expect(min(t.roule)).toBeGreaterThan(12);
    expect(min(t.roule)).toBeLessThan(25);
    expect(min(t.garage)).toBeGreaterThan(60);
    expect(min(t.garage)).toBeLessThan(95);
    expect(min(t.cabane)).toBeGreaterThan(120);
    expect(min(t.cabane)).toBeLessThan(180);
    expect(min(t.concession)).toBeGreaterThan(200);
    expect(min(t.concession)).toBeLessThan(290);
    expect(min(t.bar)).toBeGreaterThan(410);
    expect(min(t.bar)).toBeLessThan(530);
    expect(min(t.arena)).toBeGreaterThan(560);
    expect(min(t.arena)).toBeLessThan(700);
    expect(min(t.prestige)).toBeGreaterThan(600);
    expect(min(t.prestige)).toBeLessThan(760);
  }, 60_000);
});
