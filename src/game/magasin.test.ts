import { describe, expect, it } from 'vitest';
import { ARTICLES } from './magasin';
import { BASE_TAP, INVENTAIRE_MAX, articleCost, buyArticle, canBuyArticle, canUseArticle, currentRate, newGame, tapValue, tick, useArticle } from './state';
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
    expect(tapValue(s)).toBeCloseTo(BASE_TAP);
    expect(useArticle(s, 'biere')).toBe(true);
    expect(tapValue(s)).toBeCloseTo(BASE_TAP * 2);
    tick(s, 301_000);
    expect(tapValue(s)).toBeCloseTo(BASE_TAP);
    expect(s.magasin.biere).toBeUndefined();
  });

  it('le café booste le passif juste le temps qu’il dure', () => {
    const s = newGame(0);
    s.upgrades = { chum: 1 }; // 1 $/s
    s.cash = 1000;
    expect(buyArticle(s, 'cafe') && useArticle(s, 'cafe')).toBe(true);
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

  it('l’inventaire garde max 3 du même pis pas sans cash', () => {
    const s = newGame(0);
    expect(canBuyArticle(s, 'chips')).toBe(false);
    s.cash = 1000;
    for (let i = 0; i < INVENTAIRE_MAX; i++) expect(buyArticle(s, 'chips')).toBe(true);
    expect(buyArticle(s, 'chips')).toBe(false);
    expect(s.inventaire.chips).toBe(INVENTAIRE_MAX);
    expect(s.magasin.chips).toBeUndefined();
  });

  it('on en prend max deux d’avance', () => {
    const s = newGame(0);
    s.inventaire = { chips: 3 };
    expect(useArticle(s, 'chips')).toBe(true);
    expect(useArticle(s, 'chips')).toBe(true);
    expect(canUseArticle(s, 'chips')).toBe(false);
    expect(s.inventaire.chips).toBe(1);
    expect(s.magasin.chips).toBe(600);
    expect(canUseArticle(s, 'vin')).toBe(false);
  });

  it('survit à la sauvegarde', () => {
    const st = memoire();
    const s = newGame(0);
    s.magasin = { vin: 120, bidon: -3 };
    s.inventaire = { cafe: 2, bidon: 4, vin: 99, chips: 0 };
    save(st, s);
    const l = load(st, 0);
    expect(l.magasin).toEqual({ vin: 120 });
    expect(l.inventaire).toEqual({ cafe: 2, vin: INVENTAIRE_MAX });
  });
});
