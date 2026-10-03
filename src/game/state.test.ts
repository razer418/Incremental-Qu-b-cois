import { describe, expect, it } from 'vitest';
import {
  BASE_TAP,
  OFFLINE_CAP_SECONDS,
  applyOffline,
  buy,
  newGame,
  nextCost,
  passiveRate,
  tap,
  tapValue,
  tick,
  warmth,
  buyCar,
  repair,
  carRuns,
  DELIVERY_TAP,
} from './state';
import { CAR_PRICE, PARTS } from './car';
import { load, save } from './save';

describe('boucle de base', () => {
  it('une tape donne une canette', () => {
    const s = newGame(0);
    tap(s);
    expect(s.cash).toBeCloseTo(BASE_TAP);
    expect(s.taps).toBe(1);
  });

  it("pas de revenu passif avant d'acheter", () => {
    const s = newGame(0);
    tick(s, 10_000);
    expect(s.cash).toBe(0);
  });

  it('acheter coûte du cash et monte le niveau', () => {
    const s = newGame(0);
    s.cash = 10;
    expect(buy(s, 'velo')).toBe(true);
    expect(s.cash).toBeCloseTo(5);
    expect(s.upgrades.velo).toBe(1);
    expect(passiveRate(s)).toBeCloseTo(0.25);
    expect(nextCost(s, 'velo')).toBeCloseTo(7);
  });

  it("refuse d'acheter sans assez de cash", () => {
    const s = newGame(0);
    expect(buy(s, 'chum')).toBe(false);
    expect(s.upgrades.chum).toBeUndefined();
  });

  it('le multiplicateur du dépanneur touche les tapes et le passif', () => {
    const s = newGame(0);
    s.upgrades = { velo: 1, depanneur: 1 };
    expect(passiveRate(s)).toBeCloseTo(0.375);
    expect(tapValue(s)).toBeCloseTo(0.15);
  });

  it('le revenu passif suit le temps', () => {
    const s = newGame(0);
    s.upgrades = { chum: 2 };
    tick(s, 3000);
    expect(s.cash).toBeCloseTo(6);
  });
});

describe('ambiance du rang', () => {
  it('se réchauffe avec les gains pis les réparations, plafonné à 0,5', () => {
    const s = newGame(0);
    expect(warmth(s)).toBe(0);
    s.totalEarned = 250;
    expect(warmth(s)).toBeCloseTo(0.15);
    s.totalEarned = 10_000;
    expect(warmth(s)).toBeCloseTo(0.3);
    s.car.owned = true;
    for (const p of PARTS) s.car.parts[p.id] = true;
    expect(warmth(s)).toBeCloseTo(0.5);
  });
});

describe('le premier bazou', () => {
  const essentials = PARTS.filter((p) => p.essential);

  it("s'achète au prix du bonhomme Gagnon", () => {
    const s = newGame(0);
    s.cash = CAR_PRICE - 1;
    expect(buyCar(s)).toBe(false);
    s.cash = CAR_PRICE;
    expect(buyCar(s)).toBe(true);
    expect(s.cash).toBe(0);
    expect(buyCar(s)).toBe(false);
  });

  it('on répare pas un char qu\'on a pas', () => {
    const s = newGame(0);
    s.cash = 10_000;
    expect(repair(s, 'batterie')).toBe(false);
  });

  it('roule seulement quand les pièces essentielles sont réparées', () => {
    const s = newGame(0);
    s.cash = 100_000;
    buyCar(s);
    for (const p of essentials.slice(0, -1)) expect(repair(s, p.id)).toBe(true);
    expect(carRuns(s)).toBe(false);
    expect(repair(s, essentials.at(-1)!.id)).toBe(true);
    expect(carRuns(s)).toBe(true);
    expect(repair(s, 'batterie')).toBe(false);
  });

  it('les livraisons rapportent plus par tape une fois que ça roule', () => {
    const s = newGame(0);
    s.cash = 100_000;
    buyCar(s);
    essentials.forEach((p) => repair(s, p.id));
    expect(tapValue(s)).toBeCloseTo(DELIVERY_TAP);
  });

  it('les jobs motorisées sont barrées tant que le char roule pas', () => {
    const s = newGame(0);
    s.cash = 100_000;
    expect(buy(s, 'circulaires')).toBe(false);
    buyCar(s);
    essentials.forEach((p) => repair(s, p.id));
    expect(buy(s, 'circulaires')).toBe(true);
    expect(passiveRate(s)).toBeCloseTo(15);
  });

  it('la carrosserie donne x1,25', () => {
    const s = newGame(0);
    s.cash = 100_000;
    buyCar(s);
    s.upgrades = { velo: 4 };
    expect(repair(s, 'carrosserie')).toBe(true);
    expect(passiveRate(s)).toBeCloseTo(1.25);
  });
});

describe('hors-ligne et sauvegarde', () => {
  it('les gains hors-ligne sont plafonnés à 8 h', () => {
    const s = newGame(0);
    s.upgrades = { chum: 1 };
    const { seconds, gained } = applyOffline(s, 24 * 3600 * 1000);
    expect(seconds).toBe(OFFLINE_CAP_SECONDS);
    expect(gained).toBeCloseTo(OFFLINE_CAP_SECONDS);
  });

  it('sauvegarde puis recharge la partie', () => {
    const mem = new Map<string, string>();
    const storage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    };
    const s = newGame(0);
    s.cash = 42;
    s.upgrades = { sac: 3 };
    s.car = { owned: true, parts: { batterie: true } };
    save(storage, s);
    const loaded = load(storage, 1000);
    expect(loaded.cash).toBe(42);
    expect(loaded.upgrades.sac).toBe(3);
    expect(loaded.car).toEqual({ owned: true, parts: { batterie: true } });
  });

  it("une vieille sauvegarde sans char se charge correct", () => {
    const storage = {
      getItem: () => JSON.stringify({ version: 1, cash: 5, totalEarned: 5, taps: 50, upgrades: {}, lastTick: 0 }),
      setItem: () => {},
      removeItem: () => {},
    };
    expect(load(storage, 0).car).toEqual({ owned: false, parts: {} });
  });

  it('une sauvegarde brisée repart une partie neuve', () => {
    const storage = { getItem: () => '{pas du json', setItem: () => {}, removeItem: () => {} };
    expect(load(storage, 5).cash).toBe(0);
  });
});
