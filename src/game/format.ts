const cents = new Intl.NumberFormat('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const piastres = new Intl.NumberFormat('fr-CA', { maximumFractionDigits: 0 });

// Gros chiffres : 1,23 M $ au lieu de 1 234 567,89 $ (on lit vite pis ça déborde pas sur un téléphone).
const SUFFIXES = ['', '', '\u00a0M', '\u00a0G', '\u00a0T', '\u00a0P', '\u00a0E'];
const DOLLAR = '\u00a0$';

/** Courts (par défaut) ou complets, au choix dans les options. */
export const notation = { complets: false };

export function formatMoney(amount: number): string {
  const abs = Math.abs(amount);
  if (!notation.complets && abs >= 1e6) {
    const tier = Math.min(SUFFIXES.length - 1, Math.floor(Math.log10(abs) / 3));
    return `${cents.format(amount / 10 ** (tier * 3))}${SUFFIXES[tier]}${DOLLAR}`;
  }
  // Rendu à 100 000 $, les cennes servent pu à grand-chose.
  if (!notation.complets && abs >= 1e5) return `${piastres.format(amount)}${DOLLAR}`;
  return `${cents.format(amount)}${DOLLAR}`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min`;
  return `${Math.floor(seconds)} s`;
}
