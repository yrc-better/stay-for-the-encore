import type { GameState } from "../types";

export const SAVE_VERSION = 1;
export const SAVE_KEY = "band-simulator-save";

export interface SaveGame {
  version: typeof SAVE_VERSION;
  createdAt: string;
  updatedAt: string;
  state: GameState;
}

export function saveGame(state: GameState): void {
  const existing = loadSave();
  const now = new Date().toISOString();
  const payload: SaveGame = {
    version: SAVE_VERSION,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    state
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

export function loadSave(): SaveGame | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SaveGame>;
    if (parsed.version !== SAVE_VERSION || !parsed.state) return null;
    return parsed as SaveGame;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
