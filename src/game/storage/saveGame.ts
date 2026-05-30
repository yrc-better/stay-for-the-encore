import type { GameState } from "../types";

export const SAVE_VERSION = 1;
export const SAVE_KEY = "band-simulator-save";

export interface SaveGame {
  version: typeof SAVE_VERSION;
  createdAt: string;
  updatedAt: string;
  state: GameState;
}

const VALID_ROUTES: GameState["route"][] = ["technician", "writer", "performer", "rebel"];
const REQUIRED_STATE_OBJECT_FIELDS = [
  "player",
  "band",
  "relationships",
  "monthly",
  "counters",
  "flags",
  "equipment"
] as const;
const REQUIRED_STATE_ARRAY_FIELDS = [
  "riffs",
  "works",
  "recordings",
  "releases",
  "history",
  "queuedEvents"
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidRoute(value: unknown): value is GameState["route"] {
  return typeof value === "string" && VALID_ROUTES.includes(value as GameState["route"]);
}

function isGameStateShape(value: unknown): value is GameState {
  if (!isRecord(value) || typeof value.month !== "string" || !isValidRoute(value.route)) {
    return false;
  }

  return (
    REQUIRED_STATE_OBJECT_FIELDS.every((field) => isRecord(value[field])) &&
    REQUIRED_STATE_ARRAY_FIELDS.every((field) => Array.isArray(value[field]))
  );
}

function isSaveGame(value: unknown): value is SaveGame {
  return (
    isRecord(value) &&
    value.version === SAVE_VERSION &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    isGameStateShape(value.state)
  );
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
    const parsed = JSON.parse(raw) as unknown;
    if (!isSaveGame(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
