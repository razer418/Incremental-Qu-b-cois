export type BuildingId = 'garage' | 'concession';

export interface Building {
  id: BuildingId;
  name: string;
  description: string;
  cost: number;
}

// Dans l'ordre : on achète le garage avant le concessionnaire.
export const BUILDINGS: readonly Building[] = [
  {
    id: 'garage',
    name: 'Le garage à Ti-Guy',
    description: "Un vieux garage sur le bord du rang. Tu répares les chars du monde pis ça rentre tout seul.",
    cost: 50_000,
  },
  {
    id: 'concession',
    name: 'Le concessionnaire',
    description: "Un lot de chars usagés avec des fanions. Le rêve du bonhomme Gagnon.",
    cost: 1_000_000,
  },
];

/** Prestige : vendre l'empire pis repartir avec de la réputation. */
export const PRESTIGE_MIN_EARNED = 25_000_000;
export const PRESTIGE_BONUS_PER_POINT = 0.1;

/** Points de réputation gagnés pour une partie : racine carrée des millions gagnés. */
export function prestigePointsFor(totalEarned: number): number {
  return Math.floor(Math.sqrt(totalEarned / 1_000_000));
}
