export type BuildingId = 'garage' | 'cabane' | 'concession' | 'bar' | 'arena';

export interface Building {
  id: BuildingId;
  name: string;
  description: string;
  cost: number;
  /** Ce qu'on te dit quand tu l'achètes. */
  message: string;
}

// Dans l'ordre : on achète le garage avant le concessionnaire.
export const BUILDINGS: readonly Building[] = [
  {
    id: 'garage',
    name: 'Le garage à Ti-Guy',
    description: "Un vieux garage sur le bord du rang. Tu répares les chars du monde pis ça rentre tout seul.",
    cost: 2_700_000,
    message: 'Ti-Guy : « On est en affaires! » Le garage est à toé. De nouveaux achats sont débloqués.',
  },
  {
    id: 'cabane',
    name: 'La cabane à sucre',
    description: "La vieille cabane à ton oncle Gérald, dans le bois en arrière. Y manque juste quelqu'un pour la partir.",
    cost: 20_000_000,
    message: "Ton oncle Gérald : « Enfin! On va faire du sirop comme dans le temps. » La cabane à sucre est à toé.",
  },
  {
    id: 'concession',
    name: 'Le concessionnaire',
    description: "Un lot de chars usagés avec des fanions. Le rêve du bonhomme Gagnon.",
    cost: 200_000_000,
    message: "Le bonhomme Gagnon : « Prends soin de mon lot. » Le concessionnaire est à toé, pis la radio locale t'attend.",
  },
  {
    id: 'bar',
    name: 'Le bar du village',
    description: 'Le Bar chez Rollande, avec sa table de pool pis son juke-box. Rollande veut prendre sa retraite.',
    cost: 9_000_000_000,
    message: 'Rollande : « Prends soin de mes habitués. » Le bar du village est à toé.',
  },
  {
    id: 'arena',
    name: "L'aréna",
    description: "L'aréna du village, avec sa Zamboni de 1974 pis ses estrades en bois. Le conseil municipal la vend.",
    cost: 45_000_000_000,
    message: "Le maire : « Le hockey du samedi est sauvé! » L'aréna est à toé.",
  },
];

/** Prestige : vendre l'empire pis repartir avec de la réputation. Débloqué avec le bar, dès 2 points. */
export const PRESTIGE_MIN_EARNED = 160_000_000_000;
/** Le « gros » prestige que la quête de ta mère vise. */
export const EMPIRE_GOAL = 1_000_000_000_000;
export const PRESTIGE_BONUS_PER_POINT = 0.1;

/** Points de réputation gagnés pour une partie : 5 points à 1 T $, 10 points à 4 T $ (racine carrée). */
export function prestigePointsFor(totalEarned: number): number {
  return Math.floor(Math.sqrt(totalEarned / 4e10));
}

/** Combien faut gagner au total pour avoir `points` points. */
export function gainsPourPoints(points: number): number {
  return points * points * 4e10;
}
