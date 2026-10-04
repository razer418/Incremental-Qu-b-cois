import { UPGRADES, getUpgrade, palier, upgradeCost, type Upgrade } from './upgrades';
import { CAR_PRICE, CAR_TIP_MULT, PARTS } from './car';
import { QUESTS, type Quest } from './quests';
import { ARTICLES, getArticle, type Article } from './magasin';
import { saisonA } from './saisons';
import { bonusFete, feteA, type FeteId } from './fetes';
import { PROJETS, getProjet, type Projet } from './chars';
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
  /** Articles achetés chez Réjean pas encore pris : id -> combien. */
  inventaire: Record<string, number>;
  /** Succès débloqués (ids). Gardés au prestige. */
  succes: string[];
  /** Les fêtes que t'as déjà vécues (gardé au prestige). */
  fetes: FeteId[];
  /** Stats de jeu. Gardées au prestige (à vie). */
  stats: Stats;
  /** Étape du tuto; TUTO_FINI quand c'est fini. */
  tuto: number;
  /** Chars à retaper achetés : id du char -> pièces réparées. */
  projets: Record<string, string[]>;
  /** Le look du bazou (voir look.ts) : options achetées (« peinture:rouge ») pis celles posées. Gardé au prestige. */
  look: { achetes: string[]; choix: Record<'peinture' | 'collant' | 'mags' | 'flaps' | 'toit' | 'antenne', string> };
  /** Mini-jeux : quand chacun est prêt à rejouer (ms, heure de l'appareil). */
  minijeux: Record<string, number>;
  /** L'expo de chars : la dernière saison où t'es inscrit, pis tes trophées de 1re place. Gardé au prestige. */
  expo: { periode: number; trophees: number };
  /** Le cadeau du jour à Réjean : la dernière journée (« 2026-10-04 ») pis combien de jours de suite. Gardé au prestige. */
  cadeau: { jour: string; serie: number };
  lastTick: number;
}

export interface Stats {
  /** Temps joué, app ouverte. */
  secondes: number;
  tapsVie: number;
  gagneVie: number;
  boosts: number;
  articles: number;
  evenements: number;
  minijeux: number;
}

export const TUTO_FINI = 99;
/** Chaque succès : +2 % sur tous tes gains. */
export const SUCCES_BONUS = 0.02;

export const BASE_TAP = 0.1; // une canette consignée
export const DELIVERY_TAP = 1.5; // une livraison de pizza
/** Chaque tape ajoute aussi 2 % de ton revenu passif : taper vaut la peine toute la partie. */
export const TAP_PART_PASSIF = 0.02;
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
    buildings: { garage: false, cabane: false, concession: false, bar: false, arena: false },
    prestige: { points: 0, count: 0 },
    boostSeconds: 0,
    noAds: false,
    magasin: {},
    inventaire: {},
    succes: [],
    fetes: [],
    stats: { secondes: 0, tapsVie: 0, gagneVie: 0, boosts: 0, articles: 0, evenements: 0, minijeux: 0 },
    tuto: 0,
    projets: {},
    look: { achetes: [], choix: { peinture: 'brun', collant: 'aucun', mags: 'aucun', flaps: 'aucun', toit: 'aucun', antenne: 'aucune' } },
    minijeux: {},
    expo: { periode: -1, trophees: 0 },
    cadeau: { jour: '', serie: 0 },
    lastTick: now,
  };
}

/**
 * As-tu les moyens? Avec une marge d'une fraction de cenne : 10 canettes à 0,10 $
 * donnent 0,9999999 $ en virgule flottante, pis ça doit acheter un article à 1 $.
 */
export function assez(state: GameState, cost: number): boolean {
  return state.cash + 1e-6 >= cost;
}

export function payer(state: GameState, cost: number): void {
  state.cash = Math.max(0, state.cash - cost);
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
  mult *= 1 + state.succes.length * SUCCES_BONUS;
  for (const p of PROJETS) if (projetFini(state, p)) mult *= p.bonus;
  mult *= bonusFete(state.lastTick);
  return mult;
}

/** Une tape, sans les boosts temporaires. */
function baseTapValue(state: GameState): number {
  let value = carRuns(state) ? DELIVERY_TAP : BASE_TAP;
  for (const u of UPGRADES) {
    if (u.effect.kind === 'tapAdd') value += u.effect.amount * levelOf(state, u.id) * palier(levelOf(state, u.id));
  }
  return (value * multiplier(state) + TAP_PART_PASSIF * passiveRate(state)) * saisonA(state.lastTick).tap;
}

export function tapValue(state: GameState): number {
  return baseTapValue(state) * boostFactor(state) * magasinFactor(state, 'tap');
}

/** Ce que tu fais par seconde en ce moment, avec les boosts. */
export function currentRate(state: GameState): number {
  return passiveRate(state) * boostFactor(state) * magasinFactor(state, 'idle');
}

export const BOOST_FACTOR = 2;
export const BOOST_SECONDS = 60 * 60;
/** On peut cumuler jusqu'à 4 h de boost. */
export const BOOST_MAX_SECONDS = 4 * 60 * 60;

