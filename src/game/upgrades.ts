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
  /** Visible seulement quand le bazou roule, ou quand le bâtiment est acheté. */
  requires?: 'roule' | 'garage' | 'concession';
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
  // Le garage
  {
    id: 'baie',
    name: 'Une baie de plus',
    description: '+400 $/s. Un pont élévateur usagé pis un char de plus à la fois.',
    baseCost: 60_000,
    costGrowth: 1.5,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 400 },
    requires: 'garage',
  },
  {
    id: 'mecano',
    name: 'Engager un vrai mécano',
    description: 'x2 sur tous tes gains. Ti-Guy est content, y peut enfin prendre son break.',
    baseCost: 250_000,
    costGrowth: 6,
    maxLevel: 3,
    effect: { kind: 'globalMult', factor: 2 },
    requires: 'garage',
  },
  // Le concessionnaire
  {
    id: 'lot',
    name: 'Des chars sur le lot',
    description: '+4 000 $/s. Des bazous retapés, garantie de 30 jours (ou 30 km).',
    baseCost: 1_200_000,
    costGrowth: 1.5,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 4000 },
    requires: 'concession',
  },
  {
    id: 'radio',
    name: 'Une pub à la radio locale',
    description: "x1,5 sur tous tes gains. « Chez Gagnon pis fils, on vous fait un prix! »",
    baseCost: 3_000_000,
    costGrowth: 5,
    maxLevel: 4,
    effect: { kind: 'globalMult', factor: 1.5 },
    requires: 'concession',
  },
  {
    id: 'vendeur',
    name: 'Un vendeur de chars',
    description: '+30 000 $/s. Y parle vite pis y a une moustache.',
    baseCost: 15_000_000,
    costGrowth: 1.6,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 30_000 },
    requires: 'concession',
  },
];

export function getUpgrade(id: string): Upgrade | undefined {
  return UPGRADES.find((u) => u.id === id);
}

export function upgradeCost(upgrade: Upgrade, level: number): number {
  return Math.round(upgrade.baseCost * Math.pow(upgrade.costGrowth, level) * 100) / 100;
}
