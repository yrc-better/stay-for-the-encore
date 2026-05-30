export type RouteId = "technician" | "writer" | "performer" | "rebel";
export type MonthId = `${number}-${string}`;
export type CharacterId = "vocal" | "bass" | "drums";

export type PlayerStatKey =
  | "stamina"
  | "technique"
  | "creativity"
  | "stage"
  | "health"
  | "stress"
  | "fame"
  | "wealth";

export type BandStatKey = "cohesion" | "workQuality" | "fans" | "reputation" | "funds";

export type DerivedModifierKey =
  | "recordingQuality"
  | "performanceStability"
  | "riffQuality"
  | "styleDiscovery";

export type EquipmentModifierKey = PlayerStatKey | BandStatKey | DerivedModifierKey;

export interface EquipmentItem {
  id: string;
  name: string;
  tags: string[];
  modifiers?: Partial<Record<EquipmentModifierKey, number>>;
}

export interface EquipmentLoadout {
  guitar: EquipmentItem;
  pedals: EquipmentItem[];
  amp: EquipmentItem;
}

export interface MonthlyState {
  actionCounts: Record<string, number>;
  staminaCapPenalty: number;
  riskEventsThisMonth: number;
}

export interface GameCounters {
  overdraftActions: number;
  missedOpportunities: number;
  healthCrises: number;
  iconicPerformances: number;
  contractCompromises: number;
}

export interface Riff {
  id: string;
  createdAt: MonthId;
  titleSeed: string;
  quality: number;
  styleTags: string[];
  source: "write_riff" | "event" | "equipment";
}

export interface Work {
  id: string;
  title: string;
  stage: "draft" | "song";
  sourceRiffIds: string[];
  completion: number;
  quality: number;
  rehearsal: number;
  styleTags: string[];
  authorship: "player_led" | "shared" | "vocal_led" | "fragmented";
  tension: number;
}

export interface Recording {
  id: string;
  createdAt: MonthId;
  workId: string;
  type: "demo" | "single" | "album_track";
  quality: number;
  rawness: number;
  released: boolean;
}

export interface Release {
  id: string;
  month: MonthId;
  type: "demo" | "single" | "ep" | "album";
  title: string;
  recordingIds: string[];
  sales: number;
  criticalScore: number;
  fameImpact: number;
  awards: string[];
}

export interface HistoryEntry {
  id: string;
  month: MonthId;
  type: "event" | "performance" | "recording" | "release" | "contract" | "award" | "equipment" | "member";
  title: string;
  description: string;
  weight: number;
  tags: string[];
}

export interface GameState {
  month: MonthId;
  route: RouteId;
  player: Record<PlayerStatKey, number>;
  band: Record<BandStatKey, number>;
  relationships: Record<CharacterId, number>;
  equipment: EquipmentLoadout;
  monthly: MonthlyState;
  counters: GameCounters;
  flags: Record<string, boolean | number | string>;
  riffs: Riff[];
  works: Work[];
  recordings: Recording[];
  releases: Release[];
  history: HistoryEntry[];
  queuedEvents: string[];
}
