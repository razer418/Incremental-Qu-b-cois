import { TUTO_FINI, newGame, type GameState } from './state';
import { BUILDINGS } from './buildings';
import { FETES } from './fetes';

const num = (v: unknown) => Math.max(0, Number(v) || 0);

const KEY = 'incremental-quebecois-save';

export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function load(storage: Storage, now: number): GameState {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return newGame(now);
    const data = JSON.parse(raw) as Partial<GameState>;
    if (data.version !== 1) return newGame(now);
    return {
      ...newGame(now),
      ...data,
      upgrades: { ...(data.upgrades ?? {}) },
      car: { owned: data.car?.owned === true, parts: { ...(data.car?.parts ?? {}) } },
      buildings: Object.fromEntries(BUILDINGS.map((b) => [b.id, data.buildings?.[b.id] === true])) as GameState['buildings'],
      prestige: {
        points: Math.max(0, Number(data.prestige?.points) || 0),
        count: Math.max(0, Number(data.prestige?.count) || 0),
      },
      boostSeconds: Math.max(0, Number(data.boostSeconds) || 0),
      noAds: data.noAds === true,
      magasin: Object.fromEntries(
        Object.entries(data.magasin ?? {}).filter(([, v]) => typeof v === 'number' && v > 0),
      ),
      succes: Array.isArray(data.succes) ? data.succes.filter((x) => typeof x === 'string') : [],
      fetes: Array.isArray(data.fetes) ? data.fetes.filter((x) => FETES.some((f) => f.id === x)) : [],
      stats: {
        secondes: num(data.stats?.secondes),
        // Vieilles parties : on part des chiffres de la partie en cours.
        tapsVie: num(data.stats?.tapsVie ?? data.taps),
        gagneVie: num(data.stats?.gagneVie ?? data.totalEarned),
        boosts: num(data.stats?.boosts),
        articles: num(data.stats?.articles),
        evenements: num(data.stats?.evenements),
        minijeux: num(data.stats?.minijeux),
      },
      projets: Object.fromEntries(
        Object.entries(data.projets ?? {}).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.filter((x) => typeof x === 'string')]),
      ),
      look: {
        achetes: Array.isArray(data.look?.achetes) ? data.look.achetes.filter((x) => typeof x === 'string') : [],
        choix: { ...newGame(now).look.choix, ...(data.look?.choix ?? {}) },
      },
      minijeux: Object.fromEntries(Object.entries(data.minijeux ?? {}).filter(([, v]) => typeof v === 'number')),
      // Une partie déjà commencée saute le tuto.
      tuto: Number.isInteger(data.tuto) ? data.tuto! : (data.taps ?? 0) > 0 ? TUTO_FINI : 0,
      questIndex: Number.isInteger(data.questIndex) && data.questIndex! >= 0 ? data.questIndex! : 0,
    };
  } catch {
    return newGame(now);
  }
}

export function save(storage: Storage, state: GameState): void {
  try {
    storage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Stockage plein ou bloqué : on joue pareil, sans sauvegarde.
  }
}

export function wipe(storage: Storage): void {
  try {
    storage.removeItem(KEY);
  } catch {
    // rien à faire
  }
}
