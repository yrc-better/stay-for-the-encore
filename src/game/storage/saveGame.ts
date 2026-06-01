import type { GameState } from "../types";
import { normalizeBandName } from "../config/defaults";

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
  "flags"
] as const;
const REQUIRED_STATE_ARRAY_FIELDS = [
  "riffs",
  "works",
  "recordings",
  "releases",
  "history",
  "queuedEvents"
] as const;
const PLAYER_STAT_KEYS = ["stamina", "technique", "creativity", "stage", "health", "stress", "fame", "wealth"] as const;
const BAND_STAT_KEYS = ["cohesion", "workQuality", "fans", "reputation", "funds"] as const;
const CHARACTER_KEYS = ["vocal", "bass", "drums"] as const;
const COUNTER_KEYS = [
  "overdraftActions",
  "missedOpportunities",
  "healthCrises",
  "iconicPerformances",
  "contractCompromises"
] as const;
const WORK_STAGES: GameState["works"][number]["stage"][] = ["draft", "song"];
const WORK_AUTHORSHIPS: GameState["works"][number]["authorship"][] = [
  "player_led",
  "shared",
  "vocal_led",
  "fragmented"
];
const RIFF_SOURCES: GameState["riffs"][number]["source"][] = ["write_riff", "event", "equipment"];
const RECORDING_TYPES: GameState["recordings"][number]["type"][] = ["demo", "single", "album_track"];
const RELEASE_TYPES: GameState["releases"][number]["type"][] = ["demo", "single", "ep", "album"];
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidRoute(value: unknown): value is GameState["route"] {
  return typeof value === "string" && VALID_ROUTES.includes(value as GameState["route"]);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function hasFiniteNumericKeys(value: unknown, keys: readonly string[]): boolean {
  return isRecord(value) && keys.every((key) => isFiniteNumber(value[key]));
}

function isFiniteNumberRecord(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every(isFiniteNumber);
}

function isValidTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_TIMESTAMP_PATTERN.test(value)) {
    return false;
  }

  const timestamp = new Date(value);
  return !Number.isNaN(timestamp.getTime()) && timestamp.toISOString() === value;
}

function hasStringName(value: unknown): value is { name: string } {
  return isRecord(value) && typeof value.name === "string";
}

function isEquipmentShape(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasStringName(value.guitar) &&
    Array.isArray(value.pedals) &&
    value.pedals.every(hasStringName) &&
    hasStringName(value.amp)
  );
}

function isMonthlyShape(value: unknown): boolean {
  return (
    isRecord(value) &&
    isFiniteNumberRecord(value.actionCounts) &&
    isFiniteNumber(value.staminaCapPenalty) &&
    isFiniteNumber(value.riskEventsThisMonth)
  );
}

function isFlagsShape(value: unknown): boolean {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (flag) => typeof flag === "boolean" || typeof flag === "string" || isFiniteNumber(flag)
    )
  );
}

function isHistoryEntryShape(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    isFiniteNumber(value.weight) &&
    isStringArray(value.tags) &&
    typeof value.month === "string" &&
    typeof value.type === "string"
  );
}

function isRiffShape(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.titleSeed === "string" &&
    isFiniteNumber(value.quality) &&
    isStringArray(value.styleTags) &&
    typeof value.source === "string" &&
    RIFF_SOURCES.includes(value.source as GameState["riffs"][number]["source"])
  );
}

function isWorkShape(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.stage === "string" &&
    WORK_STAGES.includes(value.stage as GameState["works"][number]["stage"]) &&
    isStringArray(value.sourceRiffIds) &&
    isFiniteNumber(value.completion) &&
    isFiniteNumber(value.quality) &&
    isFiniteNumber(value.rehearsal) &&
    isStringArray(value.styleTags) &&
    typeof value.authorship === "string" &&
    WORK_AUTHORSHIPS.includes(value.authorship as GameState["works"][number]["authorship"]) &&
    isFiniteNumber(value.tension)
  );
}

function isRecordingShape(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.workId === "string" &&
    typeof value.type === "string" &&
    RECORDING_TYPES.includes(value.type as GameState["recordings"][number]["type"]) &&
    isFiniteNumber(value.quality) &&
    isFiniteNumber(value.rawness) &&
    typeof value.released === "boolean"
  );
}

function isReleaseShape(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.month === "string" &&
    typeof value.type === "string" &&
    RELEASE_TYPES.includes(value.type as GameState["releases"][number]["type"]) &&
    typeof value.title === "string" &&
    isStringArray(value.recordingIds) &&
    isFiniteNumber(value.sales) &&
    isFiniteNumber(value.criticalScore) &&
    isFiniteNumber(value.fameImpact) &&
    isStringArray(value.awards)
  );
}

function isGameStateShape(value: unknown): value is GameState {
  if (!isRecord(value) || typeof value.month !== "string" || !isValidRoute(value.route)) {
    return false;
  }

  if ("bandName" in value && typeof value.bandName !== "string") {
    return false;
  }

  if (!REQUIRED_STATE_ARRAY_FIELDS.every((field) => Array.isArray(value[field]))) {
    return false;
  }

  const riffs = value.riffs as unknown[];
  const works = value.works as unknown[];
  const recordings = value.recordings as unknown[];
  const releases = value.releases as unknown[];
  const history = value.history as unknown[];
  const queuedEvents = value.queuedEvents as unknown[];

  return (
    REQUIRED_STATE_OBJECT_FIELDS.every((field) => isRecord(value[field])) &&
    isEquipmentShape(value.equipment) &&
    hasFiniteNumericKeys(value.player, PLAYER_STAT_KEYS) &&
    hasFiniteNumericKeys(value.band, BAND_STAT_KEYS) &&
    hasFiniteNumericKeys(value.relationships, CHARACTER_KEYS) &&
    isMonthlyShape(value.monthly) &&
    hasFiniteNumericKeys(value.counters, COUNTER_KEYS) &&
    isFlagsShape(value.flags) &&
    riffs.every(isRiffShape) &&
    works.every(isWorkShape) &&
    recordings.every(isRecordingShape) &&
    releases.every(isReleaseShape) &&
    history.every(isHistoryEntryShape) &&
    queuedEvents.every((eventId) => typeof eventId === "string")
  );
}

function isSaveGame(value: unknown): value is SaveGame {
  return (
    isRecord(value) &&
    value.version === SAVE_VERSION &&
    isValidTimestamp(value.createdAt) &&
    isValidTimestamp(value.updatedAt) &&
    isGameStateShape(value.state)
  );
}

function normalizeLoadedState(state: GameState): GameState {
  return {
    ...state,
    bandName: normalizeBandName(state.bandName)
  };
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
    return { ...parsed, state: normalizeLoadedState(parsed.state) };
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
