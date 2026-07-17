import {
  CAREER_VENUE_LEVELS,
  COMMERCIAL_COLLABORATION_TEMPLATES,
  EQUIPMENT_CATALOG,
  RECORD_CONTRACTS,
} from "../data/career";
import { cloneGameState } from "./clone";
import { clamp } from "./formulas";
import { nextRandom, randomInteger } from "./rng";
import { selectAbsoluteMonth, selectBandAttributes } from "./selectors";
import type {
  CommercialOffer,
  CommercialOfferKind,
  ContractOffer,
  EquipmentSlot,
  EquipmentTier,
  GameState,
  PerformanceInvitation,
  VenueLevel,
} from "./types";

export type CareerMutationResult =
  | { ok: true; state: GameState; message: string }
  | { ok: false; state: GameState; error: string };

function mutationFailure(
  state: GameState,
  error: string,
): CareerMutationResult {
  return { ok: false, state, error };
}

function invitationPool(state: GameState): typeof CAREER_VENUE_LEVELS[number][] {
  const popularity = selectBandAttributes(state).popularity;
  return CAREER_VENUE_LEVELS.filter(
    (venue) =>
      venue.level <= state.band.unlockedVenueLevel &&
      (venue.level === 1 ||
        popularity >= Math.max(0, venue.unlock.minPopularity - 10)),
  );
}

function buildInvitations(state: GameState): PerformanceInvitation[] {
  const popularity = selectBandAttributes(state).popularity;
  const currentMonth = selectAbsoluteMonth(state);
  const storyTags = new Set(
    state.members.flatMap((member) => member.hiddenTags),
  );
  const availabilityChance = Math.min(
    0.97,
    Math.max(
      0.35,
      0.72 +
        Math.min(0.15, popularity * 0.0015) +
        (state.activeContract?.kind === "majorLabel" ? 0.07 : 0) +
        (state.band.genre === "pop"
          ? 0.03
          : state.band.genre === "indie"
            ? -0.03
            : 0) +
        (storyTags.has("场地联系人") ? 0.08 : 0) -
        (storyTags.has("场地联系降温") ? 0.12 : 0),
    ),
  );
  const availabilityRoll = nextRandom(state.rng);
  state.rng = availabilityRoll.rng;
  if (availabilityRoll.value >= availabilityChance) {
    return [];
  }

  let count = 1;

  if (popularity >= 10) {
    const roll = nextRandom(state.rng);
    state.rng = roll.rng;
    if (roll.value < 0.55) count += 1;
  }
  if (popularity >= 35) {
    const roll = nextRandom(state.rng);
    state.rng = roll.rng;
    if (roll.value < 0.45) count += 1;
  }

  const venues = invitationPool(state);
  const weightedVenues = venues.flatMap((venue) => {
    const majorLabelBonus =
      state.activeContract?.kind === "majorLabel" && venue.level >= 4 ? 4 : 0;
    return Array.from({ length: venue.level + majorLabelBonus }, () => venue);
  });
  const invitations: PerformanceInvitation[] = [];

  for (let index = 0; index < Math.min(3, count); index += 1) {
    const venueRoll = randomInteger(
      state.rng,
      0,
      weightedVenues.length - 1,
    );
    state.rng = venueRoll.rng;
    const venue = weightedVenues[venueRoll.value];
    const feeRoll = randomInteger(
      state.rng,
      venue.invitationFeeRange[0],
      venue.invitationFeeRange[1],
    );
    state.rng = feeRoll.rng;
    invitations.push({
      id: `invite-${currentMonth}-${index}-${venue.level}`,
      venueId: venue.id,
      venueName: venue.name,
      title:
        venue.level >= 5
          ? "全国巡演邀约"
          : venue.level >= 4
            ? "大型舞台邀约"
            : `${venue.name}演出邀约`,
      venueLevel: venue.level,
      fee: Math.round(feeRoll.value / 500) * 500,
      basePopularity: venue.basePopularityGain,
      actionPointCost: venue.actionPointCost,
      difficulty: venue.difficulty,
      expiresAtMonth: currentMonth,
    });
  }

  return invitations;
}

const COMMERCIAL_KIND_MAP: Readonly<
  Record<
    typeof COMMERCIAL_COLLABORATION_TEMPLATES[number]["id"],
    CommercialOfferKind
  >
> = {
  brandPromotion: "brandPromotion",
  albumLicensing: "albumLicense",
  platformPromotion: "platformCampaign",
  customCollaboration: "customCommission",
};

