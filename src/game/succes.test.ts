import { describe, expect, it } from 'vitest';
import { SUCCES, verifierSucces } from './succes';
import { SUCCES_BONUS, TUTO_FINI, multiplier, newGame, prestige, tap } from './state';
import { load, save } from './save';

const memoire = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};

describe('succès', () => {
  it('se débloque une seule fois pis donne un bonus', () => {
    const s = newGame(0);
    for (let i = 0; i < 100; i++) tap(s);
    const nouveaux = verifierSucces(s);
    expect(nouveaux.map((x) => x.id)).toContain('tapes-100');
    expect(verifierSucces(s)).toEqual([]);
    expect(multiplier(s)).toBeCloseTo(1 + s.succes.length * SUCCES_BONUS);
  });

  it('les ids sont uniques', () => {
    expect(new Set(SUCCES.map((x) => x.id)).size).toBe(SUCCES.length);
  });

  it('restent après le prestige, avec les stats', () => {
    const s = newGame(0);
    s.buildings = { garage: true, cabane: true, concession: true, bar: true, arena: true };
    s.totalEarned = 1.2e12;
    s.stats.gagneVie = 1.2e12;
    verifierSucces(s);
    const avant = s.succes.length;
    prestige(s, 0);
    expect(s.succes.length).toBe(avant);
    expect(s.stats.gagneVie).toBe(1.2e12);
    expect(s.tuto).toBe(TUTO_FINI);
  });
});

describe('sauvegarde', () => {
  it('une vieille partie commencée saute le tuto pis garde ses chiffres', () => {
    const st = memoire();
    const vieux = { ...newGame(0), taps: 50, totalEarned: 12 } as Record<string, unknown>;
    delete vieux.tuto;
    delete vieux.stats;
    st.setItem('incremental-quebecois-save', JSON.stringify(vieux));
    const s = load(st, 0);
    expect(s.tuto).toBe(TUTO_FINI);
    expect(s.stats.tapsVie).toBe(50);
    expect(s.stats.gagneVie).toBe(12);
  });

  it('une nouvelle partie commence au tuto', () => {
    const st = memoire();
    save(st, newGame(0));
    expect(load(st, 0).tuto).toBe(0);
  });
});
