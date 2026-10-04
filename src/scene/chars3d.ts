import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PAL } from './palette';

// Les chars à retaper en 3D, un modèle à chaque annonce du Face-de-Bouc Marché.
// Une forme de base, une couleur, pis un détail qui le rend unique. Style Bazou VHS : des boîtes, pas de lissage.
// Pas encore retapé : sur les blocs, plein de rouille. Retapé : sur ses roues, propre.

type Forme =
  | 'berline'
  | 'coupe'
  | 'muscle'
  | 'familiale'
  | 'corbillard'
  | 'limo'
  | 'pickup'
  | 'van'
  | 'quatre'
  | 'decapotable'
  | 'autobus'
  | 'motorise'
  | 'camion'
  | 'resurfaceuse'
  | 'formule';

/** Longueur, hauteur de la caisse, cabine [longueur, décalage, hauteur] pis rayon des roues. */
const FORMES: Record<Forme, { L: number; h: number; cab: [number, number, number]; r: number }> = {
  berline: { L: 4.4, h: 0.75, cab: [2.2, -0.2, 0.65], r: 0.42 },
  coupe: { L: 4.2, h: 0.7, cab: [1.6, -0.5, 0.6], r: 0.42 },
  muscle: { L: 4.4, h: 0.66, cab: [1.5, -0.6, 0.55], r: 0.45 },
  familiale: { L: 4.8, h: 0.75, cab: [3.0, -0.6, 0.7], r: 0.42 },
  corbillard: { L: 5.4, h: 0.8, cab: [3.4, -0.7, 0.9], r: 0.42 },
  limo: { L: 6.6, h: 0.75, cab: [4.6, -0.3, 0.65], r: 0.42 },
  pickup: { L: 4.6, h: 0.8, cab: [1.3, 0.5, 0.75], r: 0.45 },
  van: { L: 4.4, h: 0.8, cab: [3.6, -0.3, 1.1], r: 0.42 },
  quatre: { L: 4.0, h: 0.85, cab: [2.0, -0.4, 0.8], r: 0.6 },
  decapotable: { L: 4.4, h: 0.72, cab: [0, 0, 0], r: 0.42 },
  autobus: { L: 7.2, h: 1.0, cab: [6.4, -0.2, 0.9], r: 0.5 },
  motorise: { L: 6.2, h: 1.0, cab: [5.2, -0.4, 1.1], r: 0.5 },
  camion: { L: 5.6, h: 0.9, cab: [1.3, 1.7, 0.9], r: 0.5 },
  resurfaceuse: { L: 3.8, h: 1.3, cab: [0.9, 1.0, 0.6], r: 0.4 },
  formule: { L: 4.4, h: 0.35, cab: [0.7, -0.3, 0.3], r: 0.45 },
};

/** Ce qu'un détail a besoin pour se bâtir : le haut de la caisse, la longueur, pis de quoi poser des boîtes. */
interface Outils {
  haut: number;
  L: number;
  toit: number;
  boite(w: number, h: number, d: number, c: number, x: number, y: number, z: number, o?: { rx?: number; ry?: number; rz?: number }): void;
  cyl(r: number, h: number, c: number, x: number, y: number, z: number, o?: { rx?: number; rz?: number; cone?: boolean }): void;
}

interface Modele {
  forme: Forme;
  couleur: number;
  /** Des roues plus grosses que la forme (camion-monstre). */
  roue?: number;
  detail?: (o: Outils) => void;
}

// Les couleurs viennent du guide (PAL) pis des peintures du look.
const BEIGE = 0xa89a7a;
const BLANC = 0xd8d2bf;
const OR = 0xc9a14a;
const ROUGE = 0x8a2f26;
const BLEU = 0x5f7488;
const VERT = 0x3f5a3a;
const MOUTARDE = 0xa88a3a;
const NOIR = 0x2a2a28;

