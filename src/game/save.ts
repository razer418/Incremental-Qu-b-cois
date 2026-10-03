import { newGame, type GameState } from './state';

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
