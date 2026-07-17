export const GENRES = ["pop", "indie", "punk", "metal"] as const;
export type Genre = (typeof GENRES)[number];

export const MEMBER_ROLES = [
  "leader",
  "leadGuitar",
  "bass",
  "drums",
  "keyboard",
] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const MEMBER_STAT_KEYS = [
  "professional",
  "creativity",
  "performance",
  "popularity",
  "belonging",
] as const;
export type MemberStatKey = (typeof MEMBER_STAT_KEYS)[number];

export interface MemberStats {
  professional: number;
  creativity: number;
  performance: number;
  popularity: number;
  belonging: number;
}

export const MEMBER_STATUSES = [
  "excellent",
  "good",
  "normal",
  "tired",
  "awful",
] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

/**
 * The data layer supplies fixed candidates through this shape. Domain code never
 * imports candidate content, which keeps rules reusable and prevents a data/rules
 * dependency cycle.
 */
export interface MemberSeed {
  id: string;
  name: string;
  age: number;
  role: Exclude<MemberRole, "leader">;
  avatarId: string;
  biography: string;
  quote: string;
  traits: string[];
  stats: MemberStats;
}

export interface ProtagonistSeed {
  id?: string;
  name: string;
  age?: number;
  avatarId: string;
}

export interface Member extends Omit<MemberSeed, "role"> {
  role: MemberRole;
  isPlayer: boolean;
  status: MemberStatus;
  hiddenTags: string[];
}

export interface BandAttributes {
  creativity: number;
  musicianship: number;
  stagecraft: number;
  popularity: number;
  teamSpirit: number;
  funds: number;
}

export interface BandState {
  name: string;
  genre: Genre;
  basePopularity: number;
  funds: number;
  conflictPenalty: number;
  temporaryTeamBonus: number;
  publicInactivityMonths: number;
  unlockedVenueLevel: VenueLevel;
}

export interface RngState {
  seed: number;
  state: number;
  draws: number;
}

export const ACTION_IDS = [
  "personalTraining",
  "social",
  "partTime",
  "rest",
  "bandTraining",
  "rehearsal",
  "albumProduction",
  "performance",
  "promotion",
  "teamBuilding",
] as const;
export type ActionId = (typeof ACTION_IDS)[number];

export interface EffectRecord {
  target: string;
  label: string;
  amount: number;
  unit?: "point" | "currency" | "level" | "progress";
}

export type ActionExtraKind = "none" | "positive" | "negative" | "narrative";

export interface ActionExtraResult {
  kind: ActionExtraKind;
  roll: number;
  message: string;
}

export interface ActionFeedback {
  actionId: ActionId;
  title: string;
  actionPointsSpent: number;
  effects: EffectRecord[];
  messages: string[];
  extra: ActionExtraResult;
}

export interface CurrentMonthState {
  actionPointsRemaining: number;
  usedActions: ActionId[];
  hadPublicActivity: boolean;
  feedback: ActionFeedback[];
  eventPrepared: boolean;
  opportunitiesPrepared: boolean;
  performanceInvitations: PerformanceInvitation[];
  commercialOffers: CommercialOffer[];
  contractOffers: ContractOffer[];
}

export type EventMemberTarget =
  | "leader"
  | "all"
  | "randomBandmate"
  | Exclude<MemberRole, "leader">
  | `member:${string}`;

export type EventEffect =
  | {
      type: "funds";
      amount: number;
    }
  | {
      type: "basePopularity";
      amount: number;
      countsAsPublicActivity?: boolean;
    }
  | {
      type: "memberStat";
      target: EventMemberTarget;
      stat: MemberStatKey;
      amount: number;
    }
  | {
      type: "status";
      target: EventMemberTarget;
      direction: "improve" | "worsen";
      steps: 1 | 2;
    }
  | {
      type: "storyTag";
      operation: "add" | "remove";
      tag: string;
      target?: EventMemberTarget;
    };

export interface EventOutcomeCandidate {
  id: string;
  weight: number;
  title: string;
  text: string;
  effects: readonly EventEffect[];
  nextEventId?: string;
  nextEventDelayMonths?: number;
}

