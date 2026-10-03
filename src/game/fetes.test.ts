import { describe, expect, it } from 'vitest';
import { FETE_BONUS, GROSSE_FETE_BONUS, bonusFete, feteA } from './fetes';
import { SAISON_SECONDES } from './saisons';
import { multiplier, newGame, tick } from './state';
import { verifierSucces } from './succes';

const min = 60_000;
// Le 1er janvier 1970 à midi (UTC) : pas une vraie date de fête.
const debut = 12 * 3600_000;
const saison = SAISON_SECONDES * 1000;

describe('fêtes', () => {
  it('chaque saison finit avec sa fête, les 3 dernières minutes', () => {
    const s0 = Math.ceil(debut / (4 * saison)) * 4 * saison; // début d'un printemps
    expect(feteA(s0 + 6 * min)).toBeNull();
    expect(feteA(s0 + 7.5 * min)?.id).toBe('sucres');
    expect(feteA(s0 + saison + 8 * min)?.id).toBe('stjean');
    expect(feteA(s0 + 2 * saison + 9 * min)?.id).toBe('halloween');
    expect(feteA(s0 + 3 * saison + 9.9 * min)?.id).toBe('noel');
    expect(bonusFete(s0 + 7.5 * min)).toBe(FETE_BONUS);
  });

  it('aux vraies dates, la fête dure toute la journée, en plus gros', () => {
    const stJean = new Date(2026, 5, 24, 9, 0).getTime();
    expect(feteA(stJean)?.id).toBe('stjean');
    expect(bonusFete(stJean)).toBe(GROSSE_FETE_BONUS);
    expect(feteA(new Date(2026, 9, 31, 20, 0).getTime())?.id).toBe('halloween');
    expect(feteA(new Date(2026, 11, 24, 20, 0).getTime())?.id).toBe('noel');
    expect(feteA(new Date(2026, 2, 28, 10, 0).getTime())?.id).toBe('sucres');
  });

  it('la fête monte les gains pis compte pour le succès Fêtard', () => {
    const s = newGame(debut);
    const s0 = Math.ceil(debut / (4 * saison)) * 4 * saison;
    tick(s, s0 + min);
    const normal = multiplier(s);
    for (let i = 0; i < 4; i++) tick(s, s0 + i * saison + 8 * min);
    expect(multiplier(s)).toBeCloseTo(normal * FETE_BONUS);
    expect(s.fetes.sort()).toEqual(['halloween', 'noel', 'stjean', 'sucres']);
    verifierSucces(s);
    expect(s.succes).toContain('fetard');
  });
});
