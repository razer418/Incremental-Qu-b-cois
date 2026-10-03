import './style.css';
import { UPGRADES } from './game/upgrades';
import {
  FIRST_CAR_GOAL,
  applyOffline,
  buy,
  levelOf,
  newGame,
  nextCost,
  passiveRate,
  tap,
  tapValue,
  tick,
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
const offlineDialog = $<HTMLDialogElement>('offline');
const offlineText = $('offline-text');

let state = load(localStorage, Date.now());

const offline = applyOffline(state, Date.now());
if (offline.gained >= 0.01 && offline.seconds >= 60) {
  offlineText.textContent = `Pendant que t'étais parti (${formatDuration(offline.seconds)}), ta gang a ramassé ${formatMoney(offline.gained)}.`;
  offlineDialog.showModal();
}

// Une ligne par achat, créée une fois.
const rows = new Map<string, { btn: HTMLButtonElement; level: HTMLElement; cost: HTMLElement }>();
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
  rows.set(u.id, { btn, level: li.querySelector('.level')!, cost: li.querySelector('.cost')! });
  upgradesEl.append(li);
}

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
  rateEl.textContent = `${formatMoney(passiveRate(state))}/s`;
  tapValueEl.textContent = `+${formatMoney(tapValue(state))}`;

  const progress = Math.min(1, state.cash / FIRST_CAR_GOAL);
  goalBar.style.width = `${progress * 100}%`;
  goalText.textContent =
    progress >= 1 ? 'Prêt! (Jalon 2)' : `${formatMoney(state.cash)} / ${formatMoney(FIRST_CAR_GOAL)}`;

  for (const u of UPGRADES) {
    const row = rows.get(u.id)!;
    const cost = nextCost(state, u.id);
    const level = levelOf(state, u.id);
    row.level.textContent = level > 0 ? `niv. ${level}` : '';
    row.cost.textContent = cost === null ? 'Au max' : formatMoney(cost);
    row.btn.disabled = cost === null || state.cash < cost;
  }
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
