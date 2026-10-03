import * as THREE from 'three';

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
} as const;

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

export interface CarLook {
  garage: boolean;
  concession: boolean;
  owned: boolean;
  wheels: boolean;
  clean: boolean;
}

export type Lieu = 'maison' | 'garage' | 'concession';

export interface Rang {
  setCar(look: CarLook): void;
  /** Glisse la caméra vers un endroit du rang. */
  allerA(lieu: Lieu): void;
  /** 0 = début (gris), 1 = plus tard (chaud). */
  setWarmth(w: number): void;
  setPixelScale(scale: number): void;
  dispose(): void;
}

export function createRang(host: HTMLElement, opts: { pixelScale?: number; reduceMotion?: boolean } = {}): Rang | null {
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
      m = new THREE.MeshPhongMaterial({ color: c, flatShading: true, shininess: 0, specular: 0x000000 });
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

  // Sol, champ, route, entrée
  plan(160, 160, PAL.herbe, 0, 0, 0);
  plan(30, 14, PAL.champ, -6, 0.01, -14);
  plan(160, 3.8, PAL.gravier, 0, 0.02, 6.4);
  plan(3.2, 5, PAL.gravier, 4.6, 0.02, 2.6);

  // Collines au loin
  for (const [x, z, s] of [
    [-26, -38, 16],
    [6, -44, 20],
    [34, -36, 15],
  ]) {
    part(scene, G(new THREE.IcosahedronGeometry(s, 1)), PAL.herbeSombre, x, 0, z, { s: [1, 0.32, 1] });
  }

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

  // Le bazou (à vendre pour l'instant : c'est l'objectif)
  const bazou = new THREE.Group();
  bazou.position.set(4.6, 0, 2.4);
  bazou.rotation.y = -0.55;
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

  // Le garage à Ti-Guy (caché tant qu'il est pas acheté)
  const garage = new THREE.Group();
  garage.position.set(-7.6, 0, 1.6);
  garage.rotation.y = 0.15;
  scene.add(garage);
  part(garage, B(4.4, 3, 4), PAL.tole, 0, 1.5, 0);
  part(garage, B(4.8, 0.2, 4.4), PAL.rougeGrange, 0, 3.1, 0);
  part(garage, B(2.6, 2.2, 0.08), PAL.bois, 0.5, 1.1, 2.02);
  for (let i = 0; i < 4; i++) part(garage, B(2.6, 0.06, 0.1), PAL.poteau, 0.5, 0.4 + i * 0.5, 2.06);
  part(garage, B(0.7, 0.7, 0.08), PAL.vitre, -1.55, 1.9, 2.02);
  part(garage, B(2.4, 0.5, 0.1), PAL.declin, 0, 3.5, 2.1);
  part(garage, B(1.8, 0.16, 0.12), PAL.rougeGrange, 0, 3.5, 2.12);
  garage.visible = false;

  // Le concessionnaire : un lot de chars avec des fanions
  const lot = new THREE.Group();
  lot.position.set(9.3, 0, 2.6);
  lot.rotation.y = -0.2;
  scene.add(lot);
  part(lot, G(new THREE.PlaneGeometry(7, 4.6)), PAL.gravier, 0, 0.03, 0, { rx: -Math.PI / 2 });
  const miniChar = (c: number, x: number, z: number, ry: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    lot.add(g);
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
  miniChar(PAL.rougeGrange, -1.8, -0.9, 0.5);
  miniChar(PAL.champ, 0.9, -1.1, 0.5);
  miniChar(PAL.chrome, -0.6, 1.2, 0.5);
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

  // Érables et sapins
  const arbres: THREE.Group[] = [];
  const tronc = G(new THREE.CylinderGeometry(0.18, 0.25, 2.2, 6));
  [
    [-7, -5, 1.5],
    [-5.5, -8, 1.8],
    [3.5, -7, 1.6],
    [7, -4, 1.3],
    [-11.5, -1, 1.4],
  ].forEach(([x, z, s], i) => {
    const t = new THREE.Group();
    t.position.set(x, 0, z);
    scene.add(t);
    part(t, tronc, PAL.tronc, 0, 1.1, 0);
    part(t, G(new THREE.IcosahedronGeometry(s, 0)), PAL.erables[i % 3], 0, 2.4 + s * 0.6, 0);
    arbres.push(t);
  });
  const troncSapin = G(new THREE.CylinderGeometry(0.15, 0.2, 1, 6));
  const sapinBas = G(new THREE.ConeGeometry(1.4, 2.6, 6));
  const sapinHaut = G(new THREE.ConeGeometry(1.0, 2.0, 6));
  for (const [x, z] of [
    [-12, -9],
    [10, -9],
    [12, -2],
    [-14, -3],
    [0, -11],
  ]) {
    const t = new THREE.Group();
    t.position.set(x, 0, z);
    scene.add(t);
    part(t, troncSapin, PAL.tronc, 0, 0.5, 0);
    part(t, sapinBas, PAL.sapin, 0, 2.0, 0);
    part(t, sapinHaut, PAL.sapin, 0, 3.3, 0);
    arbres.push(t);
  }

  // Poteaux et fils d'Hydro
  const poteaux = [-16, -2, 12];
  for (const x of poteaux) {
    part(scene, G(new THREE.CylinderGeometry(0.12, 0.14, 6.5, 6)), PAL.poteau, x, 3.25, 8.8);
    part(scene, B(1.8, 0.12, 0.12), PAL.poteau, x, 6.2, 8.8);
  }
  const filMat = new THREE.LineBasicMaterial({ color: 0x2a2622 });
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

  const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.1, 200);
  // Visé un peu haut : le décor descend dans le cadre pis laisse le ciel au HUD.
  // Chaque endroit : où on vise, pis à quelle distance (1 = vue du rang au complet).
  const LIEUX: Record<Lieu, { cible: THREE.Vector3; dist: number }> = {
    maison: { cible: new THREE.Vector3(0.5, 3.4, 0), dist: 1 },
    garage: { cible: new THREE.Vector3(-7.6, 3.7, 1.6), dist: 0.55 },
    concession: { cible: new THREE.Vector3(10, 3.6, 2.6), dist: 0.6 },
  };
  const DIRECTION = new THREE.Vector3(11, 8.5, 21).sub(LIEUX.maison.cible);
  let recul = 1;
  const vue = (lieu: Lieu) => {
    const { cible, dist } = LIEUX[lieu];
    return { cible, pos: cible.clone().addScaledVector(DIRECTION, dist * recul) };
  };
  // La caméra glisse d'une vue à l'autre.
  let depart = vue('maison');
  let arrivee = depart;
  let lieuActuel: Lieu = 'maison';
  let glisseDebut = -Infinity;
  const GLISSE_MS = 1400;
  const cibleCam = new THREE.Vector3();
  const poserCamera = (now: number) => {
    const t = Math.min(1, (now - glisseDebut) / GLISSE_MS);
    const k = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    camera.position.lerpVectors(depart.pos, arrivee.pos, k);
    cibleCam.lerpVectors(depart.cible, arrivee.cible, k);
    camera.lookAt(cibleCam);
    return t < 1;
  };
  const placerCamera = (aspect: number) => {
    camera.aspect = aspect;
    // Écran étroit (téléphone) : on recule pour garder la maison pis le bazou dans le cadre.
    recul = aspect < 1.2 ? 1.25 : 1;
    depart = arrivee = vue(lieuActuel);
    poserCamera(Infinity);
    camera.updateProjectionMatrix();
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

  const t0 = performance.now();
  let raf = 0;
  const frame = (now: number) => {
    const t = (now - t0) / 1000;
    arbres.forEach((a, i) => (a.rotation.z = Math.sin(t * 1.1 + i) * 0.025));
    carrosserie.position.y = Math.sin(t * 28) * 0.012;
    poserCamera(now);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  // Sans animation du décor, on anime quand même la caméra le temps du glissement.
  let glisseRaf = 0;
  const glisse = (now: number) => {
    const encore = poserCamera(now);
    renderer.render(scene, camera);
    glisseRaf = encore && !raf ? requestAnimationFrame(glisse) : 0;
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

  return {
    setCar(look) {
      garage.visible = look.garage;
      lot.visible = look.concession;
      // La pile de pneus déménage dans le garage, la pancarte disparaît avec la vente.
      pilePneus.forEach((p) => (p.visible = !look.concession));
      pancarte.visible = !look.owned;
      roues.forEach((r) => (r.visible = look.wheels));
      blocs.forEach((b) => (b.visible = !look.wheels));
      rouille.forEach((r) => (r.visible = !look.clean));
      if (!raf) renderer.render(scene, camera);
    },
    allerA(lieu) {
      if (lieu === lieuActuel) return;
      const now = performance.now();
      poserCamera(now);
      depart = { cible: cibleCam.clone(), pos: camera.position.clone() };
      arrivee = vue(lieu);
      lieuActuel = lieu;
      if (opts.reduceMotion) {
        poserCamera(Infinity);
        renderer.render(scene, camera);
        return;
      }
      glisseDebut = now;
      if (!raf && !glisseRaf) glisseRaf = requestAnimationFrame(glisse);
    },
    setWarmth(w) {
      const k = Math.min(1, Math.max(0, w));
      ciel.lerpColors(DEBUT.ciel, TARD.ciel, k);
      fog.color.copy(ciel);
      fog.near = THREE.MathUtils.lerp(DEBUT.brume[0], TARD.brume[0], k);
      fog.far = THREE.MathUtils.lerp(DEBUT.brume[1], TARD.brume[1], k);
      hemi.color.lerpColors(DEBUT.hemiCiel, TARD.hemiCiel, k);
      hemi.groundColor.lerpColors(DEBUT.hemiSol, TARD.hemiSol, k);
      hemi.intensity = THREE.MathUtils.lerp(DEBUT.hemiForce, TARD.hemiForce, k) * Math.PI;
      soleil.color.lerpColors(DEBUT.soleil, TARD.soleil, k);
      soleil.intensity = THREE.MathUtils.lerp(DEBUT.soleilForce, TARD.soleilForce, k) * Math.PI;
      soleil.position.lerpVectors(DEBUT.soleilPos, TARD.soleilPos, k);
      if (!raf) renderer.render(scene, camera);
    },
    setPixelScale(scale) {
      pixelScale = scale;
      resize();
    },
    dispose() {
      stop();
      cancelAnimationFrame(glisseRaf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      filMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
