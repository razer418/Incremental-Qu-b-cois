// Les mini-jeux à l'écran : une liste pour les lancer, pis une boîte avec un petit canvas pixelisé.
// Tout se joue au doigt (ou à la souris, pis aux flèches/espace sur l'ordi).
import { MINIJEUX, finirPartie, getMiniJeu, peutJouer, recompense, repos, type MiniJeuId } from './game/minijeux';
import { choisie } from './game/look';
import type { GameState } from './game/state';
import { formatMoney } from './game/format';
import { t } from './game/i18n';

const W = 160;
const H = 120;
const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const C = {
  fond: '#151714',
  ecrit: '#d8d2bf',
  or: '#e8c26a',
  vert: '#9fb58a',
  alerte: '#c8553d',
  gravier: '#8c8170',
  neige: '#cfd0c8',
  neigeOmbre: '#a9aca3',
  boue: '#5f6342',
  tole: '#5d5f60',
  pneu: '#1c1c1a',
  ligne: '#353930',
};

interface Partie {
  aide: string;
  /** Avance de dt secondes. */
  avancer(dt: number): void;
  dessiner(g: CanvasRenderingContext2D): void;
  /** Un doigt qui touche (x, y en pixels du canvas). */
  toucher(x: number, y: number): void;
  /** Un doigt qui glisse. */
  glisser?(x: number, y: number): void;
  touche?(k: string): void;
  /** Le score de 0 à 1 quand c'est fini, sinon null. */
  score: number | null;
}

const texte = (g: CanvasRenderingContext2D, s: string, x: number, y: number, couleur = C.ecrit, taille = 14) => {
  g.fillStyle = couleur;
  g.font = `${taille}px VT323, monospace`;
  g.textAlign = 'center';
  g.fillText(s, x, y);
};
const barreTemps = (g: CanvasRenderingContext2D, reste: number) => {
  g.fillStyle = C.ligne;
  g.fillRect(0, 0, W, 4);
  g.fillStyle = reste < 0.25 ? C.alerte : C.or;
  g.fillRect(0, 0, W * Math.max(0, reste), 4);
};

// Réparer le moteur : trois coups de clé, l'aiguille doit être dans le vert.
function moteur(): Partie {
  const COUPS = 3;
  let coup = 0;
  let reussis = 0;
  let temps = 0;
  let pause = 0;
  let dernier = '';
  const zone = () => ({ centre: 0.2 + Math.random() * 0.6, largeur: 0.24 - coup * 0.05 });
  let z = zone();
  const aiguille = () => {
    // Va-et-vient à vitesse constante, plus vite à chaque coup.
    const k = (temps * (0.7 + coup * 0.3)) % 2;
    return k < 1 ? k : 2 - k;
  };
  const p: Partie = {
    aide: t("Tape quand l'aiguille est dans le vert."),
    score: null,
    avancer(dt) {
      if (pause > 0) {
        pause -= dt;
        if (pause <= 0) {
          if (coup >= COUPS) p.score = reussis / COUPS;
          else z = zone();
        }
        return;
      }
      temps += dt;
    },
    dessiner(g) {
      // Le bloc moteur
      g.fillStyle = C.tole;
      g.fillRect(45, 22, 70, 36);
      g.fillStyle = C.pneu;
      for (let i = 0; i < 4; i++) g.fillRect(52 + i * 15, 16, 10, 8);
      g.fillStyle = C.ligne;
      g.fillRect(40, 58, 80, 6);
      texte(g, t('COUP DE CLÉ {n}/{total}', { n: Math.min(coup + 1, COUPS), total: COUPS }), W / 2, 80);
      // La jauge
      g.fillStyle = C.ligne;
      g.fillRect(10, 90, 140, 14);
      g.fillStyle = C.vert;
      g.fillRect(10 + (z.centre - z.largeur / 2) * 140, 90, z.largeur * 140, 14);
      g.fillStyle = C.or;
      g.fillRect(10 + aiguille() * 140 - 1, 86, 3, 22);
      if (pause > 0) texte(g, dernier, W / 2, 44, dernier === t('VROUM!') ? C.vert : C.alerte, 22);
    },
    toucher() {
      if (pause > 0 || p.score !== null) return;
      const ok = Math.abs(aiguille() - z.centre) <= z.largeur / 2;
      if (ok) reussis++;
      dernier = t(ok ? 'VROUM!' : 'CLONK!');
      coup++;
      pause = 0.7;
    },
    touche(k) {
      if (k === ' ' || k === 'Enter') p.toucher(0, 0);
    },
  };
  return p;
}