/** Des panneaux de faux bois sur les deux côtés. */
const fauxBois = (o: Outils) => {
  for (const z of [0.91, -0.91]) o.boite(o.L * 0.8, o.haut * 0.35, 0.04, PAL.bois, -0.1, o.haut * 0.75, z);
};
/** Une galerie de toit, avec ou sans bagages. */
const galerie = (o: Outils, x: number, long: number, bagages?: number) => {
  for (const z of [-0.6, 0.6]) o.boite(long, 0.06, 0.06, PAL.pneu, x, o.toit + 0.06, z);
  if (bagages) o.boite(long * 0.6, 0.35, 1.0, bagages, x, o.toit + 0.26, 0);
};

export const MODELES: Record<string, Modele> = {
  // --- Les pick-up pis compagnie ---
  van: {
    forme: 'van',
    couleur: MOUTARDE,
    detail: (o) => {
      // Un hublot pis une bande « années 80 »
      o.cyl(0.32, 0.05, PAL.vitre, -1.2, o.haut + 0.55, 0.92, { rx: Math.PI / 2 });
      o.boite(o.L * 0.95, 0.14, 1.84, PAL.brique, 0, o.haut - 0.1, 0);
    },
  },
  pickup: {
    forme: 'pickup',
    couleur: ROUGE,
    // Le pneu de secours dans la boîte
    detail: (o) => o.cyl(0.38, 0.28, PAL.pneu, -1.4, o.haut + 0.2, 0, { rx: 0 }),
  },
  castor: {
    forme: 'berline',
    couleur: BEIGE,
    // Une moulure de chrome tout le long
    detail: (o) => {
      for (const z of [0.92, -0.92]) o.boite(o.L * 0.9, 0.06, 0.03, PAL.chrome, 0, o.haut * 0.85, z);
    },
  },
  quatre: {
    forme: 'quatre',
    couleur: VERT,
    detail: (o) => {
      // L'arbre qui a poussé à travers le toit
      o.cyl(0.16, 4.2, PAL.tronc, -0.4, 2.1, 0);
      o.cyl(1.1, 2.2, PAL.sapin, -0.4, 4.3, 0, { cone: true });
      o.boite(0.5, 0.5, 0.06, PAL.chrome, -o.L / 2 - 0.05, o.haut, 0, { ry: Math.PI / 2 });
    },
  },
  tempete: {
    forme: 'coupe',
    couleur: BLEU,
    // La porte d'un autre char, pas de la même couleur
    detail: (o) => o.boite(1.0, o.haut * 0.6, 0.04, ROUGE, 0.1, o.haut * 0.7, 0.92),
  },
  familiale: {
    forme: 'familiale',
    couleur: BLANC,
    detail: (o) => {
      fauxBois(o);
      // Une petite croix sur le toit
      o.boite(0.08, 0.5, 0.08, OR, -0.6, o.toit + 0.25, 0);
      o.boite(0.08, 0.08, 0.34, OR, -0.6, o.toit + 0.35, 0);
    },
  },

  // --- Les gros chars ---
  corbillard: {
    forme: 'corbillard',
    couleur: NOIR,
    detail: (o) => {
      // Les rideaux pis les barres de landau chromées
      for (const z of [0.81, -0.81]) {
        o.boite(1.6, 0.6, 0.04, PAL.rougeGrange, -1.3, o.haut + 0.45, z);
        o.boite(0.9, 0.06, 0.04, PAL.chrome, -1.3, o.haut + 0.45, z * 1.02, { rz: 0.5 });
      }
    },
  },
  monarque: {
    forme: 'berline',
    couleur: BLEU,
    // Le toit de vinyle
    detail: (o) => o.boite(2.25, 0.08, 1.66, PAL.pneu, -0.2, o.toit + 0.02, 0),
  },
  decapotable: {
    forme: 'decapotable',
    couleur: ROUGE,
    detail: (o) => {
      // Pare-brise, bancs pis le toit plié en arrière
      o.boite(0.06, 0.5, 1.6, PAL.vitre, 0.6, o.haut + 0.25, 0, { rz: 0.3 });
      for (const x of [0, -0.9]) o.boite(0.5, 0.45, 1.5, PAL.declin, x, o.haut + 0.15, 0);
      o.boite(0.6, 0.3, 1.6, PAL.pneu, -1.6, o.haut + 0.12, 0);
    },
  },
  limo: {
    forme: 'limo',
    couleur: BLANC,
    // Une antenne de télé sur le coffre (c'était chic en 1985)
    detail: (o) => o.cyl(0.02, 0.9, PAL.chrome, -2.9, o.haut + 0.45, 0),
  },
  coupe: {
    forme: 'coupe',
    couleur: PAL.chrome,
    // Un spoiler en arrière, ça fait Montréal
    detail: (o) => {
      o.boite(0.4, 0.06, 1.7, NOIR, -o.L / 2 + 0.2, o.haut + 0.3, 0);
      for (const z of [-0.6, 0.6]) o.boite(0.08, 0.3, 0.08, NOIR, -o.L / 2 + 0.2, o.haut + 0.15, z);
    },
  },
  grandpapa: {
    forme: 'familiale',
    couleur: PAL.carrosserie,
    detail: (o) => {
      fauxBois(o);
      galerie(o, -0.6, 2.4, PAL.declin);
    },
  },

  // --- Les chars de muscle ---
  drag: {
    forme: 'muscle',
    couleur: MOUTARDE,
    detail: (o) => {
      // Une aile pis un gros moteur qui sort du capot
      o.boite(0.5, 0.06, 1.9, NOIR, -o.L / 2 + 0.2, o.haut + 0.6, 0);
      for (const z of [-0.8, 0.8]) o.boite(0.1, 0.6, 0.06, NOIR, -o.L / 2 + 0.2, o.haut + 0.3, z);
      o.boite(0.7, 0.4, 0.7, PAL.chrome, 1.3, o.haut + 0.2, 0);
    },
  },
  bolide: {
    forme: 'muscle',
    couleur: ROUGE,
    // La prise d'air sur le capot
    detail: (o) => o.boite(0.8, 0.18, 0.6, NOIR, 1.2, o.haut + 0.09, 0),
  },
  parade: {
    forme: 'muscle',
    couleur: BLANC,
    detail: (o) => {
      // Deux drapeaux bleus en arrière
      for (const z of [-0.7, 0.7]) {
        o.cyl(0.02, 1.2, PAL.chrome, -1.9, o.haut + 0.6, z);
        o.boite(0.5, 0.34, 0.02, PAL.bleu, -2.15, o.haut + 1.0, z);
      }
    },
  },
  fusee: {
    forme: 'muscle',
    couleur: VERT,
    detail: (o) => {
      // De la paille pis des poules sur le toit
      o.boite(1.2, 0.12, 1.3, PAL.foin, -0.6, o.toit + 0.06, 0);
      for (const [x, z] of [[-0.9, 0.3], [-0.3, -0.3]]) {
        o.boite(0.24, 0.22, 0.18, BLANC, x, o.toit + 0.24, z);
        o.boite(0.06, 0.06, 0.06, ROUGE, x + 0.12, o.toit + 0.38, z);
      }
    },
  },
  requin: {
    forme: 'muscle',
    couleur: PAL.tole,
    // Un aileron de requin sur le toit
    detail: (o) => o.boite(0.6, 0.6, 0.06, PAL.tole, -0.9, o.toit + 0.25, 0, { rz: -0.5 }),
  },
  phenix: {
    forme: 'muscle',
    couleur: OR,
    detail: (o) => {
      // Un oiseau de feu sur le capot
      o.boite(0.9, 0.02, 0.2, ROUGE, 1.2, o.haut + 0.01, 0);
      for (const s of [-1, 1]) o.boite(0.7, 0.02, 0.18, ROUGE, 1.1, o.haut + 0.01, s * 0.3, { ry: s * 0.6 });
    },
  },

  // --- Les gros véhicules ---
  autobus: {
    forme: 'autobus',
    couleur: PAL.autobus,
    detail: (o) => {
      // Les bandes noires pis le stop qui sort tout seul
      for (const z of [0.91, -0.91]) o.boite(o.L, 0.1, 0.03, NOIR, 0, o.haut - 0.3, z);
      o.boite(0.06, 0.5, 0.5, ROUGE, 2.2, o.haut - 0.1, 1.15, { ry: Math.PI / 2 });
    },
  },
  motorise: {
    forme: 'motorise',
    couleur: BLANC,
    detail: (o) => {
      // Une bande brune pis le vélo attaché en arrière
      for (const z of [0.91, -0.91]) o.boite(o.L, 0.25, 0.03, PAL.carrosserie, 0, o.haut - 0.25, z);
      o.cyl(0.3, 0.04, PAL.pneu, -o.L / 2 - 0.15, o.haut + 0.1, 0.5, { rz: Math.PI / 2 });
      o.cyl(0.3, 0.04, PAL.pneu, -o.L / 2 - 0.15, o.haut + 0.1, -0.3, { rz: Math.PI / 2 });
    },
  },
  pompier: {
    forme: 'camion',
    couleur: ROUGE,
    detail: (o) => {
      // La grosse boîte, l'échelle sur le dessus pis le gyrophare
      o.boite(3.6, 1.0, 1.8, ROUGE, -0.9, o.haut + 0.5, 0);
      for (const z of [-0.4, 0.4]) o.boite(3.4, 0.06, 0.06, PAL.chrome, -0.9, o.haut + 1.1, z);
      for (let i = 0; i < 8; i++) o.boite(0.06, 0.06, 0.8, PAL.chrome, -2.4 + i * 0.42, o.haut + 1.1, 0);
      o.boite(0.3, 0.2, 0.3, PAL.lampe, 1.7, o.toit + 0.1, 0);
    },
  },
  depanneuse: {
    forme: 'camion',
    couleur: MOUTARDE,
    detail: (o) => {
      // Le bras de remorquage pis le crochet
      o.boite(2.4, 0.3, 1.6, PAL.pneu, -1.0, o.haut + 0.15, 0);
      o.boite(2.0, 0.18, 0.18, NOIR, -1.7, o.haut + 0.8, 0, { rz: 0.5 });
      o.boite(0.04, 0.6, 0.04, PAL.chrome, -2.6, o.haut + 0.9, 0);
    },
  },
  cantine: {
    forme: 'camion',
    couleur: BLANC,
    detail: (o) => {
      // La boîte avec son comptoir pis l'enseigne de patates
      o.boite(3.6, 1.2, 1.8, BLANC, -0.9, o.haut + 0.6, 0);
      o.boite(1.6, 0.5, 0.04, PAL.vitre, -0.9, o.haut + 0.8, 0.92);
      o.boite(1.8, 0.06, 0.3, ROUGE, -0.9, o.haut + 1.1, 1.05);
      o.boite(1.2, 0.4, 0.1, PAL.autobus, -0.9, o.haut + 1.5, 0);
    },
  },
  police: {
    forme: 'berline',
    couleur: NOIR,
    detail: (o) => {
      // Les portes blanches pis les gyrophares
      for (const z of [0.92, -0.92]) o.boite(1.6, o.haut * 0.6, 0.03, BLANC, -0.2, o.haut * 0.75, z);
      o.boite(0.25, 0.15, 0.3, ROUGE, -0.2, o.toit + 0.08, 0.35);
      o.boite(0.25, 0.15, 0.3, PAL.bleu, -0.2, o.toit + 0.08, -0.35);
    },
  },

  // --- Les légendes ---
  monstre: {
    forme: 'pickup',
    couleur: BLEU,
    roue: 1.0,
    // Des barres de toit pis des flammes
    detail: (o) => {
      o.boite(0.1, 0.1, 1.8, PAL.chrome, 0.5, o.toit + 0.2, 0);
      for (const z of [0.92, -0.92]) o.boite(1.4, 0.3, 0.03, 0xc0702a, 1.4, o.haut - 0.3, z);
    },
  },
  resurfaceuse: {
    forme: 'resurfaceuse',
    couleur: BLANC,
    detail: (o) => {
      // La bande bleue, le banc en haut pis la lame en arrière
      for (const z of [0.91, -0.91]) o.boite(o.L, 0.2, 0.03, PAL.bleu, 0, o.haut - 0.4, z);
      o.boite(0.5, 0.4, 0.6, PAL.pneu, 0.5, o.haut + 0.2, 0);
      o.boite(0.2, 0.3, 2.0, PAL.chrome, -o.L / 2 - 0.1, 0.4, 0);
    },
  },
  royale: {
    forme: 'berline',
    couleur: MOUTARDE,
    detail: (o) => {
      // Les gros ailerons en arrière
      for (const z of [0.82, -0.82]) {
        o.boite(1.1, 0.5, 0.1, MOUTARDE, -o.L / 2 + 0.45, o.haut + 0.25, z, { rz: -0.35 });
        o.boite(0.1, 0.16, 0.12, ROUGE, -o.L / 2 - 0.05, o.haut + 0.1, z);
      }
      for (const z of [0.92, -0.92]) o.boite(o.L * 0.9, 0.06, 0.03, PAL.chrome, 0, o.haut * 0.6, z);
    },
  },
  stockcar: {
    forme: 'coupe',
    couleur: BLANC,
    detail: (o) => {
      // Le numéro pis des bandes rouges
      for (const z of [0.92, -0.92]) {
        o.cyl(0.32, 0.03, NOIR, 0.1, o.haut * 0.7, z, { rx: Math.PI / 2 });
        o.boite(o.L, 0.12, 0.03, ROUGE, 0, o.haut - 0.1, z);
      }
    },
  },
  concept: {
    forme: 'coupe',
    couleur: VERT,
    detail: (o) => {
      // La bulle de vitre sur le dessus
      o.cyl(0.9, 0.06, PAL.vitre, -0.4, o.toit + 0.2, 0, { cone: true });
      o.boite(0.6, 0.3, 0.06, VERT, -o.L / 2 + 0.3, o.haut + 0.2, 0);
    },
  },
  formule: {
    forme: 'formule',
    couleur: ROUGE,
    detail: (o) => {
      // L'aile en avant pis l'aile en arrière
      o.boite(0.5, 0.06, 2.0, NOIR, o.L / 2 - 0.1, o.haut - 0.25, 0);
      o.boite(0.5, 0.06, 1.8, NOIR, -o.L / 2 + 0.2, o.haut + 0.5, 0);
      for (const z of [-0.6, 0.6]) o.boite(0.08, 0.5, 0.08, NOIR, -o.L / 2 + 0.2, o.haut + 0.25, z);
    },
  },
};

