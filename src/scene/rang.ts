import * as THREE from 'three';
import type { BuildingId } from '../game/buildings';
import type { FeteId } from '../game/fetes';
import type { MeteoId } from '../game/temps';
import { creerBazou, type ChoixLook } from './bazou';

// Palette Bazou VHS (voir le guide de style). Rien en dehors de ça.
export const PAL = {
  herbe: 0x6b7046,
  herbeSombre: 0x50573c,
  champ: 0x8a835a,
  sapin: 0x2e3b2c,
  erables: [0x9a5a34, 0xa47a3c, 0x7d4630],
  tronc: 0x4a3a2c,
  declin: 0xbfb7a4,
  tole: 0x5d5f60,
  brique: 0x6e4a3e,
  rougeGrange: 0x6e2f28,
  bois: 0x7a6650,
  gravier: 0x8c8170,
  poteau: 0x4f463c,
  carrosserie: 0x7d4a2e,
  rouille: 0xa0613a,
  chrome: 0x7f7f78,
  pneu: 0x1c1c1a,
  vitre: 0x1f2526,
  neige: 0xcfd0c8,
  neigeOmbre: 0xa9aca3,
  boue: 0x5f6342,
  foin: 0x7d7448,
  // Le bleu du drapeau, juste pour la Saint-Jean
  bleu: 0x3c4a6e,
  // Les fenêtres pis l'enseigne allumées du bar : pas d'ombrage, ça luit dans la brunante.
  lampe: 0xe8c26a,
  // Les feuilles du printemps pis de l'été, le sapin enneigé, la pluie
  bourgeons: [0x8a9a56, 0x7d8c4a, 0x97a462],
  feuilles: [0x4f6a36, 0x5e7a3e, 0x46602f],
  sapinNeige: 0x6f7d72,
  pluie: 0xb4c2c8,
  // Le jaune de l'autobus scolaire
  autobus: 0xc9a23c,
} as const;

export type SaisonId = 'printemps' | 'ete' | 'automne' | 'hiver';
// Le sol pis les buissons changent de couleur avec la saison.
const SOL: Record<SaisonId, [number, number]> = {
  printemps: [PAL.boue, PAL.herbeSombre],
  ete: [PAL.herbe, PAL.herbeSombre],
  automne: [PAL.foin, PAL.herbeSombre],
  hiver: [PAL.neige, PAL.neigeOmbre],
};

// Chaque saison a sa lumière pis ses arbres.
interface LookSaison {
  ciel: number;
  lumiere: number;
  soleil: number;
  force: number;
  brume: number;
  /** La couleur des érables (null : y'a pus de feuilles). */
  erables: readonly number[] | null;
  sapin: number;
}
const LOOK_SAISON: Record<SaisonId, LookSaison> = {
  // Gris-vert mouillé, bourgeons pis pluie
  printemps: {
    ciel: 0x98a4a2, lumiere: 0xd0dccc, soleil: 0xdde4d6, force: 0.85, brume: 0.7,
    erables: PAL.bourgeons, sapin: PAL.sapin,
  },
  // Grand ciel bleu, gros soleil, feuilles ben vertes
  ete: {
    ciel: 0x9db8c8, lumiere: 0xf4ecd0, soleil: 0xfff2c8, force: 1.2, brume: 1.3,
    erables: PAL.feuilles, sapin: PAL.sapin,
  },
  // Lumière dorée pis les feuilles qui revolent
  automne: {
    ciel: 0xc49a6a, lumiere: 0xf0c890, soleil: 0xffb870, force: 1, brume: 1,
    erables: PAL.erables, sapin: PAL.sapin,
  },
  // Blanc bleuté, arbres nus, sapins enneigés pis la neige qui tombe
  hiver: {
    ciel: 0xc8d0d8, lumiere: 0xe4ecf4, soleil: 0xdce6f0, force: 1.1, brume: 0.75,
    erables: null, sapin: PAL.sapinNeige,
  },
};
// La saison passe par-dessus la teinte de l'endroit, assez pour qu'on la voie partout.
const MELANGE_SAISON = 0.45;

// La météo assombrit ou éclaircit, pis brasse les arbres.
const LOOK_METEO: Record<MeteoId, Ambiance & { vent: number }> = {
  beau: { ciel: 0, lumiere: 0, soleil: 0, force: 1, brume: 1, vent: 0.025 },
  pluie: { ciel: 0x7e8a8e, lumiere: 0xb8c2c4, soleil: 0xb8c0c4, force: 0.7, brume: 0.65, vent: 0.045 },
  neige: { ciel: 0xc4ccd4, lumiere: 0xdde4ec, soleil: 0xd4dce4, force: 0.85, brume: 0.7, vent: 0.04 },
  vent: { ciel: 0xa8b0b0, lumiere: 0xdde0d8, soleil: 0xe8e8e0, force: 1, brume: 1.1, vent: 0.1 },
  brouillard: { ciel: 0xb0b4b0, lumiere: 0xd0d4cc, soleil: 0xc8ccc4, force: 0.85, brume: 0.4, vent: 0.015 },
};
const MELANGE_METEO = 0.6;

// Ce qui tombe du ciel, selon la saison pis la météo.
interface Tombe {
  couleurs: readonly number[];
  nb: number;
  taille: number;
  vitesse: number;
  vent: number;
}
function quiTombe(s: SaisonId, m: MeteoId): Tombe | null {
  const neige = (nb: number, vent: number): Tombe => ({ couleurs: [PAL.neige], nb, taille: 0.22, vitesse: 1.6, vent });
  const feuilles = (nb: number, vent: number): Tombe => ({ couleurs: PAL.erables, nb, taille: 0.26, vitesse: 1.2, vent });
  if (m === 'pluie') return { couleurs: [PAL.pluie], nb: 500, taille: 0.16, vitesse: 16, vent: 0.3 };
  if (m === 'neige') return neige(500, 0.6);
  if (m === 'vent') return s === 'hiver' ? neige(350, 6) : s === 'automne' ? feuilles(300, 6) : null;
  if (m === 'beau') return s === 'hiver' ? neige(100, 0.5) : s === 'automne' ? feuilles(120, 1.4) : null;
  return null;
}

// La nuit : bleu foncé, pis l'orange du lever pis du coucher de soleil.
const NUIT = { ciel: 0x1c2232, lumiere: 0x3c4862 };
const AUBE = { ciel: 0xc8805a, soleil: 0xff8a4a };

// Ambiance : le rang est gris pis brumeux au début, il se réchauffe avec la progression.
const DEBUT = {
  ciel: new THREE.Color(0x9ea6a2),
  brume: [12, 42],
  hemiCiel: new THREE.Color(0xd6dcd4),
  hemiSol: new THREE.Color(0x4a4636),
  hemiForce: 0.85,
  soleil: new THREE.Color(0xe6e1d2),
  soleilForce: 0.45,
  soleilPos: new THREE.Vector3(-6, 10, 8),
};
const TARD = {
  ciel: new THREE.Color(0xb89a78),
  brume: [14, 48],
  hemiCiel: new THREE.Color(0xf0d9b8),
  hemiSol: new THREE.Color(0x4a3f30),
  hemiForce: 0.8,
  soleil: new THREE.Color(0xffc98a),
  soleilForce: 0.75,
  soleilPos: new THREE.Vector3(-12, 7, 10),
};

// Chaque endroit a sa lumière, mélangée par-dessus la progression du rang (la maison garde celle du rang).
interface Ambiance {
  ciel: number;
  lumiere: number;
  soleil: number;
  /** Multiplie la force des lumières. */
  force: number;
  /** Multiplie la distance de la brume (petit = plus épais). */
  brume: number;
}
const MELANGE = 0.65;
const AMBIANCE: Partial<Record<Lieu, Ambiance>> = {
  // Après-midi jaune paille sur la galerie
  magasin: { ciel: 0xc4b68c, lumiere: 0xf2e2b0, soleil: 0xffd890, force: 1.1, brume: 1.1 },
  // Gris-vert d'huile pis de néon
  garage: { ciel: 0x7f8a84, lumiere: 0xbcc8bc, soleil: 0xd0dccc, force: 0.85, brume: 0.9 },
  // Matin froid de mars dans l'érablière, brume épaisse
  cabane: { ciel: 0xa7b2b4, lumiere: 0xdce6ea, soleil: 0xeef2f0, force: 0.95, brume: 0.7 },
  // Grand ciel clair pour faire briller les chars
  concession: { ciel: 0x9fb0b8, lumiere: 0xe0e8ec, soleil: 0xfff0d0, force: 1.15, brume: 1.3 },
  // Brunante mauve, soleil orange bas
  bar: { ciel: 0x4a3b4c, lumiere: 0x8a7088, soleil: 0xff9a5a, force: 0.6, brume: 0.85 },
  // Blanc bleuté de patinoire
  arena: { ciel: 0xb4bcc4, lumiere: 0xe8eef4, soleil: 0xdfe8f0, force: 1.0, brume: 1.0 },
};

