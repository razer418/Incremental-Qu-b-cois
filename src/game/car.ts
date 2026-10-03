export interface CarPart {
  id: string;
  name: string;
  description: string;
  cost: number;
  /** Pièce obligatoire pour que le char roule. */
  essential: boolean;
}

export const CAR_PRICE = 2500;

// Le bazou du bonhomme Gagnon : y'a pas grand-chose qui marche.
export const PARTS: readonly CarPart[] = [
  {
    id: 'batterie',
    name: 'Batterie',
    description: "La vieille est à terre depuis 2009.",
    cost: 1_800,
    essential: true,
  },
  {
    id: 'pneus',
    name: 'Pneus usagés',
    description: 'Fini les blocs de béton. Ça vient du garage à Ti-Guy.',
    cost: 3_600,
    essential: true,
  },
  {
    id: 'demarreur',
    name: 'Démarreur',
    description: 'Clic clic clic... pu de clic.',
    cost: 5_400,
    essential: true,
  },
  {
    id: 'freins',
    name: 'Freins',
    description: 'Mettons que ça serait une bonne idée.',
    cost: 7_800,
    essential: true,
  },
  {
    id: 'carrosserie',
    name: 'Débosser pis peinturer',
    description: "x1,25 sur tes gains. Un char propre, ça donne plus de pourboire.",
    cost: 18_000,
    essential: false,
  },
];

export const CAR_TIP_MULT = 1.25;