export interface Char3D {
  groupe: THREE.Group;
  /** Avancement du retapage, de 0 (acheté) à 1 (retapé) : la rouille part pièce par pièce. */
  setProgres(p: number): void;
  dispose(): void;
}

// Une petite texture 64×64 faite en code, en 4 cases de 32×32 : grain (tout le char), rouille, plaque, grille.
// Filtre « nearest » pour le look PS1. Une seule texture pour tous les chars.
const CASE = { grain: 0, rouille: 1, plaque: 2, grille: 3 } as const;
type Case = keyof typeof CASE;
let atlas: THREE.DataTexture | null = null;
function texture(): THREE.DataTexture {
  if (atlas) return atlas;
  const T = 64;
  const d = new Uint8Array(T * T * 4);
  let graine = 418;
  const hasard = () => ((graine = (graine * 16807) % 2147483647) / 2147483647);
  // Un « 418 » en pixels de 3×5, pour la plaque.
  const CHIFFRES: Record<string, string[]> = { '4': ['101', '101', '111', '001', '001'], '1': ['010', '110', '010', '010', '111'], '8': ['111', '101', '111', '101', '111'] };
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const c = (y < 32 ? 0 : 2) + (x < 32 ? 0 : 1);
      const u = x % 32;
      const v = 31 - (y % 32);
      let rgb: [number, number, number];
      if (c === 0) {
        const g = 225 + hasard() * 30;
        rgb = [g, g, g];
      } else if (c === 1) {
        const k = hasard();
        rgb = k < 0.25 ? [110, 60, 35] : k > 0.85 ? [190, 125, 75] : [160, 97, 58];
      } else if (c === 2) {
        rgb = [230, 226, 210];
        if (u === 0 || u === 31 || v === 6 || v === 25) rgb = [60, 74, 110];
        const i = Math.floor((u - 4) / 8);
        const ch = '418'[i];
        const px = (u - 4) % 8;
        const py = v - 12;
        if (ch && px < 6 && py >= 0 && py < 10 && CHIFFRES[ch][Math.floor(py / 2)][Math.floor(px / 2)] === '1') rgb = [60, 74, 110];
      } else rgb = v % 4 < 2 || u % 8 === 0 ? [40, 40, 38] : [215, 215, 205];
      d.set([...rgb, 255], (y * T + x) * 4);
    }
  atlas = new THREE.DataTexture(d, T, T);
  atlas.magFilter = THREE.NearestFilter;
  atlas.minFilter = THREE.NearestFilter;
  atlas.needsUpdate = true;
  return atlas;
}

