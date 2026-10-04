// Le magasin général à Réjean : des petits bonus pour un bout de temps, payés avec le cash du jeu.
// Les marques sont inventées : pas de vraies marques dans le jeu.

export interface Article {
  id: string;
  name: string;
  description: string;
  /** Ce que ça booste : tes tapes ou ton passif. */
  boosts: 'tap' | 'idle';
  factor: number;
  seconds: number;
  /** Le prix suit ta progression : autant de secondes de tes revenus. */
  incomeSeconds: number;
  minCost: number;
  /** Le bouton dans l'inventaire, à la maison. */
  verbe: string;
  /** Ce qui se passe quand tu le prends. */
  ligne: string;
}

export const ARTICLES: readonly Article[] = [
  {
    id: 'chips',
    name: 'Chips pis liqueur',
    description: 'Tapes x1,5 pendant 15 min. Le combo du midi.',
    boosts: 'tap',
    factor: 1.5,
    seconds: 15 * 60,
    incomeSeconds: 60,
    minCost: 3,
    verbe: 'MANGER',
    ligne: "Crunch crunch. T'as les doigts orange, mais t'es en forme.",
  },
  {
    id: 'cafe',
    name: 'Café filtre',
    description: 'Passif x1,5 pendant 15 min. Ça goûte le brûlé, mais ça réveille la gang.',
    boosts: 'idle',
    factor: 1.5,
    seconds: 15 * 60,
    incomeSeconds: 90,
    minCost: 6,
    verbe: 'BOIRE',
    ligne: 'Une gorgée de café brûlé. Les yeux ronds, la gang se réveille.',
  },
  {
    id: 'biere',
    name: 'Caisse de 24 « La Brune du Rang »',
    description: 'Tapes x2 pendant 15 min. Ti-Guy livre plus vite avec une frette qui l’attend.',
    boosts: 'tap',
    factor: 2,
    seconds: 15 * 60,
    incomeSeconds: 180,
    minCost: 30,
    verbe: 'BOIRE',
    ligne: 'Tchssss! Une frette sur la galerie. Envoye Ti-Guy, livre!',
  },
  {
    id: 'cigarettes',
    name: 'Paquet de « Rouges du Rang »',
    description: 'Passif x2 pendant 6 min. Une pause smoke, pis la gang revient en feu.',
    boosts: 'idle',
    factor: 2,
    seconds: 6 * 60,
    incomeSeconds: 135,
    minCost: 24,
    verbe: 'FUMER',
    ligne: 'Une smoke sur le perron. La gang prend une pause, pis repart en feu.',
  },
  {
    id: 'vape',
    name: 'Vape saveur barbe à papa',
    description: 'Tapes x1,5 pendant 45 min. Ça sent la cabane à sucre dans le char.',
    boosts: 'tap',
    factor: 1.5,
    seconds: 45 * 60,
    incomeSeconds: 225,
    minCost: 36,
    verbe: 'VAPOTER',
    ligne: 'Un gros nuage barbe à papa dans le salon. Ça sent la cabane.',
  },
  {
    id: 'vin',
    name: 'Vin de dépanneur',
    description: 'Passif x1,5 pendant 45 min. Une bouteille de rouge pas chère pour le souper.',
    boosts: 'idle',
    factor: 1.5,
    seconds: 45 * 60,
    incomeSeconds: 270,
    minCost: 30,
    verbe: 'BOIRE',
    ligne: "Un verre de rouge de dépanneur avec le souper. C'est pas grand cru, mais c'est bon.",
  },
  {
    id: 'vers',
    name: 'Vers de terre',
    description: 'Passif x1,25 pendant 1 h 30. Ti-Guy part à la pêche, la gang travaille en paix.',
    boosts: 'idle',
    factor: 1.25,
    seconds: 90 * 60,
    incomeSeconds: 180,
    minCost: 9,
    verbe: 'PÊCHER',
    ligne: 'Ti-Guy part au lac avec sa canne. La gang travaille en paix.',
  },
  {
    id: 'bois',
    name: 'Corde de bois',
    description: 'Passif x1,25 pendant 3 h. Une maison chaude, une gang heureuse.',
    boosts: 'idle',
    factor: 1.25,
    seconds: 180 * 60,
    incomeSeconds: 360,
    minCost: 60,
    verbe: 'CHAUFFER',
    ligne: 'Une bûche dans le poêle. La maison est chaude, la gang est heureuse.',
  },
];

export function getArticle(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id);
}

/** Ce que Réjean te dit quand t'arrives au magasin. */
export const REJEAN = [
  "Salut mon gars! Y'a de la frette dans le frigidaire pis du café sur le rond.",
  "Cash seulement, la machine à cartes est encore brisée.",
  "Ta mère est passée tantôt. A m'a dit que tu travaillais fort, astheure.",
  "Le vin est en spécial. Ben, y'est toujours en spécial.",
  "Si tu vas à la pêche, prends des vers. Les miens sont frais d'à matin.",
  "Un à la fois pour tes tapes, un à la fois pour la gang. Deux cafés, ça réveille pas deux fois plus.",
];
