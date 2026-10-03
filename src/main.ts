import '@fontsource/vt323';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';
import './style.css';
import { createRang } from './scene/rang';
import { createDemoAds } from './platform/ads';
import { NO_ADS_PRICE, webStore } from './platform/store';
import { UPGRADES } from './game/upgrades';
import { CAR_PRICE, PARTS } from './game/car';
import { CHARACTERS } from './game/quests';
import { PRESTIGE_BONUS_PER_POINT, PRESTIGE_MIN_EARNED, prestigePointsFor } from './game/buildings';
import {
  FIRST_CAR_GOAL,
  activeQuest,
  addBoost,
  boostFactor,
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
  buy,
  buyCar,
  carRuns,
  isRepaired,
  isUnlocked,
  repair,
  levelOf,
  newGame,
  nextCost,
  passiveRate,
  tap,
  tapValue,
  tick,
  warmth,
} from './game/state';
import { load, save, wipe } from './game/save';
import { formatDuration, formatMoney } from './game/format';

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

let state = load(localStorage, Date.now());

// Le rang en 3D, style Bazou VHS. Si WebGL marche pas, le jeu roule pareil.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rang = createRang($('ecran'), { pixelScale: 3, reduceMotion });
let lastWarmth = -1;
let lastLook = '';

// Lignes VHS : désactivables pour le confort des yeux, choix gardé sur l'appareil.
const VHS_KEY = 'incremental-quebecois-vhs';
const vhsBtn = $<HTMLButtonElement>('vhs');
const scanEl = $('scan');
const setVhs = (on: boolean) => {
  scanEl.hidden = !on;
  vhsBtn.setAttribute('aria-pressed', String(on));
  vhsBtn.textContent = on ? 'VHS : OUI' : 'VHS : NON';
};
let vhsOn = true;
try {
  vhsOn = localStorage.getItem(VHS_KEY) !== 'off';
} catch {
  // stockage bloqué : on garde les lignes
}
setVhs(vhsOn);
vhsBtn.addEventListener('click', () => {
  vhsOn = !vhsOn;
  setVhs(vhsOn);
  try {
    localStorage.setItem(VHS_KEY, vhsOn ? 'on' : 'off');
  } catch {
    // rien à faire
  }
});

const offline = applyOffline(state, Date.now());
if (offline.gained >= 0.01 && offline.seconds >= 60) {
  showMessage(
    `Pendant que t'étais parti (${formatDuration(offline.seconds)}), ta gang a ramassé ${formatMoney(offline.gained)}.`,
  );
}

// Une ligne par achat, créée une fois.
const rows = new Map<string, { li: HTMLLIElement; btn: HTMLButtonElement; level: HTMLElement; cost: HTMLElement }>();
for (const u of UPGRADES) {
  const li = document.createElement('li');
  li.className = 'upgrade';
  li.innerHTML = `
    <div class="upgrade-info">
      <strong>${u.name} <span class="level"></span></strong>
      <small>${u.description}</small>
    </div>
    <button type="button" class="buy"><span class="cost"></span></button>`;
  const btn = li.querySelector<HTMLButtonElement>('.buy')!;
  btn.addEventListener('click', () => {
    if (buy(state, u.id)) {
      save(localStorage, state);
      render();
    }
  });
  rows.set(u.id, { li, btn, level: li.querySelector('.level')!, cost: li.querySelector('.cost')! });
  upgradesEl.append(li);
}