const BLANC_PUR = 0xffffff;
const ROUGE_FEU = 0x8a2f26;

export function creerChar(id: string): Char3D {
  const m = MODELES[id];
  const f = FORMES[m.forme];
  // Chaque char est fait de dizaines de boîtes, mais on les fusionne en quelques objets :
  // sur un cell, c'est le nombre d'objets à dessiner qui coûte cher, pas les triangles.
  type Tas = THREE.BufferGeometry[];
  const fixe: Tas = [];
  const vitresTas: Tas = [];
  const rouilleTas: Tas = [];
  const finiTas: Tas = [];
  const brisTas: Tas = [];
  const tmp = new THREE.Object3D();
  const couleur = new THREE.Color();
  const poser = (
    tas: Tas,
    geo: THREE.BufferGeometry,
    c: number,
    x: number,
    y: number,
    z: number,
    o: { rx?: number; ry?: number; rz?: number } = {},
    kase: Case = 'grain',
  ) => {
    tmp.position.set(x, y, z);
    tmp.rotation.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0);
    tmp.updateMatrix();
    geo.applyMatrix4(tmp.matrix);
    couleur.setHex(c);
    const n = geo.attributes.position.count;
    geo.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: n }, () => couleur.toArray()).flat(), 3));
    // Chaque morceau prend sa case dans la texture.
    const uv = geo.attributes.uv;
    const k = CASE[kase];
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (k % 2) * 0.5 + uv.getX(i) * 0.5, (k < 2 ? 0 : 0.5) + uv.getY(i) * 0.5);
    tas.push(geo);
  };
  const boite = (tas: Tas, w: number, h: number, d: number, c: number, x: number, y: number, z: number, o?: { rx?: number; ry?: number; rz?: number }, kase?: Case) =>
    poser(tas, new THREE.BoxGeometry(w, h, d), c, x, y, z, o, kase);
  const cyl = (tas: Tas, r: number, h: number, c: number, x: number, y: number, z: number, o?: { rx?: number; ry?: number; rz?: number }, seg = 8) =>
    poser(tas, new THREE.CylinderGeometry(r, r, h, seg), c, x, y, z, o);

  const r = m.roue ?? f.r;
  const bas = r * 0.95;
  const haut = bas + f.h;
  const [cabL, cabX, cabH] = f.cab;
  const L = f.L;
  const outils: Outils = {
    haut,
    L,
    toit: haut + cabH + 0.06,
    boite: (w, h, d, c, x, y, z, o) => boite(fixe, w, h, d, c, x, y, z, o),
    cyl: (r, h, c, x, y, z, o = {}) => poser(fixe, o.cone ? new THREE.ConeGeometry(r, h, 6) : new THREE.CylinderGeometry(r, r, h, 8), c, x, y, z, o),
  };

  // La caisse
  boite(fixe, L, f.h, 1.8, m.couleur, 0, bas + f.h / 2, 0);
  // Le bas de caisse plus foncé, pis les ailes au-dessus des roues
  boite(fixe, L * 0.96, 0.12, 1.84, PAL.pneu, 0, bas + 0.06, 0);
  const ex = L / 2 - 0.85;
  for (const x of [ex, -ex]) for (const z of [0.9, -0.9]) boite(fixe, r * 2.3, 0.1, 0.12, m.couleur, x, Math.max(bas + 0.14, 2 * r * 0.98), z);

  // La cabine : des montants, le toit, des vitres qu'on voit au travers, pis l'intérieur.
  if (cabL) {
    const avant = cabX + cabL / 2;
    const arriere = cabX - cabL / 2;
    for (const x of [avant - 0.05, arriere + 0.05]) for (const z of [0.76, -0.76]) boite(fixe, 0.1, cabH, 0.08, m.couleur, x, haut + cabH / 2, z);
    if (cabL > 2.4) for (const z of [0.76, -0.76]) boite(fixe, 0.1, cabH, 0.08, m.couleur, cabX, haut + cabH / 2, z);
    boite(fixe, cabL + 0.1, 0.12, 1.7, m.couleur, cabX, haut + cabH, 0);
    boite(vitresTas, cabL - 0.1, cabH - 0.06, 1.5, PAL.vitre, cabX, haut + cabH / 2, 0);
    // Les miroirs
    for (const z of [0.95, -0.95]) boite(fixe, 0.1, 0.12, 0.16, PAL.chrome, avant - 0.1, haut + 0.12, z);
    // Le dash, le volant pis les bancs (avant, pis arrière si ça rentre)
    boite(fixe, 0.25, 0.18, 1.4, PAL.pneu, avant - 0.2, haut + 0.1, 0);
    poser(fixe, new THREE.TorusGeometry(0.15, 0.03, 4, 10), PAL.pneu, avant - 0.42, haut + 0.25, 0.35, { ry: Math.PI / 2, rz: 0.4 });
    const banc = (x: number) => {
      boite(fixe, 0.4, 0.14, 1.36, PAL.declin, x, haut + 0.07, 0);
      boite(fixe, 0.1, 0.4, 1.36, PAL.declin, x - 0.2, haut + 0.25, 0);
    };
    banc(avant - 0.8);
    if (cabL > 1.8) banc(avant - 1.6);
  }

  // Le devant : grille, phares ronds, plaque. L'arrière : feux pis plaque.
  boite(fixe, 0.06, Math.min(0.3, f.h * 0.45), 1.0, PAL.chrome, L / 2 + 0.02, haut - f.h * 0.35, 0, undefined, 'grille');
  for (const z of [0.68, -0.68]) {
    cyl(fixe, 0.13, 0.06, PAL.chrome, L / 2 + 0.02, haut - f.h * 0.3, z, { rz: Math.PI / 2 });
    cyl(fixe, 0.1, 0.08, PAL.declin, L / 2 + 0.03, haut - f.h * 0.3, z, { rz: Math.PI / 2 });
    boite(fixe, 0.05, 0.14, 0.24, ROUGE_FEU, -L / 2 - 0.01, haut - 0.2, z);
  }
  for (const s of [-1, 1]) {
    boite(fixe, 0.2, 0.25, 1.9, PAL.chrome, s * (L / 2 + 0.05), bas + 0.15, 0);
    boite(fixe, 0.03, 0.16, 0.4, BLANC_PUR, s * (L / 2 + 0.16), bas + 0.17, 0, undefined, 'plaque');
  }

  // Les portes : des joints foncés pis des poignées chromées.
  if (cabL) {
    const portes = cabL > 2.4 ? [cabX + cabL / 2 - 0.1, cabX, cabX - cabL / 2 + 0.1] : [cabX + cabL / 2 - 0.1, cabX - cabL / 2 + 0.1];
    for (const z of [0.91, -0.91]) {
      for (const x of portes) boite(fixe, 0.03, f.h * 0.8, 0.02, PAL.pneu, x, bas + f.h * 0.5, z);
      for (const x of portes.slice(0, -1)) boite(fixe, 0.16, 0.05, 0.04, PAL.chrome, x - 0.3, haut - 0.15, z * 1.01);
    }
  }
  m.detail?.(outils);

  // Le capot ouvert pis le moteur à l'air tant que c'est pas retapé (si y'a un capot en avant de la cabine).
  const capot = L / 2 - (cabX + cabL / 2);
  if (cabL && capot > 0.8) {
    const cx = cabX + cabL / 2 + capot / 2;
    boite(brisTas, capot * 0.7, 0.3, 1.0, PAL.tole, cx, haut + 0.15, 0);
    for (let i = 0; i < 4; i++) cyl(brisTas, 0.08, 0.2, PAL.pneu, cx - capot * 0.25 + i * capot * 0.17, haut + 0.38, 0.25);
    boite(brisTas, 0.3, 0.12, 0.3, PAL.chrome, cx, haut + 0.36, -0.3);
    // Le capot pivote sur sa charnière au pare-brise, le devant levé.
    const a = 0.7;
    boite(brisTas, capot, 0.05, 1.7, m.couleur, cabX + cabL / 2 + (capot / 2) * Math.cos(a), haut + (capot / 2) * Math.sin(a), 0, { rz: a });
  }

  // La rouille : 6 plaques qui partent une à une à chaque pièce posée.
  const plaques: [number, number, number, number, number, number][] = [
    [0.8, f.h * 0.5, 0.04, L * 0.25, bas + f.h * 0.4, 0.93],
    [0.6, f.h * 0.4, 0.04, -L * 0.3, bas + f.h * 0.55, -0.93],
    [0.6, 0.04, 0.5, L * 0.3, haut + 0.02, -0.3],
    [0.5, f.h * 0.4, 0.04, -L * 0.3, bas + f.h * 0.55, 0.93],
    [0.04, f.h * 0.4, 0.6, -L / 2 - 0.02, bas + f.h * 0.5, 0.3],
    [0.7, f.h * 0.35, 0.04, L * 0.1, bas + f.h * 0.35, -0.93],
  ];
  for (const [w, h, d, x, y, z] of plaques) boite(rouilleTas, w, h, d, BLANC_PUR, x, y, z, undefined, 'rouille');

  // Roues avec jantes, ou des blocs de béton tant que c'est pas retapé.
  for (const [x, z] of [[ex, 0.9], [ex, -0.9], [-ex, 0.9], [-ex, -0.9]]) {
    cyl(finiTas, r, 0.32, PAL.pneu, x, r, z, { rx: Math.PI / 2 }, 10);
    cyl(finiTas, r * 0.55, 0.34, PAL.chrome, x, r, z, { rx: Math.PI / 2 }, 8);
    cyl(finiTas, r * 0.18, 0.36, PAL.pneu, x, r, z, { rx: Math.PI / 2 }, 6);
    // Deux blocs de béton gris empilés, cachés sous la caisse.
    boite(brisTas, 0.4, bas / 2, 0.3, PAL.tole, x, bas / 4, z * 0.6);
    boite(brisTas, 0.4, bas / 2, 0.3, PAL.tole, x, (bas * 3) / 4, z * 0.6, { ry: 0.3 });
  }
  // Une vieille roue couchée à côté du char.
  cyl(brisTas, r, 0.3, PAL.pneu, ex + r * 0.6, 0.15, 1.2 + r);

  const mat = new THREE.MeshPhongMaterial({ vertexColors: true, map: texture(), flatShading: true, shininess: 0, specular: 0x000000 });
  const verre = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, transparent: true, opacity: 0.45, shininess: 30 });
  const fondre = (tas: Tas, mt = mat) => {
    const geo = mergeGeometries(tas)!;
    tas.forEach((g) => g.dispose());
    return new THREE.Mesh(geo, mt);
  };
  const groupe = new THREE.Group();
  const caisse = new THREE.Group();
  const rouille = fondre(rouilleTas);
  const fini = fondre(finiTas);
  const bris = fondre(brisTas);
  caisse.add(fondre(fixe), rouille, bris);
  if (vitresTas.length) caisse.add(fondre(vitresTas, verre));
  groupe.add(caisse, fini);
  // Chaque plaque de rouille est une boîte : 36 indices.
  const parPlaque = rouille.geometry.index!.count / plaques.length;

  return {
    groupe,
    setProgres(p) {
      const finiOk = p >= 1;
      fini.visible = finiOk;
      bris.visible = !finiOk;
      rouille.geometry.setDrawRange(0, Math.round((1 - p) * plaques.length) * parPlaque);
      rouille.visible = !finiOk;
      // Pas retapé : la caisse penche un peu, comme un vieux char abandonné.
      caisse.rotation.x = finiOk ? 0 : 0.04;
      // Les blocs sont dans « bris » avec le capot : la caisse tient dessus.
    },
    dispose() {
      groupe.traverse((o) => o instanceof THREE.Mesh && o.geometry.dispose());
      mat.dispose();
      verre.dispose();
    },
  };
}