export function boostFactor(state: GameState): number {
  return state.boostSeconds > 0 ? BOOST_FACTOR : 1;
}

/** Ajoute 1 h de boost x2 (après une pub récompensée, ou gratuit avec « pas de pubs »). */
export function addBoost(state: GameState): boolean {
  if (state.boostSeconds + BOOST_SECONDS > BOOST_MAX_SECONDS) return false;
  state.boostSeconds += BOOST_SECONDS;
  state.stats.boosts += 1;
  return true;
}

/** L'article encore actif multiplie tes tapes ou ton passif (un seul par sorte, voir canUseArticle). */
export function magasinFactor(state: GameState, boosts: Article['boosts'], apres = 0): number {
  let f = 1;
  for (const a of ARTICLES) if (a.boosts === boosts && (state.magasin[a.id] ?? 0) > apres) f = Math.max(f, a.factor);
  return f;
}

/** Tes revenus de référence : passif + environ 2 tapes par seconde, sans les boosts. */
export function revenuRef(state: GameState): number {
  return passiveRate(state) + 2 * baseTapValue(state);
}

/** Prix d'un article : suit tes revenus. */
export function articleCost(state: GameState, id: string): number {
  const a = getArticle(id);
  if (!a) return Infinity;
  return Math.round(Math.max(a.minCost, a.incomeSeconds * revenuRef(state)) * 100) / 100;
}

/** Max d'un même article dans l'inventaire. */
export const INVENTAIRE_MAX = 3;

/** On l'achète pour l'inventaire, tant qu'il reste de la place. */
export function canBuyArticle(state: GameState, id: string): boolean {
  return !!getArticle(id) && (state.inventaire[id] ?? 0) < INVENTAIRE_MAX && assez(state, articleCost(state, id));
}

export function buyArticle(state: GameState, id: string): boolean {
  if (!canBuyArticle(state, id)) return false;
  payer(state, articleCost(state, id));
  state.inventaire[id] = (state.inventaire[id] ?? 0) + 1;
  state.stats.articles += 1;
  return true;
}

/** Un seul buff de chaque sorte (tapes ou passif) à la fois : faut attendre qu'il finisse. */
export function canUseArticle(state: GameState, id: string): boolean {
  const a = getArticle(id);
  return !!a && (state.inventaire[id] ?? 0) > 0 && magasinFactor(state, a.boosts) === 1;
}

export function useArticle(state: GameState, id: string): boolean {
  if (!canUseArticle(state, id)) return false;
  if (--state.inventaire[id] === 0) delete state.inventaire[id];
  state.magasin[id] = (state.magasin[id] ?? 0) + getArticle(id)!.seconds;
  return true;
}

