import * as THREE from 'three';
import { CATEGORIES, LOOK, type Categorie } from '../game/look';
import { PAL } from './rang';

// Le bazou en 3D, avec son look. Utilisé dans le rang pis dans l'atelier à Ti-Guy.

export type ChoixLook = Record<Categorie, string>;

export interface Bazou {
  /** Tout le char : on le place pis on le tourne avec ça. */
  groupe: THREE.Group;
  /** La caisse, qui tremble quand le moteur tourne. */
  carrosserie: THREE.Group;
  /** Sur les blocs ou sur ses roues, rouillé ou propre. */
  setEtat(e: { wheels: boolean; clean: boolean }): void;
  setLook(choix: ChoixLook): void;
  dispose(): void;
}

export function creerBazou(): Bazou {
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];
  const G = <T extends THREE.BufferGeometry>(g: T) => (geos.push(g), g);
  const B = (w: number, h: number, d: number) => G(new THREE.BoxGeometry(w, h, d));
  const cache = new Map<number, THREE.MeshPhongMaterial>();
  const nouveau = (c: number) => {
    const m = new THREE.MeshPhongMaterial({ color: c, flatShading: true, shininess: 0, specular: 0x000000 });
    mats.push(m);
    return m;
  };
  /** Une couleur fixe, partagée. */
  const M = (c: number) => cache.get(c) ?? (cache.set(c, nouveau(c)), cache.get(c)!);
  const part = (
    parent: THREE.Object3D,
    geo: THREE.BufferGeometry,
    mat: THREE.Material | number,
    x: number,
    y: number,
    z: number,
    o: { rx?: number; ry?: number; rz?: number; s?: [number, number, number] } = {},
  ) => {
    const m = new THREE.Mesh(geo, typeof mat === 'number' ? M(mat) : mat);
    m.position.set(x, y, z);
    m.rotation.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0);
    if (o.s) m.scale.set(...o.s);
    parent.add(m);
    return m;
  };

  const groupe = new THREE.Group();
  const carrosserie = new THREE.Group();
  groupe.add(carrosserie);
  // La couleur de chaque catégorie : un matériau à changer avec le look.
  const teinte = Object.fromEntries(CATEGORIES.map((c) => [c, nouveau(0xffffff)])) as Record<Categorie, THREE.MeshPhongMaterial>;
  teinte.peinture.color.setHex(PAL.carrosserie);
  part(carrosserie, B(4.2, 0.8, 1.8), teinte.peinture, 0, 0.8, 0);
  part(carrosserie, B(2.2, 0.66, 1.6), PAL.vitre, -0.25, 1.53, 0);
  part(carrosserie, B(2.35, 0.12, 1.7), teinte.peinture, -0.25, 1.9, 0);

  // Chaque option qui se voit est un groupe caché, montré quand elle est posée.
  const options: Partial<Record<string, THREE.Group>> = {};
  const option = (c: Categorie, id: string, parent: THREE.Object3D, faire: (g: THREE.Group, mat: THREE.Material) => void) => {
    const g = new THREE.Group();
    faire(g, teinte[c]);
    g.visible = false;
    parent.add(g);
    options[`${c}:${id}`] = g;
  };

  option('collant', 'numero', carrosserie, (g, mat) => {
    const rond = G(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 10));
    for (const z of [0.91, -0.91]) {
      part(g, rond, mat, -0.3, 0.8, z, { rx: Math.PI / 2 });
      part(g, B(0.08, 0.36, 0.04), PAL.pneu, -0.3, 0.8, z * 1.012);
    }
  });
  option('collant', 'bandes', carrosserie, (g, mat) => {
    for (const z of [-0.22, 0.22]) {
      part(g, B(4.22, 0.02, 0.18), mat, 0, 1.21, z);
      part(g, B(2.37, 0.02, 0.18), mat, -0.25, 1.97, z);
    }
  });
  option('collant', 'flammes', carrosserie, (g, mat) => {
    // Des langues de feu qui partent du devant.
    const f = new THREE.Shape();
    f.moveTo(0, 0);
    for (const [x, y] of [[-0.7, 0.08], [-0.4, 0.18], [-1.0, 0.25], [-0.45, 0.33], [-0.75, 0.45], [0, 0.5]]) f.lineTo(x, y);
    const geo = G(new THREE.ShapeGeometry(f));
    // Le bord de l'autre côté est viré de bord : on le décale pour qu'il parte aussi du devant.
    part(g, geo, mat, 2.05, 0.55, 0.905);
    part(g, geo, mat, 1.05, 0.55, -0.905, { ry: Math.PI });
  });

  // Sur le toit : la galerie sert aussi pour le canot pis le sapin.
  const galerie = (g: THREE.Group) => {
    for (const z of [-0.65, 0.65]) part(g, B(2.1, 0.06, 0.06), PAL.pneu, -0.25, 2.0, z);
    for (const x of [-1.0, -0.25, 0.5]) part(g, B(0.06, 0.06, 1.4), PAL.pneu, x, 2.03, 0);
  };
  option('toit', 'galerie', carrosserie, (g) => galerie(g));
  option('toit', 'matelas', carrosserie, (g, mat) => {
    part(g, B(2.0, 0.24, 1.45), mat, -0.25, 2.08, 0);
    for (const x of [-0.85, 0.35]) part(g, B(0.08, 0.28, 1.5), PAL.pneu, x, 2.08, 0);
  });
  option('toit', 'canot', carrosserie, (g, mat) => {
    galerie(g);
    part(g, G(new THREE.SphereGeometry(1, 8, 4)), mat, -0.25, 2.2, 0, { s: [1.7, 0.2, 0.36] });
  });
  option('toit', 'sapin', carrosserie, (g, mat) => {
    galerie(g);
    part(g, G(new THREE.ConeGeometry(0.42, 1.9, 6)), mat, -0.1, 2.32, 0, { rz: Math.PI / 2 });
    part(g, G(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 5)), PAL.tronc, -1.25, 2.32, 0, { rz: Math.PI / 2 });
    for (const x of [-0.6, 0.3]) part(g, B(0.06, 0.5, 0.9), PAL.rougeGrange, x, 2.3, 0);
  });

  // L'antenne : en arrière, côté passager.
  const tige = (g: THREE.Group) => part(g, G(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 4)), PAL.chrome, -1.8, 1.9, 0.7, { rz: 0.12 });
  option('antenne', 'cb', carrosserie, (g) => {
    tige(g);
    part(g, G(new THREE.SphereGeometry(0.05, 4, 3)), PAL.pneu, -1.88, 2.6, 0.7);
  });
  option('antenne', 'drapeau', carrosserie, (g, mat) => {
    tige(g);
    part(g, B(0.55, 0.36, 0.02), mat, -2.1, 2.4, 0.7);
    // La croix blanche
    part(g, B(0.55, 0.06, 0.03), PAL.declin, -2.1, 2.4, 0.7);
    part(g, B(0.06, 0.36, 0.03), PAL.declin, -2.1, 2.4, 0.7);
  });
  option('antenne', 'raton', carrosserie, (g, mat) => {
    tige(g);
    // Une queue rayée qui pend du bout de l'antenne.
    for (let i = 0; i < 5; i++) part(g, B(0.12, 0.12, 0.12), i % 2 ? PAL.pneu : mat, -1.9 - i * 0.07, 2.55 - i * 0.12, 0.7);
  });

  const rouille = [
    part(carrosserie, B(0.7, 0.45, 0.04), PAL.rouille, 1.2, 0.75, 0.92),
    part(carrosserie, B(0.4, 0.3, 0.04), PAL.rouille, -1.5, 0.95, 0.92),
  ];
  part(carrosserie, B(0.2, 0.25, 1.9), PAL.chrome, 2.15, 0.55, 0);
  part(carrosserie, B(0.2, 0.25, 1.9), PAL.chrome, -2.15, 0.55, 0);

  // Roues, mags pis flaps de bouette. Sur les blocs de béton tant qu'y a pas de pneus.
  const roue = G(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 8));
  const mag = G(new THREE.CylinderGeometry(0.24, 0.24, 0.34, 8));
  const flap = B(0.05, 0.38, 0.3);
  const bloc = B(0.5, 0.42, 0.5);
  const roues: THREE.Mesh[] = [];
  const blocs: THREE.Mesh[] = [];
  const mags: THREE.Mesh[] = [];
  const flaps: THREE.Mesh[] = [];
  for (const [x, z] of [
    [1.35, 0.9],
    [1.35, -0.9],
    [-1.35, 0.9],
    [-1.35, -0.9],
  ]) {
    const r = part(groupe, roue, PAL.pneu, x, 0.42, z, { rx: Math.PI / 2 });
    roues.push(r);
    mags.push(part(r, mag, teinte.mags, 0, 0, 0));
    flaps.push(part(groupe, flap, teinte.flaps, x - 0.52, 0.32, z));
    blocs.push(part(groupe, bloc, PAL.gravier, x, 0.21, z * 0.8));
  }

  let roulettes = false;
  let choix: ChoixLook | null = null;
  const montrer = () => {
    for (const c of CATEGORIES) {
      const o = LOOK[c].options.find((x) => x.id === choix?.[c]) ?? LOOK[c].options[0];
      if (o.couleur !== null) teinte[c].color.setHex(o.couleur);
      for (const x of LOOK[c].options) {
        const g = options[`${c}:${x.id}`];
        if (g) g.visible = x === o;
      }
      if (c === 'mags') mags.forEach((m) => (m.visible = o.couleur !== null));
      if (c === 'flaps') flaps.forEach((f) => (f.visible = roulettes && o.couleur !== null));
    }
  };
  montrer();

  return {
    groupe,
    carrosserie,
    setEtat(e) {
      roulettes = e.wheels;
      roues.forEach((r) => (r.visible = e.wheels));
      blocs.forEach((b) => (b.visible = !e.wheels));
      rouille.forEach((r) => (r.visible = !e.clean));
      montrer();
    },
    setLook(c) {
      choix = c;
      montrer();
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
    },
  };
}
