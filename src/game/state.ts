import { UPGRADES, getUpgrade, upgradeCost, type Upgrade } from './upgrades';
import { CAR_PRICE, CAR_TIP_MULT, PARTS } from './car';
import { QUESTS, type Quest } from './quests';
import { ARTICLES, getArticle, type Article } from './magasin';
import {
  BUILDINGS,
  PRESTIGE_BONUS_PER_POINT,
  PRESTIGE_MIN_EARNED,
  prestigePointsFor,
  type BuildingId,
} from './buildings';

export interface GameState {
  version: 1;
  cash: number;
  totalEarned: number;
  taps: number;
  upgrades: Record<string, number>;
  car: { owned: boolean; parts: Record<string, boolean> };
  /** Index de la quête active dans QUESTS (= nombre de quêtes réclamées). */
  questIndex: number;
  buildings: Record<BuildingId, boolean>;
  /** Gardé d'une partie à l'autre. */
  prestige: { points: number; count: number };
  /** Secondes de boost x2 qui restent (pub récompensée). */
  boostSeconds: number;
  /** Achat « pas de pubs » : boost gratuit, sans pub. Gardé au prestige. */
  noAds: boolean;
  /** Secondes qui restent sur chaque article du magasin général. */
  magasin: Record<string, number>;
  lastTick: number;
}

export const BASE_TAP = 0.1; // une canette consignée
export const DELIVERY_TAP = 1.5; // une livraison de pizza
export const OFFLINE_CAP_SECONDS = 8 * 60 * 60;
export const FIRST_CAR_GOAL = CAR_PRICE;

export function newGame(now: number): GameState {
  return {
    version: 1,
    cash: 0,
    totalEarned: 0,
    taps: 0,
    upgrades: {},
    car: { owned: false, parts: {} },
    questIndex: 0,
    buildings: { garage: false, concession: false },
    prestige: { points: 0, count: 0 },
    boostSeconds: 0,
    noAds: false,
    magasin: {},
    lastTick: now,
  };
}

export function levelOf(state: GameState, id: string): number {
  return state.upgrades[id] ?? 0;
}

export function multiplier(state: GameState): number {
  let mult = 1;
  for (const u of UPGRADES) {
    if (u.effect.kind === 'globalMult') mult *= Math.pow(u.effect.factor, levelOf(state, u.id));
  }
  if (state.car.parts.carrosserie) mult *= CAR_TIP_MULT;
  mult *= 1 + state.prestige.points * PRESTIGE_BONUS_PER_POINT;
  return mult;
}

/** Une tape, sans les boosts temporaires. */
function baseTapValue(state: GameState): number {
  let value = carRuns(state) ? DELIVERY_TAP : BASE_TAP;
  for (const u of UPGRADES) {
    if (u.effect.kind === 'tapAdd') value += u.effect.amount * levelOf(state, u.id);
  }
  return value * multiplier(state);
}

export function tapValue(state: GameState): number {
  return baseTapValue(state) * boostFactor(state) * magasinFactor(state, 'tap');
}

/** Ce que tu fais par seconde en ce moment, avec les boosts. */
export function currentRate(state: GameState): number {
  return passiveRate(state) * boostFactor(state) * magasinFactor(state, 'idle');
}

export const BOOST_FACTOR = 2;
export const BOOST_SECONDS = 10 * 60;
/** On peut cumuler jusqu'à une heure de boost. */
export const BOOST_MAX_SECONDS = 60 * 60;

export function boostFactor(state: GameState): number {
  return state.boostSeconds > 0 ? BOOST_FACTOR : 1;
}

/** Ajoute 10 min de boost x2 (après une pub récompensée, ou gratuit avec « pas de pubs »). */
export function addBoost(state: GameState): boolean {
  if (state.boostSeconds + BOOST_SECONDS > BOOST_MAX_SECONDS) return false;
  state.boostSeconds += BOOST_SECONDS;
  return true;
}

