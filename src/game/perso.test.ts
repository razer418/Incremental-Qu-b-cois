import { describe, expect, it } from 'vitest';
import { LOOK, choisie, possede, poser } from './look';
import { MINIJEUX, REPOS_MS, SCORE_MIN, finirPartie, peutJouer, recompense } from './minijeux';
import { SAISON_SECONDES } from './saisons';
import { PARTS } from './car';
import { newGame, prestige, revenuRef } from './state';
import { load, save } from './save';

const memoire = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};
const HIVER = 3 * SAISON_SECONDES * 1000;

describe('le look du bazou', () => {
  it("on achète une fois, pis on change d'idée gratis", () => {
    const s = newGame(0);
    s.car.owned = true;
    s.cash = 300;
    expect(choisie(s, 'peinture').id).toBe('brun');
    expect(poser(s, 'peinture', 'rouge')).toBe(true);
    expect(s.cash).toBeCloseTo(50);
    expect(poser(s, 'peinture', 'bleu')).toBe(false); // trop cher
    expect(poser(s, 'peinture', 'brun')).toBe(true);
    expect(poser(s, 'peinture', 'rouge')).toBe(true);
    expect(s.cash).toBeCloseTo(50);
    expect(choisie(s, 'peinture').id).toBe('rouge');
  });

  it('faut avoir le bazou', () => {
    const s = newGame(0);
    s.cash = 1e9;
    expect(poser(s, 'mags', 'chrome')).toBe(false);
  });

  it('le look reste au prestige pis dans la sauvegarde', () => {
    const s = newGame(0);
    s.car.owned = true;
    s.cash = 1e6;
    poser(s, 'flaps', 'rouges');
    const m = memoire();
    save(m, s);
    const l = load(m, 0);
    expect(possede(l, 'flaps', 'rouges')).toBe(true);
    expect(choisie(l, 'flaps').id).toBe('rouges');
    Object.assign(s.buildings, { garage: true, concession: true });
    s.totalEarned = 1e12;
    prestige(s, 0);
    expect(choisie(s, 'flaps').id).toBe('rouges');
  });

  it('chaque catégorie a une option gratuite en premier', () => {
    for (const c of Object.values(LOOK)) expect(c.options[0].prix).toBe(0);
  });
});

describe('les mini-jeux', () => {
  it('chacun se débloque à son heure', () => {
    const s = newGame(0);
    s.lastTick = 0;
    expect(MINIJEUX.filter((m) => m.bloque(s) === null)).toEqual([]);
    s.lastTick = HIVER;
    expect(peutJouer(s, 'deneiger', 0)).toBe(true);
    s.car.owned = true;
    expect(peutJouer(s, 'moteur', 0)).toBe(true);
    expect(peutJouer(s, 'demolition', 0)).toBe(false);
    for (const p of PARTS) s.car.parts[p.id] = true;
    expect(peutJouer(s, 'demolition', 0)).toBe(true);
  });

  it('paye selon le score, pis se repose 5 minutes', () => {
    const s = newGame(0);
    s.car.owned = true;
    s.upgrades.velo = 10;
    const parfait = revenuRef(s) * 60;
    expect(recompense(s, 'moteur', 1)).toBeCloseTo(parfait);
    expect(recompense(s, 'moteur', 0)).toBeCloseTo(parfait * SCORE_MIN);
    expect(finirPartie(s, 'moteur', 0.5, 1000)).toBeCloseTo(parfait * 0.5);
    expect(s.cash).toBeCloseTo(parfait * 0.5);
    expect(s.stats.minijeux).toBe(1);
    expect(finirPartie(s, 'moteur', 1, 1000 + REPOS_MS - 1)).toBe(0);
    expect(peutJouer(s, 'moteur', 1000 + REPOS_MS)).toBe(true);
  });

  it('au début, ça donne au moins 1 $', () => {
    const s = newGame(0);
    s.car.owned = true;
    expect(recompense(s, 'moteur', 1)).toBeGreaterThanOrEqual(1);
  });
});
