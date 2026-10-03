// Les fêtes québécoises : les 3 dernières minutes de chaque saison, le rang fête (gains x1,5).
// Aux vraies dates (Saint-Jean, Halloween...), la fête dure toute la journée pis c'est x2.
// Pendant une fête, le décor change pis une invitation arrive.
import { SAISON_SECONDES, saisonA, type Saison } from './saisons';

export type FeteId = 'sucres' | 'stjean' | 'halloween' | 'noel';

export interface Fete {
  id: FeteId;
  saison: Saison['id'];
  nom: string;
  description: string;
  /** Les vraies dates de la fête (mois de 1 à 12). */
  dates: (mois: number, jour: number) => boolean;
}

export const FETE_SECONDES = 3 * 60;
export const FETE_BONUS = 1.5;
export const GROSSE_FETE_BONUS = 2;

export const FETES: readonly Fete[] = [
  {
    id: 'sucres',
    saison: 'printemps',
    nom: 'TEMPS DES SUCRES',
    description: 'Tout le village monte à la cabane : tire sur la neige, oreilles de crisse pis set carré.',
    dates: (m, j) => (m === 3 && j >= 15) || (m === 4 && j <= 15),
  },
  {
    id: 'stjean',
    saison: 'ete',
    nom: 'SAINT-JEAN',
    description: 'Feu de joie, drapeaux pis Gens du pays à tue-tête.',
    dates: (m, j) => m === 6 && (j === 23 || j === 24),
  },
  {
    id: 'halloween',
    saison: 'automne',
    nom: 'HALLOWEEN',
    description: 'Des citrouilles sur toutes les galeries pis des bonbons plein les poches.',
    dates: (m, j) => m === 10 && j >= 30,
  },
  {
    id: 'noel',
    saison: 'hiver',
    nom: 'PARTY DE NOËL',
    description: 'Les lumières sont posées, la tourtière est chaude pis mononc est déjà paqueté.',
    dates: (m, j) => m === 12 && j >= 20 && j <= 26,
  },
];

/** Secondes écoulées dans la saison en cours. */
const dansSaison = (ms: number) => (ms / 1000) % SAISON_SECONDES;

/** La fête des vraies dates au moment `ms` (selon le calendrier du téléphone), ou null. */
export function grosseFeteA(ms: number): Fete | null {
  const d = new Date(ms);
  return FETES.find((f) => f.dates(d.getMonth() + 1, d.getDate())) ?? null;
}

/** La fête au moment `ms`, ou null quand c'est une journée ordinaire. */
export function feteA(ms: number): Fete | null {
  const grosse = grosseFeteA(ms);
  if (grosse) return grosse;
  if (dansSaison(ms) < SAISON_SECONDES - FETE_SECONDES) return null;
  const s = saisonA(ms).id;
  return FETES.find((f) => f.saison === s) ?? null;
}

/** Le bonus sur tous les gains en ce moment : x2 aux vraies dates, x1,5 à la fin des saisons. */
export function bonusFete(ms: number): number {
  if (grosseFeteA(ms)) return GROSSE_FETE_BONUS;
  return feteA(ms) ? FETE_BONUS : 1;
}
