import { langue } from './i18n';

const fmt = (locale: string, decimales: number) =>
  new Intl.NumberFormat(locale, { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
const FR = { cents: fmt('fr-CA', 2), piastres: fmt('fr-CA', 0) };
const EN = { cents: fmt('en-CA', 2), piastres: fmt('en-CA', 0) };

// Gros chiffres : 1,23 M $ au lieu de 1 234 567,89 $ (on lit vite pis ça déborde pas sur un téléphone).
const SUFFIXES = ['', '', '\u00a0M', '\u00a0G', '\u00a0T', '\u00a0P', '\u00a0E'];
// En anglais : $1.23M, $4.56B.
const SUFFIXES_EN = ['', '', 'M', 'B', 'T', 'Qa', 'Qi'];
const DOLLAR = '\u00a0$';

/** Courts (par défaut) ou complets, au choix dans les options. */
export const notation = { complets: false };

const dollars = (n: string) => (langue.en ? `$${n}` : `${n}${DOLLAR}`);

export function formatMoney(amount: number): string {
  const f = langue.en ? EN : FR;
  const abs = Math.abs(amount);
  if (!notation.complets && abs >= 1e6) {
    const tier = Math.min(SUFFIXES.length - 1, Math.floor(Math.log10(abs) / 3));
    return dollars(`${f.cents.format(amount / 10 ** (tier * 3))}${(langue.en ? SUFFIXES_EN : SUFFIXES)[tier]}`);
  }
  // Rendu à 100 000 $, les cennes servent pu à grand-chose.
  if (!notation.complets && abs >= 1e5) return dollars(f.piastres.format(amount));
  return dollars(f.cents.format(amount));
}

/** Un nombre entier, avec les espaces (ou les virgules en anglais). */
export function formatNombre(n: number): string {
  return n.toLocaleString(langue.en ? 'en-CA' : 'fr-CA');
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`;
  if (m > 0) return `${m} min`;
  return `${Math.floor(seconds)} s`;
}
