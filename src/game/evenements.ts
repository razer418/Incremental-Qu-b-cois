// Les événements du rang : de temps en temps, quelqu'un arrive avec une affaire à te proposer.
// Les montants suivent tes revenus, pis une perte dépasse jamais une minute de revenus.
import { CHARACTERS } from './quests';
import { saisonA, type Saison } from './saisons';
import { carRuns, earn, payer, revenuRef, type GameState } from './state';
import { formatMoney } from './format';

export interface Choix {
  label: string;
  /** Applique le choix. `r` : un nombre au hasard de 0 à 1. Retourne ce qui est arrivé. */
  faire: (s: GameState, r: number) => string;
}

export interface Evenement {
  id: string;
  qui: keyof typeof CHARACTERS;
  texte: string;
  si?: (s: GameState) => boolean;
  choix: readonly Choix[];
}

/** Combien de temps un événement reste avant de partir tout seul. */
export const EVENEMENT_SECONDES = 60;

const montant = (s: GameState, secondes: number) => Math.max(0.5, revenuRef(s) * secondes);
const gagne = (s: GameState, secondes: number) => {
  const x = montant(s, secondes);
  earn(s, x);
  return formatMoney(x);
};
const perd = (s: GameState, secondes: number) => {
  const x = Math.min(s.cash, montant(s, secondes));
  payer(s, x);
  return formatMoney(x);
};
const en = (id: Saison['id']) => (s: GameState) => saisonA(s.lastTick).id === id;

export const EVENEMENTS: readonly Evenement[] = [
  {
    id: 'police',
    qui: 'police',
    texte: "Mon ami, ton silencieux est percé. Ça s'entend jusqu'au village.",
    si: carRuns,
    choix: [
      { label: "Payer l'amende", faire: (s) => `Tu paies ${perd(s, 30)}. L'agent te souhaite une bonne journée.` },
      {
        label: 'Jaser de hockey',
        faire: (s, r) =>
          r < 0.5
            ? "Y'é fan de la même équipe que toé. Y te laisse partir avec un clin d'œil."
            : `Mauvaise équipe. Amende double : ${perd(s, 60)}.`,
      },
    ],
  },
  {
    id: 'vente-garage',
    qui: 'voisin',
    texte: 'Vente de garage! Une boîte de vieilleries, je te la laisse pour pas cher.',
    choix: [
      {
        label: 'Acheter la boîte',
        faire: (s, r) => {
          const prix = perd(s, 20);
          return r < 0.6
            ? `Y'avait une vieille carte de hockey de collection dedans! Tu la revends ${gagne(s, 120)}.`
            : `Des vieux catalogues pis une lampe à l'huile. Ça valait ${prix}, mettons.`;
        },
      },
      { label: 'Non merci', faire: () => 'Tu continues ton chemin.' },
    ],
  },
  {
    id: 'touriste',
    qui: 'touriste',
    texte: "Excuse me... le chemin du chalet, c'est par où?",
    choix: [
      { label: "L'aider", faire: (s) => `Y te donne ${gagne(s, 60)} de pourboire. « Thank you! »` },
      { label: 'Le niaiser', faire: () => "Tu l'envoies dans le rang d'en face. Pas de pourboire, mais t'as ri." },
    ],
  },
  {
    id: 'bingo',
    qui: 'ginette',
    texte: "Bingo au sous-sol de l'église à soir! La carte est pas chère.",
    choix: [
      {
        label: 'Jouer',
        faire: (s, r) => {
          const carte = perd(s, 10);
          return r < 0.3 ? `BINGO! Tu gagnes ${gagne(s, 100)}.` : `Pas chanceux. La carte t'a coûté ${carte}.`;
        },
      },
      { label: 'Pas à soir', faire: () => 'Ginette : « Une autre fois, mon chou. »' },
    ],
  },
  {
    id: 'cabane',
    qui: 'oncle',
    texte: "J'ai besoin d'un coup de main à la cabane à sucre. Je paye en cash pis en tire.",
    si: en('printemps'),
    choix: [{ label: 'Y aller', faire: (s) => `Tu fais bouillir toute la journée. Ton oncle te donne ${gagne(s, 90)}.` }],
  },
  {
    id: 'festival',
    qui: 'voisin',
    texte: 'Festival de la gibelotte au village! Y a des canettes vides partout.',
    si: en('ete'),
    choix: [{ label: 'Ramasser', faire: (s) => `Trois sacs de canettes. Ça fait ${gagne(s, 60)}.` }],
  },
  {
    id: 'chasse',
    qui: 'tiguy',
    texte: "J'ai vu un chevreuil dans ton champ! On y va-tu?",
    si: en('automne'),
    choix: [
      {
        label: 'Y aller',
        faire: (s, r) =>
          r < 0.5
            ? `Ti-Guy le rate, mais un chasseur de la ville vous paye ${gagne(s, 90)} pour la place.`
            : 'Vous voyez rien pantoute. Une belle journée dans le bois pareil.',
      },
      { label: 'Rester en dedans', faire: () => 'Ti-Guy : « Pas grave, je vais y aller avec mon beau-frère. »' },
    ],
  },
  {
    id: 'verglas',
    qui: 'tiguy',
    texte: 'Tempête de verglas! Tout le rang est dans le fossé.',
    si: (s) => en('hiver')(s) && carRuns(s),
    choix: [{ label: 'Sortir la chaîne', faire: (s) => `Tu sors six chars du fossé. Ça fait ${gagne(s, 120)}.` }],
  },
];

/** Un événement au hasard parmi ceux qui peuvent arriver en ce moment. */
export function tirerEvenement(state: GameState, r: number): Evenement | null {
  const possibles = EVENEMENTS.filter((e) => !e.si || e.si(state));
  return possibles[Math.floor(r * possibles.length)] ?? null;
}

/** Le joueur choisit : applique le choix pis compte l'événement. */
export function choisir(state: GameState, e: Evenement, i: number, r: number): string {
  state.stats.evenements += 1;
  return e.choix[i].faire(state, r);
}
