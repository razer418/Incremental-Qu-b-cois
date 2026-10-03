import '@fontsource/vt323';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';
import './style.css';
import { createRang, type Lieu } from './scene/rang';
import { ARTICLES, REJEAN } from './game/magasin';
import { createSons } from './platform/sons';
import { createRadio, STATIONS } from './platform/radio';
import { CHARACTERS } from './game/quests';
import { createDemoAds } from './platform/ads';
import { NO_ADS_PRICE, webStore } from './platform/store';
import { UPGRADES } from './game/upgrades';
import { CAR_PRICE, PARTS } from './game/car';
import { BUILDINGS, PRESTIGE_BONUS_PER_POINT, PRESTIGE_MIN_EARNED, prestigePointsFor } from './game/buildings';
import {
  FIRST_CAR_GOAL,
  activeQuest,
  addBoost,
  BOOST_MAX_SECONDS,
  BOOST_SECONDS,
  buyBuilding,
  canBuyBuilding,
  canPrestige,
  nextBuilding,
  prestige,
  applyOffline,
  claimQuest,
  questProgress,
  buyMany,
  bulkCost,
  buyCar,
  carRuns,
  isRepaired,
  isUnlocked,
  repair,
  levelOf,
  newGame,
  nextCost,
  currentRate,
  articleCost,
  buyArticle,
  canBuyArticle,
  tap,
  tapValue,
  tick,
  warmth,
  assez,
  buyProjet,
  projetDebloque,
  projetFini,
  reparerProjet,
  SUCCES_BONUS,
  TUTO_FINI,
} from './game/state';
import { load, save, wipe } from './game/save';
import { saisonA } from './game/saisons';
import { bonusFete, feteA, grosseFeteA } from './game/fetes';
import { PROJETS } from './game/chars';
import { EVENEMENTS, EVENEMENT_SECONDES, choisir, tirerEvenement, type Evenement } from './game/evenements';
import { SUCCES, verifierSucces, type Succes } from './game/succes';
import { formatDuration, formatMoney, formatNombre, notation } from './game/format';
import { cite, facteur, langue, t } from './game/i18n';
import { createPerso } from './perso';
import { createMiniJeux } from './minijeux-ui';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const cashEl = $('cash');
const rateEl = $('rate');
const tapBtn = $<HTMLButtonElement>('tap');
const tapValueEl = $('tap-value');
const upgradesEl = $<HTMLUListElement>('upgrades');
const goalBar = $('goal-bar');
const goalText = $('goal-text');
const jobEl = $('job');
const tapLabel = $('tap-label');
const goalEl = $('goal');
const buyCarBtn = $<HTMLButtonElement>('buy-car');
const garageEl = $('garage');
const carStatus = $('car-status');
const partsEl = $<HTMLUListElement>('parts');
const questEl = $('quest');
const qPortrait = $('q-portrait');
const qWho = $('q-who');
const qLine = $('q-line');
const qBar = $('q-bar');
const qGoal = $('q-goal');
const qReward = $('q-reward');
const qClaim = $<HTMLButtonElement>('q-claim');
const repEl = $('rep');
const empireEl = $('empire');
const batEl = $('bat');
const batName = $('bat-name');
const batDesc = $('bat-desc');
const batCost = $('bat-cost');
const batBuy = $<HTMLButtonElement>('bat-buy');
const prestigeEl = $('prestige');
const prestigeDesc = $('prestige-desc');
const prestigeBtn = $<HTMLButtonElement>('prestige-btn');
const boostBtn = $<HTMLButtonElement>('boost');
const boostSub = $('boost-sub');
const noAdsBuy = $<HTMLButtonElement>('noads-buy');
const boutiqueEl = $('boutique');
const ads = createDemoAds($<HTMLDialogElement>('ad'), $('ad-count'), $<HTMLButtonElement>('ad-close'));
const store = webStore;
const messageDialog = $<HTMLDialogElement>('message');
const messageText = $('message-text');

function showMessage(text: string): void {
  messageText.textContent = text;
  if (!messageDialog.open) messageDialog.showModal();
}

// Oui ou non, dans le style du jeu (au lieu du confirm() du navigateur).
const confirmDialog = $<HTMLDialogElement>('confirm');
function demander(text: string): Promise<boolean> {
  $('confirm-text').textContent = text;
  confirmDialog.showModal();
  return new Promise((resolve) => {
    const fin = (ok: boolean) => {
      $('confirm-oui').onclick = $('confirm-non').onclick = confirmDialog.oncancel = null;
      confirmDialog.close();
      resolve(ok);
    };
    $('confirm-oui').onclick = () => fin(true);
    $('confirm-non').onclick = () => fin(false);
    confirmDialog.oncancel = (e) => {
      e.preventDefault();
      fin(false);
    };
  });
}

// Petits réglages gardés sur l'appareil.
const pref = {
  get: (k: string) => {
    try {
      return localStorage.getItem(`incremental-quebecois-${k}`);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(`incremental-quebecois-${k}`, v);
    } catch {
      // stockage bloqué : le réglage dure juste le temps de la partie
    }
  },
};
const bascule = (btn: HTMLElement, on: boolean, oui = 'OUI', non = 'NON') => {
  btn.setAttribute('aria-pressed', String(on));
  btn.textContent = t(on ? oui : non);
};

