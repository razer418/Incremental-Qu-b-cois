import * as THREE from 'three';
import type { BuildingId } from '../game/buildings';
import type { FeteId } from '../game/fetes';

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
} as const;

export type SaisonId = 'printemps' | 'ete' | 'automne' | 'hiver';
// Le sol pis les buissons changent de couleur avec la saison.
const SOL: Record<SaisonId, [number, number]> = {
  printemps: [PAL.boue, PAL.herbeSombre],
  ete: [PAL.herbe, PAL.herbeSombre],
  automne: [PAL.foin, PAL.herbeSombre],
  hiver: [PAL.neige, PAL.neigeOmbre],
};

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
}

export type Lieu = 'maison' | 'magasin' | BuildingId;

export interface Rang {
  setCar(look: CarLook): void;
  /** Change d'endroit : le bazou part, coupure VHS, pis il arrive plus loin. */
  allerA(lieu: Lieu): void;
  /** 0 = début (gris), 1 = plus tard (chaud). */
  setWarmth(w: number): void;
  setSaison(s: SaisonId): void;
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

  // Sol pis route : une longue bande pour tous les endroits.
  plan(1300, 160, PAL.herbe, 450, 0, 0);
  plan(1300, 3.8, PAL.gravier, 450, 0.02, ROUTE_Z);
  plan(30, 14, PAL.champ, -6, 0.01, -14);

  // Décor commun à chaque endroit : collines, arbres, poteaux d'Hydro.
  const arbres: THREE.Group[] = [];
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
      part(t, G(new THREE.IcosahedronGeometry(r, 0)), PAL.erables[i % 3], 0, 2.4 + r * 0.6, 0);
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
  part(maison, B(6.4, 0.25, 1.7), PAL.bois, 0, 0.18, 3.2);
  for (const x of [-3, 3]) part(maison, G(new THREE.CylinderGeometry(0.1, 0.1, 2.7, 6)), PAL.declin, x, 1.55, 3.9);
  part(maison, B(6.6, 0.15, 2), PAL.tole, 0, 2.95, 3.3, { rx: 0.12 });
  plan(3.2, 5, PAL.gravier, 4.6, 0.02, 2.6);

  // Le bazou (à vendre pour l'instant : c'est l'objectif)
  const bazou = new THREE.Group();
  bazou.position.set(STATIONNEMENT.x, 0, STATIONNEMENT.z);
  bazou.rotation.y = STATIONNEMENT.ry;
  scene.add(bazou);
  const carrosserie = new THREE.Group();
  bazou.add(carrosserie);
  part(carrosserie, B(4.2, 0.8, 1.8), PAL.carrosserie, 0, 0.8, 0);
  part(carrosserie, B(2.2, 0.66, 1.6), PAL.vitre, -0.25, 1.53, 0);
  part(carrosserie, B(2.35, 0.12, 1.7), PAL.carrosserie, -0.25, 1.9, 0);
  const rouille = [
    part(carrosserie, B(0.7, 0.45, 0.04), PAL.rouille, 1.2, 0.75, 0.92),
    part(carrosserie, B(0.4, 0.3, 0.04), PAL.rouille, -1.5, 0.95, 0.92),
  ];
  part(carrosserie, B(0.2, 0.25, 1.9), PAL.chrome, 2.15, 0.55, 0);
  part(carrosserie, B(0.2, 0.25, 1.9), PAL.chrome, -2.15, 0.55, 0);
  const roue = G(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 8));
  const bloc = B(0.5, 0.42, 0.5);
  const roues: THREE.Mesh[] = [];
  const blocs: THREE.Mesh[] = [];
  for (const [x, z] of [
    [1.35, 0.9],
    [1.35, -0.9],
    [-1.35, 0.9],
    [-1.35, -0.9],
  ]) {
    roues.push(part(bazou, roue, PAL.pneu, x, 0.42, z, { rx: Math.PI / 2 }));
    // Sur les blocs de béton tant qu'y a pas de pneus.
    blocs.push(part(bazou, bloc, PAL.gravier, x, 0.21, z * 0.8));
  }

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
    part(m, B(5.4, 0.9, 0.1), PAL.declin, 0, 4.3, 2.72);
    part(m, B(4.6, 0.18, 0.12), PAL.rougeGrange, 0, 4.48, 2.74);
    part(m, B(3.6, 0.14, 0.12), PAL.rougeGrange, 0, 4.15, 2.74);
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
  part(garage, B(2.4, 0.5, 0.1), PAL.declin, 0, 3.5, 2.1);
  part(garage, B(1.8, 0.16, 0.12), PAL.rougeGrange, 0, 3.5, 2.12);
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
  part(lot, B(2.2, 1, 0.1), PAL.declin, 3.2, 3.4, -2);
  part(lot, B(1.8, 0.2, 0.12), PAL.rougeGrange, 3.2, 3.6, -2);
  part(lot, B(1.4, 0.16, 0.12), PAL.rougeGrange, 3.2, 3.2, -2);
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
  part(bar, B(3, 0.6, 0.12), PAL.lampe, 0.4, 3.4, 1.9);
  part(bar, B(2.4, 0.14, 0.14), PAL.rougeGrange, 0.4, 3.5, 1.97);
  part(bar, B(1.6, 0.14, 0.14), PAL.rougeGrange, 0.4, 3.28, 1.97);
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
  part(arena, B(3, 0.5, 0.1), PAL.rougeGrange, 0, 2.7, 2.55);
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
  for (const ox of Object.values(ORIGINE)) {
    // Un coin de décor devant chaque endroit, un peu plus gros pour qu'on le voie.
    const coin = (g: THREE.Group) => {
      const c = new THREE.Group();
      c.position.set(ox - 3.4, 0, 3.4);
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
    part(sj, G(new THREE.CylinderGeometry(0.05, 0.05, 3.4, 5)), PAL.poteau, 2.4, 1.7, -0.6);
    part(sj, B(1.3, 0.85, 0.04), PAL.bleu, 3.05, 3, -0.6);
    part(sj, B(1.3, 0.12, 0.05), PAL.declin, 3.05, 3, -0.6);
    part(sj, B(0.12, 0.85, 0.05), PAL.declin, 3.05, 3, -0.6);
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

  // Lumière : la progression du rang, pis la teinte de l'endroit par-dessus.
  let chaleur = 0;
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
    const a = AMBIANCE[lieuActuel];
    if (a) {
      ciel.lerp(teinte.setHex(a.ciel), MELANGE);
      hemi.color.lerp(teinte.setHex(a.lumiere), MELANGE);
      soleil.color.lerp(teinte.setHex(a.soleil), MELANGE);
      hemiForce *= a.force;
      soleilForce *= a.force;
      near *= a.brume;
      far *= a.brume;
    }
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

  const t0 = performance.now();
  let raf = 0;
  const frame = (now: number) => {
    const t = (now - t0) / 1000;
    arbres.forEach((a, i) => (a.rotation.z = Math.sin(t * 1.1 + i) * 0.025));
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
      roues.forEach((r) => (r.visible = look.wheels));
      blocs.forEach((b) => (b.visible = !look.wheels));
      rouille.forEach((r) => (r.visible = !look.clean));
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
      filMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      coupe.remove();
    },
  };
}