function maybeCommercialOffer(state: GameState): CommercialOffer[] {
  const currentMonth = selectAbsoluteMonth(state);
  const popularity = selectBandAttributes(state).popularity;
  if (popularity < 10) return [];

  const chance = nextRandom(state.rng);
  state.rng = chance.rng;
  if (chance.value >= 0.35 && currentMonth % 4 !== 0) return [];

  const eligible = COMMERCIAL_COLLABORATION_TEMPLATES.filter(
    (template) =>
      !template.requiresReleasedAlbum || state.releasedAlbums.length > 0,
  );
  const selection = randomInteger(state.rng, 0, eligible.length - 1);
  state.rng = selection.rng;
  const template = eligible[selection.value];
  const scale = popularity >= 60 ? 3 : popularity >= 30 ? 2 : 1;
  const payout = (4_000 + template.id.length * 250) * scale;
  const tone: Record<
    typeof template.id,
    { popularity: number; belonging: number }
  > = {
    brandPromotion: { popularity: 2, belonging: -1 },
    albumLicensing: { popularity: 1, belonging: 0 },
    platformPromotion: { popularity: 3, belonging: 0 },
    customCollaboration: { popularity: 1, belonging: 1 },
  };

  return [
    {
      id: `commercial-${currentMonth}-${template.id}`,
      kind: COMMERCIAL_KIND_MAP[template.id],
      title: template.displayName,
      description: template.description,
      payout,
      popularityGain: tone[template.id].popularity,
      belongingChange: tone[template.id].belonging,
      expiresAtMonth: currentMonth,
    },
  ];
}

function maybeContractOffer(state: GameState): ContractOffer[] {
  if (state.activeContract) return [];

  const currentMonth = selectAbsoluteMonth(state);
  const popularity = selectBandAttributes(state).popularity;
  const eligibleKinds: Array<"smallLabel" | "majorLabel"> = [];
  if (popularity >= 15 && state.releasedAlbums.length >= 1) {
    eligibleKinds.push("smallLabel");
  }
  if (popularity >= 55 && state.releasedAlbums.length >= 2) {
    eligibleKinds.push("majorLabel");
  }
  if (eligibleKinds.length === 0) return [];

  const chance = nextRandom(state.rng);
  state.rng = chance.rng;
  if (chance.value >= 0.35 && currentMonth % 6 !== 0) return [];

  const kind = eligibleKinds[eligibleKinds.length - 1];
  const config = RECORD_CONTRACTS.find((contract) => contract.id === kind)!;
  return [
    {
      id: `contract-${currentMonth}-${kind}`,
      kind,
      title: `${config.displayName}发行合约`,
      signingBonus: config.signingBonus,
      durationMonths: config.durationMonths!,
      albumsRequired: config.releaseRequirement.requiredAlbums,
      expiresAtMonth: currentMonth,
    },
  ];
}

export function prepareMonthOpportunities(state: GameState): GameState {
  if (
    state.status !== "active" ||
    state.month.opportunitiesPrepared
  ) {
    return state;
  }

  const nextState = cloneGameState(state);
  nextState.month.opportunitiesPrepared = true;
  nextState.month.performanceInvitations = buildInvitations(nextState);
  nextState.month.commercialOffers = maybeCommercialOffer(nextState);
  nextState.month.contractOffers = maybeContractOffer(nextState);
  return nextState;
}

export function acceptCommercialOffer(
  state: GameState,
  offerId: string,
): CareerMutationResult {
  const offer = state.month.commercialOffers.find((item) => item.id === offerId);
  if (!offer) return mutationFailure(state, "这项合作已经失效");

  const nextState = cloneGameState(state);
  nextState.band.funds += offer.payout;
  nextState.band.basePopularity = clamp(
    nextState.band.basePopularity + offer.popularityGain,
  );
  if (offer.belongingChange !== 0) {
    for (const member of nextState.members) {
      member.stats.belonging = clamp(
        member.stats.belonging + offer.belongingChange,
      );
    }
  }
  nextState.month.hadPublicActivity = true;
  nextState.month.commercialOffers = [];
  nextState.history.push({
    id: `commercial-${selectAbsoluteMonth(nextState)}-${offer.kind}`,
    month: selectAbsoluteMonth(nextState),
    type: "commercial",
    title: `完成${offer.title}`,
    description: `合作收入 ¥${offer.payout.toLocaleString("zh-CN")}，基础人气 +${offer.popularityGain}。`,
  });
  return {
    ok: true,
    state: nextState,
    message: `${offer.title}已确认，合作款进入公共账户。`,
  };
}

export function declineCommercialOffer(
  state: GameState,
  offerId: string,
): CareerMutationResult {
  if (!state.month.commercialOffers.some((offer) => offer.id === offerId)) {
    return mutationFailure(state, "这项合作已经失效");
  }
  const nextState = cloneGameState(state);
  nextState.month.commercialOffers = nextState.month.commercialOffers.filter(
    (offer) => offer.id !== offerId,
  );
  return { ok: true, state: nextState, message: "已婉拒这次合作。" };
}

