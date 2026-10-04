import { describe, expect, it } from 'vitest';
import { JOUR_SECONDES, METEOS, METEO_SECONDES, formatHeure, heureA, jourA, meteoA, momentA } from './temps';
import { SAISON_SECONDES } from './saisons';

const jour = JOUR_SECONDES * 1000;
const saison = SAISON_SECONDES * 1000;

describe('heure du jeu', () => {
  it('une saison fait 5 jours qui commencent à 6 h', () => {
    expect(SAISON_SECONDES / JOUR_SECONDES).toBe(5);
    expect(heureA(0)).toBe(6);
    expect(heureA(jour / 4)).toBe(12);
    expect(jourA(0)).toBe(1);
    expect(jourA(saison - 1)).toBe(5);
    expect(jourA(saison)).toBe(1);
  });

  it('les moments de la journée', () => {
    const a = (h: number) => momentA((((h - 6 + 24) % 24) / 24) * jour).id;
    expect(a(7)).toBe('matin');
    expect(a(12)).toBe('midi');
    expect(a(15)).toBe('apresmidi');
    expect(a(19)).toBe('soir');
    expect(a(23)).toBe('nuit');
    expect(a(3)).toBe('nuit');
  });

  it("l'heure s'écrit à la québécoise", () => {
    expect(formatHeure(14.5)).toBe('14 h 30');
    expect(formatHeure(6)).toBe('6 h 00');
  });
});

describe('météo', () => {
  it('reste pareille pendant sa tranche pis change des fois', () => {
    const t0 = 1000 * METEO_SECONDES * 1000;
    expect(meteoA(t0).id).toBe(meteoA(t0 + METEO_SECONDES * 1000 - 1).id);
    const vues = new Set<string>();
    for (let i = 0; i < 400; i++) vues.add(meteoA(t0 + i * METEO_SECONDES * 1000).id);
    expect(vues.size).toBeGreaterThanOrEqual(4);
    expect([...vues].every((v) => METEOS.some((m) => m.id === v))).toBe(true);
  });

  it("y neige juste l'hiver, pis y pleut pas l'hiver", () => {
    for (let i = 0; i < 2000; i++) {
      const ms = i * 37_000;
      const m = meteoA(ms).id;
      const hiver = Math.floor(ms / saison) % 4 === 3;
      if (m === 'neige') expect(hiver).toBe(true);
      if (m === 'pluie') expect(hiver).toBe(false);
    }
  });
});