// La langue avant tout le reste : tout le texte passe par t().
langue.en = pref.get('langue') === 'en';
document.documentElement.lang = langue.en ? 'en-CA' : 'fr-CA';
// Le texte fixe de la page (marqué data-t dans index.html).
document.querySelectorAll<HTMLElement>('[data-t]').forEach((el) => (el.textContent = t(el.textContent!.trim())));
document.querySelectorAll<HTMLElement>('[aria-label]').forEach((el) => el.setAttribute('aria-label', t(el.getAttribute('aria-label')!)));
const langueBtn = $<HTMLButtonElement>('langue');
bascule(langueBtn, !langue.en, 'JOUAL', 'ENGLISH');
langueBtn.addEventListener('click', () => {
  // On recharge la page : tout se réaffiche dans la bonne langue.
  pref.set('langue', langue.en ? 'fr' : 'en');
  save(localStorage, state);
  location.reload();
});

let state = load(localStorage, Date.now());

// Le rang en 3D, style Bazou VHS. Si WebGL marche pas, le jeu roule pareil.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Effets sonores pis radio du char : volumes pis station gardés sur l'appareil.
const NIVEAUX = [0, 0.25, 0.5, 0.75, 1];
const pourcent = (v: number) => (v > 0 ? `${Math.round(v * 100)}${langue.en ? '' : ' '}%` : 'NON');
const niveau = (k: string, defaut: number) => {
  const v = Number(pref.get(k) ?? defaut);
  return NIVEAUX.includes(v) ? v : defaut;
};
const suivant = (v: number, min = 0) => NIVEAUX[Math.max(min, (NIVEAUX.indexOf(v) + 1) % NIVEAUX.length)];

const sons = createSons();
const effetsBtn = $<HTMLButtonElement>('effets');
const setEffets = (v: number) => {
  sons.volume = v;
  bascule(effetsBtn, v > 0, pourcent(v));
};
// Ancien réglage SON OUI/NON : « off » devient des effets coupés.
setEffets(pref.get('son') === 'off' ? 0 : niveau('effets', 1));
effetsBtn.addEventListener('click', () => {
  setEffets(suivant(sons.volume));
  pref.set('effets', String(sons.volume));
  sons.jouer('achat');
});

const radioEl = $<HTMLButtonElement>('radio');
const radioTexte = $('radio-texte');
const radio = createRadio(sons.contexte, (texte) => {
  radioTexte.textContent = texte;
  radioEl.setAttribute('aria-label', t('Radio : {texte}. Change de poste.', { texte }));
  // Le texte défile seulement s'il rentre pas sur la ligne.
  radioTexte.classList.remove('defile');
  requestAnimationFrame(() => {
    const trop = radioTexte.scrollWidth - radioEl.clientWidth;
    radioTexte.style.setProperty('--trop', `${-trop}px`);
    radioTexte.style.setProperty('--duree', `${Math.max(6, trop / 25)}s`);
    radioTexte.classList.toggle('defile', trop > 0 && !reduceMotion);
  });
});
const stationBtn = $<HTMLButtonElement>('station');
const volumeBtn = $<HTMLButtonElement>('radio-volume');
const setStation = (i: number) => {
  radio.syntoniser(i);
  bascule(stationBtn, i >= 0, i >= 0 ? STATIONS[i].nom : '', 'FERMÉE');
  radioEl.classList.toggle('fermee', i < 0);
  if (i >= 0 && !radioTexte.textContent) radioTexte.textContent = `♪ ${t(STATIONS[i].nom)}`;
  pref.set('radio', String(i));
};
const changerPoste = () => {
  // Poste suivant, pis « fermée » après le dernier.
  setStation(radio.station + 1 < STATIONS.length ? radio.station + 1 : -1);
  radio.demarrer();
};
const setVolumeRadio = (v: number) => {
  radio.setVolume(v);
  bascule(volumeBtn, true, pourcent(v));
  pref.set('radio-volume', String(v));
};
const stationGardee = Number(pref.get('radio') ?? 0);
setStation(stationGardee >= -1 && stationGardee < STATIONS.length ? stationGardee : 0);
setVolumeRadio(niveau('radio-volume', 0.5) || 0.5);
stationBtn.addEventListener('click', changerPoste);
radioEl.addEventListener('click', changerPoste);
volumeBtn.addEventListener('click', () => setVolumeRadio(suivant(radio.volume, 1)));
// Les navigateurs bloquent le son tant que le joueur a rien touché.
const premierGeste = () => {
  radio.demarrer();
  if (sons.contexte()) {
    removeEventListener('pointerdown', premierGeste);
    removeEventListener('keydown', premierGeste);
  }
};
addEventListener('pointerdown', premierGeste);
addEventListener('keydown', premierGeste);

const rang = createRang($('ecran'), {
  pixelScale: 3,
  reduceMotion,
  onTrajet: (e) => sons.jouer(e === 'coupe' ? 'coupe' : 'moteur'),
});
let lastWarmth = -1;
let lastLook = '';

// Lignes VHS : désactivables pour le confort des yeux.
const vhsBtn = $<HTMLButtonElement>('vhs');
const scanEl = $('scan');
let vhsOn = pref.get('vhs') !== 'off';
const setVhs = (on: boolean) => {
  scanEl.hidden = !on;
  bascule(vhsBtn, on);
};
setVhs(vhsOn);
vhsBtn.addEventListener('click', () => {
  vhsOn = !vhsOn;
  setVhs(vhsOn);
  pref.set('vhs', vhsOn ? 'on' : 'off');
});

// Gros chiffres : 1,23 M $ (courts) ou 1 234 567,89 $ (complets).
const nombresBtn = $<HTMLButtonElement>('nombres');
const setNombres = (complets: boolean) => {
  notation.complets = complets;
  bascule(nombresBtn, !complets, 'COURTS', 'COMPLETS');
};
setNombres(pref.get('nombres') === 'complets');
nombresBtn.addEventListener('click', () => {
  setNombres(!notation.complets);
  pref.set('nombres', notation.complets ? 'complets' : 'courts');
  render();
});

