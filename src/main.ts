import '@fontsource/vt323';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';
import './style.css';
import { createRang, type Lieu } from './scene/rang';
import { ARTICLES, REJEAN } from './game/magasin';
import { icone } from './icones';
import { createSons } from './platform/sons';
import { createRadio, STATIONS } from './platform/radio';
import { CHARACTERS } from './game/quests';
import { createDemoAds } from './platform/ads';
import { CADEAUX, cadeauDuJour } from './game/cadeau';
import { NO_ADS_PRICE, webStore } from './platform/store';
import { UPGRADES, palier, prochainPalier } from './game/upgrades';
import { CAR_PRICE, CAR_TIP_MULT, PARTS } from './game/car';
import { BUILDINGS, PRESTIGE_BONUS_PER_POINT, PRESTIGE_MIN_EARNED, gainsPourPoints, prestigePointsFor } from './game/buildings';
import {
  prochainObjectif,
  prestigeDebloque,
  activeQuest,
  addBoost,
  BOOST_MAX_SECONDS,
  BOOST_SECONDS,
  buyBuilding,
  canBuyBuilding,
  canPrestige,
  earn,
  nextBuilding,
  prestige,
  applyOffline,
  OFFLINE_CAP_SECONDS,
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
  canUseArticle,
  useArticle,
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
import { resteSaison, saisonA } from './game/saisons';
import { formatHeure, heureA, jourA, meteoA, momentA } from './game/temps';
import { FETE_SECONDES, bonusFete, feteA, grosseFeteA } from './game/fetes';
import { PROJETS } from './game/chars';
import { EVENEMENTS, EVENEMENT_SECONDES, choisir, tirerEvenement, type Evenement } from './game/evenements';
import { SUCCES, verifierSucces, type Succes } from './game/succes';
import { formatDuration, formatMoney, formatNombre, notation } from './game/format';
import { cite, facteur, langue, t } from './game/i18n';
import { createAtelier } from './atelier';
import { CATEGORIES, possede, LOOK } from './game/look';
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

/** Un message, avec un titre en haut (pis une icône) si on en donne un. */
function showMessage(text: string, titre = '', icon = ''): void {
  messageText.textContent = text;
  $('message-tete').hidden = !titre;
  $('message-titre').textContent = titre;
  $('message-icone').innerHTML = icon;
  $('message-icone').hidden = !icon;
  $('message-doubler').hidden = true;
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

// Outils de dev (npm run dev seulement) : l'horloge du jeu peut avancer, pour changer de saison.
const devHorloge = { decalage: import.meta.env.DEV ? Number(localStorage.getItem('dev-decalage')) || 0 : 0 };
if (import.meta.env.DEV) {
  const vrai = Date.now;
  Date.now = () => vrai() + devHorloge.decalage;
}

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
type Onglet = 'succes' | 'stats' | 'reglages' | 'dev';
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

// La stat d'un achat, bâtie à partir des données : toujours visible, même en ligne compacte.
const statUpgrade = (u: (typeof UPGRADES)[number]) =>
  u.effect.kind === 'tapAdd'
    ? `+${formatMoney(u.effect.amount)} / ${t('tape')}`
    : u.effect.kind === 'passiveAdd'
      ? `+${formatMoney(u.effect.amount)}/s`
      : `${facteur(u.effect.factor)} ${t('sur tous tes gains')}`;
const statArticle = (a: (typeof ARTICLES)[number]) =>
  `${t(a.boosts === 'tap' ? 'Tapes' : 'Passif')} ${facteur(a.factor)} / ${formatDuration(a.seconds)}`;

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
      <span class="stat">${statUpgrade(u)}</span>
      <small>${t(u.description)}</small>
    </div>
    <button type="button" class="buy"><span class="cost"></span><span class="combien"></span></button>`;
  const btn = li.querySelector<HTMLButtonElement>('.buy')!;
  btn.addEventListener('click', () => {
    const avant = currentRate(state);
    const niveau = levelOf(state, u.id);
    if (buyMany(state, u.id, LOTS[lotMode])) {
      // Un palier passé (x2) : on le fête comme un bâtiment.
      const gros = palier(levelOf(state, u.id)) > palier(niveau);
      celebrerTaux(avant, gros);
      if (gros) sons.jouer('boost');
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
      <span class="stat">${p.essential ? t('Pour que ton bazou roule') : `${facteur(CAR_TIP_MULT)} ${t('sur tous tes gains')}`}</span>
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

const offline = applyOffline(state, Date.now());
if (offline.gained >= 0.01 && offline.seconds >= 60) {
  showMessage(
    t("Pendant que t'étais parti ({temps}), ta gang a ramassé {cash}.", { temps: formatDuration(offline.seconds), cash: formatMoney(offline.gained) }) +
      (offline.seconds >= OFFLINE_CAP_SECONDS ? ' ' + t('La gang arrête après {max}, reviens plus souvent!', { max: formatDuration(OFFLINE_CAP_SECONDS) }) : ''),
  );
  // Doubler ce que la gang a ramassé : une pub récompensée, jamais forcée (gratuit avec « pas de pubs »).
  const doubler = $<HTMLButtonElement>('message-doubler');
  doubler.textContent = t(sansPubs() ? '[ DOUBLER ]' : '[ PUB : DOUBLER ]');
  doubler.hidden = false;
  doubler.onclick = async () => {
    doubler.disabled = true;
    if (!sansPubs() && !(await ads.showRewarded())) {
      doubler.disabled = false;
      return;
    }
    earn(state, offline.gained);
    sons.jouer('achat');
    save(localStorage, state);
    showMessage(t('Doublé! La gang a ramassé {cash} de plus.', { cash: formatMoney(offline.gained) }));
    render();
  };
}

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
      <span class="stat">${statArticle(a)}</span>
      <small>${t(a.description)}</small>
    </div>
    <button type="button" class="buy"><span class="cost"></span></button>`;
  const btn = li.querySelector<HTMLButtonElement>('.buy')!;
  btn.addEventListener('click', () => {
    if (buyArticle(state, a.id)) {
      sons.jouer('achat');
      // Le buff part pas tout de suite : Réjean le dit.
      mLine.textContent = cite(t("Je te mets ça dans ton sac. Ça part quand tu t'en sers dans ton inventaire."));
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
    const n = state.inventaire[a.id] ?? 0;
    row.level.textContent = n > 0 ? `x${n}` : '';
    const cost = articleCost(state, a.id);
    row.cost.textContent = formatMoney(cost);
    row.btn.disabled = !canBuyArticle(state, a.id);
    progres(row.btn, cost);
  }
}

// L'inventaire, sous LIVRER : ce que t'as acheté chez Réjean, à fumer, boire ou manger n'importe quand.
const invLine = $('inv-line');
let derniereLigne = '';
// Le sac à dos ouvre pis ferme l'inventaire (gardé sur l'appareil).
const sacBtn = $('sac');
$('sac-icone').innerHTML = icone('sac');
const ouvrirSac = (oui: boolean) => {
  sacBtn.setAttribute('aria-expanded', String(oui));
  $('inv-corps').hidden = !oui;
};
ouvrirSac(pref.get('sac') !== 'ferme');
sacBtn.addEventListener('click', () => {
  const oui = $('inv-corps').hidden;
  ouvrirSac(oui);
  pref.set('sac', oui ? 'ouvert' : 'ferme');
});
const invRows = new Map<string, { li: HTMLElement; btn: HTMLButtonElement; level: HTMLElement }>();
for (const a of ARTICLES) {
  const li = document.createElement('li');
  li.className = 'upgrade';
  li.innerHTML = `
    <div class="upgrade-info">
      <strong>${t(a.name)} <span class="level"></span></strong>
      <span class="stat">${statArticle(a)}</span>
    </div>
    <button type="button" class="buy">${t(a.verbe)}</button>`;
  const btn = li.querySelector<HTMLButtonElement>('.buy')!;
  btn.addEventListener('click', () => {
    if (useArticle(state, a.id)) {
      sons.jouer('achat');
      derniereLigne = t(a.ligne);
      save(localStorage, state);
      render();
    }
  });
  invRows.set(a.id, { li, btn, level: li.querySelector('.level')! });
  $('inventaire-liste').append(li);
}
function renderInventaire(): void {
  const vide = Object.keys(state.inventaire).length === 0;
  invLine.textContent = vide ? t('Ton sac est vide. Passe voir Réjean au magasin.') : derniereLigne;
  invLine.hidden = !invLine.textContent;
  const total = Object.values(state.inventaire).reduce((a, b) => a + b, 0);
  $('sac-n').textContent = total > 0 ? `x${total}` : '';
  for (const a of ARTICLES) {
    const row = invRows.get(a.id)!;
    const n = state.inventaire[a.id] ?? 0;
    row.li.hidden = n === 0;
    const left = Math.ceil(state.magasin[a.id] ?? 0);
    row.level.textContent = `x${n}` + (left > 0 ? ` · ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : '');
    row.btn.disabled = !canUseArticle(state, a.id);
  }
}
lieuBtns.forEach((b) => b.addEventListener('click', () => allerA(b.dataset.lieu as Lieu)));

// Les gros moments : le $/s grossit une seconde pis le « +X $/s » gagné apparaît à côté.
function celebrerTaux(avant: number, gros: boolean): void {
  const plus = currentRate(state) - avant;
  if (plus <= 0) return;
  rateEl.classList.remove('bump', 'gros');
  void rateEl.offsetWidth;
  if (!reduceMotion) rateEl.classList.add('bump', ...(gros ? ['gros'] : []));
  const span = document.createElement('span');
  span.className = 'taux-plus';
  span.textContent = `+${formatMoney(plus)}/s`;
  rateEl.after(span);
  setTimeout(() => span.remove(), gros ? 2500 : 1500);
}

batBuy.addEventListener('click', () => {
  const b = nextBuilding(state);
  const avant = currentRate(state);
  if (!b || !buyBuilding(state, b.id)) return;
  celebrerTaux(avant, true);
  sons.jouer('boost');
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

const atelier = createAtelier({
  dialog: $<HTMLDialogElement>('atelier'),
  etat: () => state,
  reduceMotion,
  change: (achat) => {
    sons.jouer(achat ? 'achat' : 'boost');
    save(localStorage, state);
    render();
  },
  expo: (msg) => {
    sons.jouer('quete');
    save(localStorage, state);
    showMessage(msg);
    render();
  },
});
$('atelier-ouvrir').addEventListener('click', () => atelier.ouvrir());
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
  renderBuffs();
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
    look: state.look.choix,
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
  renderTemps();
  renderEvenement();
  renderProjets();
  renderMagasin();
  renderInventaire();
  $('look').hidden = !state.car.owned;
  if (state.car.owned) {
    const n = CATEGORIES.reduce((k, c) => k + LOOK[c].options.filter((x) => x.prix > 0 && possede(state, c, x.id)).length, 0);
    const total = CATEGORIES.reduce((k, c) => k + LOOK[c].options.filter((x) => x.prix > 0).length, 0);
    $('look-resume').textContent = t('Peinture, mags, toit pis plus. {n} / {total} pièces dans ta collection.', { n, total });
  }
  atelier.render();
  minijeux.render();
  celebrer(verifierSucces(state));
  renderTuto();
  renderMenu();
  renderEmpire(roule);

  // La barre du prochain objectif, toujours là, avec le temps qui reste à ton $/s.
  const obj = prochainObjectif(state);
  goalEl.hidden = !obj;
  if (obj) {
    const reste = obj.cout - obj.avoir;
    const taux = currentRate(state);
    $('goal-nom').textContent = t('PROCHAIN : {nom}', { nom: t(obj.nom).toUpperCase() });
    goalBar.style.width = `${Math.min(1, obj.avoir / obj.cout) * 100}%`;
    goalText.textContent =
      `${formatMoney(obj.avoir)} / ${formatMoney(obj.cout)}` +
      (reste <= 0 ? ` · ${t('PRÊT!')}` : taux > 0 && reste / taux < 100 * 3600 ? ` · ~${formatDuration(reste / taux)}` : '');
  }
  buyCarBtn.hidden = state.car.owned || !assez(state, CAR_PRICE);
  // Tout réparé : la section disparaît, le bouton LIVRER dit déjà que ça roule.
  garageEl.hidden = !state.car.owned || PARTS.every((p) => isRepaired(state, p.id));
  if (state.car.owned) {
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
    const vise = prochainPalier(u, level);
    row.level.textContent =
      (level > 0 ? `${t('NIV.')} ${level}` : '') +
      (vise ? ` · ${t('x2 AU {n}', { n: vise })}` : '') +
      (bonus ? ` ${t(saisonA(state.lastTick).nom)} ${facteur(bonus)}` : '');
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
    const n = UPGRADES.filter((u) => u.requires === b.id).length;
    $('bat-stat').textContent = t(b.id === 'bar' ? 'Débloque {n} achats pis le prestige' : 'Débloque {n} achats', { n });
    batCost.textContent = formatMoney(b.cost);
    batBuy.disabled = !canBuyBuilding(state, b.id);
    progres(batBuy, b.cost);
  }
  prestigeEl.hidden = !prestigeDebloque(state);
  if (prestigeDebloque(state)) {
    const ready = canPrestige(state);
    const points = prestigePointsFor(state.totalEarned);
    // L'aperçu : de combien tes gains montent, pis quand tu gagnes le point suivant si t'attends.
    const avant = 1 + pts * PRESTIGE_BONUS_PER_POINT;
    const apres = 1 + (pts + points) * PRESTIGE_BONUS_PER_POINT;
    prestigeDesc.textContent = ready
      ? t('Tu repars à zéro avec {points} points de réputation (+{pc} % pour toujours).', { points, pc: points * PRESTIGE_BONUS_PER_POINT * 100 }) +
        ' ' +
        t('Tes gains de la prochaine partie : {x}. Si t\'attends, un point de plus à {cash} gagnés.', {
          x: facteur(Math.round((apres / avant) * 100) / 100),
          cash: formatMoney(gainsPourPoints(points + 1)),
        })
      : t("Disponible à {min} gagnés au total. T'es rendu à {cash}.", { min: formatMoney(PRESTIGE_MIN_EARNED), cash: formatMoney(state.totalEarned) });
    prestigeBtn.disabled = !ready;
  }
}

function renderBoost(): void {
  const full = state.boostSeconds + BOOST_SECONDS > BOOST_MAX_SECONDS;
  boostBtn.disabled = full;
  boostBtn.textContent = t(sansPubs() ? '[ BOOST x2 ]' : '[ PUB : BOOST x2 ]');
  boostSub.textContent = t(sansPubs() ? '1 H GRATUITE' : '1 H POUR UNE PUB');
  noAdsBuy.textContent = t(state.noAds ? 'ACHETÉ' : NO_ADS_PRICE);
  noAdsBuy.disabled = state.noAds;
}

// --- Buffs actifs : une icône par achat dans la barre du haut, qui se vide avec le temps ---

const buffsEl = $('buffs');
const buffIcones = new Map<string, HTMLButtonElement>();
function temps(s: number): string {
  const c = Math.ceil(s);
  return `${Math.floor(c / 60)}:${String(c % 60).padStart(2, '0')}`;
}
function buffsActifs(): { id: string; nom: string; description: string; left: number; duree: number }[] {
  return [
    { id: 'boost', nom: 'Boost x2', description: 'Tes tapes pis ton passif x2.', left: state.boostSeconds, duree: BOOST_SECONDS },
    ...ARTICLES.map((a) => ({ id: a.id, nom: a.name, description: a.description, left: state.magasin[a.id] ?? 0, duree: a.seconds })),
  ].filter((b) => b.left > 0);
}
function renderBuffs(): void {
  const actifs = buffsActifs();
  for (const [id, btn] of buffIcones) {
    if (actifs.some((b) => b.id === id)) continue;
    btn.remove();
    buffIcones.delete(id);
  }
  for (const b of actifs) {
    let btn = buffIcones.get(b.id);
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'buff';
      btn.innerHTML = icone(b.id);
      btn.addEventListener('click', () => {
        const now = buffsActifs().find((y) => y.id === b.id);
        if (now) showMessage(`${t(now.description)} ${t('Il reste {temps}.', { temps: temps(now.left) })}`, t(now.nom), icone(b.id));
      });
      buffsEl.append(btn);
      buffIcones.set(b.id, btn);
    }
    // L'horloge fait un tour par achat : claire quand t'achètes, toute sombre à zéro.
    btn.style.setProperty('--reste', String(b.left / (Math.ceil(b.left / b.duree) * b.duree)));
    btn.classList.toggle('fin', b.left < 30);
    btn.setAttribute('aria-label', `${t(b.nom)} ${temps(b.left)}`);
  }
  buffsEl.hidden = actifs.length === 0;
}

// --- L'heure pis la météo : petit dans la barre du haut, on tape dessus pour les détails ---

const heureBtn = $<HTMLButtonElement>('heure');
let lastTemps = '';
heureBtn.addEventListener('click', () => {
  const ms = state.lastTick;
  showMessage(
    t('Jour {j} de la saison, {h}, {moment}. Météo : {meteo}. Une journée dure 2 minutes.', {
      j: jourA(ms),
      h: formatHeure(heureA(ms)),
      moment: t(momentA(ms).nom).toLowerCase(),
      meteo: t(meteoA(ms).nom).toLowerCase(),
    }),
  );
});
function renderTemps(): void {
  const ms = state.lastTick;
  const h = heureA(ms);
  const m = meteoA(ms);
  const texte = `J${jourA(ms)} · ${formatHeure(h)}${m.id === 'beau' ? '' : ` · ${t(m.nom)}`}`;
  if (texte === lastTemps) return;
  heureBtn.textContent = texte;
  rang?.setTemps(Math.floor(h * 6) / 6, m.id);
  lastTemps = texte;
}

// --- Saisons ---

const saisonBtn = $<HTMLButtonElement>('saison');
let lastSaison = '';
saisonBtn.addEventListener('click', () => {
  const x = saisonA(state.lastTick);
  const f = feteA(state.lastTick);
  showMessage(
    f
      ? `${t(f.description)} ${t('Gains {x}.', { x: facteur(bonusFete(state.lastTick)) })} ${t(grosseFeteA(state.lastTick) ? "C'est la vraie date : la fête dure toute la journée!" : 'La fête dure 3 minutes.')}`
      : `${t(x.description)} ${t('Chaque saison dure 10 minutes, pis finit avec une fête.')}`,
    t(f ? f.nom : x.nom),
  );
});
function renderSaison(): void {
  const x = saisonA(state.lastTick);
  const f = feteA(state.lastTick);
  // Les 2 dernières minutes avant la fête : le compte à rebours.
  const avant = Math.ceil(resteSaison(state.lastTick) - FETE_SECONDES);
  const bientot = !f && avant <= 120 ? ` · ${t('FÊTE DANS {temps}', { temps: `${Math.floor(avant / 60)}:${String(avant % 60).padStart(2, '0')}` })}` : '';
  const cle = `${x.id}/${f?.id ?? ''}${bientot}`;
  if (cle === lastSaison) return;
  const debut = !!f && !lastSaison.includes(`/${f.id}`);
  saisonBtn.textContent = f ? `${t(f.nom)} ${facteur(bonusFete(state.lastTick))}` : t(x.nom) + bientot;
  saisonBtn.classList.toggle('fete', !!f);
  rang?.setSaison(x.id);
  rang?.setFete(f?.id ?? null);
  // La fête commence : son invitation arrive tout de suite (pas au premier chargement).
  const fe = debut && lastSaison && EVENEMENTS.find((e) => e.fete === f.id);
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
      <span class="stat"></span>
      <small></small>
    </div>
    <button type="button" class="buy"><span class="cost"></span></button>`;
  li.querySelector('strong')!.textContent = t(p.nom);
  li.querySelector('.stat')!.textContent = t('Une fois retapé : {x} sur tous tes gains.', { x: facteur(p.bonus) });
  li.querySelector('small')!.textContent = t(p.description);
  const btn = li.querySelector<HTMLButtonElement>('.buy')!;
  btn.addEventListener('click', () => {
    if (!buyProjet(state, p.id)) return;
    sons.jouer('achat');
    save(localStorage, state);
    render();
  });
  const pieces = p.pieces.map((x, i) => {
    const pli = document.createElement('li');
    pli.className = 'upgrade piece';
    pli.innerHTML = `<div class="upgrade-info"><strong></strong><span class="stat"></span></div><button type="button" class="buy"><span class="cost"></span></button>`;
    pli.querySelector('strong')!.textContent = t(x.nom);
    pli.querySelector('.stat')!.textContent = t('Pièce {i} sur {n} du {x}', { i: i + 1, n: p.pieces.length, x: facteur(p.bonus) });
    const pbtn = pli.querySelector<HTMLButtonElement>('.buy')!;
    pbtn.addEventListener('click', () => {
      const avant = currentRate(state);
      if (!reparerProjet(state, p.id, x.id)) return;
      if (projetFini(state, p)) celebrerTaux(avant, true);
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
  pastilles();
  // Le cadeau du jour, une fois le tuto fini pis les autres messages fermés.
  if (state.tuto === TUTO_FINI && !messageDialog.open) {
    const c = cadeauDuJour(state, now);
    if (c) {
      sons.jouer('quete');
      save(localStorage, state);
      const article = t(c.article.name);
      showMessage(
        t('Réjean : « Cadeau de la maison! » {article} dans ton sac.', { article }) +
          (c.serie > 1 ? ' ' + t('{n} jours de suite!', { n: c.serie }) : '') +
          (c.serie < CADEAUX.length ? ' ' + t('Reviens demain pour un plus gros cadeau.') : '') +
          (c.cash > 0 ? ' ' + t('Ton sac est plein : Réjean te donne {cash} à la place.', { cash: formatMoney(c.cash) }) : ''),
        t('CADEAU DU JOUR'),
      );
    }
  }
}

// Outils de dev : un onglet DEV dans le MENU, jamais dans la version en ligne.
if (import.meta.env.DEV) {
  ongletBtns.find((b) => b.dataset.onglet === 'dev')!.hidden = false;
  const avancer = (ms: number, gagner: boolean) => {
    devHorloge.decalage += ms;
    localStorage.setItem('dev-decalage', String(devHorloge.decalage));
    if (!gagner) state.lastTick = Date.now();
  };
  const outil = (id: string, f: () => void) =>
    $(id).addEventListener('click', () => {
      f();
      save(localStorage, state);
      render();
    });
  outil('dev-cash', () => earn(state, Math.max(1000, state.cash * 9)));
  outil('dev-saison', () => avancer(resteSaison(Date.now()) * 1000 + 1, false));
  outil('dev-fete', () => avancer(Math.max(0, resteSaison(Date.now()) - FETE_SECONDES) * 1000 + 1, false));
  outil('dev-heure', () => avancer(3600 * 1000, true));
  outil('dev-vraie', () => avancer(-devHorloge.decalage, false));
  outil('dev-evenement', () => (prochainEvenement = 0));
  outil('dev-minijeux', () => (state.minijeux = {}));
  outil('dev-tuto', finirTuto);
}

// --- De la place à l'écran : catégories repliables pis lignes compactes, gardées sur l'appareil ---

const liste = (k: string) => new Set<string>(JSON.parse(pref.get(k) ?? '[]'));
const replies = liste('replies');
const compactes = liste('compactes');
const garderPlace = () => {
  pref.set('replies', JSON.stringify([...replies]));
  pref.set('compactes', JSON.stringify([...compactes]));
};
// Un élément qui se touche comme un bouton (doigt, souris ou clavier).
const touchable = (el: HTMLElement, f: () => void) => {
  el.tabIndex = 0;
  el.setAttribute('role', 'button');
  el.addEventListener('click', f);
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    f();
  });
};

const colListes = document.querySelector<HTMLElement>('.col-listes')!;
const titres = [...colListes.querySelectorAll<HTMLElement>('h2')];
// Une icône par catégorie, en haut des listes : touche pour ouvrir ou fermer.
const COURTS: Record<string, string> = {
  garage: 'BAZOU',
  look: 'LOOK',
  minijeux: 'JEUX',
  empire: 'EMPIRE',
  projets: 'CHARS',
  achats: 'ACHATS',
  boutique: 'BOUTIQUE',
};
// De gauche à droite, dans l'ordre où tu les débloques.
const ORDRE = ['achats', 'garage', 'look', 'minijeux', 'projets', 'empire', 'boutique'];
const rangDe = (h2: HTMLElement) => (ORDRE.indexOf(h2.closest('section')!.id) + 1 || 99);
const cats = new Map<HTMLElement, HTMLButtonElement>();
for (const h2 of [...titres].sort((a, b) => rangDe(a) - rangDe(b))) {
  const s = h2.closest('section')!;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'cat';
  b.innerHTML = `${icone(s.id)}<span></span>`;
  b.querySelector('span')!.textContent = t(COURTS[s.id] ?? h2.textContent!);
  b.setAttribute('aria-label', h2.textContent!);
  b.addEventListener('click', () => basculer(h2));
  $('cats').append(b);
  cats.set(h2, b);
}
const plier = (h2: HTMLElement, replie: boolean) => {
  const s = h2.closest('section')!;
  s.classList.toggle('replie', replie);
  h2.setAttribute('aria-expanded', String(!replie));
  cats.get(h2)!.setAttribute('aria-pressed', String(!replie));
  if (replie) replies.add(s.id);
  else replies.delete(s.id);
};
let accordeon = pref.get('accordeon') === 'on';
function basculer(h2: HTMLElement): void {
  const ouvrir = h2.closest('section')!.classList.contains('replie');
  if (ouvrir && accordeon) titres.forEach((x) => plier(x, true));
  plier(h2, !ouvrir);
  garderPlace();
}
for (const h2 of titres) {
  plier(h2, replies.has(h2.closest('section')!.id));
  touchable(h2, () => basculer(h2));
}

// Un petit chiffre discret dit combien de choses sont prêtes (mini-jeu, achat) dans une catégorie fermée.
function pastilles(): void {
  for (const [h2, b] of cats) {
    const s = h2.closest('section')!;
    // Le look se change juste à la maison ou au garage.
    const ailleurs = s.id === 'look' && !!rang && lieu !== 'maison' && lieu !== 'garage';
    s.classList.toggle('ailleurs', ailleurs);
    b.hidden = s.hidden || ailleurs;
    if (h2.closest('#boutique')) continue; // pas de pastille pour de l'argent réel
    const n = String(s.querySelectorAll('.upgrade:not([hidden]) .buy:not(:disabled)').length);
    if (b.dataset.prets !== n) b.dataset.prets = n;
  }
}

const lignes = [...colListes.querySelectorAll<HTMLElement>('li.upgrade')];
const compacter = (li: HTMLElement, oui: boolean) => {
  li.classList.toggle('compacte', oui);
  li.querySelector('.upgrade-info')!.setAttribute('aria-expanded', String(!oui));
  if (oui) compactes.add(li.dataset.cle!);
  else compactes.delete(li.dataset.cle!);
};
for (const li of lignes) {
  li.dataset.cle = `${li.closest('section')!.id}-${[...li.parentElement!.children].indexOf(li)}`;
  compacter(li, compactes.has(li.dataset.cle));
  touchable(li.querySelector('.upgrade-info')!, () => {
    compacter(li, !li.classList.contains('compacte'));
    garderPlace();
  });
}

const partout = (id: string, f: () => void) =>
  $(id).addEventListener('click', () => {
    f();
    garderPlace();
  });
partout('tout-replier', () => titres.forEach((h2) => plier(h2, true)));
partout('tout-deplier', () => titres.forEach((h2) => plier(h2, false)));
partout('tout-compact', () => lignes.forEach((li) => compacter(li, true)));
partout('tout-normal', () => lignes.forEach((li) => compacter(li, false)));

const accordeonBtn = $<HTMLButtonElement>('accordeon');
bascule(accordeonBtn, accordeon);
accordeonBtn.addEventListener('click', () => {
  accordeon = !accordeon;
  bascule(accordeonBtn, accordeon);
  pref.set('accordeon', accordeon ? 'on' : 'off');
});

// Descriptions : juste les phrases avec un chiffre d'effet (+1 $/s, x1,5), sans les jokes.
const stat = (texte: string) =>
  texte
    .split(/(?<=\.)\s+/)
    .filter((x) => /[+x]\s?\$?\d/.test(x))
    .join(' ');
const descriptions = ['upgrades', 'parts', 'articles', 'projets-liste'].flatMap((id) =>
  [...$(id).querySelectorAll('small')].map((el) => ({ el, tout: el.textContent!, aStat: !!el.closest('li')!.querySelector('.stat') })),
);
// Une ligne qui a déjà sa stat garde juste la joke en TOUT, pis rien en STATS.
const sansStat = (texte: string) =>
  texte
    .split(/(?<=\.)\s+/)
    .filter((x) => !/[+x]\s?\$?\d/.test(x))
    .join(' ');
const descriptionsBtn = $<HTMLButtonElement>('descriptions');
const setDescriptions = (stats: boolean) => {
  for (const d of descriptions) {
    d.el.textContent = d.aStat ? (stats ? '' : sansStat(d.tout)) : stats ? stat(d.tout) : d.tout;
    d.el.hidden = !d.el.textContent;
  }
  document.body.classList.toggle('stats-seulement', stats);
  bascule(descriptionsBtn, !stats, 'TOUT', 'STATS');
};
setDescriptions(pref.get('descriptions') === 'stats');
descriptionsBtn.addEventListener('click', () => {
  const stats = descriptionsBtn.getAttribute('aria-pressed') === 'true';
  setDescriptions(stats);
  pref.set('descriptions', stats ? 'stats' : 'tout');
});

// Texte des quêtes : la réplique pis le portrait s'en vont, l'objectif reste.
const queteTexteBtn = $<HTMLButtonElement>('quete-texte');
const setQueteTexte = (on: boolean) => {
  $('quest').classList.toggle('sans-texte', !on);
  bascule(queteTexteBtn, on);
};
setQueteTexte(pref.get('quete-texte') !== 'off');
queteTexteBtn.addEventListener('click', () => {
  const on = $('quest').classList.contains('sans-texte');
  setQueteTexte(on);
  pref.set('quete-texte', on ? 'on' : 'off');
});

// Écran 3D plus bas : plus de place pour les listes, surtout sur un téléphone.
const ecranBtn = $<HTMLButtonElement>('ecran-taille');
const setEcran = (petit: boolean) => {
  $('ecran').classList.toggle('petit', petit);
  bascule(ecranBtn, !petit, 'GRAND', 'PETIT');
};
setEcran(pref.get('ecran') === 'petit');
ecranBtn.addEventListener('click', () => {
  const petit = !$('ecran').classList.contains('petit');
  setEcran(petit);
  pref.set('ecran', petit ? 'petit' : 'grand');
});

setInterval(loop, 100);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') save(localStorage, state);
});
window.addEventListener('pagehide', () => save(localStorage, state));

render();