/** Revenu passif sur une durée, en consommant le boost pis les articles qui restent. */
function passiveOver(state: GameState, seconds: number): number {
  const fins = [state.boostSeconds, ...ARTICLES.map((a) => (a.boosts === 'idle' ? (state.magasin[a.id] ?? 0) : 0))];
  // Par bouts : chaque fois qu'un boost finit, le facteur change.
  const cuts = [...new Set([0, seconds, ...fins.map((f) => Math.min(seconds, Math.max(0, f)))])].sort((a, b) => a - b);
  let weighted = 0;
  for (let i = 0; i < cuts.length - 1; i++) {
    const boost = state.boostSeconds > cuts[i] ? BOOST_FACTOR : 1;
    weighted += (cuts[i + 1] - cuts[i]) * boost * magasinFactor(state, 'idle', cuts[i]);
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
  const saison = saisonA(state.lastTick);
  let rate = 0;
  for (const u of UPGRADES) {
    if (u.effect.kind === 'passiveAdd') rate += u.effect.amount * levelOf(state, u.id) * palier(levelOf(state, u.id)) * (saison.bonus[u.id] ?? 1);
  }
  return rate * multiplier(state);
}

export function earn(state: GameState, amount: number): void {
  state.cash += amount;
  state.totalEarned += amount;
  state.stats.gagneVie += amount;
}

export function tap(state: GameState): number {
  const value = tapValue(state);
  earn(state, value);
  state.taps += 1;
  state.stats.tapsVie += 1;
  return value;
}

/** Avance le temps. Retourne le montant gagné. */
export function tick(state: GameState, now: number): number {
  const seconds = Math.max(0, (now - state.lastTick) / 1000);
  state.lastTick = now;
  state.stats.secondes += seconds;
  const fete = feteA(now);
  if (fete && !state.fetes.includes(fete.id)) state.fetes.push(fete.id);
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

/**
 * Achat en lot (x1, x10 ou MAX) : combien de niveaux pis pour combien.
 * Avec MAX (Infinity), c'est ce que t'as les moyens d'acheter, au moins 1 pour montrer le prix.
 */
export function bulkCost(state: GameState, id: string, want: number): { count: number; cost: number } {
  const u = getUpgrade(id);
  if (!u) return { count: 0, cost: 0 };
  let count = 0;
  let cost = 0;
  for (let level = levelOf(state, id); level < u.maxLevel && count < want; level++) {
    const next = upgradeCost(u, level);
    if (want === Infinity && count > 0 && !assez(state, cost + next)) break;
    cost += next;
    count++;
  }
  return { count, cost: Math.round(cost * 100) / 100 };
}

/** Achète jusqu'à `want` niveaux d'un coup. Tout ou rien. Retourne le nombre acheté. */
export function buyMany(state: GameState, id: string, want: number): number {
  const u = getUpgrade(id);
  const { count, cost } = bulkCost(state, id, want);
  if (!u || !isUnlocked(state, u) || count === 0 || !assez(state, cost)) return 0;
  payer(state, cost);
  state.upgrades[id] = levelOf(state, id) + count;
  return count;
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
  if (cost === null || !assez(state, cost)) return false;
  payer(state, cost);
  state.upgrades[id] = levelOf(state, id) + 1;
  return true;
}

// --- Le bazou ---

export function buyCar(state: GameState): boolean {
  if (state.car.owned || !assez(state, CAR_PRICE)) return false;
  payer(state, CAR_PRICE);
  state.car.owned = true;
  return true;
}

export function isRepaired(state: GameState, partId: string): boolean {
  return state.car.parts[partId] === true;
}

export function repair(state: GameState, partId: string): boolean {
  const part = PARTS.find((p) => p.id === partId);
  if (!part || !state.car.owned || isRepaired(state, partId) || !assez(state, part.cost)) return false;
  payer(state, part.cost);
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
    (BUILDINGS.filter((b) => state.buildings[b.id]).length / BUILDINGS.length) * 0.5
  );
}

// --- Bâtiments ---

/** Le prochain bâtiment à acheter, ou null quand t'as tout. */
export function nextBuilding(state: GameState) {
  return BUILDINGS.find((b) => !state.buildings[b.id]) ?? null;
}

export function canBuyBuilding(state: GameState, id: BuildingId): boolean {
  const next = nextBuilding(state);
  return next?.id === id && carRuns(state) && assez(state, next.cost);
}

export function buyBuilding(state: GameState, id: BuildingId): boolean {
  if (!canBuyBuilding(state, id)) return false;
  payer(state, nextBuilding(state)!.cost);
  state.buildings[id] = true;
  return true;
}

// --- Le prochain objectif (la barre « PROCHAIN » en haut des listes) ---

export interface Objectif {
  /** Le nom à afficher (passe par t()). */
  nom: string;
  cout: number;
  /** Où t'es rendu : ton cash, ou le total gagné pour le prestige. */
  avoir: number;
}

export function prochainObjectif(state: GameState): Objectif | null {
  if (!state.car.owned) return { nom: 'TON PREMIER BAZOU', cout: CAR_PRICE, avoir: state.cash };
  const part = PARTS.find((p) => p.essential && !isRepaired(state, p.id));
  if (part) return { nom: part.name, cout: part.cost, avoir: state.cash };
  if (prestigeDebloque(state) && !canPrestige(state)) return { nom: "Vendre l'empire", cout: PRESTIGE_MIN_EARNED, avoir: state.totalEarned };
  const b = nextBuilding(state);
  return b ? { nom: b.name, cout: b.cost, avoir: state.cash } : null;
}

// --- Prestige ---

/** Le bâtiment qui débloque le prestige (le bar) est acheté. */
export function prestigeDebloque(state: GameState): boolean {
  return state.buildings.bar;
}

export function canPrestige(state: GameState): boolean {
  return prestigeDebloque(state) && state.totalEarned >= PRESTIGE_MIN_EARNED;
}

/** Vend l'empire : tout repart à zéro sauf la réputation. Retourne les points gagnés. */
export function prestige(state: GameState, now: number): number {
  if (!canPrestige(state)) return 0;
  const gained = prestigePointsFor(state.totalEarned);
  const kept = { points: state.prestige.points + gained, count: state.prestige.count + 1 };
  Object.assign(state, newGame(now), {
    prestige: kept,
    noAds: state.noAds,
    succes: state.succes,
    fetes: state.fetes,
    stats: state.stats,
    look: state.look,
    expo: state.expo,
    cadeau: state.cadeau,
    tuto: TUTO_FINI,
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

// --- Chars à retaper ---

export function projetDebloque(state: GameState, p: Projet): boolean {
  return p.requires === 'roule' ? carRuns(state) : state.buildings[p.requires];
}

export function projetFini(state: GameState, p: Projet): boolean {
  return state.projets[p.id]?.length === p.pieces.length;
}

export function buyProjet(state: GameState, id: string): boolean {
  const p = getProjet(id);
  if (!p || state.projets[id] || !projetDebloque(state, p) || !assez(state, p.prix)) return false;
  payer(state, p.prix);
  state.projets[id] = [];
  return true;
}

export function reparerProjet(state: GameState, id: string, pieceId: string): boolean {
  const p = getProjet(id);
  const faites = state.projets[id];
  const piece = p?.pieces.find((x) => x.id === pieceId);
  if (!piece || !faites || faites.includes(pieceId) || !assez(state, piece.cost)) return false;
  payer(state, piece.cost);
  faites.push(pieceId);
  return true;
}