// Options : son, VHS, chiffres, sauvegarde pis recommencer.
const optionsDlg = $<HTMLDialogElement>('options-dlg');
const codeEl = $<HTMLTextAreaElement>('code');
const codeAide = $('code-aide');
const codeOk = $<HTMLButtonElement>('code-ok');
const montrerCode = (aide: string, importer: boolean) => {
  codeEl.hidden = codeAide.hidden = false;
  codeOk.hidden = !importer;
  codeAide.textContent = aide;
};
// Le menu : trois onglets, succès, stats pis options.
type Onglet = 'succes' | 'stats' | 'reglages';
const ongletBtns = [...optionsDlg.querySelectorAll<HTMLButtonElement>('[data-onglet]')];
const panneaux = [...optionsDlg.querySelectorAll<HTMLElement>('[data-panneau]')];
let onglet: Onglet = 'reglages';
function montrerOnglet(o: Onglet): void {
  onglet = o;
  ongletBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.onglet === o)));
  panneaux.forEach((p) => (p.hidden = p.dataset.panneau !== o));
  if (o === 'succes') {
    nonVus = 0;
    badge.hidden = true;
  }
  renderMenu();
}
function ouvrirMenu(o: Onglet = onglet): void {
  codeEl.hidden = codeAide.hidden = codeOk.hidden = true;
  if (!optionsDlg.open) optionsDlg.showModal();
  montrerOnglet(o);
}
ongletBtns.forEach((b) => b.addEventListener('click', () => montrerOnglet(b.dataset.onglet as Onglet)));
$('options').addEventListener('click', () => {
  if (state.tuto === TUTO.length - 1) finirTuto();
  ouvrirMenu(nonVus > 0 ? 'succes' : onglet);
});
$('exporter').addEventListener('click', async () => {
  save(localStorage, state);
  codeEl.value = btoa(encodeURIComponent(JSON.stringify(state)));
  let copie = false;
  try {
    await navigator.clipboard.writeText(codeEl.value);
    copie = true;
  } catch {
    // presse-papier bloqué : le code est dans la boîte
  }
  montrerCode(t(copie ? 'Code copié! Garde-le en lieu sûr.' : 'Copie ce code pis garde-le en lieu sûr.'), false);
  codeEl.select();
});
$('importer').addEventListener('click', () => {
  codeEl.value = '';
  montrerCode(t('Colle ton code de sauvegarde ici.'), true);
  codeEl.focus();
});
codeOk.addEventListener('click', async () => {
  let raw = '';
  try {
    raw = decodeURIComponent(atob(codeEl.value.trim()));
    JSON.parse(raw);
  } catch {
    codeAide.textContent = t("Ce code-là marche pas. Vérifie que t'as tout copié.");
    return;
  }
  if (!(await demander(t('Remplacer ta partie par celle du code?')))) return;
  localStorage.setItem('incremental-quebecois-save', raw);
  state = load(localStorage, Date.now());
  save(localStorage, state);
  optionsDlg.close();
  showMessage(t('Partie chargée!'));
  render();
});

const offline = applyOffline(state, Date.now());
if (offline.gained >= 0.01 && offline.seconds >= 60) {
  showMessage(
    t("Pendant que t'étais parti ({temps}), ta gang a ramassé {cash}.", { temps: formatDuration(offline.seconds), cash: formatMoney(offline.gained) }),
  );
}

// Achat en lot : x1, x10 ou MAX, comme dans les grands jeux du genre.
const LOTS = [1, 10, Infinity];
const lotBtn = $<HTMLButtonElement>('lot-mode');
let lotMode = Math.max(0, LOTS.map(String).indexOf(pref.get('lot') ?? '1'));
const paintLot = () => (lotBtn.textContent = LOTS[lotMode] === Infinity ? 'MAX' : `x${LOTS[lotMode]}`);
paintLot();
lotBtn.addEventListener('click', () => {
  lotMode = (lotMode + 1) % LOTS.length;
  pref.set('lot', String(LOTS[lotMode]));
  paintLot();
  render();
});

// Une ligne par achat, créée une fois.
const rows = new Map<
  string,
  { li: HTMLLIElement; btn: HTMLButtonElement; level: HTMLElement; cost: HTMLElement; combien: HTMLElement }
>();
for (const u of UPGRADES) {
  const li = document.createElement('li');
  li.className = 'upgrade';
  li.innerHTML = `
    <div class="upgrade-info">
      <strong>${t(u.name)} <span class="level"></span></strong>
      <small>${t(u.description)}</small>
    </div>
    <button type="button" class="buy"><span class="cost"></span><span class="combien"></span></button>`;
  const btn = li.querySelector<HTMLButtonElement>('.buy')!;
  btn.addEventListener('click', () => {
    if (buyMany(state, u.id, LOTS[lotMode])) {
      sons.jouer('achat');
      save(localStorage, state);
      render();
    }
  });
  rows.set(u.id, { li, btn, level: li.querySelector('.level')!, cost: li.querySelector('.cost')!, combien: li.querySelector('.combien')! });
  upgradesEl.append(li);
}

// Les pièces du bazou, une ligne chacune.
const partRows = new Map<string, { li: HTMLLIElement; btn: HTMLButtonElement; cost: HTMLElement }>();
for (const p of PARTS) {
  const li = document.createElement('li');
  li.className = 'upgrade';
  li.innerHTML = `
    <div class="upgrade-info">
      <strong>${t(p.name)}</strong>
      <small>${t(p.description)}</small>
    </div>
    <button type="button" class="buy"><span class="cost"></span></button>`;
  const btn = li.querySelector<HTMLButtonElement>('.buy')!;
  btn.addEventListener('click', () => {
    const roulait = carRuns(state);
    if (!repair(state, p.id)) return;
    sons.jouer('achat');
    save(localStorage, state);
    if (!roulait && carRuns(state)) {
      showMessage(
        t("Vroum! Ton bazou part du premier coup (ou presque). T'es maintenant livreur de pizza, pis les jobs motorisées sont débloquées."),
      );
    }
    render();
  });
  partRows.set(p.id, { li, btn, cost: li.querySelector('.cost')! });
  partsEl.append(li);
}

