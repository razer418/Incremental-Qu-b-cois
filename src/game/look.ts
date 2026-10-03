// Le look du bazou : peinture, collants, mags pis flaps de bouette.
// C'est juste cosmétique (aucun bonus), pis ça se voit dans le rang en 3D.
// Gardé au prestige : tu repars à pied, mais ton style te suit.
import { assez, payer, type GameState } from './state';

export type Categorie = 'peinture' | 'collant' | 'mags' | 'flaps';

export interface Option {
  id: string;
  nom: string;
  prix: number;
  /** Couleur dans le rang (palette Bazou VHS); null = rien à montrer. */
  couleur: number | null;
}

export const LOOK: Record<Categorie, { nom: string; options: readonly Option[] }> = {
  peinture: {
    nom: 'Peinture',
    options: [
      { id: 'brun', nom: "Brun d'origine", prix: 0, couleur: 0x7d4a2e },
      { id: 'rouge', nom: 'Rouge pompier', prix: 250, couleur: 0x8a2f26 },
      { id: 'bleu', nom: 'Bleu poudre', prix: 1500, couleur: 0x5f7488 },
      { id: 'vert', nom: 'Vert forêt', prix: 10_000, couleur: 0x3f5a3a },
      { id: 'moutarde', nom: 'Jaune moutarde', prix: 75_000, couleur: 0xa88a3a },
      { id: 'noir', nom: 'Noir mat', prix: 500_000, couleur: 0x2a2a28 },
    ],
  },
  collant: {
    nom: 'Collants',
    options: [
      { id: 'aucun', nom: 'Aucun collant', prix: 0, couleur: null },
      { id: 'numero', nom: 'Numéro de course', prix: 400, couleur: 0xd8d2bf },
      { id: 'bandes', nom: 'Bandes de course', prix: 5000, couleur: 0xd8d2bf },
      { id: 'flammes', nom: 'Flammes sur le capot', prix: 50_000, couleur: 0xc0702a },
    ],
  },
  mags: {
    nom: 'Mags',
    options: [
      { id: 'aucun', nom: "Roues d'acier", prix: 0, couleur: null },
      { id: 'chrome', nom: 'Mags chromés', prix: 800, couleur: 0xb8b8ae },
      { id: 'rouges', nom: 'Mags rouges', prix: 8000, couleur: 0x8a2f26 },
      { id: 'or', nom: 'Mags dorés', prix: 150_000, couleur: 0xc9a14a },
    ],
  },
  flaps: {
    nom: 'Flaps de bouette',
    options: [
      { id: 'aucun', nom: 'Pas de flaps', prix: 0, couleur: null },
      { id: 'noirs', nom: 'Flaps noirs', prix: 300, couleur: 0x1c1c1a },
      { id: 'rouges', nom: 'Flaps rouges', prix: 3000, couleur: 0x8a2f26 },
      { id: 'chrome', nom: 'Flaps chromés', prix: 30_000, couleur: 0xb8b8ae },
    ],
  },
};

export const CATEGORIES = Object.keys(LOOK) as Categorie[];

const cle = (c: Categorie, id: string) => `${c}:${id}`;

export function getOption(c: Categorie, id: string): Option | undefined {
  return LOOK[c].options.find((o) => o.id === id);
}

/** Les options gratuites sont à toé d'office. */
export function possede(state: GameState, c: Categorie, id: string): boolean {
  const o = getOption(c, id);
  return !!o && (o.prix === 0 || state.look.achetes.includes(cle(c, id)));
}

/** Ce qui est sur ton bazou en ce moment. */
export function choisie(state: GameState, c: Categorie): Option {
  return getOption(c, state.look.choix[c]) ?? LOOK[c].options[0];
}

/** Achète l'option si besoin, pis la pose sur le bazou. */
export function poser(state: GameState, c: Categorie, id: string): boolean {
  const o = getOption(c, id);
  if (!o || !state.car.owned) return false;
  if (!possede(state, c, id)) {
    if (!assez(state, o.prix)) return false;
    payer(state, o.prix);
    state.look.achetes.push(cle(c, id));
  }
  state.look.choix[c] = id;
  return true;
}
