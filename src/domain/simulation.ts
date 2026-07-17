import { executeAction } from "./actions";
import { prepareMonthOpportunities } from "./career";
import { createInitialGameState } from "./initialState";
import { advanceMonth } from "./month";
import { normalizeSeed } from "./rng";
import {
  GENRES,
  type ActionCommand,
  type EndingReason,
  type GameState,
  type Genre,
  type MemberSeed,
  type PerformanceInvitation,
  type VenueLevel,
} from "./types";

const SIMULATION_TEAMMATES: readonly MemberSeed[] = [
  {
    id: "simulation-lead-guitar",
    name: "林夏",
    age: 22,
    role: "leadGuitar",
    avatarId: "simulation-lead-guitar",
    biography: "擅长把旋律写成有记忆点的吉他段落。",
    quote: "先把这一小节弹到所有人都点头。",
    traits: [],
    stats: {
      professional: 70,
      creativity: 60,
      performance: 50,
      popularity: 20,
      belonging: 70,
    },
  },
  {
    id: "simulation-bass",
    name: "周航",
    age: 22,
    role: "bass",
    avatarId: "simulation-bass",
    biography: "稳健的贝斯手，也会留意乐队的现金流。",
    quote: "根基稳了，歌才站得住。",
    traits: [],
    stats: {
      professional: 60,
      creativity: 40,
      performance: 40,
      popularity: 10,
      belonging: 60,
    },
  },
  {
    id: "simulation-drums",
    name: "唐野",
    age: 22,
    role: "drums",
    avatarId: "simulation-drums",
    biography: "现场爆发力出色的鼓手。",
    quote: "节拍到了，观众自然会跟上。",
    traits: [],
    stats: {
      professional: 50,
      creativity: 30,
      performance: 60,
      popularity: 30,
      belonging: 50,
    },
  },
  {
    id: "simulation-keyboard",
    name: "许澄",
    age: 22,
    role: "keyboard",
    avatarId: "simulation-keyboard",
    biography: "负责和声、音色设计与编曲细节。",
    quote: "再给这首歌留一点呼吸。",
    traits: [],
    stats: {
      professional: 40,
      creativity: 70,
      performance: 30,
      popularity: 40,
      belonging: 40,
    },
  },
] as const;

export interface SimulationStrategy {
  /**
   * Defaults to a seed-selected genre so a batch of seeds naturally covers all
   * four routes.
   */
  genre: Genre;
  /** Cash reserve below which the band pauses expensive plans and takes work. */
  emergencyFundFloor: number;
  /** A live invitation is preferred every Nth career month. */
  performanceIntervalMonths: number;
  /** Reserve required before pairing an album release with promotion. */
  releaseFundFloor: number;
}

export interface SimResult {
  state: GameState;
  months: number;
  albums: number;
  highestVenue: VenueLevel;
  performances: number;
  endingReason: EndingReason | null;
}

function defaultGenre(seed: number): Genre {
  return GENRES[normalizeSeed(seed) % GENRES.length];
}

function resolveStrategy(
  seed: number,
  strategy: Partial<SimulationStrategy>,
): SimulationStrategy {
  const performanceInterval = Math.max(
    1,
    Math.trunc(strategy.performanceIntervalMonths ?? 4),
  );

  return {
    genre: strategy.genre ?? defaultGenre(seed),
    emergencyFundFloor: Math.max(0, strategy.emergencyFundFloor ?? 4_000),
    performanceIntervalMonths: performanceInterval,
    releaseFundFloor: Math.max(0, strategy.releaseFundFloor ?? 6_500),
  };
}

function createSimulationState(seed: number, genre: Genre): GameState {
  const normalizedSeed = normalizeSeed(seed);
  return createInitialGameState({
    bandName: `长局测试乐队 ${normalizedSeed}`,
    genre,
    protagonist: {
      id: "simulation-player",
      name: "陈默",
      avatarId: "simulation-player",
    },
    selectedMembers: SIMULATION_TEAMMATES.map((member) => ({
      ...member,
      traits: [...member.traits],
      stats: { ...member.stats },
    })),
    seed: normalizedSeed,
    gameId: `simulation-${genre}-${normalizedSeed}`,
    createdAt: "2026-07-17T00:00:00.000Z",
  });
}

function attemptAction(state: GameState, command: ActionCommand): GameState {
  const execution = executeAction(state, command);
  return execution.ok ? execution.state : state;
}