export interface EventChoiceResolution {
  eventId: string;
  eventTitle: string;
  choiceId: string;
  choiceLabel: string;
  outcomes: readonly EventOutcomeCandidate[];
  repeatable?: boolean;
  cooldownMonths?: number;
  chainId?: string;
}

export interface EventHistoryEntry {
  eventId: string;
  month: number;
  choiceId: string;
  outcomeId: string;
}

export interface ScheduledEvent {
  eventId: string;
  dueMonth: number;
  chainId: string;
}

export type EventResolutionFailureCode =
  | "NO_PENDING_EVENT"
  | "EVENT_MISMATCH"
  | "NO_EVENT_OUTCOMES"
  | "GAME_ENDED";

export interface EventResolutionFailure {
  code: EventResolutionFailureCode;
  message: string;
}

export type EventResolutionResult =
  | {
      ok: true;
      state: GameState;
      record: EventHistoryEntry;
    }
  | {
      ok: false;
      state: GameState;
      error: EventResolutionFailure;
    };

export interface CalendarState {
  completedMonths: number;
  year: number;
  month: number;
  maxMonths: number;
}

export interface AlbumState {
  id: string;
  workingTitle: string;
  coverId: string | null;
  startedInMonth: number;
  progress: number;
  quality: number | null;
  creationCheckpointResolved: boolean;
  arrangementCheckpointResolved: boolean;
  recordingCheckpointResolved: boolean;
}

export interface ReleasedAlbum {
  id: string;
  title: string;
  coverId: string;
  quality: number;
  releasedInMonth: number;
  listeners: number;
  grossRevenue: number;
  netRevenue: number;
}

export type EquipmentTier = "starter" | "advanced" | "professional" | "top";
export type EquipmentSlot = "guitar" | "pedals" | "amplifier";

export interface EquipmentState {
  guitar: EquipmentTier;
  pedals: EquipmentTier;
  amplifier: EquipmentTier;
}

export type VenueLevel = 1 | 2 | 3 | 4 | 5;

export interface PerformanceInvitation {
  id: string;
  venueId: string;
  venueName: string;
  title: string;
  venueLevel: VenueLevel;
  fee: number;
  basePopularity: number;
  actionPointCost: 2 | 3;
  difficulty: number;
  expiresAtMonth: number;
}

export interface PerformanceRecord {
  id: string;
  month: number;
  title: string;
  kind: "invited" | "selfOrganized";
  venueLevel: VenueLevel;
  rating: PerformanceRating;
  difference: number;
  grossPayment: number;
  upfrontCost: number;
  netPayment: number;
  popularityChange: number;
  excellent: boolean;
}

export interface PerformanceMilestones {
  excellentLevel3: boolean;
  excellentLevel4: boolean;
}

export type CommercialOfferKind =
  | "brandPromotion"
  | "albumLicense"
  | "platformCampaign"
  | "customCommission";

export interface CommercialOffer {
  id: string;
  kind: CommercialOfferKind;
  title: string;
  description: string;
  payout: number;
  popularityGain: number;
  belongingChange: number;
  expiresAtMonth: number;
}

export type ContractKind = "independent" | "smallLabel" | "majorLabel";

export interface ContractOffer {
  id: string;
  kind: Exclude<ContractKind, "independent">;
  title: string;
  signingBonus: number;
  durationMonths: number;
  albumsRequired: number;
  expiresAtMonth: number;
}

export interface ActiveContract {
  kind: Exclude<ContractKind, "independent">;
  title: string;
  signingBonus: number;
  startedAtMonth: number;
  deadlineMonth: number;
  albumsRequired: number;
  albumsDelivered: number;
  productionCostMultiplier: number;
  revenueShare: number;
  promotionBonus: number;
}

export interface EndingMemberSummary {
  memberId: string;
  name: string;
  role: MemberRole;
  headline: string;
  belonging: number;
}

export interface EndingSummary {
  title: string;
  reason: EndingReason;
  tags: string[];
  representativeAlbumId: string | null;
  keyPerformanceId: string | null;
  memberSummaries: EndingMemberSummary[];
  biography: string;
}

export interface TimelineEntry {
  id: string;
  month: number;
  type:
    | "action"
    | "month"
    | "album"
    | "performance"
    | "milestone"
    | "event"
    | "contract"
    | "commercial"
    | "equipment";
  title: string;
  description: string;
}