// Les pièces du bazou, une ligne chacune.
const partRows = new Map<string, { li: HTMLLIElement; btn: HTMLButtonElement; cost: HTMLElement }>();
for (const p of PARTS) {
  const li = document.createElement('li');
  li.className = 'upgrade';
  li.innerHTML = `
    <div class="upgrade-info">
      <strong>${p.name}</strong>
      <small>${p.description}</small>
    </div>
    <button type="button" class="buy"><span class="cost"></span></button>`;
  const btn = li.querySelector<HTMLButtonElement>('.buy')!;
  btn.addEventListener('click', () => {
    const roulait = carRuns(state);
    if (!repair(state, p.id)) return;
    save(localStorage, state);
    if (!roulait && carRuns(state)) {
      showMessage(
        "Vroum! Ton bazou part du premier coup (ou presque). T'es maintenant livreur de pizza, pis les jobs motorisées sont débloquées.",
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
  save(localStorage, state);
  showMessage(`${CHARACTERS[q.giver].name} : « ${q.thanks} » (+${formatMoney(q.reward)})`);
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
  save(localStorage, state);
  render();
});

noAdsBuy.addEventListener('click', async () => {
  if (state.noAds) return;
  if (!store.available) {
    showMessage(`« Pas de pubs » (${NO_ADS_PRICE}) va s'acheter dans l'app Android, via Google Play. Sur le web, y'a juste des pubs de démo.`);
    return;
  }
  if (await store.buyNoAds()) {
    state.noAds = true;
    save(localStorage, state);
    showMessage('Merci! Le boost est gratuit pour toujours, pis y aura pu jamais de pubs.');
    render();
  }
});

batBuy.addEventListener('click', () => {
  const b = nextBuilding(state);
  if (!b || !buyBuilding(state, b.id)) return;
  save(localStorage, state);
  showMessage(
    b.id === 'garage'
      ? "Ti-Guy : « On est en affaires! » Le garage est à toé. De nouveaux achats sont débloqués."
      : "Le bonhomme Gagnon : « Prends soin de mon lot. » Le concessionnaire est à toé, pis la radio locale t'attend.",
  );
  render();
});

prestigeBtn.addEventListener('click', () => {
  const points = prestigePointsFor(state.totalEarned);
  const ok = confirm(
    `Vendre l'empire? Tu repars à pied avec 0 $, mais tu gagnes ${points} points de réputation (+${points * PRESTIGE_BONUS_PER_POINT * 100} % sur tous tes gains, pour toujours).`,
  );
  if (!ok) return;
  const gained = prestige(state, Date.now());
  save(localStorage, state);
  showMessage(
    `Le rang au complet parle de toé. +${gained} points de réputation. Envoye, on recommence, mais plus vite cette fois-citte.`,
  );
  render();
});

buyCarBtn.addEventListener('click', () => {
  if (!buyCar(state)) return;
  save(localStorage, state);
  showMessage(
    "Le bonhomme Gagnon : « Y'é à toé, mon gars. Y roule pas, y'a pu de batterie pis y'é sur les blocs, mais c'est un bon char. »",
  );
  render();
});

tapBtn.addEventListener('click', () => {
  tap(state);
  tapBtn.classList.remove('pop');
  void tapBtn.offsetWidth;
  tapBtn.classList.add('pop');
  render();
});

$('reset').addEventListener('click', () => {
  if (!confirm('Tout effacer pis recommencer à zéro?')) return;
  wipe(localStorage);
  state = newGame(Date.now());
  render();
});

function render(): void {
  cashEl.textContent = formatMoney(state.cash);
  rateEl.textContent = `+${formatMoney(passiveRate(state) * boostFactor(state))}/s`;
  renderBoost();
  tapValueEl.textContent = `+${formatMoney(tapValue(state))}`;

  const w = Math.round(warmth(state) * 200) / 200;
  if (rang && w !== lastWarmth) {
    rang.setWarmth(w);
    lastWarmth = w;
  }

  const roule = carRuns(state);
  jobEl.textContent = roule ? 'LIVRER DES PIZZAS' : 'RAMASSER DES CANETTES';
  tapLabel.textContent = roule ? '[ LIVRER ]' : '[ RAMASSER ]';
  const look = {
    garage: state.buildings.garage,
    concession: state.buildings.concession,
    owned: state.car.owned,
    wheels: isRepaired(state, 'pneus'),
    clean: isRepaired(state, 'carrosserie'),
  };
  const lookKey = JSON.stringify(look);
  if (rang && lookKey !== lastLook) {
    rang.setCar(look);
    lastLook = lookKey;
  }

  renderQuest();
  renderEmpire(roule);

  // Avant l'achat : la barre d'objectif. Après : le garage avec les pièces.
  goalEl.hidden = state.car.owned;
  garageEl.hidden = !state.car.owned;
  if (!state.car.owned) {
    const progress = Math.min(1, state.cash / FIRST_CAR_GOAL);
    goalBar.style.width = `${progress * 100}%`;
    goalText.textContent = `${formatMoney(state.cash)} / ${formatMoney(FIRST_CAR_GOAL)}`;
    buyCarBtn.hidden = state.cash < CAR_PRICE;
  } else {
    carStatus.textContent = roule ? 'ÇA ROULE!' : 'SUR LES BLOCS';
    partsEl.hidden = PARTS.every((p) => isRepaired(state, p.id));
    carStatus.classList.toggle('roule', roule);
    for (const p of PARTS) {
      const row = partRows.get(p.id)!;
      const done = isRepaired(state, p.id);
      row.li.classList.toggle('done', done);
      row.cost.textContent = done ? 'RÉPARÉ' : formatMoney(p.cost);
      row.btn.disabled = done || state.cash < p.cost;
    }
  }

  for (const u of UPGRADES) {
    const row = rows.get(u.id)!;
    row.li.hidden = !isUnlocked(state, u);
    const cost = nextCost(state, u.id);
    const level = levelOf(state, u.id);
    row.level.textContent = level > 0 ? `NIV. ${level}` : '';
    row.cost.textContent = cost === null ? 'AU MAX' : formatMoney(cost);
    row.btn.disabled = cost === null || state.cash < cost;
  }
}

function renderEmpire(roule: boolean): void {
  const pts = state.prestige.points;
  repEl.hidden = pts === 0;
  repEl.textContent = `RÉPUTATION ${pts} (+${Math.round(pts * PRESTIGE_BONUS_PER_POINT * 100)} %)`;

  empireEl.hidden = !roule;
  if (!roule) return;
  const b = nextBuilding(state);
  batEl.hidden = b === null;
  if (b) {
    batName.textContent = b.name;
    batDesc.textContent = b.description;
    batCost.textContent = formatMoney(b.cost);
    batBuy.disabled = !canBuyBuilding(state, b.id);
  }
  prestigeEl.hidden = !state.buildings.concession;
  if (state.buildings.concession) {
    const ready = canPrestige(state);
    const points = prestigePointsFor(state.totalEarned);
    prestigeDesc.textContent = ready
      ? `Tu repars à zéro avec ${points} points de réputation (+${points * PRESTIGE_BONUS_PER_POINT * 100} % pour toujours).`
      : `Disponible à ${formatMoney(PRESTIGE_MIN_EARNED)} gagnés au total. T'es rendu à ${formatMoney(state.totalEarned)}.`;
    prestigeBtn.disabled = !ready;
  }
}

function renderBoost(): void {
  const left = Math.ceil(state.boostSeconds);
  const full = state.boostSeconds + BOOST_SECONDS > BOOST_MAX_SECONDS;
  boostBtn.disabled = full;
  boostBtn.textContent = sansPubs() ? '[ BOOST x2 ]' : '[ PUB : BOOST x2 ]';
  boostSub.classList.toggle('on', left > 0);
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');
  boostSub.textContent =
    left > 0 ? `x2 ACTIF : ${mm}:${ss}` : sansPubs() ? '10 MIN GRATUITES' : '10 MIN POUR UNE PUB';
  noAdsBuy.textContent = state.noAds ? 'ACHETÉ' : NO_ADS_PRICE;
  noAdsBuy.disabled = state.noAds;
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
    qWho.textContent = who.name.toUpperCase();
    qLine.textContent = `« ${q.ask} »`;
    qGoal.textContent = q.goal.toUpperCase();
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
}

setInterval(loop, 100);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') save(localStorage, state);
});
window.addEventListener('pagehide', () => save(localStorage, state));

render();
