import { describe, expect, it } from 'vitest';
import { SAISONS, SAISON_SECONDES, saisonA } from './saisons';
import { ANNONCES, ANNONCES_MS, PROJETS, annoncesEnLigne, prixAnnonce } from './chars';
import { EVENEMENTS, tirerEvenement } from './evenements';
import { annonceDe, buyProjet, coutPiece, multiplier, newGame, passiveRate, reparerProjet, tapValue, revenuRef } from './state';
import { load, save } from './save';
import { MODELES } from '../scene/chars3d';
import { RECETTES } from './mecanique';
import { SONS_CHARS } from '../platform/sons';

const memoire = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};
const quand = (id: string) => SAISONS.findIndex((x) => x.id === id) * SAISON_SECONDES * 1000;

describe('saisons', () => {
  it('font le tour aux 10 minutes', () => {
    expect(saisonA(0).id).toBe('printemps');
    expect(saisonA(SAISON_SECONDES * 1000).id).toBe('ete');
    expect(saisonA(4 * SAISON_SECONDES * 1000).id).toBe('printemps');
  });

  it("l'hiver triple le déneigement pis ralentit le bicycle", () => {
    const s = newGame(quand('hiver'));
    s.upgrades = { deneigement: 1, velo: 1 };
    expect(passiveRate(s)).toBeCloseTo(20 * 3 + 0.25 * 0.5);
  });

  it("l'été donne des tapes x1,5", () => {
    const s = newGame(quand('ete'));
    expect(tapValue(s)).toBeCloseTo(0.15);
  });
});

describe('chars à retaper', () => {
  const roule = () => {
    const s = newGame(quand('automne'));
    s.car = { owned: true, parts: { batterie: true, pneus: true, demarreur: true, freins: true } };
    return s;
  };

  it('barrés tant que le bazou roule pas', () => {
    const s = newGame(0);
    s.cash = 1e9;
    expect(buyProjet(s, 'pickup')).toBe(false);
  });

  it('acheter, réparer chaque pièce, pis le bonus embarque', () => {
    const s = roule();
    const p = PROJETS[0];
    s.cash = 1e6;
    const avant = multiplier(s);
    expect(reparerProjet(s, p.id, p.pieces[0].id)).toBe(false);
    expect(buyProjet(s, p.id)).toBe(true);
    expect(buyProjet(s, p.id)).toBe(false);
    for (const x of p.pieces) expect(reparerProjet(s, p.id, x.id)).toBe(true);
    expect(reparerProjet(s, p.id, p.pieces[0].id)).toBe(false);
    expect(multiplier(s)).toBeCloseTo(avant * p.bonus);
  });

  it('le monarque attend le garage', () => {
    const s = roule();
    s.cash = 1e9;
    expect(buyProjet(s, 'monarque')).toBe(false);
    s.buildings.garage = true;
    expect(buyProjet(s, 'monarque')).toBe(true);
  });

  it('se sauvegardent', () => {
    const s = roule();
    s.projets = { pickup: ['moteur'] };
    const st = memoire();
    save(st, s);
    expect(load(st, 0).projets).toEqual({ pickup: ['moteur'] });
  });
});

describe('Face-de-Bouc Marché', () => {
  it('montre 3 annonces, une de chaque état, qui changent aux 10 minutes', () => {
    for (const p of PROJETS) {
      const avant = annoncesEnLigne(p.id, 0);
      expect(new Set(avant.map((a) => a.etat)).size).toBe(3);
      expect(annoncesEnLigne(p.id, ANNONCES_MS)).not.toEqual(avant);
    }
  });

  it('chaque char a son modèle 3D pis son son, tous différents', () => {
    const ids = ANNONCES.map((a) => a.id).sort();
    expect(Object.keys(MODELES).sort()).toEqual(ids);
    expect(Object.keys(SONS_CHARS).sort()).toEqual(ids);
    expect(new Set(Object.values(SONS_CHARS).map((x) => JSON.stringify(x))).size).toBe(ids.length);
    expect(new Set(Object.values(MODELES).map((x) => `${x.forme}:${x.couleur}:${x.detail}`)).size).toBe(ids.length);
  });

  it('chaque pièce a son mini-jeu de mécanique', () => {
    for (const p of PROJETS) for (const x of p.pieces) expect(RECETTES[x.id]?.length).toBeGreaterThan(1);
  });

  it('chaque annonce coûte le même total que le char d’origine', () => {
    for (const a of ANNONCES) {
      const s = newGame(0);
      s.annonces[a.projet] = a.id;
      const p = PROJETS.find((x) => x.id === a.projet)!;
      const total = prixAnnonce(a) + p.pieces.reduce((t, x) => t + coutPiece(s, p.id, x.cost), 0);
      const origine = p.prix + p.pieces.reduce((t, x) => t + x.cost, 0);
      expect(Math.abs(total - origine)).toBeLessThan(2);
    }
  });

  it('le char acheté vient de son annonce pis se sauvegarde', () => {
    const s = newGame(0);
    s.car = { owned: true, parts: { batterie: true, pneus: true, demarreur: true, freins: true } };
    s.cash = 1e6;
    expect(buyProjet(s, 'van')).toBe(true);
    expect(buyProjet(s, 'castor')).toBe(false);
    expect(annonceDe(s, 'pickup').id).toBe('van');
    const st = memoire();
    save(st, s);
    expect(annonceDe(load(st, 0), 'pickup').id).toBe('van');
    // Une vieille partie a le char d'origine.
    expect(annonceDe(newGame(0), 'pickup').id).toBe('pickup');
  });
});

describe('événements', () => {
  it('la police arrête juste quelqu’un qui roule', () => {
    const s = newGame(0);
    for (let r = 0; r < 1; r += 0.01) expect(tirerEvenement(s, r)?.id).not.toBe('police');
  });

  it('chaque choix donne un message pis bouge le cash de moins de 3 min de revenus', () => {
    for (const e of EVENEMENTS) {
      for (const c of e.choix) {
        for (const r of [0, 0.99]) {
          const s = newGame(0);
          s.upgrades = { velo: 4 };
          s.cash = 1000;
          const ref = revenuRef(s);
          const msg = c.faire(s, r);
          expect(msg.length).toBeGreaterThan(0);
          expect(Math.abs(s.cash - 1000)).toBeLessThanOrEqual(180 * ref + 1);
        }
      }
    }
  });
});