/** Les articles du magasin qui sont encore actifs multiplient tes tapes ou ton passif. */
export function magasinFactor(state: GameState, boosts: Article['boosts']): number {
  let f = 1;
  for (const a of ARTICLES) if (a.boosts === boosts && (state.magasin[a.id] ?? 0) > 0) f *= a.factor;
  return f;
}

/** Prix d'un article : suit tes revenus (passif + environ 2 tapes par seconde). */
export function articleCost(state: GameState, id: string): number {
  const a = getArticle(id);
  if (!a) return Infinity;
  const income = passiveRate(state) + 2 * baseTapValue(state);
  return Math.round(Math.max(a.minCost, a.incomeSeconds * income) * 100) / 100;
}

/** On peut en reprendre quand il en reste moins que la durée d'un article (max 2 d'avance). */
export function canBuyArticle(state: GameState, id: string): boolean {
  const a = getArticle(id);
  return !!a && (state.magasin[id] ?? 0) <= a.seconds && state.cash >= articleCost(state, id);
}

export function buyArticle(state: GameState, id: string): boolean {
  if (!canBuyArticle(state, id)) return false;
  state.cash -= articleCost(state, id);
  state.magasin[id] = (state.magasin[id] ?? 0) + getArticle(id)!.seconds;
  return true;
}

/** Revenu passif sur une durée, en consommant le boost pis les articles qui restent. */
function passiveOver(state: GameState, seconds: number): number {
  const timers = [{ left: state.boostSeconds, factor: BOOST_FACTOR }];
  for (const a of ARTICLES) {
    if (a.boosts === 'idle') timers.push({ left: state.magasin[a.id] ?? 0, factor: a.factor });
  }
  // Par bouts : chaque fois qu'un boost finit, le facteur change.
  const cuts = [...new Set([0, seconds, ...timers.map((t) => Math.min(seconds, Math.max(0, t.left)))])].sort((a, b) => a - b);
  let weighted = 0;
  for (let i = 0; i < cuts.length - 1; i++) {
    const factor = timers.reduce((f, t) => (t.left > cuts[i] ? f * t.factor : f), 1);
    weighted += (cuts[i + 1] - cuts[i]) * factor;
  }
  state.boostSeconds = Math.max(0, state.boostSeconds - seconds);
  for (const id of Object.keys(state.magasin)) {
    const left = state.magasin[id] - seconds;
    if (left > 0) state.magasin[id] = left;
    else delete state.magasin[id];
  }
  return passiveRate(state) * weighted;
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
  const gained = passiveOver(state, seconds);
  earn(state, gained);
  return gained;
}

