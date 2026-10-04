import { describe, expect, it } from 'vitest';
import { CADEAUX, cadeauDuJour } from './cadeau';
import { INVENTAIRE_MAX, newGame, prestige } from './state';

const jour = (j: number, h = 9) => new Date(2026, 9, j, h).getTime();

describe('le cadeau du jour', () => {
  it('une fois par jour, plus gros si tu reviens de jours de suite', () => {
    const s = newGame(0);
    expect(cadeauDuJour(s, jour(4))?.article.id).toBe(CADEAUX[0]);
    expect(cadeauDuJour(s, jour(4, 22))).toBeNull();
    expect(cadeauDuJour(s, jour(5))?.serie).toBe(2);
    expect(s.inventaire[CADEAUX[1]]).toBe(1);
    // Un jour de sauté : on recommence au petit.
    expect(cadeauDuJour(s, jour(7))?.serie).toBe(1);
  });

  it('sac plein : du cash à la place', () => {
    const s = newGame(0);
    s.inventaire[CADEAUX[0]] = INVENTAIRE_MAX;
    const c = cadeauDuJour(s, jour(4))!;
    expect(c.cash).toBeGreaterThan(0);
    expect(s.cash).toBe(c.cash);
  });

  it('la série survit au prestige', () => {
    const s = newGame(0);
    cadeauDuJour(s, jour(4));
    s.buildings.bar = true;
    s.totalEarned = 1e12;
    prestige(s, 1);
    expect(cadeauDuJour(s, jour(5))?.serie).toBe(2);
  });
});
