export interface Character {
  id: string;
  name: string;
  initials: string;
  /** Couleur de la palette Bazou VHS pour son portrait. */
  color: string;
}

export const CHARACTERS: Record<string, Character> = {
  mere: { id: 'mere', name: 'Ta mère', initials: 'MA', color: '#6e2f28' },
  ginette: { id: 'ginette', name: 'Ginette du dépanneur', initials: 'GI', color: '#a47a3c' },
  tiguy: { id: 'tiguy', name: 'Ti-Guy', initials: 'TG', color: '#50573c' },
  gagnon: { id: 'gagnon', name: 'Le bonhomme Gagnon', initials: 'BG', color: '#5d5f60' },
};

export type Objective =
  | { kind: 'taps'; target: number }
  | { kind: 'earned'; target: number }
  | { kind: 'upgrade'; id: string; target: number }
  | { kind: 'ownCar' }
  | { kind: 'repair'; part: string }
  | { kind: 'carRuns' };

export interface Quest {
  id: string;
  giver: keyof typeof CHARACTERS;
  /** Ce que le personnage te demande. */
  ask: string;
  /** Ce qu'il te dit quand c'est fait. */
  thanks: string;
  /** Résumé court de l'objectif, affiché sous la barre. */
  goal: string;
  objective: Objective;
  reward: number;
}

// Une seule quête active à la fois, dans l'ordre.
export const QUESTS: readonly Quest[] = [
  {
    id: 'sous-sol',
    giver: 'mere',
    ask: "Envoye, sors du sous-sol! Va ramasser des canettes dans le rang, ça va te faire prendre l'air.",
    thanks: "Bon! Tu vois que t'es capable. Tiens, un petit 2 piasses pour ta liqueur.",
    goal: 'Ramasser 25 canettes',
    objective: { kind: 'taps', target: 25 },
    reward: 2,
  },
  {
    id: 'consigne',
    giver: 'ginette',
    ask: "Allo mon beau! Rapporte-moi pour 10 $ de canettes, pis je te fais un prix sur tes chips.",
    thanks: "Ça c'est du stock! Garde le change, mon chou.",
    goal: 'Gagner 10 $ au total',
    objective: { kind: 'earned', target: 10 },
    reward: 5,
  },
  {
    id: 'bicycle',
    giver: 'tiguy',
    ask: "Heille, t'as pas d'allure à marcher de même. Ton oncle a un vieux bicycle dans sa remise, achète-lui.",
    thanks: "Ah ben là! Y grince, mais tu vas faire le rang deux fois plus vite.",
    goal: 'Acheter le vieux bicycle',
    objective: { kind: 'upgrade', id: 'velo', target: 1 },
    reward: 10,
  },
  {
    id: 'associe',
    giver: 'tiguy',
    ask: "Pis si on ramassait ensemble? Pour une liqueur pis un sac de chips, je suis ton homme.",
    thanks: "Deal! On est une business astheure, mon homme.",
    goal: 'Engager Ti-Guy',
    objective: { kind: 'upgrade', id: 'chum', target: 1 },
    reward: 25,
  },
  {
    id: 'a-vendre',
    giver: 'gagnon',
    ask: "Mon vieux char dans la cour, y'é à vendre. 500 piasses pis y'é à toé. Y roule pas, mais c'est un bon char.",
    thanks: "Fais attention, y'a du millage, mais y'a du cœur. Bonne chance avec!",
    goal: 'Acheter le bazou',
    objective: { kind: 'ownCar' },
    reward: 50,
  },
  {
    id: 'pneus',
    giver: 'tiguy',
    ask: "Ton char sur les blocs, ça fait pitié. Mon cousin a des pneus usagés, va voir.",
    thanks: "Ah, ça a déjà plus l'air d'un char!",
    goal: 'Mettre des pneus',
    objective: { kind: 'repair', part: 'pneus' },
    reward: 100,
  },
  {
    id: 'souper',
    giver: 'mere',
    ask: "Ton char, y roule-tu? Si oui, viens souper dimanche, ton père veut le voir.",
    thanks: "Ton père dit que ça sonne comme un tracteur. Il est fier pareil.",
    goal: 'Faire rouler le bazou',
    objective: { kind: 'carRuns' },
    reward: 250,
  },
  {
    id: 'publisac',
    giver: 'ginette',
    ask: "Le gars des circulaires a lâché. Ça te tente-tu de faire la route avec ton char?",
    thanks: "Tout le rang a eu son Publisac. T'es mon sauveur!",
    goal: 'Prendre la route de circulaires',
    objective: { kind: 'upgrade', id: 'circulaires', target: 1 },
    reward: 1000,
  },
  {
    id: 'peinture',
    giver: 'gagnon',
    ask: "Je l'reconnais pu, ton char! Mais la rouille... Débosse-moi ça, ça te ferait honneur.",
    thanks: "Ben coudonc. Y'é plus beau que quand je l'ai acheté en 1987.",
    goal: 'Débosser pis peinturer',
    objective: { kind: 'repair', part: 'carrosserie' },
    reward: 2000,
  },
  {
    id: 'garage',
    giver: 'tiguy',
    ask: "J'ai une idée de fou : on ouvre un garage. Mais faut du cash. Mettons... 50 000 $ de gagné.",
    thanks: "On a le cash! Le garage s'en vient (au prochain jalon).",
    goal: 'Gagner 50 000 $ au total',
    objective: { kind: 'earned', target: 50000 },
    reward: 5000,
  },
];
