// Le cadeau du jour : à ta première visite de la journée, Réjean te met un article du magasin dans ton sac.
// Plus tu reviens de jours de suite, plus il est gros. Sac plein : il te donne le prix en cash.
import { getArticle, type Article } from './magasin';
import { INVENTAIRE_MAX, articleCost, earn, type GameState } from './state';

/** Du plus petit au plus gros (selon le prix chez Réjean). Jour 8 pis plus : la corde de bois. */
export const CADEAUX = ['chips', 'cafe', 'cigarettes', 'biere', 'vers', 'vape', 'vin', 'bois'] as const;

/** La date du téléphone (« 2026-10-04 »). */
export function jourDe(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Donne le cadeau si c'est ta première visite de la journée. Retourne ce qui est arrivé, ou null. */
export function cadeauDuJour(state: GameState, ms: number): { article: Article; serie: number; cash: number } | null {
  const jour = jourDe(ms);
  if (state.cadeau.jour === jour) return null;
  // Midi d'hier, pour pas se faire jouer par l'heure avancée.
  const d = new Date(ms);
  const hier = jourDe(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, 12).getTime());
  const serie = state.cadeau.jour === hier ? state.cadeau.serie + 1 : 1;
  state.cadeau = { jour, serie };
  const article = getArticle(CADEAUX[Math.min(serie, CADEAUX.length) - 1])!;
  if ((state.inventaire[article.id] ?? 0) < INVENTAIRE_MAX) {
    state.inventaire[article.id] = (state.inventaire[article.id] ?? 0) + 1;
    return { article, serie, cash: 0 };
  }
  const cash = articleCost(state, article.id);
  earn(state, cash);
  return { article, serie, cash };
}
