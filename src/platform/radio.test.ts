import { describe, expect, it } from 'vitest';
import { melodie, PUBS, STATIONS } from './radio';

describe('radio du char', () => {
  it('chaque toune a des accords connus pis une mélodie de la bonne longueur', () => {
    for (const s of STATIONS)
      for (const t of s.tounes) {
        t.accords.forEach((a) => expect(a).toMatch(/^[A-G]m?$/));
        const m = melodie(t, s.style);
        expect(m).toHaveLength(t.accords.length * 8);
        expect(m.some((n) => n !== null)).toBe(true);
      }
  });

  it('la même toune joue la même mélodie à chaque fois', () => {
    const s = STATIONS[0];
    expect(melodie(s.tounes[0], s.style)).toEqual(melodie(s.tounes[0], s.style));
  });

  it('les pubs parlent en km, jamais en miles', () => {
    PUBS.forEach((p) => expect(p).not.toMatch(/mille|miles?\b/i));
  });
});