qClaim.addEventListener('click', () => {
  const q = claimQuest(state);
  if (!q) return;
  sons.jouer('quete');
  save(localStorage, state);
  showMessage(`${t(CHARACTERS[q.giver].name)} : ${cite(t(q.thanks))} (+${formatMoney(q.reward)})`);
  render();
});

// Mode dev sans pubs (npm run dev:sans-pubs) : le boost est direct pis la boutique est cachée.
const PUBS = import.meta.env.VITE_PUBS !== 'off';
const sansPubs = (): boolean => state.noAds || !PUBS;
boutiqueEl.hidden = !PUBS;

// Boost x2 : jamais forcé, toujours sur demande.
boostBtn.addEventListener('click', async () => {
  if (state.boostSeconds + BOOST_SECONDS > BOOST_MAX_SECONDS) return;
  if (!sansPubs()) {
    boostBtn.disabled = true;
    const watched = await ads.showRewarded();
    if (!watched) return render();
  }
  addBoost(state);
  sons.jouer('boost');
  save(localStorage, state);
  render();
});

noAdsBuy.addEventListener('click', async () => {
  if (state.noAds) return;
  if (!store.available) {
    showMessage(t("« Pas de pubs » ({prix}) va s'acheter dans l'app Android, via Google Play. Sur le web, y'a juste des pubs de démo.", { prix: t(NO_ADS_PRICE) }));
    return;
  }
  if (await store.buyNoAds()) {
    state.noAds = true;
    save(localStorage, state);
    showMessage(t('Merci! Le boost est gratuit pour toujours, pis y aura pu jamais de pubs.'));
    render();
  }
});

// Les endroits du rang : la caméra glisse d'un à l'autre.
const lieuxEl = $('lieux');
const lieuBtns = [...lieuxEl.querySelectorAll<HTMLButtonElement>('button')];
let lieu: Lieu = 'maison';
const lieuBtn = (l: Lieu) => lieuBtns.find((b) => b.dataset.lieu === l)!;
function allerA(l: Lieu): void {
  lieu = l;
  rang?.allerA(l);
  lieuBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lieu === l)));
  if (l === 'magasin') mLine.textContent = cite(t(REJEAN[Math.floor(Math.random() * REJEAN.length)]));
  render();
}

// Le magasin général : on le voit quand on y est (ou tout le temps sans le décor 3D).
const magasinEl = $('magasin');
const mLine = $('m-line');
const mPortrait = $('m-portrait');
mPortrait.style.background = CHARACTERS.rejean.color;
mLine.textContent = cite(t(REJEAN[0]));
const articleRows = new Map<string, { btn: HTMLButtonElement; level: HTMLElement; cost: HTMLElement }>();
for (const a of ARTICLES) {
  const li = document.createElement('li');
  li.className = 'upgrade';
  li.innerHTML = `
    <div class="upgrade-info">
      <strong>${t(a.name)} <span class="level"></span></strong>
      <small>${t(a.description)}</small>
    </div>
    <button type="button" class="buy"><span class="cost"></span></button>`;
  const btn = li.querySelector<HTMLButtonElement>('.buy')!;
  btn.addEventListener('click', () => {
    if (buyArticle(state, a.id)) {
      sons.jouer('achat');
      save(localStorage, state);
      render();
    }
  });
  articleRows.set(a.id, { btn, level: li.querySelector('.level')!, cost: li.querySelector('.cost')! });
  $('articles').append(li);
}
function renderMagasin(): void {
  magasinEl.hidden = !!rang && lieu !== 'magasin';
  if (magasinEl.hidden) return;
  for (const a of ARTICLES) {
    const row = articleRows.get(a.id)!;
    const left = Math.ceil(state.magasin[a.id] ?? 0);
    row.level.textContent = left > 0 ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : '';
    const cost = articleCost(state, a.id);
    row.cost.textContent = formatMoney(cost);
    row.btn.disabled = !canBuyArticle(state, a.id);
    progres(row.btn, cost);
  }
}
lieuBtns.forEach((b) => b.addEventListener('click', () => allerA(b.dataset.lieu as Lieu)));

batBuy.addEventListener('click', () => {
  const b = nextBuilding(state);
  if (!b || !buyBuilding(state, b.id)) return;
  sons.jouer('achat');
  save(localStorage, state);
  allerA(b.id);
  showMessage(t(b.message));
  render();
});

prestigeBtn.addEventListener('click', async () => {
  const points = prestigePointsFor(state.totalEarned);
  const ok = await demander(
    t("Vendre l'empire? Tu repars à pied avec 0 $, mais tu gagnes {points} points de réputation (+{pc} % sur tous tes gains, pour toujours).", { points, pc: points * PRESTIGE_BONUS_PER_POINT * 100 }),
  );
  if (!ok) return;
  const gained = prestige(state, Date.now());
  save(localStorage, state);
  showMessage(
    t('Le rang au complet parle de toé. +{points} points de réputation. Envoye, on recommence, mais plus vite cette fois-citte.', { points: gained }),
  );
  render();
});

