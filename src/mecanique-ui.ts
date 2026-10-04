// Le mini-jeu de mécanique : une pièce de char à retaper, étape par étape, dans un petit canvas pixelisé.
// Touche les boulons, glisse les pièces, frotte la rouille, serre au torque.
import { C, H, W, texte } from './minijeux-ui';
import { RECETTES, type Etape, type Objet } from './game/mecanique';
import { t } from './game/i18n';

const ROUILLE = '#a0613a';
const CHROME = '#b8b8ae';
const VITRE = '#3a4a52';
const SURFACE: Record<string, string> = { rouille: ROUILLE, vinyle: '#2a2a28', peinture: '#7a6650', chrome: '#6e6e66' };

/** Dessine une pièce, centrée en (x, y). Vieille = rouillée, neuve = propre. */
function objet(g: CanvasRenderingContext2D, o: Objet, x: number, y: number, neuve: boolean) {
  const r = (c: string, dx: number, dy: number, w: number, h: number) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x + dx), Math.round(y + dy), w, h);
  };
  const metal = neuve ? CHROME : ROUILLE;
  if (o === 'roue') {
    g.fillStyle = C.pneu;
    g.beginPath();
    g.arc(x, y, 22, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = metal;
    g.beginPath();
    g.arc(x, y, 12, 0, Math.PI * 2);
    g.fill();
    r(C.pneu, -2, -2, 4, 4);
  } else if (o === 'amortisseur') {
    r(metal, -4, -24, 8, 48);
    for (let i = 0; i < 6; i++) r(neuve ? C.or : C.tole, -9, -20 + i * 7, 18, 3);
  } else if (o === 'moteur') {
    r(neuve ? C.tole : ROUILLE, -26, -12, 52, 26);
    for (let i = 0; i < 4; i++) r(C.pneu, -22 + i * 12, -18, 8, 6);
    r(metal, -30, 4, 6, 10);
  } else if (o === 'transmission') {
    r(neuve ? C.tole : ROUILLE, -24, -10, 34, 20);
    r(neuve ? C.tole : ROUILLE, 10, -6, 16, 12);
    r(metal, 26, -2, 8, 4);
  } else if (o === 'tole') {
    r(neuve ? CHROME : ROUILLE, -34, -16, 68, 32);
    if (!neuve) r(C.pneu, -10, -4, 14, 8);
  } else if (o === 'vitre') {
    r(C.pneu, -36, -18, 72, 36);
    r(VITRE, -33, -15, 66, 30);
    if (!neuve) for (let i = 0; i < 5; i++) r(C.ecrit, -20 + i * 7, -10 + ((i * 7) % 18), 6, 1);
  } else if (o === 'turbo') {
    // L'escargot du turbo
    g.fillStyle = metal;
    g.beginPath();
    g.arc(x, y, 16, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = C.pneu;
    g.beginPath();
    g.arc(x, y, 7, 0, Math.PI * 2);
    g.fill();
    r(metal, 10, -6, 18, 12);
  } else {
    // Le rouleau de vinyle
    r('#2a2a28', -30, -8, 60, 16);
    r(C.tole, -34, -4, 4, 8);
  }
}

interface Jeu {
  dessiner(g: CanvasRenderingContext2D): void;
  toucher(x: number, y: number): void;
  glisser(x: number, y: number): void;
  avancer(dt: number): void;
  fini: boolean;
  rates: number;
}

function jeu(e: Etape): Jeu {
  const j: Jeu = { fini: false, rates: 0, dessiner() {}, toucher() {}, glisser() {}, avancer() {} };
  if (e.type === 'boulons') {
    // En cercle, comme sur un moyeu de roue.
    const boulons = Array.from({ length: e.n }, (_, i) => {
      const a = (i / e.n) * Math.PI * 2 - Math.PI / 2;
      return { x: 80 + Math.cos(a) * 30, y: 64 + Math.sin(a) * 30, la: true };
    });
    j.dessiner = (g) => {
      g.fillStyle = C.tole;
      g.beginPath();
      g.arc(80, 64, 40, 0, Math.PI * 2);
      g.fill();
      for (const b of boulons) {
        g.fillStyle = b.la ? C.or : C.ligne;
        g.fillRect(b.x - 5, b.y - 5, 10, 10);
        if (b.la) {
          g.fillStyle = C.pneu;
          g.fillRect(b.x - 2, b.y - 2, 4, 4);
        }
      }
    };
    j.toucher = (x, y) => {
      const b = boulons.find((b) => b.la && Math.abs(b.x - x) < 10 && Math.abs(b.y - y) < 10);
      if (b) b.la = false;
      j.fini = boulons.every((b) => !b.la);
    };
  } else if (e.type === 'tirer') {
    let pos = { x: 80, y: 64 };
    let prise: { x: number; y: number } | null = null;
    j.dessiner = (g) => {
      g.strokeStyle = C.ligne;
      g.strokeRect(46, 34, 68, 60);
      objet(g, e.objet, pos.x, pos.y, false);
    };
    j.toucher = (x, y) => (prise = Math.abs(x - pos.x) < 36 && Math.abs(y - pos.y) < 30 ? { x: x - pos.x, y: y - pos.y } : null);
    j.glisser = (x, y) => {
      if (!prise || j.fini) return;
      pos = { x: x - prise.x, y: y - prise.y };
      // Assez loin de sa place : elle est sortie.
      if (Math.hypot(pos.x - 80, pos.y - 64) > 50) j.fini = true;
    };
  } else if (e.type === 'poser') {
    let pos = { x: 30, y: 98 };
    let prise: { x: number; y: number } | null = null;
    j.dessiner = (g) => {
      // La place vide, en pointillé
      g.strokeStyle = C.vert;
      g.setLineDash([3, 3]);
      g.strokeRect(46, 22, 68, 56);
      g.setLineDash([]);
      objet(g, e.objet, pos.x, pos.y, true);
    };
    j.toucher = (x, y) => (prise = Math.abs(x - pos.x) < 36 && Math.abs(y - pos.y) < 30 ? { x: x - pos.x, y: y - pos.y } : null);
    j.glisser = (x, y) => {
      if (!prise || j.fini) return;
      pos = { x: x - prise.x, y: y - prise.y };
      if (Math.hypot(pos.x - 80, pos.y - 50) < 10) {
        pos = { x: 80, y: 50 };
        j.fini = true;
      }
    };
  } else if (e.type === 'frotter') {
    const T = 10;
    const cases = Array.from({ length: 8 * 6 }, () => true);
    const reste = () => cases.filter(Boolean).length / cases.length;
    j.dessiner = (g) => {
      g.fillStyle = e.couleur === 'peinture' ? '#8a2f26' : e.couleur === 'chrome' ? CHROME : C.tole;
      g.fillRect(40, 30, 80, 60);
      if (e.couleur === 'peinture') {
        // Les flammes apparaissent en dessous de la peinture
        g.fillStyle = '#c0702a';
        for (let i = 0; i < 5; i++) g.fillRect(40, 38 + i * 11, 30 + ((i * 23) % 45), 5);
      }
      g.fillStyle = SURFACE[e.couleur];
      cases.forEach((c, i) => c && g.fillRect(40 + (i % 8) * T, 30 + Math.floor(i / 8) * T, T, T));
      g.fillStyle = C.ligne;
      g.fillRect(40, 96, 80, 4);
      g.fillStyle = C.vert;
      g.fillRect(40, 96, 80 * (1 - reste()), 4);
    };
    j.glisser = (x, y) => {
      for (let i = 0; i < cases.length; i++) {
        const cx = 40 + (i % 8) * T + T / 2;
        const cy = 30 + Math.floor(i / 8) * T + T / 2;
        if (Math.abs(cx - x) < 9 && Math.abs(cy - y) < 9) cases[i] = false;
      }
      if (reste() <= 0.1) j.fini = true;
    };
    j.toucher = j.glisser;
  } else {
    // Serrer au torque : l'aiguille va-et-vient, faut taper dans le vert.
    let temps = 0;
    let flash = 0;
    const aiguille = () => {
      const k = (temps * 0.9) % 2;
      return k < 1 ? k : 2 - k;
    };
    j.avancer = (dt) => {
      temps += dt;
      flash = Math.max(0, flash - dt);
    };
    j.dessiner = (g) => {
      texte(g, t('TORQUE'), 80, 50);
      g.fillStyle = C.ligne;
      g.fillRect(10, 62, 140, 14);
      g.fillStyle = C.vert;
      g.fillRect(10 + 0.68 * 140, 62, 0.18 * 140, 14);
      g.fillStyle = C.or;
      g.fillRect(10 + aiguille() * 140 - 1, 58, 3, 22);
      if (flash > 0) texte(g, t('TROP LÂCHE!'), 80, 100, C.alerte, 18);
    };
    j.toucher = () => {
      if (Math.abs(aiguille() - 0.77) <= 0.09) j.fini = true;
      else {
        j.rates++;
        flash = 0.6;
      }
    };
  }
  return j;
}

export function createMecanique(o: {
  dialog: HTMLDialogElement;
  /** La pièce est posée : la payer, sauver, son, message. */
  fini: (pieceId: string, rates: number) => void;
}) {
  const canvas = o.dialog.querySelector('canvas')!;
  const g = canvas.getContext('2d')!;
  const titre = o.dialog.querySelector<HTMLElement>('.mj-titre')!;
  const aide = o.dialog.querySelector<HTMLElement>('.mj-aide')!;
  let partie: { piece: string; etapes: readonly Etape[]; i: number; j: Jeu; rates: number; pause: number } | null = null;
  let raf = 0;
  let avant = 0;

  const fermer = () => {
    cancelAnimationFrame(raf);
    partie = null;
    if (o.dialog.open) o.dialog.close();
  };
  const etape = () => {
    const p = partie!;
    p.j = jeu(p.etapes[p.i]);
    aide.textContent = `${p.i + 1}/${p.etapes.length} · ${t(p.etapes[p.i].texte)}`;
  };
  const frame = (now: number) => {
    const p = partie;
    if (!p) return;
    const dt = Math.min(0.1, (now - avant) / 1000);
    avant = now;
    p.j.avancer(dt);
    g.fillStyle = C.fond;
    g.fillRect(0, 0, W, H);
    p.j.dessiner(g);
    if (p.j.fini) {
      // Une petite pause sur l'étape réussie, pis la suivante.
      p.pause += dt;
      texte(g, t('BEN BEAU!'), W / 2, 16, C.vert, 18);
      if (p.pause > 0.5) {
        p.rates += p.j.rates;
        p.pause = 0;
        p.i++;
        if (p.i >= p.etapes.length) {
          const { piece, rates } = p;
          fermer();
          o.fini(piece, rates);
          return;
        }
        etape();
      }
    }
    raf = requestAnimationFrame(frame);
  };

  const pos = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H] as const;
  };
  let doigt = false;
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    doigt = true;
    canvas.setPointerCapture(e.pointerId);
    if (!partie?.j.fini) partie?.j.toucher(...pos(e));
  });
  canvas.addEventListener('pointermove', (e) => {
    if (doigt && !partie?.j.fini) partie?.j.glisser(...pos(e));
  });
  const lever = () => (doigt = false);
  canvas.addEventListener('pointerup', lever);
  canvas.addEventListener('pointercancel', lever);
  o.dialog.addEventListener('keydown', (e) => {
    if (partie?.etapes[partie.i].type !== 'serrer' || ![' ', 'Enter'].includes(e.key)) return;
    e.preventDefault();
    partie.j.toucher(0, 0);
  });
  // Lâcher en chemin : rien de payé, la pièce reste à poser.
  o.dialog.querySelector('.mj-lacher')!.addEventListener('click', fermer);
  o.dialog.addEventListener('close', fermer);

  return {
    /** Ouvre le mini-jeu pour une pièce. Faux si la pièce a pas de recette. */
    lancer(piece: string, nom: string): boolean {
      const etapes = RECETTES[piece];
      if (!etapes) return false;
      partie = { piece, etapes, i: 0, j: jeu(etapes[0]), rates: 0, pause: 0 };
      titre.textContent = nom.toUpperCase();
      etape();
      o.dialog.showModal();
      avant = performance.now();
      raf = requestAnimationFrame(frame);
      return true;
    },
  };
}