/** Gains pendant que l'app était fermée, plafonnés à 8 h. */
export function applyOffline(state: GameState, now: number): { seconds: number; gained: number } {
  const seconds = Math.min(OFFLINE_CAP_SECONDS, Math.max(0, (now - state.lastTick) / 1000));
  const gained = passiveOver(state, seconds);
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

export function isUnlocked(state: GameState, u: Upgrade): boolean {
  switch (u.requires) {
    case undefined:
      return true;
    case 'roule':
      return carRuns(state);
    default:
      return state.buildings[u.requires];
  }
}

export function buy(state: GameState, id: string): boolean {
  const u = getUpgrade(id);
  if (!u || !isUnlocked(state, u)) return false;
  const cost = nextCost(state, id);
  if (cost === null || state.cash < cost) return false;
  state.cash -= cost;
  state.upgrades[id] = levelOf(state, id) + 1;
  return true;
}

// --- Le bazou ---

export function buyCar(state: GameState): boolean {
  if (state.car.owned || state.cash < CAR_PRICE) return false;
  state.cash -= CAR_PRICE;
  state.car.owned = true;
  return true;
}

export function isRepaired(state: GameState, partId: string): boolean {
  return state.car.parts[partId] === true;
}

export function repair(state: GameState, partId: string): boolean {
  const part = PARTS.find((p) => p.id === partId);
  if (!part || !state.car.owned || isRepaired(state, partId) || state.cash < part.cost) return false;
  state.cash -= part.cost;
  state.car.parts[partId] = true;
  return true;
}

/** Le char roule quand toutes les pièces essentielles sont réparées. */
export function carRuns(state: GameState): boolean {
  return state.car.owned && PARTS.every((p) => !p.essential || isRepaired(state, p.id));
}

export function repairedFraction(state: GameState): number {
  return PARTS.filter((p) => isRepaired(state, p.id)).length / PARTS.length;
}

/**
 * Réchauffement du rang : 0,3 avec de quoi payer le bazou, 0,5 une fois le bazou tout réparé,
 * 0,7 avec le garage, 1 avec le concessionnaire.
 */
export function warmth(state: GameState): number {
  return (
    Math.min(1, state.totalEarned / FIRST_CAR_GOAL) * 0.3 +
    repairedFraction(state) * 0.2 +
    (state.buildings.garage ? 0.2 : 0) +
    (state.buildings.concession ? 0.3 : 0)
  );
}

// --- Bâtiments ---

/** Le prochain bâtiment à acheter, ou null quand t'as tout. */
export function nextBuilding(state: GameState) {
  return BUILDINGS.find((b) => !state.buildings[b.id]) ?? null;
}

export function canBuyBuilding(state: GameState, id: BuildingId): boolean {
  const next = nextBuilding(state);
  return next?.id === id && carRuns(state) && state.cash >= next.cost;
}

export function buyBuilding(state: GameState, id: BuildingId): boolean {
  if (!canBuyBuilding(state, id)) return false;
  state.cash -= nextBuilding(state)!.cost;
  state.buildings[id] = true;
  return true;
}

// --- Prestige ---

export function canPrestige(state: GameState): boolean {
  return state.buildings.concession && state.totalEarned >= PRESTIGE_MIN_EARNED;
}

/** Vend l'empire : tout repart à zéro sauf la réputation. Retourne les points gagnés. */
export function prestige(state: GameState, now: number): number {
  if (!canPrestige(state)) return 0;
  const gained = prestigePointsFor(state.totalEarned);
  const kept = { points: state.prestige.points + gained, count: state.prestige.count + 1 };
  Object.assign(state, newGame(now), {
    prestige: kept,
    noAds: state.noAds,
    // Les quêtes racontent la première partie; on les rejoue pas.
    questIndex: QUESTS.length,
  });
  return gained;
}

// --- Quêtes ---

export function activeQuest(state: GameState): Quest | null {
  return QUESTS[state.questIndex] ?? null;
}

/** Progrès de 0 à 1 vers l'objectif. */
export function questProgress(state: GameState, quest: Quest): number {
  const o = quest.objective;
  switch (o.kind) {
    case 'taps':
      return Math.min(1, state.taps / o.target);
    case 'earned':
      return Math.min(1, state.totalEarned / o.target);
    case 'upgrade':
      return Math.min(1, levelOf(state, o.id) / o.target);
    case 'ownCar':
      return state.car.owned ? 1 : Math.min(0.99, state.cash / CAR_PRICE);
    case 'repair':
      return isRepaired(state, o.part) ? 1 : 0;
    case 'building':
      return state.buildings[o.id] ? 1 : Math.min(0.99, state.cash / BUILDINGS.find((b) => b.id === o.id)!.cost);
    case 'carRuns': {
      const essentials = PARTS.filter((p) => p.essential);
      return essentials.filter((p) => isRepaired(state, p.id)).length / essentials.length;
    }
  }
}

export function questDone(state: GameState): boolean {
  const q = activeQuest(state);
  return q !== null && questProgress(state, q) >= 1;
}

/** Réclame la récompense et passe à la quête suivante. */
export function claimQuest(state: GameState): Quest | null {
  const q = activeQuest(state);
  if (!q || questProgress(state, q) < 1) return null;
  earn(state, q.reward);
  state.questIndex += 1;
  return q;
}