export function signContract(
  state: GameState,
  offerId: string,
): CareerMutationResult {
  if (state.activeContract) {
    return mutationFailure(state, "同一时间只能有一份唱片合约");
  }
  const offer = state.month.contractOffers.find((item) => item.id === offerId);
  if (!offer) return mutationFailure(state, "这份合约已经失效");
  const config = RECORD_CONTRACTS.find(
    (contract) => contract.id === offer.kind,
  )!;
  const currentMonth = selectAbsoluteMonth(state);
  const nextState = cloneGameState(state);
  nextState.activeContract = {
    kind: offer.kind,
    title: offer.title,
    signingBonus: config.signingBonus,
    startedAtMonth: currentMonth,
    deadlineMonth: currentMonth + offer.durationMonths,
    albumsRequired: offer.albumsRequired,
    albumsDelivered: 0,
    productionCostMultiplier: config.productionCostMultiplier,
    revenueShare: config.releaseRevenueShare,
    promotionBonus: config.promotionPopularityBonus,
  };
  nextState.band.funds += config.signingBonus;
  nextState.month.contractOffers = [];
  nextState.history.push({
    id: `contract-sign-${currentMonth}-${offer.kind}`,
    month: currentMonth,
    type: "contract",
    title: `签下${config.displayName}`,
    description: `获得签约金 ¥${config.signingBonus.toLocaleString("zh-CN")}，需要在 ${offer.durationMonths} 个月内发行 ${offer.albumsRequired} 张专辑。`,
  });
  return {
    ok: true,
    state: nextState,
    message: `${config.displayName}合约已生效。`,
  };
}

export function declineContractOffer(
  state: GameState,
  offerId: string,
): CareerMutationResult {
  if (!state.month.contractOffers.some((offer) => offer.id === offerId)) {
    return mutationFailure(state, "这份合约已经失效");
  }
  const nextState = cloneGameState(state);
  nextState.month.contractOffers = nextState.month.contractOffers.filter(
    (offer) => offer.id !== offerId,
  );
  return { ok: true, state: nextState, message: "乐队决定继续观望。" };
}

export function buyEquipment(
  state: GameState,
  slot: EquipmentSlot,
  tier: Exclude<EquipmentTier, "starter">,
): CareerMutationResult {
  const target = EQUIPMENT_CATALOG.find(
    (item) => item.slot === slot && item.tier === tier,
  );
  const current = EQUIPMENT_CATALOG.find(
    (item) => item.slot === slot && item.tier === state.equipment[slot],
  );
  if (!target || !current) return mutationFailure(state, "找不到对应设备");
  if (target.price <= current.price) {
    return mutationFailure(state, "新设备必须高于当前档次");
  }
  const tradeIn = Math.round(current.price * 0.5);
  const amountDue = target.price - tradeIn;
  if (state.band.funds < amountDue) {
    return mutationFailure(state, "公共资金不足，无法完成升级");
  }

  const nextState = cloneGameState(state);
  nextState.band.funds -= amountDue;
  nextState.equipment[slot] = tier;
  nextState.history.push({
    id: `equipment-${selectAbsoluteMonth(nextState)}-${slot}-${tier}`,
    month: selectAbsoluteMonth(nextState),
    type: "equipment",
    title: `换装${target.displayName}`,
    description: `旧设备折价 ¥${tradeIn.toLocaleString("zh-CN")}，实际支出 ¥${amountDue.toLocaleString("zh-CN")}。`,
  });
  return {
    ok: true,
    state: nextState,
    message: `${target.displayName}已经接入主角的设备链。`,
  };
}

export function sellEquipment(
  state: GameState,
  slot: EquipmentSlot,
): CareerMutationResult {
  const current = EQUIPMENT_CATALOG.find(
    (item) => item.slot === slot && item.tier === state.equipment[slot],
  );
  if (!current || current.tier === "starter") {
    return mutationFailure(state, "入门设备不能出售");
  }
  const refund = Math.round(current.price * 0.5);
  const nextState = cloneGameState(state);
  nextState.band.funds += refund;
  nextState.equipment[slot] = "starter";
  nextState.history.push({
    id: `equipment-sale-${selectAbsoluteMonth(nextState)}-${slot}`,
    month: selectAbsoluteMonth(nextState),
    type: "equipment",
    title: `出售${current.displayName}`,
    description: `设备回款 ¥${refund.toLocaleString("zh-CN")}，当前恢复为入门设备。`,
  });
  return {
    ok: true,
    state: nextState,
    message: `设备已出售，回款 ¥${refund.toLocaleString("zh-CN")}。`,
  };
}

export function equipmentModifier(
  state: GameState,
  key: "albumCheckBonus" | "performanceCheckBonus" | "trainingCheckBonus",
): number {
  return (Object.keys(state.equipment) as EquipmentSlot[]).reduce(
    (total, slot) => {
      const option = EQUIPMENT_CATALOG.find(
        (item) =>
          item.slot === slot && item.tier === state.equipment[slot],
      );
      return total + (option?.hiddenModifiers[key] ?? 0);
    },
    0,
  );
}

export function abandonAlbum(state: GameState): CareerMutationResult {
  const activeAlbum = state.activeAlbum;
  if (!activeAlbum) return mutationFailure(state, "当前没有在制专辑");
  const nextState = cloneGameState(state);
  const title = activeAlbum.workingTitle;
  nextState.activeAlbum = null;
  nextState.history.push({
    id: `album-abandon-${selectAbsoluteMonth(nextState)}`,
    month: selectAbsoluteMonth(nextState),
    type: "album",
    title: "放弃当前专辑",
    description: `乐队停止了《${title}》的制作，保留精力重新出发。`,
  });
  return { ok: true, state: nextState, message: "当前专辑已经放弃。" };
}
