// Sous-titres : le jeu est en joual, pis on peut le lire en anglais.
// Le texte français sert de clé : t() donne la traduction, ou le français si y'en a pas.
import { EN } from './en';

/** Choisi dans les options; gardé sur l'appareil. */
export const langue = { en: false };

export function t(fr: string, vars?: Record<string, string | number>): string {
  let s = (langue.en && EN[fr]) || fr;
  for (const [k, v] of Object.entries(vars ?? {})) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

/** Un multiplicateur : x1,5 en français, x1.5 en anglais. */
export function facteur(n: number): string {
  return `x${langue.en ? n : String(n).replace('.', ',')}`;
}

/** Une réplique entre guillemets : « Allo » ou “Hello”. */
export function cite(s: string): string {
  return langue.en ? `“${s}”` : `« ${s} »`;
}
