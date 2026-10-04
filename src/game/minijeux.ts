// Les mini-jeux : des petites jobs optionnelles qui donnent un bonus de cash.
// Jamais obligatoires : le jeu avance pareil sans eux.
import { saisonA } from './saisons';
import { t } from './i18n';
import { carRuns, earn, revenuRef, type GameState } from './state';

export type MiniJeuId = 'moteur' | 'deneiger' | 'trafic';

export interface MiniJeu {
  id: MiniJeuId;
  nom: string;
  description: string;
  /** Une partie parfaite rapporte autant de secondes de tes revenus. */
  secondes: number;
  /** Pourquoi c'est barré (déjà traduit), ou null si on peut jouer. */
  bloque: (s: GameState) => string | null;
}

/** Entre deux parties du même mini-jeu. */
export const REPOS_MS = 5 * 60_000;
/** Même une partie ratée donne un petit quelque chose. */
export const SCORE_MIN = 0.1;

export const MINIJEUX: readonly MiniJeu[] = [
  {
    id: 'moteur',
    nom: 'Réparer le moteur',
    description: "Tape quand l'aiguille est dans le vert. Trois coups de clé.",
    secondes: 120,
    bloque: (s) => (s.car.owned ? null : t('Prends le bazou en premier.')),
  },
  {
    id: 'deneiger',
    nom: "Déneiger l'entrée",
    description: "Passe ton doigt sur la neige avant que le temps finisse. L'hiver seulement.",
    secondes: 120,
    bloque: (s) => (saisonA(s.lastTick).id === 'hiver' ? null : t("Y'a pas de neige. Reviens l'hiver.")),
  },
  {
    id: 'trafic',
    nom: 'Swimming dans le trafic',
    description: "La trend du moment : zigzague avec le bazou entre les chars, de plus en plus vite. Frôler un char sans l'accrocher donne du bonus.",
    secondes: 180,
    bloque: (s) => (carRuns(s) ? null : t('Le bazou doit rouler.')),
  },
];

export function getMiniJeu(id: string): MiniJeu | undefined {
  return MINIJEUX.find((m) => m.id === id);
}

/** Millisecondes avant de pouvoir rejouer (0 = prêt). */
export function repos(state: GameState, id: MiniJeuId, now: number): number {
  return Math.max(0, (state.minijeux[id] ?? 0) - now);
}

export function peutJouer(state: GameState, id: MiniJeuId, now: number): boolean {
  const m = getMiniJeu(id);
  return !!m && m.bloque(state) === null && repos(state, id, now) === 0;
}

/** Ce qu'une partie rapporte pour un score de 0 à 1. */
export function recompense(state: GameState, id: MiniJeuId, score: number): number {
  const m = getMiniJeu(id)!;
  const s = Math.min(1, Math.max(SCORE_MIN, score));
  return Math.max(1, revenuRef(state) * m.secondes) * s;
}

/** Fin de partie : paye, pis le mini-jeu se repose. Retourne le montant gagné. */
export function finirPartie(state: GameState, id: MiniJeuId, score: number, now: number): number {
  if (!peutJouer(state, id, now)) return 0;
  const x = recompense(state, id, score);
  earn(state, x);
  state.minijeux[id] = now + REPOS_MS;
  state.stats.minijeux += 1;
  return x;
}
