import { describe, expect, it } from 'vitest';
import { PARTS } from './car';
import { QUESTS } from './quests';
import { BUILDINGS, prestigePointsFor } from './buildings';
import { saisonA } from './saisons';
import {
  buy,
  buyBuilding,
  buyCar,
  canPrestige,
  multiplier,
  newGame,
  nextBuilding,
  passiveRate,
  prestige,
  repair,
  warmth,
  type GameState,
} from './state';
import { load } from './save';

function avecBazouQuiRoule(cash: number): GameState {
  const s = newGame(0);
  s.cash = 1_000_000_000;
  buyCar(s);
  PARTS.filter((p) => p.essential).forEach((p) => repair(s, p.id));
  s.cash = cash;
  return s;
}

describe('le garage pis le concessionnaire', () => {
  it('faut que le bazou roule pour acheter le garage', () => {
    const s = newGame(0);
    s.cash = 100_000;
    expect(buyBuilding(s, 'garage')).toBe(false);
  });

  it('un endroit à la fois : garage, cabane, lot, bar, aréna', () => {
    const s = avecBazouQuiRoule(100_000_000_000);
    expect(buyBuilding(s, 'concession')).toBe(false);
    expect(buyBuilding(s, 'garage')).toBe(true);
    expect(s.cash).toBe(99_997_300_000);
    expect(nextBuilding(s)?.id).toBe('cabane');
    expect(buyBuilding(s, 'concession')).toBe(false);
    for (const id of ['cabane', 'concession', 'bar', 'arena'] as const) expect(buyBuilding(s, id)).toBe(true);
    expect(nextBuilding(s)).toBeNull();
  });

  it('chaque endroit débloque ses jobs', () => {
    const s = avecBazouQuiRoule(100_000_000_000);
    expect(buy(s, 'chaudieres')).toBe(false);
    buyBuilding(s, 'garage');
    buyBuilding(s, 'cabane');
    expect(buy(s, 'chaudieres')).toBe(true);
    expect(buy(s, 'chansonnier')).toBe(false);
  });

  it('les achats du garage sont barrés tant que t’as pas le garage', () => {
    const s = avecBazouQuiRoule(100_000_000);
    expect(buy(s, 'baie')).toBe(false);
    buyBuilding(s, 'garage');
    expect(buy(s, 'baie')).toBe(true);
    expect(passiveRate(s)).toBeCloseTo(120 * (saisonA(s.lastTick).bonus.baie ?? 1));
  });

  it('le rang est au plus chaud avec tout', () => {
    const s = avecBazouQuiRoule(100_000_000_000);
    s.totalEarned = 1e9;
    repair(s, 'carrosserie');
    for (const b of BUILDINGS) buyBuilding(s, b.id);
    expect(warmth(s)).toBeCloseTo(1);
  });
});

describe('le prestige', () => {
  it('points : 5 à 1 T$, 10 à 4 T$', () => {
    expect(prestigePointsFor(39_999_999_999)).toBe(0);
    expect(prestigePointsFor(1e12)).toBe(5);
    expect(prestigePointsFor(4e12)).toBe(10);
  });

  it("seulement avec l'aréna pis 1 T$ de gagné", () => {
    const s = avecBazouQuiRoule(100_000_000_000);
    s.totalEarned = 1.2e12;
    expect(canPrestige(s)).toBe(false);
    for (const b of BUILDINGS) buyBuilding(s, b.id);
    expect(canPrestige(s)).toBe(true);
    s.totalEarned = 0.9e12;
    expect(canPrestige(s)).toBe(false);
  });

  it('repart à zéro mais garde la réputation qui donne +10 % par point', () => {
    const s = avecBazouQuiRoule(100_000_000_000);
    for (const b of BUILDINGS) buyBuilding(s, b.id);
    s.totalEarned = 1.44e12;
    expect(prestige(s, 123)).toBe(6);
    expect(s.cash).toBe(0);
    expect(s.car.owned).toBe(false);
    expect(s.buildings.garage).toBe(false);
    expect(s.upgrades).toEqual({});
    expect(s.prestige).toEqual({ points: 6, count: 1 });
    expect(s.questIndex).toBe(QUESTS.length);
    expect(multiplier(s)).toBeCloseTo(1.6);
  });

  it('la réputation survit à la sauvegarde', () => {
    const mem = new Map<string, string>();
    const storage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    };
    const s = newGame(0);
    s.prestige = { points: 3, count: 1 };
    s.buildings.garage = true;
    storage.setItem('incremental-quebecois-save', JSON.stringify(s));
    const loaded = load(storage, 0);
    expect(loaded.prestige).toEqual({ points: 3, count: 1 });
    expect(loaded.buildings).toEqual({ garage: true, cabane: false, concession: false, bar: false, arena: false });
  });
});