// Déneiger l'entrée : passe le doigt sur la neige avant la fin du temps.
function deneiger(): Partie {
  const DUREE = 12;
  const T = 10;
  const COLS = W / T;
  const LIGNES = 9;
  const HAUT = 20;
  const neige = new Array<boolean>(COLS * LIGNES).fill(true);
  let reste = DUREE;
  const pelleter = (x: number, y: number) => {
    for (let i = 0; i < neige.length; i++) {
      const cx = (i % COLS) * T + T / 2;
      const cy = HAUT + Math.floor(i / COLS) * T + T / 2;
      if ((cx - x) ** 2 + (cy - y) ** 2 <= 13 ** 2) neige[i] = false;
    }
  };
  const fraction = () => neige.filter((n) => !n).length / neige.length;
  const p: Partie = {
    aide: t('Passe ton doigt sur la neige pour pelleter.'),
    score: null,
    avancer(dt) {
      reste -= dt;
      // Un peu de neige qui reste dans les coins, c'est correct : 95 %, c'est parfait.
      if (reste <= 0 || fraction() >= 0.95) p.score = Math.min(1, fraction() / 0.95);
    },
    dessiner(g) {
      barreTemps(g, reste / DUREE);
      g.fillStyle = C.gravier;
      g.fillRect(0, HAUT, W, LIGNES * T);
      neige.forEach((n, i) => {
        if (!n) return;
        g.fillStyle = (i + Math.floor(i / COLS)) % 2 ? C.neige : C.neigeOmbre;
        g.fillRect((i % COLS) * T, HAUT + Math.floor(i / COLS) * T, T, T);
      });
      texte(g, `${Math.floor(fraction() * 100)} %`, W / 2, 16, C.ecrit, 12);
    },
    toucher: (x, y) => pelleter(x, y),
    glisser: (x, y) => pelleter(x, y),
  };
  return p;
}

// Derby de démolition : change de voie pour éviter les autres chars.
function demolition(couleur: string): Partie {
  const DUREE = 20;
  const VIES = 3;
  const VOIES = [W / 6, W / 2, (W * 5) / 6];
  const MOI_Y = 100;
  const couleurs = ['#6e2f28', '#8a835a', '#7f7f78', '#5f7488', '#a47a3c'];
  let voie = 1;
  let temps = 0;
  let coups = 0;
  let prochain = 0.5;
  let secousse = 0;
  const autres: { voie: number; y: number; c: string }[] = [];
  const char = (g: CanvasRenderingContext2D, x: number, y: number, c: string) => {
    g.fillStyle = C.pneu;
    g.fillRect(x - 12, y - 9, 24, 5);
    g.fillRect(x - 12, y + 4, 24, 5);
    g.fillStyle = c;
    g.fillRect(x - 10, y - 11, 20, 22);
    g.fillStyle = C.ligne;
    g.fillRect(x - 7, y - 5, 14, 6);
  };
  const p: Partie = {
    aide: t('Tape à gauche ou à droite pour changer de voie.'),
    score: null,
    avancer(dt) {
      temps += dt;
      secousse = Math.max(0, secousse - dt);
      const vitesse = 55 + temps * 4;
      prochain -= dt;
      if (prochain <= 0) {
        autres.push({ voie: Math.floor(Math.random() * 3), y: -15, c: couleurs[Math.floor(Math.random() * couleurs.length)] });
        prochain = Math.max(0.45, 0.9 - temps * 0.02);
      }
      for (const a of autres) a.y += vitesse * dt;
      for (let i = autres.length - 1; i >= 0; i--) {
        const a = autres[i];
        if (a.voie === voie && Math.abs(a.y - MOI_Y) < 18) {
          coups++;
          secousse = 0.3;
          autres.splice(i, 1);
        } else if (a.y > H + 20) autres.splice(i, 1);
      }
      if (coups >= VIES) p.score = 0;
      else if (temps >= DUREE) p.score = 1 - coups / VIES;
    },
    dessiner(g) {
      g.save();
      if (secousse > 0) g.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
      g.fillStyle = C.boue;
      g.fillRect(-4, -4, W + 8, H + 8);
      g.fillStyle = C.ligne;
      for (const x of [W / 3, (W * 2) / 3]) for (let y = (temps * 60) % 16; y < H; y += 16) g.fillRect(x - 1, y, 2, 8);
      for (const a of autres) char(g, VOIES[a.voie], a.y, a.c);
      char(g, VOIES[voie], MOI_Y, couleur);
      g.restore();
      barreTemps(g, 1 - temps / DUREE);
      texte(g, '♥'.repeat(VIES - coups), W - 16, 16, C.alerte, 12);
      if (secousse > 0) texte(g, t('BANG!'), W / 2, 50, C.or, 24);
    },
    toucher(x) {
      voie = Math.max(0, Math.min(2, voie + (x < W / 2 ? -1 : 1)));
    },
    touche(k) {
      if (k === 'ArrowLeft') p.toucher(0, 0);
      if (k === 'ArrowRight') p.toucher(W, 0);
    },
  };
  return p;
}