buyCarBtn.addEventListener('click', () => {
  if (!buyCar(state)) return;
  sons.jouer('achat');
  save(localStorage, state);
  showMessage(
    t("Le bonhomme Gagnon : « Y'é à toé, mon gars. Y roule pas, y'a pu de batterie pis y'é sur les blocs, mais c'est un bon char. »"),
  );
  render();
});

tapBtn.addEventListener('click', (e) => {
  const gain = tap(state);
  if (!reduceMotion) flotter(gain, e);
  sons.jouer(carRuns(state) ? 'livraison' : 'canette');
  tapBtn.classList.remove('pop');
  void tapBtn.offsetWidth;
  tapBtn.classList.add('pop');
  render();
});

$('reset').addEventListener('click', async () => {
  if (!(await demander(t('Tout effacer pis recommencer à zéro? Tout part : réputation, succès, stats pis « pas de pubs ».')))) return;
  wipe(localStorage);
  state = newGame(Date.now());
  optionsDlg.close();
  allerA('maison');
});

// --- Le look du bazou pis les mini-jeux ---

const perso = createPerso({
  liste: $('look-liste'),
  etat: () => state,
  achete: () => {
    sons.jouer('achat');
    save(localStorage, state);
    render();
  },
  // Un bazou qui roule pas reste dans la cour : on y retourne pour voir l'aperçu.
  apercu: () => (rang && !carRuns(state) && lieu !== 'maison' ? allerA('maison') : render()),
});
const minijeux = createMiniJeux({
  liste: $('minijeux-liste'),
  section: $('minijeux'),
  dialog: $<HTMLDialogElement>('minijeu'),
  etat: () => state,
  fini: (msg) => {
    sons.jouer('quete');
    save(localStorage, state);
    showMessage(msg);
    render();
  },
});

// --- Succès ---

const badge = $('badge');
const toast = $<HTMLButtonElement>('toast');
let nonVus = 0;
const aCelebrer: Succes[] = [];
let toastFin = 0;
function celebrer(nouveaux: Succes[]): void {
  if (!nouveaux.length) return;
  save(localStorage, state);
  aCelebrer.push(...nouveaux);
  nonVus += nouveaux.length;
  badge.hidden = false;
  badge.textContent = String(nonVus);
}
// Un petit bandeau en bas, un succès à la fois, sans bloquer le jeu.
function renderToast(now: number): void {
  if (now < toastFin) return;
  const x = aCelebrer.shift();
  toast.hidden = !x;
  if (!x) return;
  toast.textContent = t('SUCCÈS : {nom} (+{pc} %)', { nom: t(x.nom), pc: SUCCES_BONUS * 100 });
  toast.classList.remove('entre');
  void toast.offsetWidth;
  toast.classList.add('entre');
  sons.jouer('quete');
  toastFin = now + 3000;
}
toast.addEventListener('click', () => {
  toastFin = 0;
  aCelebrer.length = 0;
  toast.hidden = true;
  ouvrirMenu('succes');
});

const succesRows = new Map<string, HTMLLIElement>();
for (const x of SUCCES) {
  const li = document.createElement('li');
  li.innerHTML = `<strong></strong><small></small>`;
  li.querySelector('strong')!.textContent = t(x.nom);
  li.querySelector('small')!.textContent = t(x.description);
  succesRows.set(x.id, li);
  $('succes-liste').append(li);
}

function renderMenu(): void {
  if (!optionsDlg.open) return;
  if (onglet === 'succes') {
    const n = state.succes.length;
    $('succes-resume').textContent = t('{n} / {total} : +{pc} % sur tous tes gains', { n, total: SUCCES.length, pc: Math.round(n * SUCCES_BONUS * 100) });
    for (const x of SUCCES) succesRows.get(x.id)!.classList.toggle('obtenu', state.succes.includes(x.id));
  } else if (onglet === 'stats') {
    const st = state.stats;
    const lignes: [string, string][] = [
      [t('Temps joué'), formatDuration(st.secondes)],
      [t('Gagné cette partie'), formatMoney(state.totalEarned)],
      [t('Gagné à vie'), formatMoney(st.gagneVie)],
      [t('Revenu'), `${formatMoney(currentRate(state))}/s`],
      [t('Une tape'), formatMoney(tapValue(state))],
      [t('Tapes cette partie'), formatNombre(state.taps)],
      [t('Tapes à vie'), formatNombre(st.tapsVie)],
      [t('Boosts x2'), String(st.boosts)],
      [t('Achats chez Réjean'), String(st.articles)],
      [t('Événements'), String(st.evenements)],
      [t('Mini-jeux joués'), String(st.minijeux)],
      [t('Quêtes finies'), String(state.questIndex)],
      [t('Empires vendus'), String(state.prestige.count)],
      [t('Réputation'), `${state.prestige.points} (+${Math.round(state.prestige.points * PRESTIGE_BONUS_PER_POINT * 100)} %)`],
      [t('Succès'), `${state.succes.length} / ${SUCCES.length} (+${Math.round(state.succes.length * SUCCES_BONUS * 100)} %)`],
    ];
    $('stats-liste').innerHTML = lignes.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  }
}

// --- Tuto : une bulle avec une flèche qui pointe la prochaine affaire à faire ---