// Le cadrage de chaque endroit, par rapport à son origine : d'où on regarde, ce qu'on vise, l'angle.
interface Cadrage {
  pos: [number, number, number];
  vise: [number, number, number];
  fov: number;
}
const CADRAGE: Record<Lieu, Cadrage> = {
  // Trois quarts, comme une photo de la maison
  maison: { pos: [11, 8.5, 21], vise: [1.2, 2.4, 0], fov: 40 },
  // De face, à hauteur de galerie, comme si on traversait la rue
  magasin: { pos: [1.5, 2.3, 13], vise: [0.5, 2.6, 0], fov: 46 },
  // Bas pis de côté, le bazou devant la porte du garage
  garage: { pos: [10, 2.6, 12.5], vise: [-1.5, 1.8, 0], fov: 44 },
  // Basse, entre les érables
  cabane: { pos: [3, 2.2, 14], vise: [-1, 2.8, -1], fov: 50 },
  // Plongée sur le lot, comme du haut de la pancarte
  concession: { pos: [3, 17, 15], vise: [0, 0, 0.5], fov: 44 },
  // Serré, au ras du stationnement
  bar: { pos: [8, 2, 11], vise: [-1, 2.4, 0], fov: 42 },
  // Contre-plongée grand angle : l'aréna a l'air immense
  arena: { pos: [3, 0.9, 10.5], vise: [0, 3.6, -3], fov: 58 },
};

export interface CarLook {
  /** Les endroits achetés (garage, cabane, lot, bar, aréna). */
  lieux: Record<BuildingId, boolean>;
  owned: boolean;
  wheels: boolean;
  clean: boolean;
  /** Le bazou roule : il te suit d'un endroit à l'autre pis part livrer. */
  runs: boolean;
  /** Le look posé (voir game/look.ts). */
  look: ChoixLook;
}

export type Lieu = 'maison' | 'magasin' | BuildingId;

export interface Rang {
  setCar(look: CarLook): void;
  /** Change d'endroit : le bazou part, coupure VHS, pis il arrive plus loin. */
  allerA(lieu: Lieu): void;
  /** 0 = début (gris), 1 = plus tard (chaud). */
  setWarmth(w: number): void;
  setSaison(s: SaisonId): void;
  /** L'heure du jeu (0 à 24) pis la météo. */
  setTemps(heure: number, meteo: MeteoId): void;
  /** Le décor de la fête (null : pas de fête). */
  setFete(f: FeteId | null): void;
  setPixelScale(scale: number): void;
  dispose(): void;
}

// Chaque endroit est sa propre scène, loin sur le même rang : la brume cache les autres.
const ORIGINE: Record<Lieu, number> = {
  maison: 0,
  magasin: 150,
  garage: 300,
  concession: 450,
  cabane: 600,
  bar: 750,
  arena: 900,
};
// Où le bazou se stationne, par rapport à l'origine de l'endroit (face à la route).
const STATIONNEMENT = { x: 4.6, z: 2.4, ry: -0.55 };
const ROUTE_Z = 6.4;

