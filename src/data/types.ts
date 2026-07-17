export type GenreId = "pop" | "indie" | "punk" | "metal";

export type RecruitableRole =
  | "leadGuitar"
  | "bass"
  | "drums"
  | "keyboard";

export type MemberStatKey =
  | "professional"
  | "creation"
  | "performance"
  | "heat"
  | "belonging";

export interface MemberStats {
  professional: number;
  creation: number;
  performance: number;
  heat: number;
  belonging: number;
}

export interface PortraitPlaceholder {
  background: string;
  foreground: string;
  monogram: string;
}

export interface PortraitResource {
  alt: string;
  /**
   * Reserved path for the final illustration. Until that file exists, clients
   * should render `placeholder` and may use `artDirection` as an image prompt.
   */
  futureAssetPath: string;
  available: boolean;
  placeholder: PortraitPlaceholder;
  artDirection: string;
}

export interface GenreContent {
  id: GenreId;
  label: string;
  englishLabel: string;
  tagline: string;
  description: string;
  openingLine: string;
  accentColor: string;
  accentSoftColor: string;
  audienceTone: string;
  hiddenModifiers: {
    promotionPopularityBonus: number;
    albumCreationCheckBonus: number;
    albumArrangementPlayingBonus: number;
    performanceCheckBonus: number;
    performancePlayingBonus: number;
    commercialEventWeightMultiplier: number;
    negativeExtraWeightBonus: number;
  };
}

export interface PlayerAvatarContent {
  id: string;
  label: string;
  description: string;
  portrait: PortraitResource;
}

export interface PersonalityTag {
  id: string;
  label: string;
}

export interface CandidateContent {
  id: string;
  role: RecruitableRole;
  name: string;
  age: number;
  biography: string;
  quote: string;
  tags: readonly PersonalityTag[];
  stats: MemberStats;
  portrait: PortraitResource;
}

export type ActionCategory = "personal" | "band";

export type ActionId =
  | "personalTraining"
  | "social"
  | "partTime"
  | "rest"
  | "bandTraining"
  | "rehearsal"
  | "albumProduction"
  | "performance"
  | "promotion"
  | "teamBuilding";

export interface ActionCostOption {
  id: string;
  label: string;
  actionPoints: number;
  money?: number;
  effectPreview: string;
  statePreview?: string;
}

export interface ActionContent {
  id: ActionId;
  category: ActionCategory;
  label: string;
  description: string;
  actionPoints: number | readonly number[];
  oncePerMonth: true;
  targetPrompt?: string;
  costOptions?: readonly ActionCostOption[];
  fixedEffectPreview: readonly string[];
  statePreview?: string;
  availabilityHint?: string;
}

export interface VenueContent {
  id: string;
  level: 1;
  name: string;
  kind: string;
  district: string;
  description: string;
  difficulty: 30;
  invitationFeeRange: readonly [number, number];
  basePopularityGain: 1;
  selfHosted: {
    available: true;
    upfrontCost: 2000;
    stableRevenue: 3000;
  };
  posterAccent: string;
}

export type EventPool =
  | "member"
  | "album"
  | "performance"
  | "equipment"
  | "publicOpinion"
  | "industry"
  | "life"
  | "genre";

export type EventEffectTarget =
  | "leader"
  | "all"
  | "randomBandmate"
  | RecruitableRole;

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
      target: EventEffectTarget;
      stat: MemberStatKey;
      amount: number;
    }
  | {
      type: "status";
      target: EventEffectTarget;
      direction: "improve" | "worsen";
      steps: 1 | 2;
    }
  | {
      type: "storyTag";
      operation: "add" | "remove";
      tag: string;
      target?: EventEffectTarget;
    };

export interface EventOutcome {
  id: string;
  weight: number;
  tone: "positive" | "negative" | "neutral";
  title: string;
  text: string;
  effects: readonly EventEffect[];
  nextEventId?: string;
  nextEventDelayMonths?: number;
}

export interface EventChoice {
  id: string;
  label: string;
  hint: string;
  outcomes: readonly EventOutcome[];
}

export interface EventContent {
  id: string;
  pool: EventPool;
  title: string;
  text: string;
  genres?: readonly GenreId[];
  minMonth?: number;
  maxMonth?: number;
  minPopularity?: number;
  maxPopularity?: number;
  minReleasedAlbums?: number;
  minVenueLevel?: 1 | 2 | 3 | 4 | 5;
  requiresMemberIds?: readonly string[];
  requiresTags?: readonly string[];
  excludesTags?: readonly string[];
  requiresActiveAlbum?: boolean;
  once?: boolean;
  cooldownMonths?: number;
  chainId?: string;
  choices: readonly EventChoice[];
}

export interface GenreNameSuggestions {
  bandNames: readonly string[];
  albumNames: readonly string[];
}
