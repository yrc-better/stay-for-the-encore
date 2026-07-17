import {
  MAX_GAME_MONTHS,
  MONTHLY_ACTION_POINTS,
  PROTAGONIST_INITIAL_STATS,
} from "./constants";
import { clampMemberStats } from "./formulas";
import { createRng, normalizeSeed } from "./rng";
import type { GameState, Member, MemberRole, NewGameInput } from "./types";

const REQUIRED_TEAMMATE_ROLES: Exclude<MemberRole, "leader">[] = [
  "leadGuitar",
  "bass",
  "drums",
  "keyboard",
];

function assertNewGameInput(input: NewGameInput): void {
  if (input.bandName.trim().length === 0) {
    throw new Error("乐队名称不能为空");
  }

  if (input.protagonist.name.trim().length === 0) {
    throw new Error("主角名称不能为空");
  }

  if (input.selectedMembers.length !== 4) {
    throw new Error("开局必须选择四名队友");
  }

  const selectedRoles = new Set(input.selectedMembers.map((member) => member.role));
  const hasEveryRole = REQUIRED_TEAMMATE_ROLES.every((role) => selectedRoles.has(role));
  if (!hasEveryRole || selectedRoles.size !== REQUIRED_TEAMMATE_ROLES.length) {
    throw new Error("队伍必须包含主音吉他、贝斯、鼓手和键盘手");
  }

  const ids = [
    input.protagonist.id ?? "player",
    ...input.selectedMembers.map((member) => member.id),
  ];
  if (new Set(ids).size !== ids.length) {
    throw new Error("成员 ID 不能重复");
  }
}

export function createInitialGameState(input: NewGameInput): GameState {
  assertNewGameInput(input);

  const createdAt = input.createdAt ?? new Date().toISOString();
  const seed = normalizeSeed(input.seed ?? Date.now());
  const gameId =
    input.gameId ??
    `game-${seed.toString(16).padStart(8, "0")}-${createdAt.replace(/\D/g, "").slice(0, 14)}`;

  const protagonist: Member = {
    id: input.protagonist.id ?? "player",
    name: input.protagonist.name.trim(),
    age: input.protagonist.age ?? 22,
    role: "leader",
    avatarId: input.protagonist.avatarId,
    biography: "大学吉他社成员，毕业后决定以吉他手兼主唱的身份组建乐队。",
    quote: "那就从第一间排练室开始吧。",
    traits: [],
    stats: { ...PROTAGONIST_INITIAL_STATS },
    isPlayer: true,
    status: "normal",
    hiddenTags: [],
  };

  const teammates: Member[] = input.selectedMembers.map((member) => ({
    ...member,
    name: member.name.trim(),
    biography: member.biography.trim(),
    quote: member.quote.trim(),
    traits: [...member.traits],
    stats: clampMemberStats(member.stats),
    isPlayer: false,
    status: "normal",
    hiddenTags: [],
  }));

  return {
    version: 2,
    id: gameId,
    createdAt,
    status: "active",
    endingReason: null,
    endingSummary: null,
    rng: createRng(seed),
    calendar: {
      completedMonths: 0,
      year: 1,
      month: 1,
      maxMonths: MAX_GAME_MONTHS,
    },
    band: {
      name: input.bandName.trim(),
      genre: input.genre,
      basePopularity: 0,
      funds: 10_000,
      conflictPenalty: 0,
      temporaryTeamBonus: 0,
      publicInactivityMonths: 0,
      unlockedVenueLevel: 1,
    },
    members: [protagonist, ...teammates],
    month: {
      actionPointsRemaining: MONTHLY_ACTION_POINTS,
      usedActions: [],
      hadPublicActivity: false,
      feedback: [],
      eventPrepared: false,
      opportunitiesPrepared: false,
      performanceInvitations: [],
      commercialOffers: [],
      contractOffers: [],
    },
    activeAlbum: null,
    releasedAlbums: [],
    equipment: {
      guitar: "starter",
      pedals: "starter",
      amplifier: "starter",
    },
    activeContract: null,
    performanceRecords: [],
    performanceMilestones: {
      excellentLevel3: false,
      excellentLevel4: false,
    },
    financialCrisis: {
      active: false,
      monthsRemaining: 0,
      consecutiveNegativeMonths: 0,
    },
    belongingCrises: [],
    pendingEvent: null,
    eventCooldownMonths: 0,
    eventCooldowns: {},
    completedEventIds: [],
    scheduledEvents: [],
    eventHistory: [],
    history: [
      {
        id: "formation",
        month: 0,
        type: "milestone",
        title: "乐队成立",
        description: `${input.bandName.trim()} 完成组队，第一次站在同一间排练室里。`,
      },
    ],
  };
}
