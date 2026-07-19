import { z } from "zod";
import {
  ACTION_IDS,
  GENRES,
  MEMBER_ROLES,
  MEMBER_STATUSES,
  type GameState,
} from "../domain/types";

const boundedAttribute = z.number().min(0).max(100);
const nonEmptyString = z.string().min(1);
const nonNegativeInteger = z.number().int().nonnegative();
const positiveInteger = z.number().int().positive();
const venueLevelSchema = z.number().int().min(1).max(5);
const endingReasonSchema = z.enum([
  "twentiethAnniversary",
  "memberBreakup",
  "debtBreakup",
  "playerEnded",
  "specialStory",
]);
const performanceRatingSchema = z.enum([
  "accident",
  "barelyCompleted",
  "steady",
  "crowdIgnited",
  "legendary",
]);
const timestampSchema = nonEmptyString.refine(
  (value) => !Number.isNaN(Date.parse(value)),
  "时间戳格式无效",
);

const memberStatsSchema = z
  .object({
    professional: boundedAttribute,
    creativity: boundedAttribute,
    performance: boundedAttribute,
    popularity: boundedAttribute,
    belonging: boundedAttribute,
  })
  .strict();

const memberSchema = z
  .object({
    id: nonEmptyString,
    name: nonEmptyString,
    age: nonNegativeInteger,
    role: z.enum(MEMBER_ROLES),
    avatarId: z.string(),
    biography: z.string(),
    quote: z.string(),
    traits: z.array(z.string()),
    stats: memberStatsSchema,
    isPlayer: z.boolean(),
    status: z.enum(MEMBER_STATUSES),
    hiddenTags: z.array(z.string()),
  })
  .strict();

const effectRecordSchema = z
  .object({
    target: z.string(),
    label: z.string(),
    amount: z.number(),
    unit: z.enum(["point", "currency", "level", "progress"]).optional(),
  })
  .strict();

const actionExtraSchema = z
  .object({
    kind: z.enum(["none", "positive", "negative", "narrative"]),
    roll: z.number().min(0).max(100),
    message: z.string(),
  })
  .strict();

const actionFeedbackSchema = z
  .object({
    actionId: z.enum(ACTION_IDS),
    title: z.string(),
    actionPointsSpent: z.number().int().min(0).max(3),
    effects: z.array(effectRecordSchema),
    messages: z.array(z.string()),
    extra: actionExtraSchema,
  })
  .strict();

const eventHistoryEntrySchema = z
  .object({
    eventId: nonEmptyString,
    month: positiveInteger,
    choiceId: nonEmptyString,
    outcomeId: nonEmptyString,
  })
  .strict();

const scheduledEventSchema = z
  .object({
    eventId: nonEmptyString,
    dueMonth: positiveInteger,
    chainId: nonEmptyString,
  })
  .strict();

const albumSchema = z
  .object({
    id: nonEmptyString,
    workingTitle: z.string(),
    coverId: z.string().nullable(),
    startedInMonth: positiveInteger,
    progress: z.number().min(0).max(100),
    quality: z.number().min(0.5).max(5).nullable(),
    creationCheckpointResolved: z.boolean(),
    arrangementCheckpointResolved: z.boolean(),
    recordingCheckpointResolved: z.boolean(),
  })
  .strict();

const releasedAlbumSchema = z
  .object({
    id: nonEmptyString,
    title: nonEmptyString,
    coverId: nonEmptyString,
    quality: z.number().min(0.5).max(5),
    releasedInMonth: positiveInteger,
    listeners: nonNegativeInteger,
    grossRevenue: z.number().int(),
    netRevenue: z.number().int(),
  })
  .strict();

const equipmentSchema = z
  .object({
    guitar: z.enum(["starter", "advanced", "professional", "top"]),
    pedals: z.enum(["starter", "advanced", "professional", "top"]),
    amplifier: z.enum(["starter", "advanced", "professional", "top"]),
  })
  .strict();

const performanceInvitationSchema = z
  .object({
    id: nonEmptyString,
    venueId: nonEmptyString,
    venueName: nonEmptyString,
    title: nonEmptyString,
    venueLevel: venueLevelSchema,
    fee: z.number().int().nonnegative(),
    basePopularity: z.number().nonnegative(),
    actionPointCost: z.union([z.literal(2), z.literal(3)]),
    difficulty: z.number(),
    expiresAtMonth: positiveInteger,
  })
  .strict();

const performanceRecordSchema = z
  .object({
    id: nonEmptyString,
    month: positiveInteger,
    title: nonEmptyString,
    kind: z.enum(["invited", "selfOrganized"]),
    venueLevel: venueLevelSchema,
    rating: performanceRatingSchema,
    difference: z.number(),
    grossPayment: z.number().int().nonnegative(),
    upfrontCost: z.number().int().nonnegative(),
    netPayment: z.number().int(),
    popularityChange: z.number(),
    excellent: z.boolean(),
  })
  .strict();

const commercialOfferSchema = z
  .object({
    id: nonEmptyString,
    kind: z.enum([
      "brandPromotion",
      "albumLicense",
      "platformCampaign",
      "customCommission",
    ]),
    title: nonEmptyString,
    description: z.string(),
    payout: z.number().int().nonnegative(),
    popularityGain: z.number(),
    belongingChange: z.number(),
    expiresAtMonth: positiveInteger,
  })
  .strict();

const contractOfferSchema = z
  .object({
    id: nonEmptyString,
    kind: z.enum(["smallLabel", "majorLabel"]),
    title: nonEmptyString,
    signingBonus: z.number().int().nonnegative(),
    durationMonths: positiveInteger,
    albumsRequired: positiveInteger,
    expiresAtMonth: positiveInteger,
  })
  .strict();

