import type { ActionId, Genre, MemberStats, MemberStatus } from "./types";

export const MAX_ATTRIBUTE = 100;
export const MIN_ATTRIBUTE = 0;
export const MONTHLY_ACTION_POINTS = 3;
export const MONTHLY_OPERATING_COST = 1_000;
export const MAX_GAME_MONTHS = 240;
export const ACTION_EXTRA_FUNDS_CHANGE = 500;
export const SELF_ORGANIZED_PERFORMANCE_DIFFICULTY_PENALTY = 10;

export const PROTAGONIST_INITIAL_STATS: Readonly<MemberStats> = {
  professional: 50,
  creativity: 50,
  performance: 45,
  popularity: 5,
  belonging: 80,
};

export const ACTION_POINT_COSTS: Readonly<Record<ActionId, number>> = {
  personalTraining: 1,
  social: 1,
  partTime: 1,
  rest: 1,
  bandTraining: 1,
  rehearsal: 1,
  albumProduction: 1,
  performance: 2,
  promotion: 1,
  teamBuilding: 1,
};

export const STATUS_EXTRA_SHIFT: Readonly<Record<MemberStatus, number>> = {
  excellent: 10,
  good: 5,
  normal: 0,
  tired: -5,
  awful: -10,
};

export const STYLE_MODIFIERS: Readonly<
  Record<
    Genre,
    {
      promotionPopularity: number;
      albumCreativity: number;
      albumMusicianship: number;
      performance: number;
    }
  >
> = {
  pop: {
    promotionPopularity: 1,
    albumCreativity: 0,
    albumMusicianship: 0,
    performance: 0,
  },
  indie: {
    promotionPopularity: 0,
    albumCreativity: 4,
    albumMusicianship: 0,
    performance: 0,
  },
  punk: {
    promotionPopularity: 0,
    albumCreativity: 0,
    albumMusicianship: 0,
    performance: 4,
  },
  metal: {
    promotionPopularity: 0,
    albumCreativity: 0,
    albumMusicianship: 4,
    performance: 0,
  },
};

export const VENUE_DIFFICULTY: Readonly<Record<1 | 2 | 3 | 4 | 5, number>> = {
  1: 30,
  2: 45,
  3: 60,
  4: 75,
  5: 88,
};

export const DEFAULT_PERFORMANCE_FEE: Readonly<
  Record<1 | 2 | 3 | 4 | 5, number>
> = {
  1: 2_000,
  2: 6_000,
  3: 15_000,
  4: 45_000,
  5: 115_000,
};

export const DEFAULT_PERFORMANCE_POPULARITY: Readonly<
  Record<1 | 2 | 3 | 4 | 5, number>
> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 10,
};