const TUTO: { cible: () => HTMLElement; texte: string; fini: () => boolean }[] = [
  {
    cible: () => tapBtn,
    texte: 'Tape ici pour ramasser des canettes. Chaque canette consignée, c’est 10 cennes!',
    // 10 canettes = 1 $, juste assez pour le sac.
    fini: () => state.taps >= 10,
  },
  {
    cible: () => rows.get('sac')!.li,
    texte: 'T’as 1 $! Achète un plus gros sac : chaque tape va rapporter plus.',
    fini: () => levelOf(state, 'sac') >= 1,
  },
  {
    cible: () => questEl,
    texte: 'Ta mère a une job pour toé. Quand la barre est pleine, réclame ta récompense.',
    fini: () => state.questIndex >= 1,
  },
  {
    cible: () => $('options'),
    texte: 'Dans le MENU : tes succès, tes stats pis les options. Bonne game!',
    fini: () => false,
  },
];
const bulle = document.createElement('div');
bulle.className = 'bulle';
bulle.innerHTML = `<p></p><div class="bulle-actions"><button type="button" class="passer">${t('Passer le tuto')}</button><button type="button" class="ok" hidden>[ OK ]</button></div>`;
bulle.querySelector('.passer')!.addEventListener('click', () => finirTuto());
bulle.querySelector('.ok')!.addEventListener('click', () => finirTuto());
let tutoAffiche = -1;
function finirTuto(): void {
  state.tuto = TUTO_FINI;
  save(localStorage, state);
  renderTuto();
}
function renderTuto(): void {
  while (state.tuto < TUTO.length && TUTO[state.tuto].fini()) state.tuto++;
  const step = state.tuto < TUTO.length ? state.tuto : -1;
  if (step === tutoAffiche) return;
  document.querySelector('.tuto-cible')?.classList.remove('tuto-cible');
  tutoAffiche = step;
  if (step < 0) {
    bulle.remove();
    if (state.tuto !== TUTO_FINI) finirTuto();
    return;
  }
  const etape = TUTO[step];
  const cible = etape.cible();
  cible.classList.add('tuto-cible');
  bulle.querySelector('p')!.textContent = t(etape.texte);
  const dernier = step === TUTO.length - 1;
  bulle.querySelector<HTMLElement>('.ok')!.hidden = !dernier;
  bulle.querySelector<HTMLElement>('.passer')!.hidden = dernier;
  // Le bouton MENU est dans la barre du haut : la bulle va juste en dessous, flèche à droite.
  bulle.classList.toggle('droite', dernier);
  if (dernier) $('app').querySelector(matchMedia('(min-width: 900px)').matches ? '.col-listes' : '.col-jeu')!.prepend(bulle);
  else cible.after(bulle);
  if (step > 0 && !dernier) bulle.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
}

/** Le bouton se remplit à mesure que tu t'approches du prix. */
function progres(btn: HTMLElement, cost: number): void {
  btn.style.setProperty('--p', `${Math.min(100, (state.cash / cost) * 100).toFixed(1)}%`);
}

// Le montant gagné monte au-dessus du bouton, comme dans Cookie Clicker.
function flotter(gain: number, e: MouseEvent): void {
  if (tapBtn.querySelectorAll('.flotte').length > 8) return;
  const r = tapBtn.getBoundingClientRect();
  const span = document.createElement('span');
  span.className = 'flotte';
  span.textContent = `+${formatMoney(gain)}`;
  // Au doigt, sinon (clavier) quelque part au milieu.
  const x = e.clientX ? e.clientX - r.left : r.width * (0.3 + Math.random() * 0.4);
  span.style.left = `${Math.max(40, Math.min(r.width - 40, x))}px`;
  span.addEventListener('animationend', () => span.remove());
  tapBtn.append(span);
}

// Ordi : la barre d'espace ramasse aussi.
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || e.repeat || document.querySelector('dialog[open]')) return;
  if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLTextAreaElement) return;
  e.preventDefault();
  tapBtn.click();
});

function render(): void {
  cashEl.textContent = formatMoney(state.cash);
  rateEl.textContent = `+${formatMoney(currentRate(state))}/s`;
  renderBoost();
  tapValueEl.textContent = `+${formatMoney(tapValue(state))}`;

  const w = Math.round(warmth(state) * 200) / 200;
  if (rang && w !== lastWarmth) {
    rang.setWarmth(w);
    lastWarmth = w;
  }

  const roule = carRuns(state);
  jobEl.textContent = t(roule ? 'LIVRER DES PIZZAS' : 'RAMASSER DES CANETTES');
  tapLabel.textContent = t(roule ? '[ LIVRER ]' : '[ RAMASSER ]');
  const look = {
    lieux: { ...state.buildings },
    owned: state.car.owned,
    wheels: isRepaired(state, 'pneus'),
    clean: isRepaired(state, 'carrosserie'),
    runs: roule,
    ...perso.look(),
  };
  lieuxEl.hidden = !rang;
  for (const b of BUILDINGS) lieuBtn(b.id).hidden = !state.buildings[b.id];
  // Après le prestige, les bâtiments sont partis : on revient à la maison.
  if (lieu !== 'maison' && lieu !== 'magasin' && !state.buildings[lieu]) allerA('maison');
  const lookKey = JSON.stringify(look);
  if (rang && lookKey !== lastLook) {
    rang.setCar(look);
    lastLook = lookKey;
  }

  renderQuest();
  renderSaison();
  renderEvenement();
  renderProjets();
  renderMagasin();
  $('look').hidden = !state.car.owned;
  if (state.car.owned) perso.render();
  minijeux.render();
  celebrer(verifierSucces(state));
  renderTuto();
  renderMenu();
  renderEmpire(roule);

  // Avant l'achat : la barre d'objectif. Après : le garage avec les pièces.
  goalEl.hidden = state.car.owned;
  // Tout réparé : la section disparaît, le bouton LIVRER dit déjà que ça roule.
  garageEl.hidden = !state.car.owned || PARTS.every((p) => isRepaired(state, p.id));
  if (!state.car.owned) {
    const progress = Math.min(1, state.cash / FIRST_CAR_GOAL);
    goalBar.style.width = `${progress * 100}%`;
    goalText.textContent = `${formatMoney(state.cash)} / ${formatMoney(FIRST_CAR_GOAL)}`;
    buyCarBtn.hidden = !assez(state, CAR_PRICE);
  } else {
    carStatus.textContent = t(roule ? 'ÇA ROULE!' : 'SUR LES BLOCS');
    carStatus.classList.toggle('roule', roule);
    for (const p of PARTS) {
      const row = partRows.get(p.id)!;
      const done = isRepaired(state, p.id);
      row.li.classList.toggle('done', done);
      row.cost.textContent = done ? t('RÉPARÉ') : formatMoney(p.cost);
      row.btn.disabled = done || !assez(state, p.cost);
      if (!done) progres(row.btn, p.cost);
    }
  }

  for (const u of UPGRADES) {
    const row = rows.get(u.id)!;
    row.li.hidden = !isUnlocked(state, u);
    const level = levelOf(state, u.id);
    const max = nextCost(state, u.id) === null;
    const lot = bulkCost(state, u.id, LOTS[lotMode]);
    row.li.classList.toggle('max', max);
    const bonus = saisonA(state.lastTick).bonus[u.id];
    row.level.textContent = (level > 0 ? `${t('NIV.')} ${level}` : '') + (bonus ? ` ${t(saisonA(state.lastTick).nom)} ${facteur(bonus)}` : '');
    row.cost.textContent = max ? t('AU MAX') : formatMoney(lot.cost);
    row.combien.textContent = max || LOTS[lotMode] === 1 ? '' : `+${lot.count} ${t('NIV.')}`;
    row.btn.disabled = max || !assez(state, lot.cost);
    progres(row.btn, lot.cost);
  }
}

