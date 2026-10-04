import { describe, expect, it } from 'vitest';
import { simuler } from './simulation';

// Le rythme visé (« moyen » au début, « long » ensuite, choisi par Etienne) pour un vrai joueur actif :
// 4 tapes par seconde, boost x2 la moitié du temps (une pub = 1 h), le magasin à Réjean, les mini-jeux pis l'expo.
// bazou ~7 min, y roule ~13 min, garage ~1 h 10, cabane ~2 h 30, lot ~3 h 30, bar ~8 h (prestige possible),
// aréna ~10 h 20 pis 1 T $ gagnés en même temps.
// Pis jamais plus de 20 min sans rien acheter.
// Si un changement de chiffres fait sortir de ces bornes, c'est que le rythme a changé.
describe('équilibre', () => {
  it('chaque palier prend le bon temps, sans trou', () => {
    const min = (s?: number) => (s ?? Infinity) / 60;
    let sig = '';
    let dernier = 0;
    let pireTrou = 0;
    const t = simuler(4, 16 * 3600, (sec, s) => {
      const achats = JSON.stringify([s.upgrades, s.car, s.buildings, s.projets]);
      if (achats === sig) return;
      pireTrou = Math.max(pireTrou, sec - dernier);
      dernier = sec;
      sig = achats;
    });
    expect(min(t.bazou)).toBeGreaterThan(5);
    expect(min(t.bazou)).toBeLessThan(10);
    expect(min(t.roule)).toBeGreaterThan(10);
    expect(min(t.roule)).toBeLessThan(25);
    expect(min(t.garage)).toBeGreaterThan(60);
    expect(min(t.garage)).toBeLessThan(95);
    expect(min(t.cabane)).toBeGreaterThan(120);
    expect(min(t.cabane)).toBeLessThan(180);
    expect(min(t.concession)).toBeGreaterThan(180);
    expect(min(t.concession)).toBeLessThan(290);
    expect(min(t.bar)).toBeGreaterThan(410);
    expect(min(t.bar)).toBeLessThan(530);
    expect(min(t.prestige)).toBeGreaterThan(410);
    expect(min(t.prestige)).toBeLessThan(560);
    expect(min(t.arena)).toBeGreaterThan(560);
    expect(min(t.arena)).toBeLessThan(700);
    expect(min(t.empire)).toBeGreaterThan(560);
    expect(min(t.empire)).toBeLessThan(760);
    expect(min(pireTrou)).toBeLessThanOrEqual(20);
  }, 60_000);
});
