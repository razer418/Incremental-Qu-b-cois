// Les chars à retaper après le bazou. Tu l'achètes, tu le répares pièce par pièce,
// pis une fois fini il reste dans ta cour : bonus sur tous tes gains jusqu'au prochain prestige.
// Marques inventées seulement.

export interface Projet {
  id: string;
  nom: string;
  description: string;
  prix: number;
  /** Débloqué quand le bazou roule, ou avec le bâtiment. */
  requires: 'roule' | 'garage' | 'concession';
  pieces: readonly { id: string; nom: string; cost: number }[];
  /** Multiplicateur sur tous tes gains une fois retapé. */
  bonus: number;
}

export const PROJETS: readonly Projet[] = [
  {
    id: 'pickup',
    nom: 'Le pick-up rouillé à Ti-Guy',
    description: "Un Bœuf 1979. Y'a plus de rouille que de tôle, mais la boîte est encore bonne.",
    prix: 10000,
    requires: 'roule',
    pieces: [
      { id: 'moteur', nom: 'Moteur', cost: 15000 },
      { id: 'boite', nom: 'Fond de boîte', cost: 25000 },
      { id: 'parebrise', nom: 'Pare-brise', cost: 40000 },
    ],
    bonus: 1.25,
  },
  {
    id: 'monarque',
    nom: 'La Grand Monarque à matante Huguette',
    description: 'Un salon sur quatre roues. Les bancs de velours sont pognés dans le plastique depuis 1991.',
    prix: 2000000,
    requires: 'garage',
    pieces: [
      { id: 'transmission', nom: 'Transmission', cost: 3000000 },
      { id: 'suspension', nom: 'Suspension', cost: 5000000 },
      { id: 'vinyle', nom: 'Toit de vinyle', cost: 8000000 },
    ],
    bonus: 1.3,
  },
  {
    id: 'bolide',
    nom: 'Le Bolide 1970',
    description: 'Un vrai char de muscle, trouvé sous une bâche dans une grange à Saint-Clin-Clin.',
    prix: 600000000,
    requires: 'concession',
    pieces: [
      { id: 'v8', nom: 'Le V8', cost: 1000000000 },
      { id: 'chrome', nom: 'Les chromes', cost: 1500000000 },
      { id: 'flammes', nom: 'Des flammes sur le capot', cost: 2500000000 },
    ],
    bonus: 1.5,
  },
];

export function getProjet(id: string): Projet | undefined {
  return PROJETS.find((p) => p.id === id);
}