export interface FinancialCrisisState {
  active: boolean;
  monthsRemaining: number;
  consecutiveNegativeMonths: number;
}

export interface BelongingCrisisState {
  memberId: string;
  monthsRemaining: number;
}

export type GameStatus = "active" | "ended";
export type EndingReason =
  | "twentiethAnniversary"
  | "memberBreakup"
  | "debtBreakup"
  | "playerEnded"
  | "specialStory";

export interface GameState {
  version: 2;
  id: string;
  createdAt: string;
  status: GameStatus;
  endingReason: EndingReason | null;
  endingSummary: EndingSummary | null;
  rng: RngState;
  calendar: CalendarState;
  band: BandState;
  members: Member[];
  month: CurrentMonthState;
  activeAlbum: AlbumState | null;
  releasedAlbums: ReleasedAlbum[];
  equipment: EquipmentState;
  activeContract: ActiveContract | null;
  performanceRecords: PerformanceRecord[];
  performanceMilestones: PerformanceMilestones;
  financialCrisis: FinancialCrisisState;
  belongingCrises: BelongingCrisisState[];
  pendingEvent: string | null;
  eventCooldownMonths: number;
  eventCooldowns: Record<string, number>;
  completedEventIds: string[];
  scheduledEvents: ScheduledEvent[];
  eventHistory: EventHistoryEntry[];
  history: TimelineEntry[];
}

export interface NewGameInput {
  bandName: string;
  genre: Genre;
  protagonist: ProtagonistSeed;
  selectedMembers: MemberSeed[];
  seed?: number;
  gameId?: string;
  createdAt?: string;
}

export type AlbumProductionMode = "normal" | "concentrated" | "release";

export interface PerformancePlan {
  kind: "invited" | "selfOrganized";
  invitationId?: string;
  venueId?: string;
  venueLevel: VenueLevel;
  fee: number;
  basePopularity: number;
  upfrontCost?: number;
  actionPointCost?: 2 | 3;
  title?: string;
}

export type ActionCommand =
  | {
      type: "personalTraining";
      stat: MemberStatKey;
    }
  | {
      type: "social";
    }
  | {
      type: "partTime";
    }
  | {
      type: "rest";
    }
  | {
      type: "bandTraining";
      memberId: string;
      stat: MemberStatKey;
    }
  | {
      type: "rehearsal";
    }
  | {
      type: "albumProduction";
      mode: AlbumProductionMode;
      title?: string;
      coverId?: string;
    }
  | {
      type: "performance";
      plan?: PerformancePlan;
    }
  | {
      type: "promotion";
    }
  | {
      type: "teamBuilding";
    };

export type DomainFailureCode =
  | "GAME_ENDED"
  | "ACTION_ALREADY_USED"
  | "NOT_ENOUGH_ACTION_POINTS"
  | "NOT_ENOUGH_FUNDS"
  | "MEMBER_NOT_FOUND"
  | "INVALID_TARGET"
  | "NO_ACTIVE_ALBUM"
  | "ALBUM_NOT_READY"
  | "ALBUM_DETAILS_REQUIRED"
  | "INVALID_COMMAND";

export interface DomainFailure {
  code: DomainFailureCode;
  message: string;
}

export type ActionExecution =
  | {
      ok: true;
      state: GameState;
      feedback: ActionFeedback;
    }
  | {
      ok: false;
      state: GameState;
      error: DomainFailure;
    };

export type PerformanceRating =
  | "accident"
  | "barelyCompleted"
  | "steady"
  | "crowdIgnited"
  | "legendary";

export interface MonthSummary {
  completedMonth: number;
  unusedActionPoints: number;
  operatingCost: number;
  playerStatusRecoveredBy: number;
  teammateStatusRecoveredBy: number;
  popularityDecay: number;
  fundsBeforeSettlement: number;
  fundsAfterSettlement: number;
  autoSaveDue: boolean;
  gameEnded: boolean;
  contractMessage: string | null;
  newVenueLevel: VenueLevel | null;
}

export interface MonthAdvanceResult {
  state: GameState;
  summary: MonthSummary;
}
