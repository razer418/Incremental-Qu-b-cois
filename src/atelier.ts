// L'atelier à Ti-Guy : un écran juste pour le look du bazou.
// Le bazou tourne en gros plan, des onglets par catégorie, pis une grille de pièces.
// Toucher une pièce l'essaie (aperçu); le bouton du bas l'achète ou la pose.
import * as THREE from 'three';
import { CATEGORIES, LOOK, possede, poser, type Categorie, type Option } from './game/look';
import { assez, isRepaired, type GameState } from './game/state';
import { formatMoney } from './game/format';
import { cite, t } from './game/i18n';
import { critereOk, dejaInscrit, inscrire, noteExpo, prixExpo, themeA } from './game/expo';
import { resteSaison } from './game/saisons';
import { CHARACTERS } from './game/quests';
import { creerBazou, type ChoixLook } from './scene/bazou';
import { PAL } from './scene/rang';

/** Le petit garage en 3D, avec le bazou qui tourne. Null si y'a pas de WebGL. */
function creerVue(host: HTMLElement, reduceMotion: boolean) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(1);
  renderer.domElement.className = 'atelier-canvas';
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2a2a26);
  scene.add(new THREE.HemisphereLight(0xe6e1d2, 0x3a352c, 0.9 * Math.PI));
  const lampe = new THREE.DirectionalLight(0xffd9a0, 0.8 * Math.PI);
  lampe.position.set(3, 8, 5);
  scene.add(lampe);
  const mat = (c: number) => new THREE.MeshPhongMaterial({ color: c, flatShading: true, shininess: 0, specular: 0x000000 });
  // Plancher de béton pis mur de tôle
  const plancher = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), mat(0x6a665c));
  plancher.rotation.x = -Math.PI / 2;
  scene.add(plancher);
  const mur = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 0.2), mat(PAL.tole));
  mur.position.set(0, 4, -5);
  scene.add(mur);
  const etabli = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 0.8), mat(PAL.bois));
  etabli.position.set(-4, 0.5, -4.3);
  scene.add(etabli);

  const bazou = creerBazou();
  scene.add(bazou.groupe);
  const camera = new THREE.PerspectiveCamera(36, 4 / 3, 0.1, 100);
  const cadrer = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(Math.max(1, Math.round(w / 3)), Math.max(1, Math.round(h / 3)), false);
    camera.aspect = w / h;
    // Écran étroit : on recule pour garder tout le char.
    const recul = camera.aspect < 1.2 ? 1.35 : 1.2;
    camera.position.set(0, 2.6 * recul, 7.5 * recul);
    camera.lookAt(0, 0.9, 0);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(cadrer).observe(host);

  // Le char tourne tout seul; on peut le virer avec le doigt.
  let angle = -0.6;
  let doigt: number | null = null;
  let touche = 0;
  host.addEventListener('pointerdown', (e) => {
    doigt = e.clientX;
    host.setPointerCapture(e.pointerId);
  });
  host.addEventListener('pointermove', (e) => {
    if (doigt === null) return;
    angle += (e.clientX - doigt) * 0.012;
    doigt = e.clientX;
    touche = performance.now();
  });
  const lever = () => (doigt = null);
  host.addEventListener('pointerup', lever);
  host.addEventListener('pointercancel', lever);

  let raf = 0;
  let avant = 0;
  const frame = (now: number) => {
    const dt = Math.min(0.1, (now - avant) / 1000);
    avant = now;
    if (!reduceMotion && doigt === null && now - touche > 2000) angle += dt * 0.4;
    bazou.groupe.rotation.y = angle;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  return {
    bazou,
    demarrer() {
      cadrer();
      avant = performance.now();
      if (!raf) raf = requestAnimationFrame(frame);
    },
    arreter() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}

export function createAtelier(o: {
  dialog: HTMLDialogElement;
  etat: () => GameState;
  reduceMotion: boolean;
  /** Après un achat ou un changement : sauver, son, réafficher. */
  change: (achat: boolean) => void;
  /** Le résultat de l'expo : sauver, son, message. */
  expo: (message: string) => void;
}) {
  const $ = (sel: string) => o.dialog.querySelector<HTMLElement>(sel)!;
  const onglets = $('.atelier-onglets');
  const grille = $('.atelier-grille');
  const cashEl = $('.atelier-cash');
  const choixEl = $('.atelier-choix');
  const action = $('.atelier-action') as HTMLButtonElement;
  let vue: ReturnType<typeof creerVue> | undefined;
  /** L'onglet ouvert : une catégorie, ou l'expo de chars. */
  let categorie: Categorie | 'expo' = 'peinture';
  /** Ce qu'on essaie, catégorie par catégorie (part du look posé). */
  let essai = {} as ChoixLook;

  const ONGLETS = ['expo', ...CATEGORIES] as const;
  const ouvrirOnglet = (c: (typeof ONGLETS)[number]) => {
    categorie = c;
    remplir();
    render();
  };
  const ongletBtns = ONGLETS.map((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = c === 'expo' ? t('EXPO') : t(LOOK[c].nom).toUpperCase();
    b.addEventListener('click', () => ouvrirOnglet(c));
    onglets.append(b);
    return b;
  });

  // L'expo de chars : le juge, son thème, pis ce qui fitte avec le look posé.
  const expoEl = document.createElement('div');
  expoEl.className = 'expo';
  expoEl.innerHTML = `
    <div class="quest">
      <div class="portrait" aria-hidden="true"></div>
      <div class="quest-body"><p class="quest-who"></p><p class="quest-line"></p></div>
    </div>
    <p class="expo-theme"></p>
    <ul class="expo-criteres"></ul>
    <p class="expo-info"></p>`;
  const criteresEl = expoEl.querySelector('.expo-criteres')!;
  let themeAffiche = '';

  let tuiles: { o: Option; btn: HTMLButtonElement; prix: HTMLElement }[] = [];
  function remplir(): void {
    if (categorie === 'expo') {
      tuiles = [];
      themeAffiche = '';
      grille.replaceChildren(expoEl);
      return;
    }
    const c = categorie;
    tuiles = LOOK[c].options.map((x) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tuile';
      btn.innerHTML = `<span class="pastille"></span><span class="nom"></span><span class="prix"></span>`;
      const pastille = btn.querySelector<HTMLElement>('.pastille')!;
      if (x.couleur === null) pastille.classList.add('vide');
      else pastille.style.background = `#${x.couleur.toString(16).padStart(6, '0')}`;
      btn.querySelector('.nom')!.textContent = t(x.nom);
      btn.addEventListener('click', () => {
        essai[c] = x.id;
        render();
      });
      return { o: x, btn, prix: btn.querySelector<HTMLElement>('.prix')! };
    });
    grille.replaceChildren(...tuiles.map((x) => x.btn));
  }

  action.addEventListener('click', () => {
    const s = o.etat();
    if (categorie === 'expo') {
      const r = inscrire(s, Date.now());
      if (!r) return;
      const cash = formatMoney(r.gain);
      if (r.note === 1) o.expo(t('1re place! Le juge te donne un trophée pis {cash}.', { cash }));
      else if (r.note >= 0.6) o.expo(t('2e place. Pas pire pantoute! +{cash}', { cash }));
      else if (r.note > 0) o.expo(t('Mention honorable. +{cash}', { cash }));
      else o.expo(t("Le juge a même pas levé les yeux. Essaie de fitter le thème à la prochaine expo."));
      return;
    }
    const id = essai[categorie];
    const achat = !possede(s, categorie, id);
    if (poser(s, categorie, id)) o.change(achat);
  });

  o.dialog.addEventListener('close', () => vue?.arreter());

  function render(): void {
    if (!o.dialog.open) return;
    const s = o.etat();
    cashEl.textContent = formatMoney(s.cash);
    ongletBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(ONGLETS[i] === categorie)));
    vue?.bazou.setEtat({ wheels: isRepaired(s, 'pneus'), clean: isRepaired(s, 'carrosserie') });
    if (categorie === 'expo') return renderExpo(s);
    const c = categorie;
    for (const x of tuiles) {
      const pose = s.look.choix[c] === x.o.id;
      const a = possede(s, c, x.o.id);
      x.btn.setAttribute('aria-pressed', String(essai[c] === x.o.id));
      x.btn.classList.toggle('posee', pose);
      x.btn.classList.toggle('a-toe', a);
      x.prix.textContent = pose ? t('POSÉ') : a ? t('À TOÉ') : formatMoney(x.o.prix);
      x.prix.classList.toggle('cher', !a && !assez(s, x.o.prix));
    }
    const x = LOOK[c].options.find((y) => y.id === essai[c])!;
    const pose = s.look.choix[c] === x.id;
    const a = possede(s, c, x.id);
    choixEl.textContent = pose ? t(x.nom) : t('{nom} (aperçu)', { nom: t(x.nom) });
    action.textContent = pose ? t('POSÉ') : a ? t('POSER') : t('ACHETER {prix}', { prix: formatMoney(x.prix) });
    action.disabled = pose || (!a && !assez(s, x.prix));
    vue?.bazou.setLook(essai);
  }

  function renderExpo(s: GameState): void {
    const now = Date.now();
    const theme = themeA(now);
    // Le juge regarde le look posé, pas l'aperçu.
    vue?.bazou.setLook(s.look.choix);
    if (theme.id !== themeAffiche) {
      themeAffiche = theme.id;
      const juge = CHARACTERS[theme.juge];
      const portrait = expoEl.querySelector<HTMLElement>('.portrait')!;
      portrait.textContent = juge.initials;
      portrait.style.background = juge.color;
      expoEl.querySelector('.quest-who')!.textContent = t('{nom}, JUGE', { nom: t(juge.name).toUpperCase() });
      expoEl.querySelector('.quest-line')!.textContent = cite(t(theme.demande));
      expoEl.querySelector('.expo-theme')!.textContent = t('Thème : {nom}', { nom: t(theme.nom) });
      criteresEl.replaceChildren(
        ...theme.criteres.map((c) => {
          const li = document.createElement('li');
          const b = document.createElement('button');
          b.type = 'button';
          b.addEventListener('click', () => ouvrirOnglet(c.categorie));
          li.append(b);
          return li;
        }),
      );
    }
    theme.criteres.forEach((c, i) => {
      const ok = critereOk(s, c);
      const b = criteresEl.children[i].querySelector('button')!;
      b.textContent = `${ok ? '✓' : '✗'} ${t(c.texte)}`;
      b.classList.toggle('ok', ok);
    });
    const note = noteExpo(s, theme);
    const reste = Math.ceil(resteSaison(now));
    const temps = `${Math.floor(reste / 60)}:${String(reste % 60).padStart(2, '0')}`;
    expoEl.querySelector('.expo-info')!.textContent = t('Prix : jusqu\'à {cash}. Trophées : {n}. Prochaine expo dans {temps}.', {
      cash: formatMoney(prixExpo(s, 1)),
      n: s.expo.trophees,
      temps,
    });
    const inscrit = dejaInscrit(s, now);
    choixEl.textContent = t('Ton look fitte {n} / {total}', { n: Math.round(note * theme.criteres.length), total: theme.criteres.length });
    action.textContent = inscrit ? t('INSCRIT') : t("S'INSCRIRE");
    action.disabled = inscrit;
  }

  return {
    ouvrir(): void {
      essai = { ...o.etat().look.choix };
      if (vue === undefined) vue = creerVue($('.atelier-vue'), o.reduceMotion);
      $('.atelier-vue').hidden = !vue;
      remplir();
      o.dialog.showModal();
      vue?.demarrer();
      render();
    },
    render,
  };
}