function invitationCommand(
  invitation: PerformanceInvitation,
): ActionCommand {
  return {
    type: "performance",
    plan: {
      kind: "invited",
      invitationId: invitation.id,
      venueId: invitation.venueId,
      venueLevel: invitation.venueLevel,
      fee: invitation.fee,
      basePopularity: invitation.basePopularity,
      actionPointCost: invitation.actionPointCost,
      title: invitation.title,
    },
  };
}

function bestInvitation(
  invitations: readonly PerformanceInvitation[],
): PerformanceInvitation | null {
  return (
    [...invitations].sort(
      (left, right) =>
        right.venueLevel - left.venueLevel ||
        right.fee - left.fee ||
        left.id.localeCompare(right.id),
    )[0] ?? null
  );
}

function workAndRecover(state: GameState): GameState {
  let nextState = attemptAction(state, { type: "partTime" });
  nextState = attemptAction(nextState, { type: "rest" });
  return nextState;
}

function playInvitation(
  state: GameState,
  invitation: PerformanceInvitation,
): GameState {
  let nextState = attemptAction(state, invitationCommand(invitation));
  if (nextState !== state && nextState.month.actionPointsRemaining > 0) {
    nextState = attemptAction(nextState, { type: "rest" });
  }
  return nextState;
}

function releaseAlbum(state: GameState): GameState {
  const albumNumber = state.releasedAlbums.length + 1;
  let nextState = attemptAction(state, { type: "promotion" });
  nextState = attemptAction(nextState, {
    type: "albumProduction",
    mode: "release",
    title: `第 ${albumNumber} 张专辑`,
    coverId: `simulation-cover-${albumNumber}`,
  });
  return nextState;
}

function startAlbumWithRehearsal(state: GameState): GameState {
  let nextState = attemptAction(state, { type: "rehearsal" });
  nextState = attemptAction(nextState, {
    type: "albumProduction",
    mode: "normal",
    title: `第 ${state.releasedAlbums.length + 1} 张专辑`,
  });
  return nextState;
}

function continueAlbum(state: GameState): GameState {
  let nextState = attemptAction(state, {
    type: "albumProduction",
    mode: "normal",
  });
  if (nextState === state) {
    return workAndRecover(state);
  }

  const absoluteMonth = nextState.calendar.completedMonths + 1;
  if (absoluteMonth % 3 === 0 && nextState.band.funds >= 1_500) {
    nextState = attemptAction(nextState, { type: "promotion" });
  } else {
    nextState = attemptAction(nextState, { type: "rehearsal" });
  }
  return nextState;
}

function playMonth(
  state: GameState,
  strategy: SimulationStrategy,
): GameState {
  const absoluteMonth = state.calendar.completedMonths + 1;
  const invitation = bestInvitation(state.month.performanceInvitations);

  if (state.band.funds < strategy.emergencyFundFloor) {
    return workAndRecover(state);
  }

  if (state.activeAlbum?.progress === 100) {
    if (state.band.funds < strategy.releaseFundFloor) {
      return workAndRecover(state);
    }
    return releaseAlbum(state);
  }

  if (
    invitation &&
    absoluteMonth % strategy.performanceIntervalMonths === 0
  ) {
    return playInvitation(state, invitation);
  }

  if (state.activeAlbum) {
    return continueAlbum(state);
  }

  return startAlbumWithRehearsal(state);
}

/**
 * Runs the public domain APIs exactly as a player would, but without preparing
 * or resolving interactive story events. The fixed timestamp, roster and RNG
 * seed make repeated runs byte-for-byte deterministic.
 */
export function simulateCareer(
  seed: number,
  months = 240,
  strategy: Partial<SimulationStrategy> = {},
): SimResult {
  const resolvedStrategy = resolveStrategy(seed, strategy);
  const requestedMonths = Math.max(0, Math.trunc(months));
  let state = createSimulationState(seed, resolvedStrategy.genre);
  let simulatedMonths = 0;

  while (state.status === "active" && simulatedMonths < requestedMonths) {
    const monthBeforeAdvance = state.calendar.completedMonths;
    state = prepareMonthOpportunities(state);
    state = playMonth(state, resolvedStrategy);
    state = advanceMonth(state).state;

    if (state.calendar.completedMonths <= monthBeforeAdvance) {
      throw new Error(
        `Career simulation stalled in month ${monthBeforeAdvance + 1}`,
      );
    }
    simulatedMonths += 1;
  }

  return {
    state,
    months: state.calendar.completedMonths,
    albums: state.releasedAlbums.length,
    highestVenue: state.band.unlockedVenueLevel,
    performances: state.performanceRecords.length,
    endingReason: state.endingReason,
  };
}
