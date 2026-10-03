export type UpgradeEffect =
  | { kind: 'tapAdd'; amount: number }
  | { kind: 'passiveAdd'; amount: number }
  | { kind: 'globalMult'; factor: number };

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  maxLevel: number;
  effect: UpgradeEffect;
  /** 'roule' : visible seulement quand le bazou roule. */
  requires?: 'roule';
}

// Jalon 1 : on est à pied, on ramasse des canettes consignées.
export const UPGRADES: readonly Upgrade[] = [
  {
    id: 'sac',
    name: 'Un plus gros sac',
    description: '+0,10 $ par tape. Un sac de chips, ça tenait pas grand-chose.',
    baseCost: 1,
    costGrowth: 1.35,
    maxLevel: 25,
    effect: { kind: 'tapAdd', amount: 0.1 },
  },
  {
    id: 'velo',
    name: 'Le vieux bicycle à ton oncle',
    description: '+0,25 $/s. Y grince, mais y roule.',
    baseCost: 5,
    costGrowth: 1.4,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 0.25 },
  },
  {
    id: 'chum',
    name: 'Ti-Guy te donne un coup de main',
    description: '+1 $/s. Y travaille pour une liqueur pis un sac de chips.',
    baseCost: 40,
    costGrowth: 1.45,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 1 },
  },
  {
    id: 'remorque',
    name: 'Une remorque de bicycle',
    description: '+5 $/s. Tu ramasses le stock de tout le rang.',
    baseCost: 250,
    costGrowth: 1.5,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 5 },
  },
  {
    id: 'depanneur',
    name: 'Contact au dépanneur',
    description: 'x1,5 sur tous tes gains. Le proprio te fait un prix.',
    baseCost: 150,
    costGrowth: 4,
    maxLevel: 5,
    effect: { kind: 'globalMult', factor: 1.5 },
  },
  // Jobs motorisées, débloquées quand le bazou roule.
  {
    id: 'circulaires',
    name: 'Route de circulaires',
    description: '+15 $/s. Le Publisac, ça se livre pas tout seul.',
    baseCost: 2000,
    costGrowth: 1.5,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 15 },
    requires: 'roule',
  },
  {
    id: 'deneigement',
    name: 'Déneigement des entrées',
    description: '+60 $/s. Une pelle sur le bazou pis envoye.',
    baseCost: 9000,
    costGrowth: 1.55,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 60 },
    requires: 'roule',
  },
  {
    id: 'remorquage',
    name: 'Remorquage chez les voisins',
    description: "+250 $/s. Tout le monde reste pogné dans le fossé l'hiver.",
    baseCost: 40000,
    costGrowth: 1.6,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 250 },
    requires: 'roule',
  },
];

export function getUpgrade(id: string): Upgrade | undefined {
  return UPGRADES.find((u) => u.id === id);
}

export function upgradeCost(upgrade: Upgrade, level: number): number {
  return Math.round(upgrade.baseCost * Math.pow(upgrade.costGrowth, level) * 100) / 100;
}
