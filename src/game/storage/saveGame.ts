import { ABILITY_KEYS, createEmptyAbilityProgress } from "../config/abilityGrowth";
import type { GameState, MemberStatus } from "../types";
import { normalizeBandName } from "../config/defaults";
import { createInitialMemberStates, MEMBER_IDS, MEMBER_STATUSES } from "../config/members";

const LEGACY_SAVE_VERSIONS = [1, 2, 3, 4] as const;
export const SAVE_VERSION = 5;
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
  "abilityProgress",
  "band",
  "relationships",
  "memberStates",
  "monthly",
  "counters",
  "flags",
  "eventCooldowns"
] as const;
const REQUIRED_STATE_ARRAY_FIELDS = [
  "riffs",
  "works",
  "recordings",
  "releases",
  "history",
  "annualSummaries",
  "queuedEvents",
  "eventLog"
] as const;
const PHASES: GameState["phase"][] = ["campus", "career"];
const CAREER_STAGES: GameState["careerStage"][] = ["campus", "early", "rising", "mature", "late"];
const EVENT_CATEGORIES: GameState["eventLog"][number]["category"][] = ["anchor", "random", "rare", "fallback"];
const PLAYER_STAT_KEYS = ["stamina", "technique", "creativity", "stage", "health", "stress", "fame", "wealth"] as const;
const BAND_STAT_KEYS = ["cohesion", "workQuality", "fans", "reputation", "funds"] as const;
const CHARACTER_KEYS = MEMBER_IDS;
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

function isValidPhase(value: unknown): value is GameState["phase"] {
  return typeof value === "string" && PHASES.includes(value as GameState["phase"]);
}

function isValidCareerStage(value: unknown): value is GameState["careerStage"] {
  return typeof value === "string" && CAREER_STAGES.includes(value as GameState["careerStage"]);
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
    hasFiniteNumericKeys(value.abilityProgressGains, ABILITY_KEYS) &&
    isFiniteNumber(value.staminaCapPenalty) &&
    isFiniteNumber(value.riskEventsThisMonth)
  );
}

