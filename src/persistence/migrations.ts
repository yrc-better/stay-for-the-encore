import type { Genre, MemberRole, MemberStatus } from "../domain/types";

type UnknownRecord = Record<string, unknown>;

export interface MigrationCandidate {
  state: unknown;
  savedAt?: string;
}

const LEGACY_HEAD_SAVE_VERSIONS = new Set([1, 2, 3, 4, 5]);
const LEGACY_ROUTES = new Set(["technician", "writer", "performer", "rebel"]);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valueOrDefault(
  record: UnknownRecord,
  key: string,
  defaultValue: unknown,
): unknown {
  return record[key] === undefined ? defaultValue : record[key];
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function nonEmptyString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function validTimestamp(value: unknown): string | undefined {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    return undefined;
  }
  return value;
}

function clamp(value: number, minimum = 0, maximum = 100): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function hashText(value: string): number {
  let hash = 2_166_136_261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function legacyMonthIndex(value: unknown): number {
  if (typeof value !== "string") {
    return 0;
  }
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    return 0;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    return 0;
  }
  return Math.round(clamp((year - 2027) * 12 + month - 5, 0, 240));
}

function routeToGenre(route: string): Genre {
  switch (route) {
    case "technician":
      return "metal";
    case "performer":
      return "pop";
    case "rebel":
      return "punk";
    default:
      return "indie";
  }
}

function oldMemberStatus(
  memberStates: UnknownRecord | null,
  legacyId: string,
): MemberStatus {
  const state = memberStates && isRecord(memberStates[legacyId])
    ? memberStates[legacyId]
    : null;
  const status = state?.status;
  if (status === "away") {
    return "awful";
  }
  if (status === "strained") {
    return "tired";
  }
  return "normal";
}

function legacyHistoryType(value: unknown) {
  switch (value) {
    case "performance":
      return "performance" as const;
    case "release":
    case "recording":
      return "album" as const;
    case "contract":
      return "contract" as const;
    case "equipment":
      return "equipment" as const;
    case "award":
      return "milestone" as const;
    default:
      return "event" as const;
  }
}

/**
 * The v1 rewrite already used almost the same state model as v2. Migration is
 * intentionally additive: missing v2 fields receive safe defaults, while
 * malformed existing values are preserved so the v2 schema can reject them.
 */
export function migrateV1State(input: unknown): MigrationCandidate | null {
  if (!isRecord(input) || input.version !== 1) {
    return null;
  }

  const month = isRecord(input.month) ? input.month : null;
  if (!month) {
    return null;
  }

  const milestones = isRecord(input.performanceMilestones)
    ? input.performanceMilestones
    : {};

  return {
    state: {
      ...input,
      version: 2,
      endingSummary: valueOrDefault(input, "endingSummary", null),
      month: {
        ...month,
        eventPrepared: valueOrDefault(month, "eventPrepared", false),
        opportunitiesPrepared: valueOrDefault(
          month,
          "opportunitiesPrepared",
          false,
        ),
        performanceInvitations: valueOrDefault(
          month,
          "performanceInvitations",
          [],
        ),
        commercialOffers: valueOrDefault(month, "commercialOffers", []),
        contractOffers: valueOrDefault(month, "contractOffers", []),
      },
      activeContract: valueOrDefault(input, "activeContract", null),
      performanceRecords: valueOrDefault(input, "performanceRecords", []),
      performanceMilestones: {
        excellentLevel3: valueOrDefault(
          milestones,
          "excellentLevel3",
          false,
        ),
        excellentLevel4: valueOrDefault(
          milestones,
          "excellentLevel4",
          false,
        ),
      },
      pendingEvent: valueOrDefault(input, "pendingEvent", null),
      eventCooldownMonths: valueOrDefault(input, "eventCooldownMonths", 0),
      eventCooldowns: valueOrDefault(input, "eventCooldowns", {}),
      completedEventIds: valueOrDefault(input, "completedEventIds", []),
      scheduledEvents: valueOrDefault(input, "scheduledEvents", []),
      eventHistory: valueOrDefault(input, "eventHistory", []),
    },
  };
}

