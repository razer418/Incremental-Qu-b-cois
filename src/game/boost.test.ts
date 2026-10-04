import { describe, expect, it } from 'vitest';
import {
  BOOST_MAX_SECONDS,
  BOOST_SECONDS,
  addBoost,
  applyOffline,
  newGame,
  prestige,
  tapValue,
  tick,
  BASE_TAP,
  TAP_PART_PASSIF,
} from './state';

describe('le boost x2', () => {
  it('double les tapes pis le passif tant qu’il en reste', () => {
    const s = newGame(0);
    s.upgrades = { chum: 1 };
    expect(addBoost(s)).toBe(true);
    // Une canette pis 2 % du passif (1 $/s), le tout x2.
    expect(tapValue(s)).toBeCloseTo((BASE_TAP + TAP_PART_PASSIF * 1) * 2);
    tick(s, 10_000);
    expect(s.cash).toBeCloseTo(20);
    expect(s.boostSeconds).toBeCloseTo(BOOST_SECONDS - 10);
  });

  it('se termine au milieu d’un tick sans tricher', () => {
    const s = newGame(0);
    s.upgrades = { chum: 1 };
    s.boostSeconds = 5;
    tick(s, 10_000);
    expect(s.cash).toBeCloseTo(15);
    expect(s.boostSeconds).toBe(0);
    expect(tapValue(s)).toBeCloseTo(BASE_TAP + TAP_PART_PASSIF * 1);
  });

  it('compte aussi hors-ligne', () => {
    const s = newGame(0);
    s.upgrades = { chum: 1 };
    addBoost(s);
    const { gained } = applyOffline(s, 3600 * 1000);
    expect(gained).toBeCloseTo(3600 + BOOST_SECONDS);
  });

  it('se cumule jusqu’à une heure max', () => {
    const s = newGame(0);
    const max = BOOST_MAX_SECONDS / BOOST_SECONDS;
    for (let i = 0; i < max; i++) expect(addBoost(s)).toBe(true);
    expect(addBoost(s)).toBe(false);
    expect(s.boostSeconds).toBe(BOOST_MAX_SECONDS);
  });

  it('l’achat « pas de pubs » survit au prestige', () => {
    const s = newGame(0);
    s.noAds = true;
    s.buildings = { garage: true, cabane: true, concession: true, bar: true, arena: true };
    s.totalEarned = 1.2e12;
    prestige(s, 1);
    expect(s.noAds).toBe(true);
  });
});