export function createRang(
  host: HTMLElement,
  opts: {
    pixelScale?: number;
    reduceMotion?: boolean;
    /** Pour les sons : le bazou part, ou la coupure VHS. */
    onTrajet?: (e: 'depart' | 'coupe') => void;
  } = {},
): Rang | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
  } catch {
    return null; // pas de WebGL : le jeu marche pareil, sans le décor
  }
  renderer.setPixelRatio(1);
  renderer.domElement.className = 'rang-canvas';
  host.prepend(renderer.domElement);

  let pixelScale = opts.pixelScale ?? 3;
  const scene = new THREE.Scene();
  const ciel = DEBUT.ciel.clone();
  scene.background = ciel;
  const fog = new THREE.Fog(ciel, DEBUT.brume[0], DEBUT.brume[1]);
  scene.fog = fog;
  const hemi = new THREE.HemisphereLight(DEBUT.hemiCiel, DEBUT.hemiSol, DEBUT.hemiForce * Math.PI);
  scene.add(hemi);
  const soleil = new THREE.DirectionalLight(DEBUT.soleil, DEBUT.soleilForce * Math.PI);
  soleil.position.copy(DEBUT.soleilPos);
  scene.add(soleil);

  const mats = new Map<number, THREE.Material>();
  const M = (c: number) => {
    let m = mats.get(c);
    if (!m) {
      m =
        c === PAL.lampe
          ? new THREE.MeshBasicMaterial({ color: c })
          : new THREE.MeshPhongMaterial({ color: c, flatShading: true, shininess: 0, specular: 0x000000 });
      mats.set(c, m);
    }
    return m;
  };
  const geos: THREE.BufferGeometry[] = [];
  const G = <T extends THREE.BufferGeometry>(g: T) => (geos.push(g), g);
  const B = (w: number, h: number, d: number) => G(new THREE.BoxGeometry(w, h, d));
  const part = (
    parent: THREE.Object3D,
    geo: THREE.BufferGeometry,
    c: number,
    x: number,
    y: number,
    z: number,
    o: { rx?: number; ry?: number; rz?: number; s?: [number, number, number] } = {},
  ) => {
    const m = new THREE.Mesh(geo, M(c));
    m.position.set(x, y, z);
    m.rotation.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0);
    if (o.s) m.scale.set(...o.s);
    parent.add(m);
    return m;
  };
  const plan = (w: number, d: number, c: number, x: number, y: number, z: number) =>
    part(scene, G(new THREE.PlaneGeometry(w, d)), c, x, y, z, { rx: -Math.PI / 2 });

  // Les enseignes : du texte peint dans une petite texture, en VT323 une fois la police chargée.
  const enseignes: { tex: THREE.CanvasTexture; mat: THREE.Material; dessiner: () => void }[] = [];
  const hexCss = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
  const enseigne = (
    parent: THREE.Object3D,
    texte: string,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    o: { fond?: number; encre?: number; allumee?: boolean; ry?: number } = {},
  ) => {
    const canvas = document.createElement('canvas');
    canvas.height = 32;
    canvas.width = Math.round((32 * w) / h);
    const ctx = canvas.getContext('2d');
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    const dessiner = () => {
      if (!ctx) return;
      ctx.fillStyle = hexCss(o.fond ?? PAL.declin);
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = hexCss(o.encre ?? PAL.rougeGrange);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let taille = 28;
      do ctx.font = `${taille--}px VT323, monospace`;
      while (ctx.measureText(texte).width > canvas.width - 6 && taille > 8);
      ctx.fillText(texte, canvas.width / 2, canvas.height / 2 + 1);
      tex.needsUpdate = true;
    };
    dessiner();
    const mat = o.allumee
      ? new THREE.MeshBasicMaterial({ map: tex })
      : new THREE.MeshPhongMaterial({ map: tex, flatShading: true, shininess: 0, specular: 0x000000 });
    enseignes.push({ tex, mat, dessiner });
    const m = new THREE.Mesh(G(new THREE.PlaneGeometry(w, h)), mat);
    m.position.set(x, y, z);
    m.rotation.y = o.ry ?? 0;
    parent.add(m);
    return m;
  };
  document.fonts?.load('28px VT323').then(() => enseignes.forEach((e) => e.dessiner()), () => {});

  // Sol pis route : une longue bande pour tous les endroits.
  plan(1300, 160, PAL.herbe, 450, 0, 0);
  plan(1300, 3.8, PAL.gravier, 450, 0.02, ROUTE_Z);
  plan(30, 14, PAL.champ, -6, 0.01, -14);

  // Décor commun à chaque endroit : collines, arbres, poteaux d'Hydro.
  const arbres: THREE.Group[] = [];
  // Les feuilles ont leurs propres matériaux : elles changent avec la saison sans toucher au reste.
  const feuillage = PAL.erables.map(
    (c) => new THREE.MeshPhongMaterial({ color: c, flatShading: true, shininess: 0, specular: 0x000000 }),
  );
  const cimes: THREE.Mesh[] = [];
  const tronc = G(new THREE.CylinderGeometry(0.18, 0.25, 2.2, 6));
  const troncSapin = G(new THREE.CylinderGeometry(0.15, 0.2, 1, 6));
  const sapinBas = G(new THREE.ConeGeometry(1.4, 2.6, 6));
  const sapinHaut = G(new THREE.ConeGeometry(1.0, 2.0, 6));
  const filMat = new THREE.LineBasicMaterial({ color: 0x2a2622 });
  const decor = (ox: number, erables: number[][], sapins: number[][]) => {
    for (const [x, z, r] of [
      [-26, -38, 16],
      [6, -44, 20],
      [34, -36, 15],
    ]) {
      part(scene, G(new THREE.IcosahedronGeometry(r, 1)), PAL.herbeSombre, ox + x, 0, z, { s: [1, 0.32, 1] });
    }
    erables.forEach(([x, z, r], i) => {
      const t = new THREE.Group();
      t.position.set(ox + x, 0, z);
      scene.add(t);
      part(t, tronc, PAL.tronc, 0, 1.1, 0);
      const cime = new THREE.Mesh(G(new THREE.IcosahedronGeometry(r, 0)), feuillage[i % 3]);
      cime.position.set(0, 2.4 + r * 0.6, 0);
      t.add(cime);
      cimes.push(cime);
      arbres.push(t);
    });
    for (const [x, z] of sapins) {
      const t = new THREE.Group();
      t.position.set(ox + x, 0, z);
      scene.add(t);
      part(t, troncSapin, PAL.tronc, 0, 0.5, 0);
      part(t, sapinBas, PAL.sapin, 0, 2.0, 0);
      part(t, sapinHaut, PAL.sapin, 0, 3.3, 0);
      arbres.push(t);
    }
    const poteaux = [ox - 16, ox - 2, ox + 12];
    for (const x of poteaux) {
      part(scene, G(new THREE.CylinderGeometry(0.12, 0.14, 6.5, 6)), PAL.poteau, x, 3.25, 8.8);
      part(scene, B(1.8, 0.12, 0.12), PAL.poteau, x, 6.2, 8.8);
    }
    for (const dx of [-0.8, 0.8]) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < poteaux.length - 1; i++) {
        for (let k = 0; k <= 12; k++) {
          const t = k / 12;
          const x = poteaux[i] + (poteaux[i + 1] - poteaux[i]) * t;
          pts.push(new THREE.Vector3(x + dx, 6.25 - Math.sin(Math.PI * t) * 0.6, 8.8));
        }
      }
      scene.add(new THREE.Line(G(new THREE.BufferGeometry().setFromPoints(pts)), filMat));
    }
  };
  decor(
    ORIGINE.maison,
    [
      [-7, -5, 1.5],
      [-5.5, -8, 1.8],
      [3.5, -7, 1.6],
      [7, -4, 1.3],
      [-11.5, -1, 1.4],
    ],
    [
      [-12, -9],
      [10, -9],
      [12, -2],
      [-14, -3],
      [0, -11],
    ],
  );
  const decorAilleurs = (ox: number) =>
    decor(
      ox,
      [
        [-9, -6, 1.6],
        [6.5, -7, 1.5],
        [-12, 0, 1.3],
      ],
      [
        [-13, -9],
        [11, -8],
        [13, -1],
        [2, -12],
      ],
    );
  decorAilleurs(ORIGINE.magasin);
  decorAilleurs(ORIGINE.garage);
  decorAilleurs(ORIGINE.concession);
  // La cabane est dans une érablière : des érables partout.
  decor(
    ORIGINE.cabane,
    [
      [-9, -6, 1.6],
      [-6, -10, 1.8],
      [6.5, -7, 1.5],
      [9.5, -3, 1.4],
      [-12, 0, 1.3],
      [-8, 4, 1.2],
      [11, 3.5, 1.3],
      [2, -11, 1.7],
      [-14, -6, 1.5],
    ],
    [[13, -9]],
  );
  decorAilleurs(ORIGINE.bar);
  decorAilleurs(ORIGINE.arena);

  // Maison de rang
  const maison = new THREE.Group();
  maison.position.set(-1.2, 0, -2);
  scene.add(maison);
  part(maison, B(6, 3.2, 4.6), PAL.declin, 0, 1.6, 0);
  const tri = new THREE.Shape();
  tri.moveTo(-3, 0);
  tri.lineTo(3, 0);
  tri.lineTo(0, 2.2);
  tri.lineTo(-3, 0);
  const pignon = G(new THREE.ExtrudeGeometry(tri, { depth: 4.6, bevelEnabled: false }));
  pignon.translate(0, 0, -2.3);
  part(maison, pignon, PAL.declin, 0, 3.2, 0);
  const pente = Math.atan2(2.4, 3.4);
  part(maison, B(4.35, 0.18, 5.2), PAL.tole, -1.68, 4.45, 0, { rz: pente });
  part(maison, B(4.35, 0.18, 5.2), PAL.tole, 1.68, 4.45, 0, { rz: -pente });
  part(maison, B(0.6, 1.8, 0.6), PAL.brique, 1.7, 4.9, -0.9);
  part(maison, B(1, 2, 0.12), PAL.rougeGrange, 0, 1.05, 2.33);
  for (const x of [-1.85, 1.85]) {
    part(maison, B(1.2, 1.2, 0.1), PAL.rougeGrange, x, 1.95, 2.32);
    part(maison, B(0.95, 0.95, 0.12), PAL.vitre, x, 1.95, 2.34);
  }
  part(maison, B(0.8, 0.8, 0.12), PAL.vitre, 0, 4.0, 2.33);
  // Les lumières de la maison s'allument le soir.
  const fenetres = new THREE.Group();
  maison.add(fenetres);
  for (const x of [-1.85, 1.85]) part(fenetres, B(0.95, 0.95, 0.12), PAL.lampe, x, 1.95, 2.36);
  part(fenetres, B(0.8, 0.8, 0.12), PAL.lampe, 0, 4.0, 2.35);
  fenetres.visible = false;
  part(maison, B(6.4, 0.25, 1.7), PAL.bois, 0, 0.18, 3.2);
  for (const x of [-3, 3]) part(maison, G(new THREE.CylinderGeometry(0.1, 0.1, 2.7, 6)), PAL.declin, x, 1.55, 3.9);
  part(maison, B(6.6, 0.15, 2), PAL.tole, 0, 2.95, 3.3, { rx: 0.12 });
  plan(3.2, 5, PAL.gravier, 4.6, 0.02, 2.6);

  // Le bazou (à vendre pour l'instant : c'est l'objectif)
  const leBazou = creerBazou();
  const bazou = leBazou.groupe;
  const carrosserie = leBazou.carrosserie;
  bazou.position.set(STATIONNEMENT.x, 0, STATIONNEMENT.z);
  bazou.rotation.y = STATIONNEMENT.ry;
  scene.add(bazou);

  // Pancarte « à vendre » du bonhomme Gagnon
  const pancarte = new THREE.Group();
  pancarte.position.set(7.4, 0, 4.2);
  pancarte.rotation.y = -0.3;
  scene.add(pancarte);
  part(pancarte, G(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 5)), PAL.bois, 0, 0.65, 0);
  part(pancarte, B(1.1, 0.6, 0.06), PAL.declin, 0, 1.4, 0);
  part(pancarte, B(0.8, 0.14, 0.07), PAL.rougeGrange, 0, 1.48, 0);
  part(pancarte, B(0.6, 0.1, 0.07), PAL.rougeGrange, 0, 1.28, 0);

  // Pile de pneus, boîte à malle, botte de foin
  const pneu = G(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8));
  const pilePneus: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) pilePneus.push(part(scene, pneu, PAL.pneu, 8.2, 0.15 + i * 0.3, 0.4));
  part(scene, G(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 5)), PAL.bois, -3.4, 0.55, 4.3);
  part(scene, B(0.45, 0.4, 0.7), PAL.chrome, -3.4, 1.25, 4.3);
  part(scene, B(0.06, 0.3, 0.06), PAL.tole, -3.15, 1.5, 4.45);
  part(scene, G(new THREE.CylinderGeometry(0.65, 0.65, 1.1, 10)), PAL.champ, -9, 0.65, -6, { rz: Math.PI / 2 });
  // La pancarte de bois à l'entrée de la cour
  const pancarteMaison = new THREE.Group();
  pancarteMaison.position.set(-0.6, 0, 5);
  pancarteMaison.rotation.y = 0.45;
  scene.add(pancarteMaison);
  for (const x of [-1.9, 1.9]) part(pancarteMaison, G(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 5)), PAL.tronc, x, 1.1, 0);
  part(pancarteMaison, B(4.2, 1.2, 0.08), PAL.tronc, 0, 1.7, 0);
  enseigne(pancarteMaison, 'CHEZ NOUS', 4, 1.05, 0, 1.7, 0.05, { fond: PAL.tronc, encre: PAL.declin });

  const roue = G(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 8));
  const miniChar = (parent: THREE.Object3D, c: number, x: number, z: number, ry: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    parent.add(g);
    part(g, B(2.6, 0.55, 1.2), c, 0, 0.55, 0);
    part(g, B(1.3, 0.45, 1.05), PAL.vitre, -0.15, 1.05, 0);
    for (const [wx, wz] of [
      [0.85, 0.6],
      [0.85, -0.6],
      [-0.85, 0.6],
      [-0.85, -0.6],
    ]) {
      part(g, roue, PAL.pneu, wx, 0.3, wz, { rx: Math.PI / 2, s: [0.7, 0.7, 0.7] });
    }
  };

  // Le magasin général à Réjean : façade de village, galerie, pompe à gaz.
  {
    const ox = ORIGINE.magasin;
    const m = new THREE.Group();
    m.position.set(ox - 1.2, 0, -3);
    m.scale.setScalar(1.15);
    scene.add(m);
    part(m, B(7, 3.4, 5), PAL.bois, 0, 1.7, 0);
    part(m, B(7.2, 0.18, 5.4), PAL.tole, 0, 3.45, 0);
    // Fausse façade, typique des magasins de village
    part(m, B(7.4, 5, 0.25), PAL.declin, 0, 2.5, 2.55);
    part(m, B(7.2, 1.4, 0.1), PAL.rougeGrange, 0, 4.2, 2.72);
    enseigne(m, 'MAGASIN GÉNÉRAL', 7, 1.2, 0, 4.2, 2.78, { fond: PAL.rougeGrange, encre: PAL.declin });
    part(m, B(1.1, 2.1, 0.1), PAL.rougeGrange, 0, 1.1, 2.7);
    part(m, B(0.8, 1.2, 0.12), PAL.vitre, 0, 1.45, 2.72);
    for (const x of [-2.4, 2.4]) {
      part(m, B(1.9, 1.4, 0.1), PAL.bois, x, 1.7, 2.7);
      part(m, B(1.7, 1.2, 0.12), PAL.vitre, x, 1.7, 2.72);
    }
    // Galerie
    part(m, B(7.6, 0.25, 1.8), PAL.bois, 0, 0.13, 3.5);
    part(m, B(7.8, 0.15, 2.1), PAL.tole, 0, 3, 3.6, { rx: 0.15 });
    for (const x of [-3.6, 0, 3.6]) part(m, G(new THREE.CylinderGeometry(0.1, 0.1, 2.9, 6)), PAL.declin, x, 1.5, 4.3);
    // Banc pis coffre à glace
    part(m, B(1.6, 0.12, 0.45), PAL.bois, -1.6, 0.7, 3.4);
    for (const x of [-2.2, -1]) part(m, B(0.1, 0.45, 0.4), PAL.bois, x, 0.45, 3.4);
    part(m, B(1.4, 1, 0.7), PAL.declin, 2.2, 0.75, 3.5);
    part(m, B(1, 0.2, 0.05), PAL.vitre, 2.2, 0.95, 3.86);
    // Vieille pompe à gaz
    part(m, B(0.7, 1.7, 0.5), PAL.rougeGrange, -4.8, 0.85, 4.4);
    part(m, B(0.5, 0.4, 0.52), PAL.declin, -4.8, 1.95, 4.4);
    part(m, B(0.12, 0.6, 0.12), PAL.pneu, -4.4, 1, 4.65);
    plan(11, 3.6, PAL.gravier, ox + 1, 0.025, 3.4);
    // L'îlot de pompes à essence devant le magasin, pis la grande pancarte des prix
    const ilot = new THREE.Group();
    ilot.position.set(ox - 2.6, 0, 4.4);
    scene.add(ilot);
    part(ilot, B(3.6, 0.18, 0.9), PAL.gravier, 0, 0.09, 0);
    [-1.1, 1.1].forEach((x, i) => {
      const c = i ? PAL.bleu : PAL.rougeGrange;
      part(ilot, B(0.6, 1.5, 0.45), c, x, 0.93, 0);
      part(ilot, B(0.5, 0.35, 0.47), PAL.declin, x, 1.35, 0);
      part(ilot, B(0.4, 0.2, 0.48), PAL.vitre, x, 1.05, 0);
      part(ilot, B(0.1, 0.5, 0.1), PAL.pneu, x + 0.36, 0.95, 0.12);
    });
    part(ilot, G(new THREE.CylinderGeometry(0.18, 0.18, 0.7, 6)), PAL.rouille, 0, 0.53, 0);
    const prix = new THREE.Group();
    prix.position.set(ox - 4.4, 0, 4.2);
    prix.rotation.y = 0.35;
    scene.add(prix);
    part(prix, G(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 6)), PAL.poteau, 0, 1.3, 0);
    part(prix, B(2.4, 1.6, 0.14), PAL.rougeGrange, 0, 3.3, 0);
    enseigne(prix, 'ESSENCE', 2.2, 0.65, 0, 3.7, 0.08, { fond: PAL.rougeGrange, encre: PAL.declin });
    enseigne(prix, '1,59 $/L', 2.2, 0.65, 0, 2.95, 0.08, { fond: PAL.pneu, encre: PAL.lampe, allumee: true });
  }

  // Le garage à Ti-Guy (caché tant qu'il est pas acheté)
  const garage = new THREE.Group();
  garage.position.set(ORIGINE.garage - 2, 0, -1.4);
  garage.scale.setScalar(1.5);
  scene.add(garage);
  part(garage, B(4.4, 3, 4), PAL.tole, 0, 1.5, 0);
  part(garage, B(4.8, 0.2, 4.4), PAL.rougeGrange, 0, 3.1, 0);
  part(garage, B(2.6, 2.2, 0.08), PAL.bois, 0.5, 1.1, 2.02);
  for (let i = 0; i < 4; i++) part(garage, B(2.6, 0.06, 0.1), PAL.poteau, 0.5, 0.4 + i * 0.5, 2.06);
  part(garage, B(0.7, 0.7, 0.08), PAL.vitre, -1.55, 1.9, 2.02);
  for (const x of [-1.6, 1.6]) part(garage, B(0.1, 0.8, 0.1), PAL.poteau, x, 3.5, 1.9);
  const pancarteGarage = new THREE.Group();
  pancarteGarage.position.set(0, 3.9, 2);
  pancarteGarage.rotation.y = 0.55;
  garage.add(pancarteGarage);
  part(pancarteGarage, B(4.6, 1, 0.1), PAL.rougeGrange, 0, 0, 0);
  enseigne(pancarteGarage, 'GARAGE TI-GUY', 4.4, 0.85, 0, 0, 0.06, { fond: PAL.rougeGrange, encre: PAL.declin });
  part(garage, G(new THREE.PlaneGeometry(4, 3)), PAL.gravier, 0.5, 0.02, 3.4, { rx: -Math.PI / 2 });
  miniChar(garage, PAL.champ, -3.6, 2.2, 1.2);
  for (let i = 0; i < 4; i++) part(garage, pneu, PAL.pneu, 3, 0.15 + i * 0.3, 0.6);
  garage.visible = false;

  // Le concessionnaire : un lot de chars avec des fanions
  const lot = new THREE.Group();
  lot.position.set(ORIGINE.concession - 2.8, 0, 0.3);
  lot.rotation.y = -0.2;
  lot.scale.setScalar(1.5);
  scene.add(lot);
  part(lot, G(new THREE.PlaneGeometry(7, 4.6)), PAL.gravier, 0, 0.03, 0, { rx: -Math.PI / 2 });
  miniChar(lot, PAL.rougeGrange, -1.8, -0.9, 0.5);
  miniChar(lot, PAL.champ, 0.9, -1.1, 0.5);
  miniChar(lot, PAL.chrome, -0.6, 1.2, 0.5);
  for (const x of [-3.4, 3.4]) part(lot, G(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 5)), PAL.poteau, x, 1.3, 2.2);
  const fanion = G(new THREE.ConeGeometry(0.16, 0.34, 3));
  for (let i = 0; i < 11; i++) {
    const x = -3.2 + i * 0.64;
    const y = 2.45 - Math.sin((Math.PI * i) / 10) * 0.35;
    part(lot, fanion, [PAL.rougeGrange, PAL.erables[1], PAL.declin][i % 3], x, y, 2.2, { rx: Math.PI });
  }
  part(lot, G(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 5)), PAL.poteau, 3.2, 1.6, -2);
  part(lot, B(3.2, 1.4, 0.1), PAL.rougeGrange, 3.2, 3.6, -2);
  enseigne(lot, 'AUTOS USAGÉES', 3, 1.2, 3.2, 3.6, -1.94, { fond: PAL.rougeGrange, encre: PAL.declin });
  lot.visible = false;

  // La cabane à sucre : en bois, avec la cheminée qui boucane pis des chaudières aux érables.
  const cabane = new THREE.Group();
  cabane.position.set(ORIGINE.cabane - 2, 0, -1.6);
  cabane.scale.setScalar(1.5);
  scene.add(cabane);
  part(cabane, B(4.6, 2.4, 3.6), PAL.bois, 0, 1.2, 0);
  part(cabane, B(5, 0.18, 2.3), PAL.tole, 0, 2.95, 0.95, { rx: 0.55 });
  part(cabane, B(5, 0.18, 2.3), PAL.tole, 0, 2.95, -0.95, { rx: -0.55 });
  part(cabane, B(1.4, 0.7, 3.8), PAL.bois, 0, 3.6, 0);
  part(cabane, B(1, 1.9, 0.08), PAL.tronc, 0.6, 0.95, 1.82);
  // La pancarte de bois au bord du chemin
  const pancarteCabane = new THREE.Group();
  pancarteCabane.position.set(-1.6, 0, 3);
  pancarteCabane.rotation.y = 0.25;
  cabane.add(pancarteCabane);
  for (const x of [-1.4, 1.4]) part(pancarteCabane, G(new THREE.CylinderGeometry(0.07, 0.07, 2, 5)), PAL.tronc, x, 1, 0);
  part(pancarteCabane, B(3.2, 0.85, 0.08), PAL.tronc, 0, 1.55, 0);
  enseigne(pancarteCabane, 'CABANE À SUCRE', 3, 0.72, 0, 1.55, 0.05, { fond: PAL.tronc, encre: PAL.declin });
  part(cabane, B(0.7, 0.6, 0.08), PAL.vitre, -1.3, 1.5, 1.82);
  part(cabane, G(new THREE.CylinderGeometry(0.16, 0.16, 1.6, 6)), PAL.poteau, -1.6, 3.6, -0.6);
  const boucane = G(new THREE.IcosahedronGeometry(0.4, 0));
  for (let i = 0; i < 3; i++)
    part(cabane, boucane, PAL.neigeOmbre, -1.6 + i * 0.25, 4.7 + i * 0.6, -0.6, { s: [1 + i * 0.3, 0.8, 1] });
  const chaudiere = G(new THREE.CylinderGeometry(0.16, 0.12, 0.3, 6));
  for (const [x, z] of [
    [3.6, -1.4],
    [4.4, 1.2],
    [-3.4, 1.6],
  ]) {
    part(cabane, tronc, PAL.tronc, x, 1.1, z);
    part(cabane, chaudiere, PAL.chrome, x, 0.9, z + 0.28);
  }
  part(cabane, B(1.6, 0.5, 0.6), PAL.bois, 2.6, 0.25, 2.6);
  cabane.visible = false;

  // Le bar du village : la bâtisse en brique, l'enseigne pis les chars des habitués.
  const bar = new THREE.Group();
  bar.position.set(ORIGINE.bar - 2, 0, -1.6);
  bar.scale.setScalar(1.5);
  scene.add(bar);
  part(bar, B(5.2, 2.8, 3.8), PAL.brique, 0, 1.4, 0);
  part(bar, B(5.4, 0.25, 4), PAL.tole, 0, 2.9, 0);
  part(bar, B(1, 2, 0.08), PAL.tronc, -1.4, 1, 1.92);
  part(bar, B(1.4, 0.8, 0.08), PAL.lampe, 0.6, 1.5, 1.92);
  part(bar, B(1.4, 0.8, 0.08), PAL.lampe, 2.1, 1.5, 1.92);
  for (const x of [-1.4, 2.2]) part(bar, B(0.1, 0.8, 0.1), PAL.poteau, x, 3.3, 1.7);
  part(bar, B(4.6, 1.15, 0.12), PAL.pneu, 0.4, 3.7, 1.8);
  enseigne(bar, 'CHEZ GINETTE', 4.4, 0.95, 0.4, 3.7, 1.87, { fond: PAL.rougeGrange, encre: PAL.lampe, allumee: true });
  part(bar, G(new THREE.PlaneGeometry(13, 4.4)), PAL.tole, 0, 0.025, 3.4, { rx: -Math.PI / 2 });
  miniChar(bar, PAL.rougeGrange, 4, 2.6, 0.5);
  miniChar(bar, PAL.chrome, -4.2, 2.4, 0.5);
  bar.visible = false;

  // L'aréna : un grand hangar au toit de tôle arrondi, avec la Zamboni qui attend devant.
  const arena = new THREE.Group();
  arena.position.set(ORIGINE.arena - 2, 0, -3);
  arena.scale.setScalar(1.5);
  scene.add(arena);
  part(arena, B(7, 2.4, 5), PAL.declin, 0, 1.2, 0);
  const toitArena = G(new THREE.CylinderGeometry(3.5, 3.5, 5.2, 10, 1, false, Math.PI / 2, Math.PI));
  part(arena, toitArena, PAL.tole, 0, 2.4, 0, { rx: Math.PI / 2, s: [1, 1, 0.45] });
  part(arena, B(1.8, 2, 0.08), PAL.tole, 0, 1, 2.52);
  part(arena, B(5.2, 1.1, 0.1), PAL.rougeGrange, 0, 3.2, 2.6);
  enseigne(arena, 'ARÉNA MUNICIPAL', 5, 0.9, 0, 3.2, 2.66, { fond: PAL.rougeGrange, encre: PAL.declin });
  part(arena, B(1.2, 0.8, 0.9), PAL.declin, 3.4, 0.5, 3.6);
  part(arena, B(0.6, 0.5, 0.8), PAL.vitre, 3.4, 1.15, 3.6);
  part(arena, G(new THREE.PlaneGeometry(10, 3)), PAL.tole, 0, 0.025, 4.2, { rx: -Math.PI / 2 });
  arena.visible = false;

  // Les fêtes : le même petit décor devant chaque endroit, caché le reste du temps.
  const fetes: Record<FeteId, THREE.Group> = {
    sucres: new THREE.Group(),
    stjean: new THREE.Group(),
    halloween: new THREE.Group(),
    noel: new THREE.Group(),
  };
  const buche = G(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 5));
  const flamme = G(new THREE.ConeGeometry(0.45, 1.1, 5));
  const citrouille = G(new THREE.IcosahedronGeometry(0.32, 1));
  const lumiere = B(0.2, 0.24, 0.2);
  for (const [lieu, ox] of Object.entries(ORIGINE)) {
    // Un coin de décor devant chaque endroit, un peu plus gros pour qu'on le voie.
    // Au magasin, les pompes à essence prennent la place : la fête va de l'autre bord.
    const dx = lieu === 'magasin' ? 7.6 : -3.4;
    const coin = (g: THREE.Group) => {
      const c = new THREE.Group();
      c.position.set(ox + dx, 0, 3.4);
      c.scale.setScalar(1.6);
      g.add(c);
      return c;
    };
    // Temps des sucres : le chaudron qui bout sur le feu pis la table de tire sur la neige.
    const su = coin(fetes.sucres);
    for (const dx of [-0.6, 0.6]) part(su, buche, PAL.tronc, dx, 0.6, 0, { rz: dx * 0.5 });
    part(su, G(new THREE.CylinderGeometry(0.42, 0.32, 0.5, 7)), PAL.pneu, 0, 0.75, 0);
    part(su, boucane, PAL.neigeOmbre, 0, 1.4, 0, { s: [0.8, 0.6, 0.8] });
    part(su, B(1.6, 0.6, 0.7), PAL.bois, 2, 0.3, 0.4);
    part(su, B(1.5, 0.12, 0.6), PAL.neige, 2, 0.66, 0.4);
    // Saint-Jean : le feu de joie pis le drapeau.
    const sj = coin(fetes.stjean);
    for (let i = 0; i < 5; i++) part(sj, buche, PAL.tronc, 0, 0.45, 0, { ry: (i * Math.PI) / 5, rz: 0.9 });
    part(sj, flamme, PAL.rouille, 0, 0.85, 0);
    part(sj, flamme, PAL.erables[1], 0, 1.1, 0, { s: [0.6, 0.8, 0.6] });
    // Le drapeau reste assez bas pour pas cacher les enseignes.
    part(sj, G(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 5)), PAL.poteau, 2.4, 1.2, -0.6);
    part(sj, B(1.3, 0.85, 0.04), PAL.bleu, 3.05, 2, -0.6);
    part(sj, B(1.3, 0.12, 0.05), PAL.declin, 3.05, 2, -0.6);
    part(sj, B(0.12, 0.85, 0.05), PAL.declin, 3.05, 2, -0.6);
    // Halloween : des citrouilles sur le bord du chemin.
    const ha = coin(fetes.halloween);
    [
      [0, 0, 1.2],
      [0.8, 0.3, 0.9],
      [1.7, -0.1, 1.1],
    ].forEach(([dx, dz, k]) => {
      part(ha, citrouille, PAL.rouille, dx, 0.24 * k, dz, { s: [k, 0.75 * k, k] });
      part(ha, B(0.06, 0.14, 0.06), PAL.tronc, dx, 0.5 * k, dz);
    });
    // Party de Noël : un petit sapin avec des lumières.
    const no = coin(fetes.noel);
    part(no, troncSapin, PAL.tronc, 0, 0.3, 0, { s: [1, 0.6, 1] });
    part(no, sapinBas, PAL.sapin, 0, 1.3, 0, { s: [0.7, 0.7, 0.7] });
    part(no, sapinHaut, PAL.sapin, 0, 2.2, 0, { s: [0.7, 0.7, 0.7] });
    for (let i = 0; i < 9; i++) {
      const a = i * 2.1;
      const y = 0.8 + i * 0.18;
      const r = 0.95 - i * 0.08;
      part(no, lumiere, [PAL.rougeGrange, PAL.erables[1], PAL.bleu][i % 3], Math.cos(a) * r, y, Math.sin(a) * r);
    }
  }
  for (const g of Object.values(fetes)) {
    g.visible = false;
    scene.add(g);
  }

  // Caméra : chaque endroit a son cadrage.
  const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.1, 200);
  let lieuActuel: Lieu = 'maison';
  const placerCamera = (aspect?: number) => {
    if (aspect) camera.aspect = aspect;
    const { pos, vise, fov } = CADRAGE[lieuActuel];
    const ox = ORIGINE[lieuActuel];
    // Écran étroit (téléphone) : on recule pour garder l'endroit pis le bazou dans le cadre.
    const recul = camera.aspect < 1.2 ? 1.25 : 1;
    camera.position.set(
      ox + vise[0] + (pos[0] - vise[0]) * recul,
      vise[1] + (pos[1] - vise[1]) * recul,
      vise[2] + (pos[2] - vise[2]) * recul,
    );
    camera.lookAt(ox + vise[0], vise[1], vise[2]);
    camera.fov = fov;
    camera.updateProjectionMatrix();
  };

  // Ce qui tombe du ciel (pluie, feuilles, neige) : une boîte de points autour de l'endroit.
  const NB_TOMBE = 500;
  const tombePos = new Float32Array(NB_TOMBE * 3);
  const tombeCouleurs = new Float32Array(NB_TOMBE * 3);
  for (let i = 0; i < NB_TOMBE; i++) {
    tombePos[i * 3] = (Math.random() - 0.5) * 34;
    tombePos[i * 3 + 1] = Math.random() * 14;
    tombePos[i * 3 + 2] = -10 + Math.random() * 24;
  }
  const tombeGeo = G(new THREE.BufferGeometry());
  tombeGeo.setAttribute('position', new THREE.BufferAttribute(tombePos, 3));
  tombeGeo.setAttribute('color', new THREE.BufferAttribute(tombeCouleurs, 3));
  const tombeMat = new THREE.PointsMaterial({ size: 0.2, vertexColors: true });
  const tombe = new THREE.Points(tombeGeo, tombeMat);
  tombe.frustumCulled = false;
  tombe.visible = false;
  scene.add(tombe);
  let tombeActuel: Tombe | null = null;
  const majTombe = () => {
    const x = quiTombe(saison, meteo);
    tombeActuel = x;
    tombe.visible = !!x;
    if (!x) return;
    tombeMat.size = x.taille;
    tombeGeo.setDrawRange(0, x.nb);
    for (let i = 0; i < NB_TOMBE; i++) teinte.setHex(x.couleurs[i % x.couleurs.length]).toArray(tombeCouleurs, i * 3);
    tombeGeo.attributes.color.needsUpdate = true;
  };
  const faireTomber = (dt: number, t: number) => {
    const x = tombeActuel;
    if (!x) return;
    for (let i = 0; i < NB_TOMBE; i++) {
      let y = tombePos[i * 3 + 1] - x.vitesse * dt * (0.7 + (i % 5) * 0.1);
      if (y < 0) y += 14;
      tombePos[i * 3 + 1] = y;
      // Le vent pousse tout du même bord, avec un peu de zigzag.
      let px = tombePos[i * 3] + (Math.sin(t * 0.8 + i) * 0.6 + 0.4) * x.vent * dt;
      if (px > 17) px -= 34;
      tombePos[i * 3] = px;
    }
    tombeGeo.attributes.position.needsUpdate = true;
  };

  // Lumière : la progression du rang, la teinte de l'endroit pis la saison par-dessus.
  let chaleur = 0;
  let saison: SaisonId = 'ete';
  let meteo: MeteoId = 'beau';
  let heure = 12;
  const teinte = new THREE.Color();
  const eclairer = () => {
    const k = chaleur;
    ciel.lerpColors(DEBUT.ciel, TARD.ciel, k);
    let near = THREE.MathUtils.lerp(DEBUT.brume[0], TARD.brume[0], k);
    let far = THREE.MathUtils.lerp(DEBUT.brume[1], TARD.brume[1], k);
    hemi.color.lerpColors(DEBUT.hemiCiel, TARD.hemiCiel, k);
    hemi.groundColor.lerpColors(DEBUT.hemiSol, TARD.hemiSol, k);
    let hemiForce = THREE.MathUtils.lerp(DEBUT.hemiForce, TARD.hemiForce, k);
    soleil.color.lerpColors(DEBUT.soleil, TARD.soleil, k);
    let soleilForce = THREE.MathUtils.lerp(DEBUT.soleilForce, TARD.soleilForce, k);
    soleil.position.lerpVectors(DEBUT.soleilPos, TARD.soleilPos, k);
    const teinter = (a: Ambiance, k: number) => {
      ciel.lerp(teinte.setHex(a.ciel), k);
      hemi.color.lerp(teinte.setHex(a.lumiere), k);
      soleil.color.lerp(teinte.setHex(a.soleil), k);
      const f = THREE.MathUtils.lerp(1, a.force, k);
      hemiForce *= f;
      soleilForce *= f;
      near *= THREE.MathUtils.lerp(1, a.brume, k);
      far *= THREE.MathUtils.lerp(1, a.brume, k);
    };
    const a = AMBIANCE[lieuActuel];
    if (a) teinter(a, MELANGE);
    teinter(LOOK_SAISON[saison], MELANGE_SAISON);
    if (meteo !== 'beau') teinter(LOOK_METEO[meteo], MELANGE_METEO);
    // Le soleil fait le tour : jour = 1 à midi, 0 la nuit; l'aube pis le coucher virent orange.
    const angle = ((heure - 5) / 16) * Math.PI;
    const jour = THREE.MathUtils.clamp(Math.sin(angle) * 1.4 + 0.1, 0, 1);
    const aube = Math.max(0, 1 - Math.min(Math.abs(heure - 6), Math.abs(heure - 19.5)) / 1.5);
    ciel.lerp(teinte.setHex(AUBE.ciel), aube * 0.45);
    soleil.color.lerp(teinte.setHex(AUBE.soleil), aube * 0.6);
    ciel.lerp(teinte.setHex(NUIT.ciel), (1 - jour) * 0.85);
    hemi.color.lerp(teinte.setHex(NUIT.lumiere), (1 - jour) * 0.8);
    hemiForce *= THREE.MathUtils.lerp(0.45, 1, jour);
    soleilForce *= THREE.MathUtils.lerp(0.05, 1, jour);
    fenetres.visible = jour < 0.35;
    soleil.position.set(-Math.cos(angle) * 12, Math.max(1, Math.sin(angle) * 11), 9);
    fog.color.copy(ciel);
    fog.near = near;
    fog.far = far;
    hemi.intensity = hemiForce * Math.PI;
    soleil.intensity = soleilForce * Math.PI;
  };

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(Math.max(1, Math.round(w / pixelScale)), Math.max(1, Math.round(h / pixelScale)), false);
    placerCamera(w / h);
    renderer.render(scene, camera);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // La coupure VHS entre deux endroits.
  const coupe = document.createElement('div');
  coupe.className = 'coupe';
  renderer.domElement.after(coupe);
  const flash = () => {
    coupe.classList.remove('on');
    void coupe.offsetWidth; // relance l'animation CSS
    coupe.classList.add('on');
  };

  // Les trajets du bazou : une suite d'étapes jouées dans la boucle d'animation.
  interface Pose {
    x: number;
    z: number;
    ry: number;
  }
  interface Etape {
    ms: number;
    de?: Pose;
    a?: Pose;
    ease?: (k: number) => number;
    /** Lancé au début de l'étape. */
    action?: () => void;
  }
  const easeIn = (k: number) => k * k;
  const easeOut = (k: number) => 1 - (1 - k) * (1 - k);
  const stationne = (l: Lieu): Pose => ({ x: ORIGINE[l] + STATIONNEMENT.x, z: STATIONNEMENT.z, ry: STATIONNEMENT.ry });
  const poser = (p: Pose) => {
    bazou.position.set(p.x, 0, p.z);
    bazou.rotation.y = p.ry;
  };
  // Part par l'entrée, tourne sur le rang pis sort du cadre vers la droite.
  const depart = (l: Lieu): Etape[] => {
    const ox = ORIGINE[l];
    const route = { x: ox + 7.5, z: ROUTE_Z, ry: 0 };
    return [
      { ms: 380, de: stationne(l), a: route, ease: easeIn, action: () => opts.onTrajet?.('depart') },
      { ms: 520, de: route, a: { x: ox + 32, z: ROUTE_Z, ry: 0 }, ease: easeIn },
    ];
  };
  // Arrive par la gauche, dépasse l'entrée pis recule dedans.
  const arrivee = (l: Lieu): Etape[] => {
    const ox = ORIGINE[l];
    const route = { x: ox + 8, z: ROUTE_Z, ry: 0 };
    return [
      { ms: 560, de: { x: ox - 30, z: ROUTE_Z, ry: 0 }, a: route, ease: easeOut },
      { ms: 460, de: route, a: stationne(l), ease: easeOut },
    ];
  };
  let etapes: Etape[] = [];
  let etapeDebut = 0;
  let carLieu: Lieu = 'maison';
  let roule = false;
  let prochaineLivraison = Infinity;
  const planifierLivraison = (now: number) => (prochaineLivraison = now + 35_000 + Math.random() * 35_000);
  const jouer = (now: number, liste: Etape[]) => {
    etapes = liste;
    etapeDebut = now;
    etapes[0]?.action?.();
  };
  const avancer = (now: number) => {
    while (etapes.length) {
      const e = etapes[0];
      const k = Math.min(1, (now - etapeDebut) / e.ms);
      if (e.de && e.a) {
        const q = (e.ease ?? ((x: number) => x))(k);
        poser({
          x: THREE.MathUtils.lerp(e.de.x, e.a.x, q),
          z: THREE.MathUtils.lerp(e.de.z, e.a.z, q),
          ry: THREE.MathUtils.lerp(e.de.ry, e.a.ry, q),
        });
      }
      if (k < 1) return;
      etapes.shift();
      etapeDebut += e.ms;
      etapes[0]?.action?.();
    }
    // Rien en cours : le bazou part livrer de temps en temps (5B).
    if (roule && carLieu === lieuActuel && now >= prochaineLivraison) {
      jouer(now, [...depart(carLieu), { ms: 6000 }, ...arrivee(carLieu)]);
      planifierLivraison(now + 8000);
    }
  };

  // Le monde qui passe dans le rang devant la maison : chars, vélos, motos, un chien, un renard...
  // Chaque modèle est bâti une fois pis réutilisé. L'avant est vers +x.
  interface Passant {
    type: PassantId;
    g: THREE.Group;
    phares: THREE.Object3D[];
    vitesse: number;
    /** Sur la route (x qui avance) ou à travers (z qui avance, le renard). */
    traverse?: boolean;
    actif: boolean;
    dir: number;
    pattes?: THREE.Object3D[];
    ailes?: THREE.Object3D[];
  }
  type PassantId = 'char' | 'pickup' | 'tracteur' | 'scooter' | 'velo' | 'moto' | 'chien' | 'renard' | 'motoneige' | 'oiseaux' | 'autobus' | 'chevreuil' | 'vtt' | 'joggeur';
  const roueMince = G(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 8));
  const nouveauPassant = (type: PassantId, vitesse: number, bati: (g: THREE.Group, phares: THREE.Object3D[], pattes: THREE.Object3D[]) => void, traverse = false) => {
    const g = new THREE.Group();
    g.visible = false;
    scene.add(g);
    const phares: THREE.Object3D[] = [];
    const pattes: THREE.Object3D[] = [];
    bati(g, phares, pattes);
    return { type, g, phares, pattes, vitesse, traverse, actif: false, dir: 1 } as Passant;
  };
  const roues4 = (g: THREE.Group, x: number, z: number, s = 0.75) => {
    for (const [wx, wz] of [
      [x, z],
      [x, -z],
      [-x, z],
      [-x, -z],
    ])
      part(g, roue, PAL.pneu, wx, 0.42 * s, wz, { rx: Math.PI / 2, s: [s, s, s] });
  };
  const phare = (g: THREE.Group, phares: THREE.Object3D[], x: number, y: number, z: number) =>
    phares.push(part(g, B(0.08, 0.16, 0.22), PAL.lampe, x, y, z));
  const pilote = (g: THREE.Group, x: number, y: number, chandail: number, tete: number) => {
    part(g, B(0.36, 0.62, 0.42), chandail, x, y + 0.31, 0, { rz: -0.2 });
    part(g, B(0.3, 0.3, 0.3), tete, x + 0.08, y + 0.78, 0);
  };
  // Une volée d'oiseaux en V, haut dans le ciel, qui battent des ailes.
  const volee = () => {
    const p = nouveauPassant('oiseaux', 5, () => {});
    p.ailes = [];
    [[0, 0], [-0.9, 0.7], [-0.9, -0.7], [-1.8, 1.4], [-1.8, -1.4]].forEach(([x, z]) => {
      const o = new THREE.Group();
      o.position.set(x, Math.random() * 0.3, z);
      p.g.add(o);
      part(o, B(0.35, 0.1, 0.1), PAL.pneu, 0, 0, 0);
      for (const c of [1, -1]) {
        const aile = new THREE.Group();
        aile.position.z = 0.05 * c;
        aile.userData.c = c;
        o.add(aile);
        part(aile, B(0.18, 0.03, 0.4), PAL.pneu, 0, 0, 0.2 * c);
        p.ailes!.push(aile);
      }
    });
    return p;
  };
  const passants: Passant[] = [
    volee(),
    nouveauPassant('autobus', 7, (g, ph) => {
      part(g, B(5.4, 1.5, 1.7), PAL.autobus, 0, 1.25, 0);
      part(g, B(1, 0.8, 1.66), PAL.autobus, 3.1, 0.85, 0);
      part(g, B(4.4, 0.45, 1.74), PAL.vitre, -0.3, 1.55, 0);
      part(g, B(5.42, 0.1, 1.72), PAL.pneu, 0, 1.0, 0);
      part(g, B(0.08, 0.5, 1.5), PAL.vitre, 2.71, 1.6, 0);
      for (const x of [1.9, -1.8]) for (const z of [0.8, -0.8]) part(g, roue, PAL.pneu, x, 0.4, z, { rx: Math.PI / 2, s: [0.95, 1, 0.95] });
      phare(g, ph, 3.61, 0.9, 0.6);
      phare(g, ph, 3.61, 0.9, -0.6);
    }),
    nouveauPassant('vtt', 6, (g, ph) => {
      part(g, B(1.3, 0.4, 0.9), PAL.rougeGrange, 0, 0.6, 0);
      part(g, B(0.4, 0.15, 0.95), PAL.pneu, 0.55, 0.85, 0);
      for (const x of [0.5, -0.5]) for (const z of [0.5, -0.5]) part(g, roue, PAL.pneu, x, 0.3, z, { rx: Math.PI / 2, s: [0.7, 0.8, 0.7] });
      pilote(g, -0.15, 0.8, PAL.sapin, PAL.declin);
      phare(g, ph, 0.66, 0.65, 0);
    }),
    nouveauPassant('joggeur', 2.8, (g, _ph, pattes) => {
      part(g, B(0.3, 0.55, 0.36), PAL.rougeGrange, 0, 1.05, 0);
      part(g, B(0.26, 0.26, 0.26), PAL.declin, 0.04, 1.48, 0);
      for (const z of [0.1, -0.1]) pattes.push(part(g, B(0.1, 0.75, 0.12), PAL.bleu, 0, 0.4, z));
    }),
    nouveauPassant(
      'chevreuil',
      4.5,
      (g, _ph, pattes) => {
        part(g, B(1.1, 0.45, 0.4), PAL.bois, 0, 1.05, 0);
        part(g, B(0.2, 0.5, 0.2), PAL.bois, 0.55, 1.35, 0, { rz: -0.4 });
        part(g, B(0.38, 0.22, 0.22), PAL.bois, 0.75, 1.6, 0);
        part(g, B(0.14, 0.2, 0.08), PAL.declin, -0.6, 1.15, 0);
        for (const [x, z] of [[0.4, 0.13], [0.4, -0.13], [-0.4, 0.13], [-0.4, -0.13]])
          pattes.push(part(g, B(0.08, 0.85, 0.08), PAL.bois, x, 0.42, z));
      },
      true,
    ),
    ...[PAL.bleu, PAL.champ, PAL.chrome].map((c) =>
      nouveauPassant('char', 9, (g, ph) => {
        part(g, B(3.4, 0.62, 1.5), c, 0, 0.62, 0);
        part(g, B(1.7, 0.55, 1.36), PAL.vitre, -0.2, 1.2, 0);
        part(g, B(1.8, 0.1, 1.42), c, -0.2, 1.5, 0);
        roues4(g, 1.1, 0.72);
        phare(g, ph, 1.71, 0.7, 0.5);
        phare(g, ph, 1.71, 0.7, -0.5);
      }),
    ),
    nouveauPassant('pickup', 8, (g, ph) => {
      part(g, B(1.6, 1.1, 1.6), PAL.rougeGrange, 0.9, 0.85, 0);
      part(g, B(0.9, 0.45, 1.5), PAL.vitre, 0.75, 1.2, 0);
      part(g, B(2.2, 0.6, 1.6), PAL.rougeGrange, -1, 0.6, 0);
      part(g, B(1.2, 0.5, 1.2), PAL.foin, -1.1, 1.1, 0);
      roues4(g, 1.1, 0.78);
      phare(g, ph, 1.71, 0.8, 0.55);
      phare(g, ph, 1.71, 0.8, -0.55);
    }),
    nouveauPassant('tracteur', 3, (g, ph) => {
      part(g, B(1.8, 0.7, 0.9), PAL.rougeGrange, 0.4, 1, 0);
      part(g, B(0.9, 1.1, 1), PAL.vitre, -0.5, 1.6, 0);
      part(g, B(1, 0.1, 1.1), PAL.rougeGrange, -0.5, 2.2, 0);
      part(g, G(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 5)), PAL.pneu, 0.9, 1.6, 0);
      for (const z of [0.7, -0.7]) {
        part(g, roue, PAL.pneu, -0.6, 0.7, z, { rx: Math.PI / 2, s: [1.6, 1, 1.6] });
        part(g, roue, PAL.pneu, 1, 0.4, z * 0.8, { rx: Math.PI / 2, s: [0.9, 0.8, 0.9] });
      }
      phare(g, ph, 1.31, 1.1, 0.3);
    }),
    nouveauPassant('scooter', 5, (g, ph) => {
      for (const x of [0.55, -0.55]) part(g, roueMince, PAL.pneu, x, 0.3, 0, { rx: Math.PI / 2, s: [0.9, 1, 0.9] });
      part(g, B(1.2, 0.35, 0.4), PAL.erables[1], 0, 0.55, 0);
      part(g, B(0.15, 0.7, 0.3), PAL.erables[1], 0.5, 0.9, 0);
      pilote(g, -0.15, 0.7, PAL.bleu, PAL.pneu);
      phare(g, ph, 0.6, 1.1, 0);
    }),
    nouveauPassant('velo', 3.5, (g) => {
      for (const x of [0.55, -0.55]) part(g, roueMince, PAL.pneu, x, 0.34, 0, { rx: Math.PI / 2 });
      part(g, B(1.1, 0.08, 0.08), PAL.chrome, 0, 0.62, 0, { rz: 0.15 });
      part(g, B(0.08, 0.5, 0.08), PAL.chrome, 0.45, 0.7, 0);
      pilote(g, -0.1, 0.75, PAL.champ, PAL.rougeGrange);
    }),
    nouveauPassant('moto', 12, (g, ph) => {
      for (const x of [0.75, -0.75]) part(g, roueMince, PAL.pneu, x, 0.38, 0, { rx: Math.PI / 2, s: [1.1, 2, 1.1] });
      part(g, B(1.3, 0.4, 0.4), PAL.pneu, 0, 0.75, 0);
      part(g, B(0.5, 0.3, 0.45), PAL.chrome, 0.1, 0.55, 0);
      pilote(g, -0.2, 0.9, PAL.tronc, PAL.pneu);
      phare(g, ph, 0.75, 1, 0);
    }),
    nouveauPassant('motoneige', 10, (g, ph) => {
      for (const z of [0.4, -0.4]) part(g, B(1.6, 0.06, 0.15), PAL.chrome, 0.3, 0.05, z);
      part(g, B(2, 0.45, 0.9), PAL.erables[1], 0, 0.4, 0);
      part(g, B(0.5, 0.3, 0.8), PAL.vitre, 0.55, 0.75, 0, { rz: 0.4 });
      pilote(g, -0.4, 0.62, PAL.bleu, PAL.pneu);
      phare(g, ph, 1.01, 0.45, 0);
    }),
    nouveauPassant('chien', 2.4, (g, _ph, pattes) => {
      part(g, B(0.8, 0.32, 0.3), PAL.tronc, 0, 0.5, 0);
      part(g, B(0.3, 0.28, 0.26), PAL.tronc, 0.48, 0.68, 0);
      part(g, B(0.16, 0.1, 0.14), PAL.pneu, 0.66, 0.62, 0);
      part(g, B(0.3, 0.06, 0.06), PAL.tronc, -0.5, 0.65, 0, { rz: 0.6 });
      for (const [x, z] of [[0.3, 0.1], [0.3, -0.1], [-0.3, 0.1], [-0.3, -0.1]])
        pattes.push(part(g, B(0.08, 0.35, 0.08), PAL.tronc, x, 0.18, z));
    }),
    nouveauPassant(
      'renard',
      3.2,
      (g, _ph, pattes) => {
        part(g, B(0.75, 0.28, 0.26), PAL.rouille, 0, 0.45, 0);
        part(g, B(0.26, 0.24, 0.24), PAL.rouille, 0.45, 0.6, 0);
        part(g, G(new THREE.ConeGeometry(0.1, 0.28, 4)), PAL.rouille, 0.68, 0.58, 0, { rz: -Math.PI / 2 });
        part(g, B(0.55, 0.18, 0.18), PAL.rouille, -0.6, 0.5, 0, { rz: 0.25 });
        part(g, B(0.16, 0.16, 0.16), PAL.declin, -0.9, 0.58, 0);
        for (const [x, z] of [[0.25, 0.09], [0.25, -0.09], [-0.25, 0.09], [-0.25, -0.09]])
          pattes.push(part(g, B(0.07, 0.3, 0.07), PAL.pneu, x, 0.15, z));
      },
      true,
    ),
  ];
  // Qui peut passer, selon la saison, la météo pis l'heure (poids : plus gros = plus souvent).
  const chancesPassants = (): [PassantId, number][] => {
    const nuit = heure >= 21 || heure < 5;
    const hiver = saison === 'hiver';
    const mouille = meteo === 'pluie' || meteo === 'neige';
    const deux = !hiver && !mouille && !nuit;
    const liste: [PassantId, number][] = [
      ['char', 5],
      ['pickup', 3],
      ['tracteur', !hiver && !nuit ? 1 : 0],
      ['scooter', deux ? 1.5 : 0],
      ['velo', deux ? 1.5 : 0],
      ['moto', !hiver && !mouille ? 1.5 : 0],
      ['motoneige', hiver ? 2.5 : 0],
      ['chien', !nuit ? 1.2 : 0],
      ['renard', nuit || heure < 8 || heure >= 18 ? 2 : 0.4],
      // L'autobus scolaire : le matin pis l'après-midi, pas l'été.
      ['autobus', saison !== 'ete' && ((heure >= 7 && heure < 9) || (heure >= 15 && heure < 17)) ? 4 : 0],
      ['vtt', !hiver && !nuit ? 1 : 0],
      ['joggeur', deux ? 1 : 0],
      // Le chevreuil traverse à l'aube pis à la brunante.
      ['chevreuil', heure < 8 || heure >= 18 ? 1.5 : 0.3],
      // Les oiseaux dorment la nuit pis aiment pas la tempête.
      ['oiseaux', nuit || mouille ? 0 : hiver ? 0.8 : 2],
    ];
    return liste.filter(([, p]) => p > 0);
  };
  let prochainPassant = 0;
  const lancerPassant = (now: number) => {
    const nuit = heure >= 21 || heure < 5;
    // La nuit, ça passe trois fois moins.
    prochainPassant = now + (4000 + Math.random() * 7000) * (nuit ? 3 : 1);
    if (passants.filter((p) => p.actif).length >= 3) return;
    const liste = chancesPassants();
    let r = Math.random() * liste.reduce((t, [, p]) => t + p, 0);
    const type = liste.find(([, p]) => (r -= p) < 0)?.[0];
    const p = passants.find((x) => x.type === type && !x.actif);
    if (!p) return;
    p.actif = true;
    p.g.visible = true;
    p.dir = Math.random() < 0.5 ? 1 : -1;
    const ox = ORIGINE.maison;
    if (p.traverse) {
      // Le renard traverse le rang, du champ d'en avant vers le bois.
      p.g.position.set(ox + (p.type === 'chevreuil' ? -10 : 13.5), 0, 16);
      p.g.rotation.y = Math.PI / 2;
    } else {
      // Les animaux suivent l'accotement, la motoneige passe dans le champ d'en avant.
      const z = p.type === 'oiseaux' ? -3 + Math.random() * 6 : p.type === 'motoneige' ? 10 : p.type === 'chien' || p.type === 'joggeur' ? 8.1 : p.dir > 0 ? ROUTE_Z + 0.9 : ROUTE_Z - 0.9;
      p.g.position.set(ox - 40 * p.dir, p.type === 'oiseaux' ? 8 + Math.random() * 3 : 0, z);
      p.g.rotation.y = p.dir > 0 ? 0 : Math.PI;
    }
  };
  const fairePasser = (now: number, dt: number, t: number) => {
    if (lieuActuel !== 'maison') return;
    if (now >= prochainPassant) lancerPassant(now);
    const phares = heure >= 19.5 || heure < 6.5 || meteo === 'brouillard';
    for (const p of passants) {
      if (!p.actif) continue;
      p.phares.forEach((x) => (x.visible = phares));
      if (p.traverse) {
        p.g.position.z -= p.vitesse * dt;
        if (p.g.position.z < -14) p.actif = p.g.visible = false;
      } else {
        p.g.position.x += p.vitesse * p.dir * dt;
        if (Math.abs(p.g.position.x - ORIGINE.maison) > 42) p.actif = p.g.visible = false;
      }
      // Les pattes trottent, les deux-roues pis les chars brassent un peu.
      p.pattes?.forEach((x, i) => (x.rotation.z = Math.sin(t * 14 + (i % 2) * Math.PI) * 0.5));
      p.ailes?.forEach((a, i) => (a.rotation.x = Math.sin(t * 12 + i * 0.7) * 0.7 * a.userData.c));
      if (!p.ailes) p.g.position.y = p.pattes?.length ? Math.abs(Math.sin(t * 14)) * 0.04 : Math.sin(t * 20 + p.vitesse) * 0.015;
    }
  };
  const cacherPassants = () => passants.forEach((p) => (p.actif = p.g.visible = false));

  const t0 = performance.now();
  let raf = 0;
  let tAvant = 0;
  const frame = (now: number) => {
    const t = (now - t0) / 1000;
    const vent = LOOK_METEO[meteo].vent;
    arbres.forEach((a, i) => (a.rotation.z = Math.sin(t * (1.1 + vent * 20) + i) * vent));
    faireTomber(Math.min(0.1, t - tAvant), t);
    fairePasser(now, Math.min(0.1, t - tAvant), t);
    tAvant = t;
    carrosserie.position.y = Math.sin(t * 28) * 0.012;
    avancer(now);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (!opts.reduceMotion && !raf) raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);
  start();

  const couper = (l: Lieu) => {
    lieuActuel = l;
    cacherPassants();
    tombe.position.x = ORIGINE[l];
    placerCamera();
    eclairer();
  };

  return {
    setCar(look) {
      garage.visible = look.lieux.garage;
      lot.visible = look.lieux.concession;
      cabane.visible = look.lieux.cabane;
      bar.visible = look.lieux.bar;
      arena.visible = look.lieux.arena;
      // La pile de pneus déménage dans le garage, la pancarte disparaît avec la vente.
      pilePneus.forEach((p) => (p.visible = !look.lieux.concession));
      pancarte.visible = !look.owned;
      leBazou.setEtat(look);
      leBazou.setLook(look.look);
      if (look.runs && !roule) planifierLivraison(performance.now());
      roule = look.runs;
      // Un bazou qui roule pas reste dans la cour chez vous.
      if (!roule && carLieu !== 'maison' && !etapes.length) {
        carLieu = 'maison';
        poser(stationne('maison'));
      }
      if (!raf) renderer.render(scene, camera);
    },
    allerA(l) {
      if (l === lieuActuel) return;
      const now = performance.now();
      const suit = roule;
      // Sans animation : on coupe direct.
      if (!raf) {
        etapes = [];
        couper(l);
        if (suit) {
          carLieu = l;
          poser(stationne(l));
        }
        renderer.render(scene, camera);
        return;
      }
      const bazouIci = suit && carLieu === lieuActuel && !etapes.length;
      const arrive = suit ? arrivee(l) : [];
      arrive[0] && (arrive[0].action = () => (carLieu = l));
      // Le flash VHS monte, on coupe au plus fort, pis il redescend sur le nouvel endroit.
      const coupure: Etape[] = [
        {
          ms: 150,
          action: () => {
            flash();
            opts.onTrajet?.('coupe');
          },
        },
        {
          ms: 150,
          action: () => {
            couper(l);
            if (suit) poser({ x: ORIGINE[l] - 30, z: ROUTE_Z, ry: 0 });
          },
        },
      ];
      jouer(now, [...(bazouIci ? depart(lieuActuel) : []), ...coupure, ...arrive]);
      planifierLivraison(now);
    },
    setWarmth(w) {
      chaleur = Math.min(1, Math.max(0, w));
      eclairer();
      if (!raf) renderer.render(scene, camera);
    },
    setSaison(x) {
      (M(PAL.herbe) as THREE.MeshPhongMaterial).color.setHex(SOL[x][0]);
      (M(PAL.herbeSombre) as THREE.MeshPhongMaterial).color.setHex(SOL[x][1]);
      saison = x;
      const look = LOOK_SAISON[x];
      cimes.forEach((c) => (c.visible = !!look.erables));
      if (look.erables) feuillage.forEach((m, i) => m.color.setHex(look.erables![i % look.erables!.length]));
      (M(PAL.sapin) as THREE.MeshPhongMaterial).color.setHex(look.sapin);
      majTombe();
      eclairer();
      if (!raf) renderer.render(scene, camera);
    },
    setTemps(h, m) {
      heure = h;
      if (m !== meteo) {
        meteo = m;
        majTombe();
      }
      eclairer();
      if (!raf) renderer.render(scene, camera);
    },
    setFete(f) {
      for (const [id, g] of Object.entries(fetes)) g.visible = id === f;
      if (!raf) renderer.render(scene, camera);
    },
    setPixelScale(scale) {
      pixelScale = scale;
      resize();
    },
    dispose() {
      stop();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      leBazou.dispose();
      filMat.dispose();
      tombeMat.dispose();
      feuillage.forEach((m) => m.dispose());
      enseignes.forEach((e) => (e.tex.dispose(), e.mat.dispose()));
      renderer.dispose();
      renderer.domElement.remove();
      coupe.remove();
    },
  };
}
