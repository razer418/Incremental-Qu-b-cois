import { describe, expect, it } from 'vitest';
import { PARTS } from './car';
import { QUESTS } from './quests';
import { prestigePointsFor } from './buildings';
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

  it('le garage avant le concessionnaire', () => {
    const s = avecBazouQuiRoule(10_000_000);
    expect(buyBuilding(s, 'concession')).toBe(false);
    expect(buyBuilding(s, 'garage')).toBe(true);
    expect(s.cash).toBe(9_950_000);
    expect(nextBuilding(s)?.id).toBe('concession');
    expect(buyBuilding(s, 'concession')).toBe(true);
    expect(nextBuilding(s)).toBeNull();
  });

  it('les achats du garage sont barrés tant que t’as pas le garage', () => {
    const s = avecBazouQuiRoule(1_000_000);
    expect(buy(s, 'baie')).toBe(false);
    buyBuilding(s, 'garage');
    expect(buy(s, 'baie')).toBe(true);
    expect(passiveRate(s)).toBeCloseTo(400 * (saisonA(s.lastTick).bonus.baie ?? 1));
  });

  it('le rang est au plus chaud avec tout', () => {
    const s = avecBazouQuiRoule(100_000_000);
    s.totalEarned = 1e9;
    repair(s, 'carrosserie');
    buyBuilding(s, 'garage');
    buyBuilding(s, 'concession');
    expect(warmth(s)).toBeCloseTo(1);
  });
});

describe('le prestige', () => {
  it('points = racine carrée des millions gagnés', () => {
    expect(prestigePointsFor(999_999)).toBe(0);
    expect(prestigePointsFor(25_000_000)).toBe(5);
    expect(prestigePointsFor(100_000_000)).toBe(10);
  });

  it('seulement avec le concessionnaire pis 25 M$ de gagné', () => {
    const s = avecBazouQuiRoule(10_000_000);
    s.totalEarned = 30_000_000;
    expect(canPrestige(s)).toBe(false);
    buyBuilding(s, 'garage');
    buyBuilding(s, 'concession');
    expect(canPrestige(s)).toBe(true);
  });

  it('repart à zéro mais garde la réputation qui donne +10 % par point', () => {
    const s = avecBazouQuiRoule(10_000_000);
    buyBuilding(s, 'garage');
    buyBuilding(s, 'concession');
    s.totalEarned = 36_000_000;
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
    expect(loaded.buildings).toEqual({ garage: true, concession: false });
  });
});
