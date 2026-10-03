import { describe, expect, it } from 'vitest';
import { ARTICLES } from './magasin';
import { BASE_TAP, articleCost, buyArticle, canBuyArticle, currentRate, newGame, tapValue, tick } from './state';
import { load, save } from './save';

const memoire = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};

describe('le magasin général', () => {
  it('la caisse de 24 double les tapes pendant 5 min', () => {
    const s = newGame(0);
    s.cash = 100;
    const prix = articleCost(s, 'biere');
    expect(buyArticle(s, 'biere')).toBe(true);
    expect(s.cash).toBeCloseTo(100 - prix);
    expect(tapValue(s)).toBeCloseTo(BASE_TAP * 2);
    tick(s, 301_000);
    expect(tapValue(s)).toBeCloseTo(BASE_TAP);
    expect(s.magasin.biere).toBeUndefined();
  });

  it('le café booste le passif juste le temps qu’il dure', () => {
    const s = newGame(0);
    s.upgrades = { chum: 1 }; // 1 $/s
    s.cash = 1000;
    expect(buyArticle(s, 'cafe')).toBe(true);
    const avant = s.cash;
    expect(currentRate(s)).toBeCloseTo(1.5);
    tick(s, 400_000); // 300 s à x1,5 pis 100 s à x1
    expect(s.cash - avant).toBeCloseTo(550);
  });

  it('se cumule avec le boost de pub', () => {
    const s = newGame(0);
    s.upgrades = { chum: 1 };
    s.boostSeconds = 100;
    s.magasin = { cigarettes: 50 };
    tick(s, 200_000); // 50 s x4, 50 s x2, 100 s x1
    expect(s.cash).toBeCloseTo(400);
    expect(s.boostSeconds).toBe(0);
  });

  it('les articles se cumulent pas entre eux : le meilleur compte', () => {
    const s = newGame(0);
    s.magasin = { chips: 100, biere: 100, vape: 100 };
    expect(tapValue(s)).toBeCloseTo(BASE_TAP * 2);
  });

  it('le prix suit tes revenus', () => {
    const s = newGame(0);
    // Au début : 2 tapes de 0,10 $ par seconde.
    expect(articleCost(s, 'cafe')).toBeCloseTo(ARTICLES.find((a) => a.id === 'cafe')!.incomeSeconds * 0.2);
    s.upgrades = { chum: 10 };
    expect(articleCost(s, 'cafe')).toBeGreaterThan(200);
  });

  it('max deux d’avance pis pas sans cash', () => {
    const s = newGame(0);
    expect(canBuyArticle(s, 'chips')).toBe(false);
    s.cash = 1000;
    expect(buyArticle(s, 'chips')).toBe(true);
    expect(buyArticle(s, 'chips')).toBe(true);
    expect(buyArticle(s, 'chips')).toBe(false);
  });

  it('survit à la sauvegarde', () => {
    const st = memoire();
    const s = newGame(0);
    s.magasin = { vin: 120, bidon: -3 };
    save(st, s);
    expect(load(st, 0).magasin).toEqual({ vin: 120 });
  });
});