const activeContractSchema = z
  .object({
    kind: z.enum(["smallLabel", "majorLabel"]),
    title: nonEmptyString,
    signingBonus: z.number().int().nonnegative(),
    startedAtMonth: positiveInteger,
    deadlineMonth: positiveInteger,
    albumsRequired: positiveInteger,
    albumsDelivered: nonNegativeInteger,
    productionCostMultiplier: z.number().min(0).max(1),
    revenueShare: z.number().min(0).max(1),
    promotionBonus: z.number().nonnegative(),
  })
  .strict();

const endingMemberSummarySchema = z
  .object({
    memberId: nonEmptyString,
    name: nonEmptyString,
    role: z.enum(MEMBER_ROLES),
    headline: nonEmptyString,
    belonging: boundedAttribute,
  })
  .strict();

const endingSummarySchema = z
  .object({
    title: nonEmptyString,
    reason: endingReasonSchema,
    tags: z.array(z.string()),
    representativeAlbumId: z.string().nullable(),
    keyPerformanceId: z.string().nullable(),
    memberSummaries: z.array(endingMemberSummarySchema),
    biography: nonEmptyString,
  })
  .strict();

const timelineEntrySchema = z
  .object({
    id: nonEmptyString,
    month: nonNegativeInteger,
    type: z.enum([
      "action",
      "month",
      "album",
      "performance",
      "milestone",
      "event",
      "contract",
      "commercial",
      "equipment",
    ]),
    title: z.string(),
    description: z.string(),
  })
  .strict();

const gameStateObjectSchema = z
  .object({
    version: z.literal(2),
    id: nonEmptyString,
    createdAt: timestampSchema,
    status: z.enum(["active", "ended"]),
    endingReason: endingReasonSchema.nullable(),
    endingSummary: endingSummarySchema.nullable(),
    rng: z
      .object({
        seed: z.number().int().min(0).max(0xffff_ffff),
        state: z.number().int().min(0).max(0xffff_ffff),
        draws: nonNegativeInteger,
      })
      .strict(),
    calendar: z
      .object({
        completedMonths: z.number().int().min(0).max(240),
        year: positiveInteger,
        month: z.number().int().min(1).max(12),
        maxMonths: positiveInteger,
      })
      .strict(),
    band: z
      .object({
        name: nonEmptyString,
        genre: z.enum(GENRES),
        basePopularity: boundedAttribute,
        funds: z.number(),
        conflictPenalty: z.number().nonnegative(),
        temporaryTeamBonus: z.number(),
        publicInactivityMonths: nonNegativeInteger,
        unlockedVenueLevel: venueLevelSchema,
      })
      .strict(),
    members: z.array(memberSchema).length(5),
    month: z
      .object({
        actionPointsRemaining: z.number().int().min(0).max(3),
        usedActions: z.array(z.enum(ACTION_IDS)),
        hadPublicActivity: z.boolean(),
        feedback: z.array(actionFeedbackSchema),
        eventPrepared: z.boolean(),
        opportunitiesPrepared: z.boolean(),
        opportunitiesAcknowledged: z.boolean().default(false),
        performanceInvitations: z.array(performanceInvitationSchema),
        commercialOffers: z.array(commercialOfferSchema),
        contractOffers: z.array(contractOfferSchema),
      })
      .strict(),
    activeAlbum: albumSchema.nullable(),
    releasedAlbums: z.array(releasedAlbumSchema),
    equipment: equipmentSchema,
    activeContract: activeContractSchema.nullable(),
    performanceRecords: z.array(performanceRecordSchema),
    performanceMilestones: z
      .object({
        excellentLevel3: z.boolean(),
        excellentLevel4: z.boolean(),
      })
      .strict(),
    financialCrisis: z
      .object({
        active: z.boolean(),
        monthsRemaining: nonNegativeInteger,
        consecutiveNegativeMonths: nonNegativeInteger,
      })
      .strict(),
    belongingCrises: z.array(
      z
        .object({
          memberId: nonEmptyString,
          monthsRemaining: positiveInteger,
        })
        .strict(),
    ),
    pendingEvent: nonEmptyString.nullable(),
    eventCooldownMonths: nonNegativeInteger,
    eventCooldowns: z.record(nonEmptyString, nonNegativeInteger),
    completedEventIds: z.array(nonEmptyString),
    scheduledEvents: z.array(scheduledEventSchema),
    eventHistory: z.array(eventHistoryEntrySchema),
    history: z.array(timelineEntrySchema),
  })
  .strict();

export const gameStateSchema = gameStateObjectSchema.superRefine((state, context) => {
  const players = state.members.filter((member) => member.isPlayer);
  if (players.length !== 1) {
    context.addIssue({
      code: "custom",
      path: ["members"],
      message: "存档必须且只能包含一名主角",
    });
  } else if (players[0].role !== "leader") {
    context.addIssue({
      code: "custom",
      path: ["members"],
      message: "主角必须担任队长、吉他手兼主唱",
    });
  }

  const ids = state.members.map((member) => member.id);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({
      code: "custom",
      path: ["members"],
      message: "成员 ID 不能重复",
    });
  }

  for (const role of MEMBER_ROLES) {
    if (state.members.filter((member) => member.role === role).length !== 1) {
      context.addIssue({
        code: "custom",
        path: ["members"],
        message: `成员阵容必须且只能包含一名 ${role}`,
      });
    }
  }
});

export const saveEnvelopeSchema = z
  .object({
    saveVersion: z.literal(2),
    savedAt: timestampSchema,
    state: gameStateSchema,
  })
  .strict();

export type SaveEnvelope = z.infer<typeof saveEnvelopeSchema>;

export function parseGameState(input: unknown): GameState {
  return gameStateSchema.parse(input) as GameState;
}