function renderEmpire(roule: boolean): void {
  const pts = state.prestige.points;
  repEl.hidden = pts === 0;
  repEl.textContent = `${t('RÉPUTATION')} ${pts} (+${Math.round(pts * PRESTIGE_BONUS_PER_POINT * 100)} %)`;

  empireEl.hidden = !roule;
  if (!roule) return;
  const b = nextBuilding(state);
  batEl.hidden = b === null;
  if (b) {
    batName.textContent = t(b.name);
    batDesc.textContent = t(b.description);
    batCost.textContent = formatMoney(b.cost);
    batBuy.disabled = !canBuyBuilding(state, b.id);
    progres(batBuy, b.cost);
  }
  prestigeEl.hidden = !state.buildings.arena;
  if (state.buildings.arena) {
    const ready = canPrestige(state);
    const points = prestigePointsFor(state.totalEarned);
    prestigeDesc.textContent = ready
      ? t('Tu repars à zéro avec {points} points de réputation (+{pc} % pour toujours).', { points, pc: points * PRESTIGE_BONUS_PER_POINT * 100 })
      : t("Disponible à {min} gagnés au total. T'es rendu à {cash}.", { min: formatMoney(PRESTIGE_MIN_EARNED), cash: formatMoney(state.totalEarned) });
    prestigeBtn.disabled = !ready;
  }
}

function renderBoost(): void {
  const left = Math.ceil(state.boostSeconds);
  const full = state.boostSeconds + BOOST_SECONDS > BOOST_MAX_SECONDS;
  boostBtn.disabled = full;
  boostBtn.textContent = t(sansPubs() ? '[ BOOST x2 ]' : '[ PUB : BOOST x2 ]');
  boostSub.classList.toggle('on', left > 0);
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');
  boostSub.textContent =
    left > 0 ? t('x2 ACTIF : {temps}', { temps: `${mm}:${ss}` }) : t(sansPubs() ? '10 MIN GRATUITES' : '10 MIN POUR UNE PUB');
  noAdsBuy.textContent = t(state.noAds ? 'ACHETÉ' : NO_ADS_PRICE);
  noAdsBuy.disabled = state.noAds;
}

// --- Saisons ---

const saisonBtn = $<HTMLButtonElement>('saison');
let lastSaison = '';
saisonBtn.addEventListener('click', () => {
  const x = saisonA(state.lastTick);
  const f = feteA(state.lastTick);
  showMessage(
    f
      ? `${t(f.nom)} : ${t(f.description)} ${t('Gains {x}.', { x: facteur(bonusFete(state.lastTick)) })} ${t(grosseFeteA(state.lastTick) ? "C'est la vraie date : la fête dure toute la journée!" : 'La fête dure 3 minutes.')}`
      : `${t(x.nom)} : ${t(x.description)} ${t('Chaque saison dure 10 minutes, pis finit avec une fête.')}`,
  );
});
function renderSaison(): void {
  const x = saisonA(state.lastTick);
  const f = feteA(state.lastTick);
  const cle = `${x.id}/${f?.id ?? ''}`;
  if (cle === lastSaison) return;
  saisonBtn.textContent = f ? `${t(f.nom)} ${facteur(bonusFete(state.lastTick))}` : t(x.nom);
  saisonBtn.classList.toggle('fete', !!f);
  rang?.setSaison(x.id);
  rang?.setFete(f?.id ?? null);
  // La fête commence : son invitation arrive tout de suite (pas au premier chargement).
  const fe = f && lastSaison && EVENEMENTS.find((e) => e.fete === f.id);
  if (fe && !evenement && state.tuto === TUTO_FINI) montrerEvenement(fe, Date.now());
  lastSaison = cle;
}

// --- Événements du rang : aux 3 à 6 minutes, une affaire à prendre ou à laisser ---

