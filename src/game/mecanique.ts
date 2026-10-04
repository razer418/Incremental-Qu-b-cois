// Le mini-jeu de mécanique (genre Car Mechanic Simulator) : chaque pièce d'un char à retaper
// se pose en quelques étapes. Dévisser, sortir la vieille pièce, poser la neuve, serrer au torque.
// Pas de cash en plus : la pièce se paye au même prix, le mini-jeu c'est la job de la poser.

export type Objet = 'roue' | 'amortisseur' | 'moteur' | 'transmission' | 'tole' | 'vitre' | 'vinyle' | 'turbo';

export type Etape =
  /** Touche chaque boulon pour le dévisser (ou chaque rivet pour le poser). */
  | { type: 'boulons'; n: number; texte: string }
  /** Glisse la vieille pièce en dehors. */
  | { type: 'tirer'; objet: Objet; texte: string }
  /** Glisse la pièce neuve à sa place. */
  | { type: 'poser'; objet: Objet; texte: string }
  /** Frotte toute la surface : rouille, vieux vinyle, peinture. */
  | { type: 'frotter'; couleur: 'rouille' | 'vinyle' | 'peinture' | 'chrome'; texte: string }
  /** Tape quand l'aiguille de la clé dynamométrique est dans le vert. */
  | { type: 'serrer'; texte: string };

const SERRER: Etape = { type: 'serrer', texte: 'Serre au torque : tape dans le vert.' };
const ROUE_OFF: Etape[] = [
  { type: 'boulons', n: 5, texte: 'Dévisse les écrous de roue.' },
  { type: 'tirer', objet: 'roue', texte: 'Enlève la roue.' },
];

/** Les étapes de chaque pièce (id de la pièce dans chars.ts). */
export const RECETTES: Record<string, readonly Etape[]> = {
  moteur: [
    { type: 'boulons', n: 4, texte: 'Dévisse les supports du vieux moteur.' },
    { type: 'tirer', objet: 'moteur', texte: 'Sors le moteur avec le palan.' },
    { type: 'poser', objet: 'moteur', texte: 'Descends le moteur neuf à sa place.' },
    SERRER,
  ],
  boite: [
    { type: 'frotter', couleur: 'rouille', texte: 'Gratte la rouille du fond de boîte.' },
    { type: 'poser', objet: 'tole', texte: 'Pose la tôle neuve.' },
    { type: 'boulons', n: 6, texte: 'Rivette la tôle : touche chaque trou.' },
  ],
  parebrise: [
    { type: 'tirer', objet: 'vitre', texte: 'Arrache le vieux pare-brise craqué.' },
    { type: 'frotter', couleur: 'rouille', texte: 'Nettoie le cadre.' },
    { type: 'poser', objet: 'vitre', texte: 'Pose le pare-brise neuf.' },
  ],
  transmission: [
    { type: 'boulons', n: 6, texte: 'Dévisse la transmission.' },
    { type: 'tirer', objet: 'transmission', texte: 'Descends la vieille transmission.' },
    { type: 'poser', objet: 'transmission', texte: 'Monte la transmission neuve.' },
    SERRER,
  ],
  suspension: [
    ...ROUE_OFF,
    { type: 'boulons', n: 2, texte: "Dévisse l'amortisseur." },
    { type: 'tirer', objet: 'amortisseur', texte: "Sors l'amortisseur fini." },
    { type: 'poser', objet: 'amortisseur', texte: "Pose l'amortisseur neuf." },
    { type: 'poser', objet: 'roue', texte: 'Remets la roue avec une mag neuve.' },
    SERRER,
  ],
  vinyle: [
    { type: 'frotter', couleur: 'vinyle', texte: 'Arrache le vieux vinyle.' },
    { type: 'poser', objet: 'vinyle', texte: 'Déroule le vinyle neuf.' },
    { type: 'frotter', couleur: 'vinyle', texte: 'Lisse les bulles.' },
  ],
  v8: [
    { type: 'boulons', n: 8, texte: 'Dévisse les supports du moteur.' },
    { type: 'tirer', objet: 'moteur', texte: 'Sors le vieux moteur avec le palan.' },
    { type: 'poser', objet: 'moteur', texte: 'Descends le V8 à sa place.' },
    SERRER,
  ],
  chrome: [
    ...ROUE_OFF,
    { type: 'poser', objet: 'roue', texte: 'Pose la mag chromée.' },
    SERRER,
    { type: 'frotter', couleur: 'chrome', texte: 'Polis les chromes.' },
  ],
  diesel: [
    { type: 'boulons', n: 6, texte: 'Dévisse les supports du vieux diesel.' },
    { type: 'tirer', objet: 'moteur', texte: 'Sors le diesel avec le palan.' },
    { type: 'poser', objet: 'moteur', texte: 'Descends le diesel neuf à sa place.' },
    SERRER,
  ],
  roues: [...ROUE_OFF, { type: 'poser', objet: 'roue', texte: 'Pose la roue double neuve.' }, SERRER],
  interieur: [
    { type: 'frotter', couleur: 'vinyle', texte: 'Arrache le vieux tapis.' },
    { type: 'poser', objet: 'vinyle', texte: 'Déroule le tapis neuf.' },
    { type: 'boulons', n: 4, texte: 'Visse les bancs.' },
  ],
  turbo: [
    { type: 'boulons', n: 4, texte: 'Dévisse le collecteur.' },
    { type: 'poser', objet: 'turbo', texte: 'Pose le turbo.' },
    SERRER,
  ],
  aileron: [
    { type: 'boulons', n: 4, texte: 'Perce les trous : touche chaque marque.' },
    { type: 'poser', objet: 'tole', texte: "Pose l'aileron." },
    SERRER,
  ],
  legende: [
    { type: 'frotter', couleur: 'rouille', texte: 'Sable la carrosserie.' },
    { type: 'frotter', couleur: 'chrome', texte: 'Polis les chromes de légende.' },
    { type: 'frotter', couleur: 'peinture', texte: 'Peinture les bandes de course.' },
  ],
  flammes: [
    { type: 'frotter', couleur: 'rouille', texte: 'Sable le capot.' },
    { type: 'frotter', couleur: 'peinture', texte: 'Peinture les flammes.' },
  ],
};
