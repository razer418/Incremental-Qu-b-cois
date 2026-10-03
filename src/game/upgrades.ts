import type { BuildingId } from './buildings';

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
  requires?: 'roule' | BuildingId;
}

// Jalon 1 : on est à pied, on ramasse des canettes consignées.
export const UPGRADES: readonly Upgrade[] = [
  {
    id: 'sac',
    name: 'Un plus gros sac',
    description: '+0,10 $ par tape. Un sac de chips, ça tenait pas grand-chose.',
    baseCost: 5,
    costGrowth: 1.5,
    maxLevel: 25,
    effect: { kind: 'tapAdd', amount: 0.1 },
  },
  {
    id: 'velo',
    name: 'Le vieux bicycle à ton oncle',
    description: '+0,25 $/s. Y grince, mais y roule.',
    baseCost: 25,
    costGrowth: 1.55,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 0.25 },
  },
  {
    id: 'chum',
    name: 'Ti-Guy te donne un coup de main',
    description: '+1 $/s. Y travaille pour une liqueur pis un sac de chips.',
    baseCost: 300,
    costGrowth: 1.55,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 1 },
  },
  {
    id: 'remorque',
    name: 'Une remorque de bicycle',
    description: '+5 $/s. Tu ramasses le stock de tout le rang.',
    baseCost: 2_500,
    costGrowth: 1.6,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 5 },
  },
  {
    id: 'depanneur',
    name: 'Contact au dépanneur',
    description: 'x1,5 sur tous tes gains. Le proprio te fait un prix.',
    baseCost: 1_500,
    costGrowth: 15,
    maxLevel: 3,
    effect: { kind: 'globalMult', factor: 1.5 },
  },
  // Jobs motorisées, débloquées quand le bazou roule.
  {
    id: 'circulaires',
    name: 'Route de circulaires',
    description: '+6 $/s. Le Publisac, ça se livre pas tout seul.',
    baseCost: 20_000,
    costGrowth: 1.6,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 6 },
    requires: 'roule',
  },
  {
    id: 'deneigement',
    name: 'Déneigement des entrées',
    description: '+24 $/s. Une pelle sur le bazou pis envoye.',
    baseCost: 300_000,
    costGrowth: 1.65,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 24 },
    requires: 'roule',
  },
  {
    id: 'remorquage',
    name: 'Remorquage chez les voisins',
    description: "+100 $/s. Tout le monde reste pogné dans le fossé l'hiver.",
    baseCost: 4_000_000,
    costGrowth: 1.7,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 100 },
    requires: 'roule',
  },
  // Le garage
  {
    id: 'baie',
    name: 'Une baie de plus',
    description: '+130 $/s. Un pont élévateur usagé pis un char de plus à la fois.',
    baseCost: 8_000_000,
    costGrowth: 1.6,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 130 },
    requires: 'garage',
  },
  {
    id: 'mecano',
    name: 'Engager un vrai mécano',
    description: 'x2 sur tous tes gains. Ti-Guy est content, y peut enfin prendre son break.',
    baseCost: 10_000_000,
    costGrowth: 20,
    maxLevel: 2,
    effect: { kind: 'globalMult', factor: 2 },
    requires: 'garage',
  },
  // La cabane à sucre
  {
    id: 'chaudieres',
    name: "Des chaudières d'eau d'érable",
    description: '+430 $/s. Ton oncle Gérald fait bouillir, toi tu ramasses.',
    baseCost: 60_000_000,
    costGrowth: 1.6,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 430 },
    requires: 'cabane',
  },
  {
    id: 'tire',
    name: 'La tire sur la neige',
    description: 'x1,5 sur tous tes gains. Les touristes font la file jusque dans le rang.',
    baseCost: 80_000_000,
    costGrowth: 12,
    maxLevel: 1,
    effect: { kind: 'globalMult', factor: 1.5 },
    requires: 'cabane',
  },
  // Le concessionnaire
  {
    id: 'lot',
    name: 'Des chars sur le lot',
    description: '+1 350 $/s. Des bazous retapés, garantie de 30 jours (ou 30 km).',
    baseCost: 300_000_000,
    costGrowth: 1.6,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 1_350 },
    requires: 'concession',
  },
  {
    id: 'radio',
    name: 'Une pub à la radio locale',
    description: "x1,5 sur tous tes gains. « Chez Gagnon pis fils, on vous fait un prix! »",
    baseCost: 2_000_000_000,
    costGrowth: 10,
    maxLevel: 3,
    effect: { kind: 'globalMult', factor: 1.5 },
    requires: 'concession',
  },
  {
    id: 'vendeur',
    name: 'Un vendeur de chars',
    description: '+10 000 $/s. Y parle vite pis y a une moustache.',
    baseCost: 15_000_000_000,
    costGrowth: 1.7,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 10_000 },
    requires: 'concession',
  },
  // Le bar du village
  {
    id: 'chansonnier',
    name: 'Le chansonnier du vendredi',
    description: '+4 000 $/s. Y connaît juste trois tounes, mais y les fait ben.',
    baseCost: 6_000_000_000,
    costGrowth: 1.65,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 4_000 },
    requires: 'bar',
  },
  {
    id: 'karaoke',
    name: 'La soirée karaoké',
    description: 'x1,5 sur tous tes gains. Ginette chante la même toune depuis 1998.',
    baseCost: 8_000_000_000,
    costGrowth: 10,
    maxLevel: 1,
    effect: { kind: 'globalMult', factor: 1.5 },
    requires: 'bar',
  },
  // L'aréna
  {
    id: 'glace',
    name: 'Louer la glace',
    description: "+20 000 $/s. Les ligues de garage jouent jusqu'à minuit.",
    baseCost: 40_000_000_000,
    costGrowth: 1.7,
    maxLevel: 25,
    effect: { kind: 'passiveAdd', amount: 20_000 },
    requires: 'arena',
  },
  {
    id: 'tournoi',
    name: 'Le tournoi de hockey bottine',
    description: 'x1,5 sur tous tes gains. Tout le comté vient voir la finale.',
    baseCost: 60_000_000_000,
    costGrowth: 10,
    maxLevel: 1,
    effect: { kind: 'globalMult', factor: 1.5 },
    requires: 'arena',
  },
];

export function getUpgrade(id: string): Upgrade | undefined {
  return UPGRADES.find((u) => u.id === id);
}

export function upgradeCost(upgrade: Upgrade, level: number): number {
  return Math.round(upgrade.baseCost * Math.pow(upgrade.costGrowth, level) * 100) / 100;
}
