import { describe, expect, it } from 'vitest';
import html from '../../index.html?raw';
import { EN } from './en';
import { facteur, langue, t } from './i18n';
import { formatMoney } from './format';
import { UPGRADES } from './upgrades';
import { PARTS } from './car';
import { BUILDINGS } from './buildings';
import { CHARACTERS, QUESTS } from './quests';
import { ARTICLES, REJEAN } from './magasin';
import { SUCCES } from './succes';
import { SAISONS } from './saisons';
import { FETES } from './fetes';
import { METEOS, MOMENTS } from './temps';
import { ANNONCES, ETATS, PROJETS } from './chars';
import { EVENEMENTS } from './evenements';
import { LOOK } from './look';
import { MINIJEUX } from './minijeux';
import { THEMES } from './expo';
import { NO_ADS_PRICE } from '../platform/store';
import { PUBS, STATIONS } from '../platform/radio';

/** Tout le texte du jeu qui passe par t(). */
function cles(): string[] {
  const k: string[] = [
    ...UPGRADES.flatMap((u) => [u.name, u.description]),
    ...PARTS.flatMap((p) => [p.name, p.description]),
    ...BUILDINGS.flatMap((b) => [b.name, b.description, b.message]),
    ...Object.values(CHARACTERS).map((c) => c.name),
    ...QUESTS.flatMap((q) => [q.ask, q.thanks, q.goal]),
    ...ARTICLES.flatMap((a) => [a.name, a.description, a.verbe, a.ligne]),
    ...REJEAN,
    ...SUCCES.flatMap((x) => [x.nom, x.description]),
    ...SAISONS.flatMap((x) => [x.nom, x.description]),
    ...FETES.flatMap((x) => [x.nom, x.description]),
    ...MOMENTS.map((x) => x.nom),
    ...METEOS.map((x) => x.nom),
    ...PROJETS.flatMap((p) => [p.nom, p.description, ...p.pieces.map((x) => x.nom)]),
    ...ANNONCES.flatMap((a) => [a.nom, a.vendeur, a.description]),
    ...Object.values(ETATS).map((x) => x.nom),
    ...EVENEMENTS.flatMap((e) => [e.texte, ...e.choix.map((c) => c.label)]),
    ...Object.values(LOOK).flatMap((c) => [c.nom, ...c.options.map((o) => o.nom)]),
    ...MINIJEUX.flatMap((m) => [m.nom, m.description]),
    ...THEMES.flatMap((x) => [x.nom, x.demande, ...x.criteres.map((c) => c.texte)]),
    // Les boutons OUI/NON des options
    'OUI', 'NON', 'COURTS', 'COMPLETS', 'JOUAL', 'ENGLISH', 'GRAND', 'PETIT', 'TOUT', 'STATS',
    NO_ADS_PRICE,
    // La radio du char
    ...STATIONS.flatMap((s) => [s.nom, s.slogan, ...s.tounes.map((x) => x.titre)]),
    ...PUBS,
    'FERMÉE',
    'Ton sac est vide. Passe voir Réjean au magasin.',
  ];
  // Les t('...') pis les textes du tuto dans le code
  const sources = import.meta.glob<string>(['../**/*.ts', '!../**/*.test.ts', '!./en.ts'], { query: '?raw', import: 'default', eager: true });
  for (const src of Object.values(sources)) {
    // t('...'), pis t(condition ? '...' : '...')
    const lit = `(?:'((?:[^'\\\\]|\\\\.)*)'|"((?:[^"\\\\]|\\\\.)*)")`;
    const re = new RegExp(`\\bt\\(\\s*(?:[^'"?;]*?\\?\\s*)?${lit}(?:\\s*:\\s*${lit})?`, 'g');
    for (const m of src.matchAll(re)) {
      for (const x of [m[1] ?? m[2], m[3] ?? m[4]]) if (x !== undefined) k.push(x.replace(/\\(.)/g, '$1'));
    }
    for (const m of src.matchAll(/texte: '((?:[^'\\]|\\.)*)'/g)) k.push(m[1]);
  }
  // Le texte fixe de la page
  for (const m of html.matchAll(/data-t>([^<]+)</g)) k.push(m[1].trim().replaceAll('&apos;', "'"));
  for (const m of html.matchAll(/aria-label="([^"]+)"/g)) k.push(m[1]);
  return [...new Set(k)];
}

describe('anglais', () => {
  it('tout le texte a une traduction', () => {
    const manque = cles().filter((x) => !EN[x]);
    expect(manque).toEqual([]);
  });

  it('les {trous} se retrouvent dans la traduction', () => {
    for (const [fr, en] of Object.entries(EN)) {
      const trous = (x: string) => [...x.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();
      expect(trous(en), fr).toEqual(trous(fr));
    }
  });

  it("t() traduit, pis le joual reste par défaut", () => {
    const fr = 'Tu paies {x}. L\'agent te souhaite une bonne journée.';
    expect(t(fr, { x: '5 $' })).toBe("Tu paies 5 $. L'agent te souhaite une bonne journée.");
    langue.en = true;
    try {
      expect(t(fr, { x: '$5' })).toContain('$5');
      expect(t(fr, { x: '$5' })).not.toBe(fr);
      expect(formatMoney(1234.5)).toBe('$1,234.50');
      expect(formatMoney(2_500_000)).toBe('$2.50M');
      expect(facteur(1.5)).toBe('x1.5');
    } finally {
      langue.en = false;
    }
    expect(formatMoney(1234.5)).toBe('1 234,50 $');
    expect(facteur(1.5)).toBe('x1,5');
  });
});