export function createMiniJeux(o: {
  liste: HTMLElement;
  section: HTMLElement;
  dialog: HTMLDialogElement;
  etat: () => GameState;
  /** Fin de partie payée : sauver, son, message. */
  fini: (message: string) => void;
}) {
  const canvas = o.dialog.querySelector('canvas')!;
  const g = canvas.getContext('2d')!;
  const titre = o.dialog.querySelector<HTMLElement>('.mj-titre')!;
  const aide = o.dialog.querySelector<HTMLElement>('.mj-aide')!;
  let partie: { id: MiniJeuId; p: Partie } | null = null;
  let raf = 0;
  let avant = 0;

  const fermer = () => {
    cancelAnimationFrame(raf);
    partie = null;
    if (o.dialog.open) o.dialog.close();
  };
  const frame = (now: number) => {
    if (!partie) return;
    const dt = Math.min(0.1, (now - avant) / 1000);
    avant = now;
    partie.p.avancer(dt);
    g.fillStyle = C.fond;
    g.fillRect(0, 0, W, H);
    partie.p.dessiner(g);
    if (partie.p.score !== null) {
      const { id, p } = partie;
      fermer();
      const x = finirPartie(o.etat(), id, p.score!, Date.now());
      const cash = formatMoney(x);
      if (p.score! >= 0.9) o.fini(t('Du travail de pro! +{cash}', { cash }));
      else if (p.score! >= 0.5) o.fini(t('Pas pire pantoute. +{cash}', { cash }));
      else o.fini(t('Ouin... Tu feras mieux la prochaine fois. +{cash}', { cash }));
      return;
    }
    raf = requestAnimationFrame(frame);
  };
  const lancer = (id: MiniJeuId) => {
    if (!peutJouer(o.etat(), id, Date.now())) return;
    const peinture = choisie(o.etat(), 'peinture').couleur!;
    const p = id === 'moteur' ? moteur() : id === 'deneiger' ? deneiger() : demolition(hex(peinture));
    partie = { id, p };
    titre.textContent = t(getMiniJeu(id)!.nom).toUpperCase();
    aide.textContent = p.aide;
    o.dialog.showModal();
    avant = performance.now();
    raf = requestAnimationFrame(frame);
  };

  // Les doigts pis la souris, en pixels du canvas.
  const pos = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H] as const;
  };
  let doigt = false;
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    doigt = true;
    canvas.setPointerCapture(e.pointerId);
    partie?.p.toucher(...pos(e));
  });
  canvas.addEventListener('pointermove', (e) => {
    if (doigt) partie?.p.glisser?.(...pos(e));
  });
  const lever = () => (doigt = false);
  canvas.addEventListener('pointerup', lever);
  canvas.addEventListener('pointercancel', lever);
  o.dialog.addEventListener('keydown', (e) => {
    if (!partie?.p.touche || !['ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)) return;
    e.preventDefault();
    partie.p.touche(e.key);
  });
  // Lâcher en chemin : pas de cash, mais pas d'attente non plus.
  o.dialog.querySelector('.mj-lacher')!.addEventListener('click', fermer);
  o.dialog.addEventListener('close', fermer);

  const rows = MINIJEUX.map((m) => {
    const li = document.createElement('li');
    li.className = 'upgrade';
    li.innerHTML = `
      <div class="upgrade-info"><strong></strong><small></small></div>
      <button type="button" class="buy"><span class="cost"></span><span class="combien"></span></button>`;
    li.querySelector('strong')!.textContent = t(m.nom);
    const btn = li.querySelector<HTMLButtonElement>('.buy')!;
    btn.addEventListener('click', () => lancer(m.id));
    o.liste.append(li);
    return { m, btn, small: li.querySelector('small')!, cost: li.querySelector<HTMLElement>('.cost')!, combien: li.querySelector<HTMLElement>('.combien')! };
  });

  return {
    render(): void {
      const s = o.etat();
      const now = Date.now();
      o.section.hidden = MINIJEUX.every((m) => m.bloque(s) !== null) && !s.car.owned;
      if (o.section.hidden) return;
      for (const r of rows) {
        const bloque = r.m.bloque(s);
        const attente = Math.ceil(repos(s, r.m.id, now) / 1000);
        r.small.textContent = bloque ?? t(r.m.description);
        r.cost.textContent = bloque ? '-' : attente > 0 ? `${Math.floor(attente / 60)}:${String(attente % 60).padStart(2, '0')}` : t('JOUER');
        r.combien.textContent = bloque || attente > 0 ? '' : t("jusqu'à {cash}", { cash: formatMoney(recompense(s, r.m.id, 1)) });
        r.btn.disabled = !!bloque || attente > 0;
      }
    },
  };
}
