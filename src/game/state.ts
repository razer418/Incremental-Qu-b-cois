import { UPGRADES, getUpgrade, upgradeCost } from './upgrades';

export interface GameState {
  version: 1;
  cash: number;
  totalEarned: number;
  taps: number;
  upgrades: Record<string, number>;
  lastTick: number;
}

export const BASE_TAP = 0.1; // une canette consignée
export const OFFLINE_CAP_SECONDS = 8 * 60 * 60;
export const FIRST_CAR_GOAL = 500;

export function newGame(now: number): GameState {
  return { version: 1, cash: 0, totalEarned: 0, taps: 0, upgrades: {}, lastTick: now };
}

export function levelOf(state: GameState, id: string): number {
  return state.upgrades[id] ?? 0;
}

export function multiplier(state: GameState): number {
  let mult = 1;
  for (const u of UPGRADES) {
    if (u.effect.kind === 'globalMult') mult *= Math.pow(u.effect.factor, levelOf(state, u.id));
  }
  return mult;
}

export function tapValue(state: GameState): number {
  let value = BASE_TAP;
  for (const u of UPGRADES) {
    if (u.effect.kind === 'tapAdd') value += u.effect.amount * levelOf(state, u.id);
  }
  return value * multiplier(state);
}

export function passiveRate(state: GameState): number {
  let rate = 0;
  for (const u of UPGRADES) {
    if (u.effect.kind === 'passiveAdd') rate += u.effect.amount * levelOf(state, u.id);
  }
  return rate * multiplier(state);
}

function earn(state: GameState, amount: number): void {
  state.cash += amount;
  state.totalEarned += amount;
}

export function tap(state: GameState): number {
  const value = tapValue(state);
  earn(state, value);
  state.taps += 1;
  return value;
}

/** Avance le temps. Retourne le montant gagné. */
export function tick(state: GameState, now: number): number {
  const seconds = Math.max(0, (now - state.lastTick) / 1000);
  state.lastTick = now;
  const gained = passiveRate(state) * seconds;
  earn(state, gained);
  return gained;
}

/** Gains pendant que l'app était fermée, plafonnés à 8 h. */
export function applyOffline(state: GameState, now: number): { seconds: number; gained: number } {
  const seconds = Math.min(OFFLINE_CAP_SECONDS, Math.max(0, (now - state.lastTick) / 1000));
  const gained = passiveRate(state) * seconds;
  earn(state, gained);
  state.lastTick = now;
  return { seconds, gained };
}

export function nextCost(state: GameState, id: string): number | null {
  const u = getUpgrade(id);
  if (!u) return null;
  const level = levelOf(state, id);
  return level >= u.maxLevel ? null : upgradeCost(u, level);
}

export function buy(state: GameState, id: string): boolean {
  const cost = nextCost(state, id);
  if (cost === null || state.cash < cost) return false;
  state.cash -= cost;
  state.upgrades[id] = levelOf(state, id) + 1;
  return true;
}

/** Réchauffement du rang : 0 au début, 0,5 quand t'as amassé de quoi payer ton premier bazou. */
export function warmth(state: GameState): number {
  return Math.min(1, state.totalEarned / FIRST_CAR_GOAL) * 0.5;
}