/**
 * Converts the pre-rewrite v1-v5 save envelope into the current five-member
 * model. Incompatible systems (riffs, individual equipment, old event queues)
 * are retained as timeline context where possible and otherwise reset safely.
 */
export function migrateLegacyHeadSave(input: unknown): MigrationCandidate | null {
  if (
    !isRecord(input) ||
    typeof input.version !== "number" ||
    !LEGACY_HEAD_SAVE_VERSIONS.has(input.version) ||
    !isRecord(input.state)
  ) {
    return null;
  }

  const legacy = input.state;
  if (
    typeof legacy.month !== "string" ||
    typeof legacy.route !== "string" ||
    !LEGACY_ROUTES.has(legacy.route) ||
    !isRecord(legacy.player) ||
    !isRecord(legacy.band) ||
    !isRecord(legacy.relationships)
  ) {
    return null;
  }

  const bandName = nonEmptyString(legacy.bandName, "未命名乐队");
  const completedMonths = legacyMonthIndex(legacy.month);
  const currentMonth = completedMonths + 1;
  const player = legacy.player;
  const band = legacy.band;
  const relationships = legacy.relationships;
  const memberStates = isRecord(legacy.memberStates)
    ? legacy.memberStates
    : null;
  const playerPopularity = clamp(finiteNumber(player.fame, 5));
  const oldFans = finiteNumber(band.fans, 0);
  const basePopularity = clamp(Math.max(playerPopularity, oldFans / 10));
  const oldFunds = finiteNumber(band.funds, 1_000);
  const funds = Math.round(oldFunds * 10);
  const averageBelonging = clamp(
    (finiteNumber(relationships.vocal, 50) +
      finiteNumber(relationships.bass, 50) +
      finiteNumber(relationships.drums, 50)) /
      3,
  );
  const age = 22 + Math.floor(completedMonths / 12);
  const seed = hashText(`${bandName}:${legacy.month}:${legacy.route}`);
  const route = legacy.route;
  const sharedStats = {
    professional: clamp(35 + finiteNumber(band.workQuality, 20) * 0.5),
    creativity: clamp(35 + finiteNumber(player.creativity, 50) * 0.25),
    performance: clamp(35 + finiteNumber(player.stage, 45) * 0.25),
    popularity: clamp(playerPopularity * 0.7),
  };

  const teammateDefinitions: Array<{
    id: string;
    legacyId: string;
    name: string;
    role: Exclude<MemberRole, "leader">;
    belonging: number;
  }> = [
    {
      id: "legacy-lin-xia",
      legacyId: "vocal",
      name: "林夏",
      role: "leadGuitar",
      belonging: finiteNumber(relationships.vocal, 50),
    },
    {
      id: "legacy-zhou-hang",
      legacyId: "bass",
      name: "周航",
      role: "bass",
      belonging: finiteNumber(relationships.bass, 50),
    },
    {
      id: "legacy-tang-ye",
      legacyId: "drums",
      name: "唐野",
      role: "drums",
      belonging: finiteNumber(relationships.drums, 50),
    },
    {
      id: "legacy-keyboard",
      legacyId: "keyboard",
      name: "许澄",
      role: "keyboard",
      belonging: averageBelonging,
    },
  ];

  const members = [
    {
      id: "legacy-player",
      name: "主角",
      age,
      role: "leader",
      avatarId: "player-midnight",
      biography: "由旧版乐队生涯迁移而来。",
      quote: "换一间排练室，也要把这段路继续走下去。",
      traits: ["旧版存档"],
      stats: {
        professional: clamp(finiteNumber(player.technique, 50)),
        creativity: clamp(finiteNumber(player.creativity, 50)),
        performance: clamp(finiteNumber(player.stage, 45)),
        popularity: playerPopularity,
        belonging: averageBelonging,
      },
      isPlayer: true,
      status: "normal",
      hiddenTags: ["legacy-save-migrated"],
    },
    ...teammateDefinitions.map((member) => ({
      id: member.id,
      name: member.name,
      age,
      role: member.role,
      avatarId: member.id,
      biography: "由旧版固定成员资料迁移而来。",
      quote: "旧的履历还在，我们从这里继续。",
      traits: ["旧版成员"],
      stats: {
        ...sharedStats,
        belonging: clamp(member.belonging),
      },
      isPlayer: false,
      status: oldMemberStatus(memberStates, member.legacyId),
      hiddenTags: ["legacy-save-migrated"],
    })),
  ];

  const releases = Array.isArray(legacy.releases) ? legacy.releases : [];
  const releasedAlbums = releases.flatMap((release, index) => {
    if (!isRecord(release) || release.type !== "album") {
      return [];
    }
    const title = nonEmptyString(release.title, `旧版专辑 ${index + 1}`);
    const criticalScore = finiteNumber(release.criticalScore, 50);
    const quality = Math.round(clamp(criticalScore / 20, 0.5, 5) * 2) / 2;
    return [
      {
        id: nonEmptyString(release.id, `legacy-album-${index + 1}`),
        title,
        coverId: "legacy-cover",
        quality,
        releasedInMonth: Math.max(1, legacyMonthIndex(release.month) + 1),
        listeners: Math.max(0, Math.round(finiteNumber(release.sales, 0))),
        grossRevenue: 0,
        netRevenue: 0,
      },
    ];
  });

  const oldHistory = Array.isArray(legacy.history) ? legacy.history : [];
  const migratedHistory = oldHistory.flatMap((entry, index) => {
    if (!isRecord(entry)) {
      return [];
    }
    return [
      {
        id: `legacy-${nonEmptyString(entry.id, `history-${index + 1}`)}`,
        month: legacyMonthIndex(entry.month),
        type: legacyHistoryType(entry.type),
        title: nonEmptyString(entry.title, "旧版生涯记录"),
        description: nonEmptyString(entry.description, "从旧版存档迁移。"),
      },
    ];
  });

  const unlockedVenueLevel =
    basePopularity >= 30 && releasedAlbums.length > 0
      ? 3
      : basePopularity >= 10
        ? 2
        : 1;
  const ended = completedMonths >= 240;
  const createdAt =
    validTimestamp(input.createdAt) ??
    validTimestamp(input.updatedAt) ??
    new Date().toISOString();

  return {
    savedAt: validTimestamp(input.updatedAt) ?? validTimestamp(input.createdAt),
    state: {
      version: 2,
      id: `legacy-${seed.toString(16).padStart(8, "0")}`,
      createdAt,
      status: ended ? "ended" : "active",
      endingReason: ended ? "twentiethAnniversary" : null,
      endingSummary: null,
      rng: {
        seed,
        state: seed,
        draws: 0,
      },
      calendar: {
        completedMonths,
        year: Math.floor(completedMonths / 12) + 1,
        month: (completedMonths % 12) + 1,
        maxMonths: 240,
      },
      band: {
        name: bandName,
        genre: routeToGenre(route),
        basePopularity,
        funds,
        conflictPenalty: 0,
        temporaryTeamBonus: 0,
        publicInactivityMonths: 0,
        unlockedVenueLevel,
      },
      members,
      month: {
        actionPointsRemaining: 3,
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
      releasedAlbums,
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
          title: "旧版乐队履历",
          description: `${bandName} 的旧版生涯已迁移到新版工作站。`,
        },
        ...migratedHistory,
        {
          id: "legacy-save-migration",
          month: currentMonth,
          type: "milestone",
          title: "存档迁移完成",
          description: "旧版路线、属性、专辑和履历已按新版规则安全转换。",
        },
      ],
    },
  };
}
