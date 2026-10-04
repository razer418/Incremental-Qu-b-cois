// L'expo de chars du village : à chaque saison, un juge demande un thème.
// Tu montes un look qui fitte dans l'atelier, tu t'inscris une fois par saison,
// pis tu gagnes du cash selon ce qui fitte, plus un trophée pour la 1re place.
import { CHARACTERS } from './quests';
import { SAISON_SECONDES } from './saisons';
import { earn, revenuRef, type GameState } from './state';
import type { Categorie } from './look';

export interface Critere {
  categorie: Categorie;
  /** Une de ces options fait l'affaire. */
  ids: readonly string[];
  /** Ce que le juge veut, en mots. */
  texte: string;
}

export interface Theme {
  id: string;
  nom: string;
  juge: keyof typeof CHARACTERS;
  demande: string;
  criteres: readonly Critere[];
}

export const THEMES: readonly Theme[] = [
  {
    id: 'course',
    nom: 'Char de course',
    juge: 'tiguy',
    demande: "Moé, j'veux voir un char qui a l'air d'aller vite, même stationné.",
    criteres: [
      { categorie: 'collant', ids: ['numero', 'bandes', 'flammes'], texte: 'Un collant de course' },
      { categorie: 'mags', ids: ['chrome', 'rouges', 'or'], texte: 'Des mags' },
      { categorie: 'peinture', ids: ['rouge', 'noir'], texte: 'Rouge ou noir' },
    ],
  },
  {
    id: 'chalet',
    nom: 'Prêt pour le chalet',
    juge: 'oncle',
    demande: 'Un vrai char de fin de semaine au lac. Faut que ça passe dans le chemin de terre.',
    criteres: [
      { categorie: 'toit', ids: ['canot', 'galerie'], texte: 'Un canot ou une galerie' },
      { categorie: 'flaps', ids: ['noirs', 'rouges', 'chrome'], texte: 'Des flaps de bouette' },
      { categorie: 'peinture', ids: ['vert', 'brun'], texte: 'Vert ou brun' },
    ],
  },
  {
    id: 'fierte',
    nom: 'Fierté du rang',
    juge: 'maire',
    demande: 'Pour la parade du village, je veux du bleu pis du drapeau!',
    criteres: [
      { categorie: 'antenne', ids: ['drapeau'], texte: 'Le drapeau fleurdelisé' },
      { categorie: 'peinture', ids: ['bleu'], texte: 'Bleu poudre' },
      { categorie: 'collant', ids: ['bandes'], texte: 'Des bandes de course' },
    ],
  },
  {
    id: 'demenagement',
    nom: 'Le 1er juillet',
    juge: 'mere',
    demande: 'Mon gars, montre-moé le char le plus prêt à déménager du comté.',
    criteres: [
      { categorie: 'toit', ids: ['matelas'], texte: 'Un matelas sur le toit' },
      { categorie: 'flaps', ids: ['noirs', 'rouges', 'chrome'], texte: 'Des flaps de bouette' },
      { categorie: 'antenne', ids: ['cb', 'raton'], texte: 'Une antenne de CB ou une queue de raton' },
    ],
  },
  {
    id: 'bling',
    nom: 'Le gros luxe',
    juge: 'gagnon',
    demande: 'Ça brille-tu, ton affaire? Au lot, on vendait juste du beau.',
    criteres: [
      { categorie: 'mags', ids: ['or', 'chrome'], texte: 'Des mags dorés ou chromés' },
      { categorie: 'flaps', ids: ['chrome'], texte: 'Des flaps chromés' },
      { categorie: 'peinture', ids: ['noir', 'moutarde'], texte: 'Noir mat ou jaune moutarde' },
    ],
  },
  {
    id: 'fetes',
    nom: 'Le temps des fêtes',
    juge: 'rollande',
    demande: "Un char qui sent le réveillon, c'est ça que je veux voir.",
    criteres: [
      { categorie: 'toit', ids: ['sapin'], texte: 'Un sapin sur le toit' },
      { categorie: 'peinture', ids: ['rouge', 'vert'], texte: 'Rouge ou vert' },
      { categorie: 'mags', ids: ['or'], texte: 'Des mags dorés' },
    ],
  },
];

/** Une partie parfaite rapporte autant de secondes de tes revenus. */
export const EXPO_SECONDES = 300;

/** Le numéro de la saison en cours : une expo par saison. */
export function periode(ms: number): number {
  return Math.floor(ms / 1000 / SAISON_SECONDES);
}

export function themeA(ms: number): Theme {
  return THEMES[periode(ms) % THEMES.length];
}

export function critereOk(state: GameState, c: Critere): boolean {
  return c.ids.includes(state.look.choix[c.categorie]);
}

/** De 0 à 1 : la part des critères que ton look fitte. */
export function noteExpo(state: GameState, theme: Theme): number {
  return theme.criteres.filter((c) => critereOk(state, c)).length / theme.criteres.length;
}

export function dejaInscrit(state: GameState, ms: number): boolean {
  return state.expo.periode === periode(ms);
}

export function peutInscrire(state: GameState, ms: number): boolean {
  return state.car.owned && !dejaInscrit(state, ms);
}

export function prixExpo(state: GameState, note: number): number {
  return Math.max(1, revenuRef(state) * EXPO_SECONDES) * note;
}

/** Inscrit le bazou à l'expo de la saison. Retourne la note pis le cash gagné, ou null. */
export function inscrire(state: GameState, ms: number): { note: number; gain: number } | null {
  if (!peutInscrire(state, ms)) return null;
  const note = noteExpo(state, themeA(ms));
  const gain = prixExpo(state, note);
  if (gain > 0) earn(state, gain);
  state.expo.periode = periode(ms);
  if (note === 1) state.expo.trophees += 1;
  return { note, gain };
}