const evenementEl = $('evenement');
const prochainDelai = () => (3 + Math.random() * 3) * 60_000;
let evenement: { e: Evenement; fin: number } | null = null;
let prochainEvenement = Date.now() + prochainDelai();
function montrerEvenement(e: Evenement, now: number): void {
  evenement = { e, fin: now + EVENEMENT_SECONDES * 1000 };
  const who = CHARACTERS[e.qui];
  $('e-portrait').textContent = who.initials;
  $('e-portrait').style.background = who.color;
  $('e-who').textContent = t(who.name).toUpperCase();
  $('e-line').textContent = cite(t(e.texte));
  const choixEl = $('e-choix');
  choixEl.replaceChildren(
    ...e.choix.map((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'buy-car';
      b.textContent = `[ ${t(c.label).toUpperCase()} ]`;
      b.addEventListener('click', () => {
        evenement = null;
        const msg = choisir(state, e, i, Math.random());
        save(localStorage, state);
        showMessage(msg);
        render();
      });
      return b;
    }),
  );
  sons.jouer('quete');
}
function renderEvenement(): void {
  const now = Date.now();
  // Pas d'événement pendant le tuto.
  if (!evenement && now >= prochainEvenement && state.tuto === TUTO_FINI) {
    const e = tirerEvenement(state, Math.random());
    if (e) montrerEvenement(e, now);
  }
  if (evenement && now >= evenement.fin) evenement = null;
  if (evenement) prochainEvenement = now + prochainDelai();
  evenementEl.hidden = !evenement;
  if (evenement) $('e-bar').style.width = `${((evenement.fin - now) / (EVENEMENT_SECONDES * 1000)) * 100}%`;
}

// --- Chars à retaper ---

const projetRows = PROJETS.map((p) => {
  const li = document.createElement('li');
  li.className = 'upgrade';
  li.innerHTML = `
    <div class="upgrade-info">
      <strong></strong>
      <small></small>
    </div>
    <button type="button" class="buy"><span class="cost"></span></button>`;
  li.querySelector('strong')!.textContent = t(p.nom);
  li.querySelector('small')!.textContent = `${t(p.description)} ${t('Une fois retapé : {x} sur tous tes gains.', { x: facteur(p.bonus) })}`;
  const btn = li.querySelector<HTMLButtonElement>('.buy')!;
  btn.addEventListener('click', () => {
    if (!buyProjet(state, p.id)) return;
    sons.jouer('achat');
    save(localStorage, state);
    render();
  });
  const pieces = p.pieces.map((x) => {
    const pli = document.createElement('li');
    pli.className = 'upgrade piece';
    pli.innerHTML = `<div class="upgrade-info"><strong></strong></div><button type="button" class="buy"><span class="cost"></span></button>`;
    pli.querySelector('strong')!.textContent = t(x.nom);
    const pbtn = pli.querySelector<HTMLButtonElement>('.buy')!;
    pbtn.addEventListener('click', () => {
      if (!reparerProjet(state, p.id, x.id)) return;
      sons.jouer('achat');
      save(localStorage, state);
      if (projetFini(state, p)) showMessage(t('{nom} est retapé! Il reste dans ta cour : {x} sur tous tes gains.', { nom: t(p.nom), x: facteur(p.bonus) }));
      render();
    });
    return { x, li: pli, btn: pbtn, cost: pli.querySelector<HTMLElement>('.cost')! };
  });
  $('projets-liste').append(li, ...pieces.map((x) => x.li));
  return { p, li, btn, cost: li.querySelector<HTMLElement>('.cost')!, pieces };
});
function renderProjets(): void {
  let visible = false;
  for (const row of projetRows) {
    const ouvert = projetDebloque(state, row.p);
    const faites = state.projets[row.p.id];
    const fini = projetFini(state, row.p);
    visible ||= ouvert;
    row.li.hidden = !ouvert;
    row.li.classList.toggle('done', fini);
    row.cost.textContent = fini ? t('RETAPÉ') : faites ? t('À TOÉ') : formatMoney(row.p.prix);
    row.btn.disabled = !!faites || !assez(state, row.p.prix);
    if (!faites) progres(row.btn, row.p.prix);
    for (const pc of row.pieces) {
      // Les pièces s'affichent quand le char est à toé, pis disparaissent quand il est fini.
      pc.li.hidden = !faites || fini;
      const faite = !!faites?.includes(pc.x.id);
      pc.li.classList.toggle('done', faite);
      pc.cost.textContent = faite ? t('RÉPARÉ') : formatMoney(pc.x.cost);
      pc.btn.disabled = faite || !assez(state, pc.x.cost);
      if (!faite) progres(pc.btn, pc.x.cost);
    }
  }
  $('projets').hidden = !visible;
}

let lastQuestId = '';
function renderQuest(): void {
  const q = activeQuest(state);
  questEl.hidden = q === null;
  if (!q) return;
  if (q.id !== lastQuestId) {
    const who = CHARACTERS[q.giver];
    qPortrait.textContent = who.initials;
    qPortrait.style.background = who.color;
    qWho.textContent = t(who.name).toUpperCase();
    qLine.textContent = cite(t(q.ask));
    qGoal.textContent = t(q.goal).toUpperCase();
    qReward.textContent = `+${formatMoney(q.reward)}`;
    lastQuestId = q.id;
  }
  const progress = questProgress(state, q);
  qBar.style.width = `${progress * 100}%`;
  const ready = progress >= 1;
  qClaim.hidden = !ready;
  questEl.classList.toggle('ready', ready);
}

let lastSave = Date.now();
function loop(): void {
  const now = Date.now();
  tick(state, now);
  if (now - lastSave > 5000) {
    save(localStorage, state);
    lastSave = now;
  }
  render();
  renderToast(now);
}

setInterval(loop, 100);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') save(localStorage, state);
});
window.addEventListener('pagehide', () => save(localStorage, state));

render();
