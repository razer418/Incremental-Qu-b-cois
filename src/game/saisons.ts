// Les saisons : chacune donne un coup de pouce à des jobs différentes.
// Elles suivent l'horloge (10 min chacune), donc elles changent aussi quand l'app est fermée.

export interface Saison {
  id: 'printemps' | 'ete' | 'automne' | 'hiver';
  nom: string;
  description: string;
  /** Multiplicateur par achat (id dans UPGRADES). */
  bonus: Record<string, number>;
  /** Multiplicateur sur les tapes. */
  tap: number;
}

export const SAISON_SECONDES = 10 * 60;

export const SAISONS: readonly Saison[] = [
  {
    id: 'printemps',
    nom: 'PRINTEMPS',
    description: 'Le dégel pis les nids-de-poule : baies du garage x2, remorquage x1,5.',
    bonus: { baie: 2, remorquage: 1.5 },
    tap: 1,
  },
  {
    id: 'ete',
    nom: 'ÉTÉ',
    description: 'Les touristes laissent traîner des canettes : tapes x1,5. Bicycle x2, pis les chars usagés partent vite (lot x1,5).',
    bonus: { velo: 2, lot: 1.5 },
    tap: 1.5,
  },
  {
    id: 'automne',
    nom: 'AUTOMNE',
    description: "Ti-Guy revient de la chasse en forme : Ti-Guy x2. Les circulaires de l'Halloween x2.",
    bonus: { chum: 2, circulaires: 2 },
    tap: 1,
  },
  {
    id: 'hiver',
    nom: 'HIVER',
    description: 'Déneigement x3 pis remorquage x2. Le bicycle dans la neige, par exemple... x0,5.',
    bonus: { deneigement: 3, remorquage: 2, velo: 0.5 },
    tap: 1,
  },
];

/** La saison au moment `ms` (temps de l'horloge). */
export function saisonA(ms: number): Saison {
  return SAISONS[Math.floor(ms / 1000 / SAISON_SECONDES) % SAISONS.length];
}

/** Secondes avant la prochaine saison. */
export function resteSaison(ms: number): number {
  return SAISON_SECONDES - ((ms / 1000) % SAISON_SECONDES);
}