function isMemberStateShape(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.status === "string" &&
    MEMBER_STATUSES.includes(value.status as MemberStatus) &&
    typeof value.note === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isMemberStatesShape(value: unknown): boolean {
  return isRecord(value) && CHARACTER_KEYS.every((key) => isMemberStateShape(value[key]));
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

function isEventLogEntryShape(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.month === "string" &&
    typeof value.category === "string" &&
    EVENT_CATEGORIES.includes(value.category as GameState["eventLog"][number]["category"])
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

function isAnnualSummaryShape(value: unknown): boolean {
  return (
    isRecord(value) &&
    isFiniteNumber(value.year) &&
    typeof value.month === "string" &&
    isFiniteNumber(value.releases) &&
    isFiniteNumber(value.totalReleaseSales) &&
    isFiniteNumber(value.bestReleaseCriticalScore) &&
    isFiniteNumber(value.performances) &&
    isFiniteNumber(value.averageRelationship) &&
    isFiniteNumber(value.healthDebt) &&
    isFiniteNumber(value.fame) &&
    typeof value.note === "string"
  );
}

function isGameStateShape(value: unknown): value is GameState {
  if (
    !isRecord(value) ||
    typeof value.month !== "string" ||
    !isValidPhase(value.phase) ||
    !isValidCareerStage(value.careerStage) ||
    !isValidRoute(value.route)
  ) {
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
  const annualSummaries = value.annualSummaries as unknown[];
  const queuedEvents = value.queuedEvents as unknown[];
  const eventLog = value.eventLog as unknown[];

  return (
    REQUIRED_STATE_OBJECT_FIELDS.every((field) => isRecord(value[field])) &&
    isEquipmentShape(value.equipment) &&
    hasFiniteNumericKeys(value.player, PLAYER_STAT_KEYS) &&
    hasFiniteNumericKeys(value.abilityProgress, ABILITY_KEYS) &&
    hasFiniteNumericKeys(value.band, BAND_STAT_KEYS) &&
    hasFiniteNumericKeys(value.relationships, CHARACTER_KEYS) &&
    isMemberStatesShape(value.memberStates) &&
    isMonthlyShape(value.monthly) &&
    hasFiniteNumericKeys(value.counters, COUNTER_KEYS) &&
    isFlagsShape(value.flags) &&
    riffs.every(isRiffShape) &&
    works.every(isWorkShape) &&
    recordings.every(isRecordingShape) &&
    releases.every(isReleaseShape) &&
    history.every(isHistoryEntryShape) &&
    annualSummaries.every(isAnnualSummaryShape) &&
    queuedEvents.every((eventId) => typeof eventId === "string") &&
    eventLog.every(isEventLogEntryShape) &&
    isFiniteNumberRecord(value.eventCooldowns)
  );
}

function getPhaseForMonth(month: string): GameState["phase"] {
  return month === "2027-05" ? "campus" : "career";
}

function getCareerStageForMonth(month: string): GameState["careerStage"] {
  if (getPhaseForMonth(month) === "campus") return "campus";

  const [yearText, monthText] = month.split("-");
  const monthIndex = (Number(yearText) - 2027) * 12 + Number(monthText);

  if (monthIndex <= 41) return "early";
  if (monthIndex <= 89) return "rising";
  if (monthIndex <= 185) return "mature";
  return "late";
}

function migratePhaseState(value: Record<string, unknown>): Record<string, unknown> {
  if (typeof value.month !== "string") return value;

  return {
    ...value,
    phase: getPhaseForMonth(value.month),
    careerStage: getCareerStageForMonth(value.month),
    eventLog: [],
    eventCooldowns: {}
  };
}

function migrateAbilityProgressState(value: Record<string, unknown>): Record<string, unknown> {
  const monthly = isRecord(value.monthly)
    ? {
        ...value.monthly,
        abilityProgressGains: value.monthly.abilityProgressGains ?? createEmptyAbilityProgress()
      }
    : value.monthly;

  return {
    ...value,
    abilityProgress: value.abilityProgress ?? createEmptyAbilityProgress(),
    monthly
  };
}

function migrateMemberStatesState(value: Record<string, unknown>): Record<string, unknown> {
  if (isMemberStatesShape(value.memberStates)) return value;
  const month = typeof value.month === "string" ? value.month : "2027-05";

  return {
    ...value,
    memberStates: createInitialMemberStates(month as GameState["month"])
  };
}

function migrateAnnualSummariesState(value: Record<string, unknown>): Record<string, unknown> {
  return {
    ...value,
    annualSummaries: Array.isArray(value.annualSummaries) ? value.annualSummaries : []
  };
}

function migrateLegacyState(value: unknown, version: number): unknown {
  if (!isRecord(value) || typeof value.month !== "string") return value;

  const phaseAware = version === 1 ? migratePhaseState(value) : value;
  const progressAware = migrateAbilityProgressState(phaseAware);
  const memberAware = migrateMemberStatesState(progressAware);
  return migrateAnnualSummariesState(memberAware);
}

function isSupportedSaveVersion(value: unknown): value is number {
  return (
    value === SAVE_VERSION ||
    LEGACY_SAVE_VERSIONS.includes(value as (typeof LEGACY_SAVE_VERSIONS)[number])
  );
}

function parseSaveGame(value: unknown): SaveGame | null {
  if (
    !isRecord(value) ||
    !isValidTimestamp(value.createdAt) ||
    !isValidTimestamp(value.updatedAt) ||
    !isSupportedSaveVersion(value.version)
  ) {
    return null;
  }

  const state = value.version === SAVE_VERSION ? value.state : migrateLegacyState(value.state, value.version);
  if (!isGameStateShape(state)) return null;

  return {
    version: SAVE_VERSION,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    state
  };
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
    const save = parseSaveGame(parsed);
    if (!save) return null;
    return { ...save, state: normalizeLoadedState(save.state) };
  } catch {
    return null;
  }
}

export function hasStoredSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
