// Les événements du rang : de temps en temps, quelqu'un arrive avec une affaire à te proposer.
// Les montants suivent tes revenus, pis une perte dépasse jamais une minute de revenus.
import { CHARACTERS } from './quests';
import { saisonA, type Saison } from './saisons';
import type { FeteId } from './fetes';
import { carRuns, earn, payer, revenuRef, type GameState } from './state';
import { formatMoney } from './format';
import { t } from './i18n';

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
  /** Arrive juste au début de cette fête (jamais au hasard). */
  fete?: FeteId;
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
      { label: "Payer l'amende", faire: (s) => t("Tu paies {x}. L'agent te souhaite une bonne journée.", { x: perd(s, 30) }) },
      {
        label: 'Jaser de hockey',
        faire: (s, r) =>
          r < 0.5
            ? t("Y'é fan de la même équipe que toé. Y te laisse partir avec un clin d'œil.")
            : t('Mauvaise équipe. Amende double : {x}.', { x: perd(s, 60) }),
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
            ? t("Y'avait une vieille carte de hockey de collection dedans! Tu la revends {x}.", { x: gagne(s, 120) })
            : t("Des vieux catalogues pis une lampe à l'huile. Ça valait {x}, mettons.", { x: prix });
        },
      },
      { label: 'Non merci', faire: () => t('Tu continues ton chemin.') },
    ],
  },
  {
    id: 'touriste',
    qui: 'touriste',
    texte: "Excuse me... le chemin du chalet, c'est par où?",
    choix: [
      { label: "L'aider", faire: (s) => t('Y te donne {x} de pourboire. « Thank you! »', { x: gagne(s, 60) }) },
      { label: 'Le niaiser', faire: () => t("Tu l'envoies dans le rang d'en face. Pas de pourboire, mais t'as ri.") },
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
          return r < 0.3 ? t('BINGO! Tu gagnes {x}.', { x: gagne(s, 100) }) : t("Pas chanceux. La carte t'a coûté {x}.", { x: carte });
        },
      },
      { label: 'Pas à soir', faire: () => t('Ginette : « Une autre fois, mon chou. »') },
    ],
  },
  {
    id: 'cabane',
    qui: 'oncle',
    texte: "J'ai besoin d'un coup de main à la cabane à sucre. Je paye en cash pis en tire.",
    si: en('printemps'),
    choix: [{ label: 'Y aller', faire: (s) => t('Tu fais bouillir toute la journée. Ton oncle te donne {x}.', { x: gagne(s, 90) }) }],
  },
  {
    id: 'festival',
    qui: 'voisin',
    texte: 'Festival de la gibelotte au village! Y a des canettes vides partout.',
    si: en('ete'),
    choix: [{ label: 'Ramasser', faire: (s) => t('Trois sacs de canettes. Ça fait {x}.', { x: gagne(s, 60) }) }],
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
            ? t('Ti-Guy le rate, mais un chasseur de la ville vous paye {x} pour la place.', { x: gagne(s, 90) })
            : t('Vous voyez rien pantoute. Une belle journée dans le bois pareil.'),
      },
      { label: 'Rester en dedans', faire: () => t('Ti-Guy : « Pas grave, je vais y aller avec mon beau-frère. »') },
    ],
  },
  {
    id: 'verglas',
    qui: 'tiguy',
    texte: 'Tempête de verglas! Tout le rang est dans le fossé.',
    si: (s) => en('hiver')(s) && carRuns(s),
    choix: [{ label: 'Sortir la chaîne', faire: (s) => t('Tu sors six chars du fossé. Ça fait {x}.', { x: gagne(s, 120) }) }],
  },
  // Les fêtes : chacune arrive avec son invitation.
  {
    id: 'fete-sucres',
    qui: 'oncle',
    fete: 'sucres',
    texte: "C'est le temps des sucres! Viens manger à la cabane, y'a du jambon pis de la tire pour tout le monde.",
    choix: [
      { label: 'Aller se sucrer le bec', faire: (s) => t('Tu vends du sirop aux visiteurs entre deux oreilles de crisse. Ça fait {x}.', { x: gagne(s, 90) }) },
      { label: 'Rester travailler', faire: () => t('Ton oncle : « Je te garde un pot de sirop. »') },
    ],
  },
  {
    id: 'fete-stjean',
    qui: 'voisin',
    fete: 'stjean',
    texte: 'Bonne Saint-Jean! On fait un feu de joie dans le champ. Tu fournis la bière?',
    choix: [
      {
        label: 'Fournir la bière',
        faire: (s, r) => {
          const caisse = perd(s, 15);
          return r < 0.7
            ? t('Le monde est content, pis tout le village passe acheter chez vous. Tu fais {x}.', { x: gagne(s, 120) })
            : t("Gens du pays jusqu'à trois heures du matin. La bière t'a coûté {x}, mais quelle soirée.", { x: caisse });
        },
      },
      { label: 'Juste regarder le feu', faire: () => t('Monsieur Tremblay : « La prochaine fois! »') },
    ],
  },
  {
    id: 'fete-halloween',
    qui: 'ginette',
    fete: 'halloween',
    texte: "Les enfants passent l'Halloween dans le rang à soir. T'as-tu des bonbons?",
    choix: [
      { label: 'Donner des chips', faire: (s) => t('Les parents sont contents pis reviennent au dépanneur. Ça te rapporte {x}.', { x: gagne(s, 60) }) },
      { label: 'Éteindre les lumières', faire: () => t('Le lendemain, ta boîte aux lettres est pleine de papier de toilette.') },
    ],
  },
  {
    id: 'fete-noel',
    qui: 'mere',
    fete: 'noel',
    texte: "Le party de Noël est chez nous cette année. Tu fais l'échange de cadeaux?",
    choix: [
      {
        label: "Faire l'échange",
        faire: (s, r) => {
          const cadeau = perd(s, 10);
          return r < 0.5
            ? t("Tu pioches le billet de loto de mononc. Y'é gagnant : {x}!", { x: gagne(s, 150) })
            : t('Tu pioches des bas de laine. Ton cadeau à toé a coûté {x}.', { x: cadeau });
        },
      },
      { label: 'Manger de la tourtière', faire: () => t('Trois pointes de tourtière plus tard, tu fais une sieste sur le divan.') },
    ],
  },
];

/** Un événement au hasard parmi ceux qui peuvent arriver en ce moment. */
export function tirerEvenement(state: GameState, r: number): Evenement | null {
  const possibles = EVENEMENTS.filter((e) => !e.fete && (!e.si || e.si(state)));
  return possibles[Math.floor(r * possibles.length)] ?? null;
}

/** Le joueur choisit : applique le choix pis compte l'événement. */
export function choisir(state: GameState, e: Evenement, i: number, r: number): string {
  state.stats.evenements += 1;
  return e.choix[i].faire(state, r);
}
