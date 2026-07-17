import {
  ACTION_EXTRA_FUNDS_CHANGE,
  ACTION_POINT_COSTS,
  DEFAULT_PERFORMANCE_FEE,
  DEFAULT_PERFORMANCE_POPULARITY,
  SELF_ORGANIZED_PERFORMANCE_DIFFICULTY_PENALTY,
  STATUS_EXTRA_SHIFT,
  STYLE_MODIFIERS,
  VENUE_DIFFICULTY,
} from "./constants";
import { equipmentModifier } from "./career";
import { cloneGameState } from "./clone";
import {
  averageStatusModifier,
  clamp,
  clampAlbumQuality,
  qualityFromCreativity,
  shiftStatus,
} from "./formulas";
import { nextRandom, randomInteger } from "./rng";
import { selectAbsoluteMonth, selectBandAttributes, selectPlayer } from "./selectors";
import type {
  ActionCommand,
  ActionExecution,
  ActionExtraKind,
  ActionExtraResult,
  ActionFeedback,
  ActionId,
  AlbumState,
  DomainFailure,
  EffectRecord,
  GameState,
  Member,
  MemberStatKey,
  PerformancePlan,
  PerformanceRating,
  ReleasedAlbum,
} from "./types";

const ACTION_TITLES: Readonly<Record<ActionId, string>> = {
  personalTraining: "个人训练",
  social: "社交",
  partTime: "兼职",
  rest: "休息",
  bandTraining: "成员训练",
  rehearsal: "乐队排练",
  albumProduction: "制作专辑",
  performance: "演出",
  promotion: "宣传",
  teamBuilding: "团建",
};

function failure(
  state: GameState,
  code: DomainFailure["code"],
  message: string,
): ActionExecution {
  return {
    ok: false,
    state,
    error: { code, message },
  };
}

function actionPointCost(command: ActionCommand): number {
  if (command.type === "albumProduction" && command.mode === "concentrated") {
    return 2;
  }

  if (command.type === "performance") {
    return command.plan?.actionPointCost ?? ACTION_POINT_COSTS.performance;
  }

  return ACTION_POINT_COSTS[command.type];
}

function requiredFunds(state: GameState, command: ActionCommand): number {
  switch (command.type) {
    case "promotion":
    case "teamBuilding":
      return 1_000;
    case "albumProduction": {
      const multiplier = state.activeContract?.productionCostMultiplier ?? 1;
      if (command.mode === "release") {
        return Math.round(5_000 * multiplier);
      }

      if ((state.activeAlbum?.progress ?? 0) >= 70) {
        const base = command.mode === "concentrated" ? 6_000 : 3_000;
        return Math.round(base * multiplier);
      }

      return 0;
    }
    case "performance":
      return command.plan?.upfrontCost ?? 0;
    default:
      return 0;
  }
}

function resolveRelevantMembers(state: GameState, command: ActionCommand): Member[] {
  if (
    command.type === "personalTraining" ||
    command.type === "social" ||
    command.type === "partTime" ||
    command.type === "rest"
  ) {
    return [selectPlayer(state)];
  }

  if (command.type === "bandTraining") {
    const target = state.members.find((member) => member.id === command.memberId);
    return target ? [target] : state.members;
  }

  return state.members;
}

function rollActionExtra(
  state: GameState,
  command: ActionCommand,
  relevantMembers: readonly Member[],
): ActionExtraResult {
  const averageShift =
    relevantMembers.length === 0
      ? 0
      : relevantMembers.reduce(
          (sum, member) => sum + STATUS_EXTRA_SHIFT[member.status],
          0,
        ) / relevantMembers.length;
  const punkNegativeShift = state.band.genre === "punk" ? 5 : 0;
  const trainingBonus =
    command.type === "personalTraining" && command.stat === "professional"
      ? equipmentModifier(state, "trainingCheckBonus") * 0.5
      : 0;
  const positiveProbability = clamp(
    25 + averageShift + trainingBonus,
    0,
    100,
  );
  const negativeProbability = clamp(15 - averageShift + punkNegativeShift, 0, 100);
  const narrativeProbability = 15;
  const result = nextRandom(state.rng);
  const roll = result.value * 100;
  state.rng = result.rng;

  let kind: ActionExtraKind;
  if (roll < positiveProbability) {
    kind = "positive";
  } else if (roll < positiveProbability + negativeProbability) {
    kind = "negative";
  } else if (
    roll <
    positiveProbability + negativeProbability + narrativeProbability
  ) {
    kind = "narrative";
  } else {
    kind = "none";
  }

  const messageByKind: Record<ActionExtraKind, string> = {
    positive: `这次行动格外顺利，临时节省了 ¥${ACTION_EXTRA_FUNDS_CHANGE.toLocaleString(
      "zh-CN",
    )}。`,
    negative: "行动中出现了小插曲，但固定成长仍然完整生效。",
    narrative: "行动留下了一段值得记住的小故事，没有额外数值变化。",
    none: "本次行动按计划完成，没有额外结果。",
  };

  return {
    kind,
    roll: Math.round(roll * 100) / 100,
    message: messageByKind[kind],
  };
}

function applyActionExtraEffect(
  state: GameState,
  command: ActionCommand,
  extra: ActionExtraResult,
  effects: EffectRecord[],
): void {
  if (extra.kind === "positive") {
    addFunds(state, ACTION_EXTRA_FUNDS_CHANGE, effects);
  } else if (extra.kind === "negative") {
    if (command.type === "partTime") {
      const player = selectPlayer(state);
      const statusBefore = player.status;
      changeStatus(player, -1, effects);
      if (player.status !== statusBefore) {
        extra.message = "兼职收尾比预想更辛苦，主角状态额外下降一级，但收入完整到账。";
        return;
      }
    }
    addFunds(state, -ACTION_EXTRA_FUNDS_CHANGE, effects);
    extra.message = `临时状况带来 ¥${ACTION_EXTRA_FUNDS_CHANGE.toLocaleString(
      "zh-CN",
    )} 额外支出，但固定成长仍然完整生效。`;
  }
}

function addStat(
  member: Member,
  stat: MemberStatKey,
  amount: number,
  effects: EffectRecord[],
): void {
  const before = member.stats[stat];
  member.stats[stat] = clamp(before + amount);
  const actual = member.stats[stat] - before;
  if (actual !== 0) {
    effects.push({
      target: member.id,
      label: stat,
      amount: actual,
      unit: "point",
    });
  }
}

function changeStatus(
  member: Member,
  recoveryLevels: number,
  effects: EffectRecord[],
): void {
  const before = member.status;
  member.status = shiftStatus(member.status, recoveryLevels);
  if (member.status !== before) {
    effects.push({
      target: member.id,
      label: "status",
      amount: recoveryLevels,
      unit: "level",
    });
  }
}

function addFunds(state: GameState, amount: number, effects: EffectRecord[]): void {
  state.band.funds += amount;
  effects.push({
    target: "band",
    label: "funds",
    amount,
    unit: "currency",
  });
}

function addBasePopularity(
  state: GameState,
  amount: number,
  effects: EffectRecord[],
): void {
  const before = state.band.basePopularity;
  state.band.basePopularity = clamp(before + amount);
  const actual = state.band.basePopularity - before;
  if (actual !== 0) {
    effects.push({
      target: "band",
      label: "basePopularity",
      amount: actual,
      unit: "point",
    });
  }
}

function createAlbumDraft(state: GameState, title?: string): AlbumState {
  const absoluteMonth = selectAbsoluteMonth(state);
  return {
    id: `album-${state.id}-${absoluteMonth}-${state.releasedAlbums.length + 1}`,
    workingTitle: title?.trim() || "未命名专辑",
    coverId: null,
    startedInMonth: absoluteMonth,
    progress: 0,
    quality: null,
    creationCheckpointResolved: false,
    arrangementCheckpointResolved: false,
    recordingCheckpointResolved: false,
  };
}

function resolveAlbumCheckpoints(
  state: GameState,
  previousProgress: number,
  effects: EffectRecord[],
  messages: string[],
): void {
  const album = state.activeAlbum;
  if (!album) {
    return;
  }

  if (
    previousProgress < 40 &&
    album.progress >= 40 &&
    !album.creationCheckpointResolved
  ) {
    const attributes = selectBandAttributes(state);
    const effectiveCreativity =
      attributes.creativity +
      STYLE_MODIFIERS[state.band.genre].albumCreativity +
      equipmentModifier(state, "albumCheckBonus") * 0.5;
    album.quality = qualityFromCreativity(effectiveCreativity);
    album.creationCheckpointResolved = true;
    state.members.forEach((member) => addStat(member, "creativity", 1, effects));
    messages.push(`专辑创作成型，当前质量为 ${album.quality} 星。`);
  }

  if (
    previousProgress < 70 &&
    album.progress >= 70 &&
    !album.arrangementCheckpointResolved
  ) {
    const attributes = selectBandAttributes(state);
    const effectiveMusicianship =
      attributes.musicianship +
      STYLE_MODIFIERS[state.band.genre].albumMusicianship +
      equipmentModifier(state, "albumCheckBonus") * 0.5;
    if (effectiveMusicianship >= attributes.creativity - 10) {
      album.quality = clampAlbumQuality((album.quality ?? 0.5) + 0.5);
      messages.push("乐队顺利驾驭了编曲，专辑质量提高 0.5 星。");
    } else {
      messages.push("编曲已经完成，但演奏能力暂时没有带来额外质量提升。");
    }
    album.arrangementCheckpointResolved = true;
    state.members.forEach((member) => addStat(member, "professional", 1, effects));
  }

  if (
    previousProgress < 100 &&
    album.progress >= 100 &&
    !album.recordingCheckpointResolved
  ) {
    const attributes = selectBandAttributes(state);
    const membersReady = state.members.every(
      (member) => member.status !== "tired" && member.status !== "awful",
    );
    if (attributes.teamSpirit >= 60 && membersReady) {
      album.quality = clampAlbumQuality((album.quality ?? 0.5) + 0.5);
      messages.push("录音状态与团队配合都很理想，专辑质量提高 0.5 星。");
    } else {
      messages.push("录音完成了，但团队状态没有带来额外质量提升。");
    }
    album.recordingCheckpointResolved = true;
    state.members.forEach((member) => addStat(member, "professional", 1, effects));
  }
}

function releaseBracket(popularity: number): {
  listeners: number;
  revenue: number;
} {
  if (popularity < 10) return { listeners: 1_000, revenue: 3_000 };
  if (popularity < 30) return { listeners: 10_000, revenue: 10_000 };
  if (popularity < 60) return { listeners: 100_000, revenue: 30_000 };
  if (popularity < 85) return { listeners: 1_000_000, revenue: 80_000 };
  return { listeners: 5_000_000, revenue: 200_000 };
}

function albumQualityOutcome(quality: number): {
  multiplier: number;
  popularity: number;
} {
  if (quality <= 1) return { multiplier: 0.4, popularity: 0 };
  if (quality <= 2) return { multiplier: 0.7, popularity: 1 };
  if (quality <= 3) return { multiplier: 1, popularity: 3 };
  if (quality <= 4) return { multiplier: 1.5, popularity: 6 };
  if (quality === 4.5) return { multiplier: 2.2, popularity: 10 };
  return { multiplier: 3, popularity: 15 };
}

function releaseAlbum(
  state: GameState,
  command: Extract<ActionCommand, { type: "albumProduction" }>,
  effects: EffectRecord[],
  messages: string[],
): DomainFailure | null {
  const album = state.activeAlbum;
  if (!album) {
    return { code: "NO_ACTIVE_ALBUM", message: "目前没有正在制作的专辑" };
  }
  if (album.progress < 100 || album.quality === null) {
    return { code: "ALBUM_NOT_READY", message: "专辑尚未完成，不能发行" };
  }
  if (!command.title?.trim() || !command.coverId) {
    return {
      code: "ALBUM_DETAILS_REQUIRED",
      message: "发行前需要确认专辑名称和封面",
    };
  }

  const qualityOutcome = albumQualityOutcome(album.quality);
  const popularity = selectBandAttributes(state).popularity;
  const bracket = releaseBracket(popularity);
  const promotedThisMonth = state.month.usedActions.includes("promotion");
  const promotionMultiplier = promotedThisMonth ? 1.25 : 1;
  const listeners = Math.round(
    bracket.listeners * qualityOutcome.multiplier * promotionMultiplier,
  );
  const grossRevenue = Math.round(
    bracket.revenue * qualityOutcome.multiplier * promotionMultiplier,
  );
  const contract = state.activeContract;
  const releaseCost = Math.round(
    5_000 * (contract?.productionCostMultiplier ?? 1),
  );
  const bandRevenue = Math.round(
    grossRevenue * (contract?.revenueShare ?? 1),
  );
  const netRevenue = bandRevenue - releaseCost;

  addFunds(state, netRevenue, effects);
  addBasePopularity(
    state,
    qualityOutcome.popularity + (promotedThisMonth ? 1 : 0),
    effects,
  );
  state.month.hadPublicActivity = true;

  const released: ReleasedAlbum = {
    id: album.id,
    title: command.title.trim(),
    coverId: command.coverId,
    quality: album.quality,
    releasedInMonth: selectAbsoluteMonth(state),
    listeners,
    grossRevenue,
    netRevenue,
  };
  state.releasedAlbums.push(released);
  if (contract) {
    contract.albumsDelivered += 1;
    if (contract.albumsDelivered >= contract.albumsRequired) {
      state.history.push({
        id: `contract-complete-${released.id}`,
        month: selectAbsoluteMonth(state),
        type: "contract",
        title: `完成${contract.title}`,
        description: "乐队按期交付了约定专辑，合约正式结束并恢复独立发行。",
      });
      state.activeContract = null;
    }
  }
  state.activeAlbum = null;
  state.history.push({
    id: `release-${released.id}`,
    month: selectAbsoluteMonth(state),
    type: "album",
    title: `发行《${released.title}》`,
    description: `${released.quality} 星，首发收听约 ${released.listeners.toLocaleString(
      "zh-CN",
    )}，净收益 ¥${released.netRevenue.toLocaleString("zh-CN")}。`,
  });
  messages.push(
    `《${released.title}》正式发行，获得约 ${listeners.toLocaleString(
      "zh-CN",
    )} 次首发收听。`,
  );

  return null;
}

function performanceRatingFromDifference(difference: number): PerformanceRating {
  if (difference <= -20) return "accident";
  if (difference <= -6) return "barelyCompleted";
  if (difference <= 9) return "steady";
  if (difference <= 24) return "crowdIgnited";
  return "legendary";
}

function ratingLabel(rating: PerformanceRating): string {
  const labels: Record<PerformanceRating, string> = {
    accident: "演出事故",
    barelyCompleted: "勉强完成",
    steady: "稳定发挥",
    crowdIgnited: "全场沸腾",
    legendary: "传奇现场",
  };
  return labels[rating];
}

export function estimatePerformanceRisk(
  state: GameState,
  plan: PerformancePlan,
): {
  difference: number;
  label: "稳妥" | "有风险" | "很难";
} {
  const attributes = selectBandAttributes(state);
  const effectiveMusicianship = clamp(
    attributes.musicianship +
      (state.band.genre === "metal"
        ? STYLE_MODIFIERS.metal.albumMusicianship
        : 0),
  );
  const bestAlbumQuality = state.releasedAlbums.reduce(
    (best, album) => Math.max(best, album.quality),
    0,
  );
  const difference =
    effectiveMusicianship * 0.4 +
    attributes.stagecraft * 0.4 +
    attributes.teamSpirit * 0.2 +
    bestAlbumQuality +
    averageStatusModifier(state.members) +
    STYLE_MODIFIERS[state.band.genre].performance +
    equipmentModifier(state, "performanceCheckBonus") -
    VENUE_DIFFICULTY[plan.venueLevel] +
    (plan.kind === "selfOrganized"
      ? -SELF_ORGANIZED_PERFORMANCE_DIFFICULTY_PENALTY
      : 0);

  return {
    difference: Math.round(difference * 10) / 10,
    label: difference >= 8 ? "稳妥" : difference >= -7 ? "有风险" : "很难",
  };
}

function resolvePerformance(
  state: GameState,
  planInput: PerformancePlan | undefined,
  effects: EffectRecord[],
  messages: string[],
): void {
  const plan: PerformancePlan = planInput ?? {
    kind: "invited",
    venueLevel: 1,
    fee: DEFAULT_PERFORMANCE_FEE[1],
    basePopularity: DEFAULT_PERFORMANCE_POPULARITY[1],
    actionPointCost: 2,
    title: "小型拼盘演出",
  };
  const attributes = selectBandAttributes(state);
  const effectiveMusicianship = clamp(
    attributes.musicianship +
      (state.band.genre === "metal" ? STYLE_MODIFIERS.metal.albumMusicianship : 0),
  );
  const baseAbility =
    effectiveMusicianship * 0.4 +
    attributes.stagecraft * 0.4 +
    attributes.teamSpirit * 0.2;
  const bestAlbumQuality = state.releasedAlbums.reduce(
    (best, album) => Math.max(best, album.quality),
    0,
  );
  const genreModifier = STYLE_MODIFIERS[state.band.genre].performance;
  const randomResult = randomInteger(state.rng, -8, 8);
  state.rng = randomResult.rng;
  const difference =
    baseAbility +
    bestAlbumQuality +
    averageStatusModifier(state.members) +
    genreModifier -
    VENUE_DIFFICULTY[plan.venueLevel] +
    equipmentModifier(state, "performanceCheckBonus") +
    (plan.kind === "selfOrganized"
      ? -SELF_ORGANIZED_PERFORMANCE_DIFFICULTY_PENALTY
      : 0) +
    randomResult.value;
  const rating = performanceRatingFromDifference(difference);

  const paymentMultiplier: Record<PerformanceRating, number> = {
    accident: 0.5,
    barelyCompleted: 1,
    steady: 1,
    crowdIgnited: 1.2,
    legendary: 1.5,
  };
  const popularityMultiplier: Record<PerformanceRating, number> = {
    accident: -0.5,
    barelyCompleted: 0,
    steady: 1,
    crowdIgnited: 1.5,
    legendary: 2,
  };
  const grossPayment = Math.round(plan.fee * paymentMultiplier[rating]);
  const upfrontCost = plan.upfrontCost ?? 0;
  addFunds(state, grossPayment - upfrontCost, effects);

  let popularityChange: number;
  if (rating === "accident") {
    popularityChange = -Math.ceil(plan.basePopularity / 2);
  } else {
    popularityChange = Math.round(
      plan.basePopularity *
        popularityMultiplier[rating] *
        (plan.kind === "selfOrganized" ? 1.2 : 1),
    );
  }
  addBasePopularity(state, popularityChange, effects);

  const stateDrop = plan.venueLevel >= 4 || (plan.actionPointCost ?? 2) === 3 ? -2 : -1;
  state.members.forEach((member) => changeStatus(member, stateDrop, effects));
  if (rating === "crowdIgnited" || rating === "legendary") {
    state.members.forEach((member) => addStat(member, "performance", 1, effects));
  }

  state.month.hadPublicActivity = true;
  if (plan.invitationId) {
    state.month.performanceInvitations =
      state.month.performanceInvitations.filter(
        (invitation) => invitation.id !== plan.invitationId,
      );
  }
  const title = plan.title ?? `${plan.venueLevel} 级场地演出`;
  messages.push(
    `${title}：${ratingLabel(rating)}，获得 ¥${grossPayment.toLocaleString(
      "zh-CN",
    )} 报酬。`,
  );
  state.history.push({
    id: `performance-${selectAbsoluteMonth(state)}-${state.history.length}`,
    month: selectAbsoluteMonth(state),
    type: rating === "legendary" ? "milestone" : "performance",
    title: `${title} · ${ratingLabel(rating)}`,
    description: `演出差值 ${Math.round(difference * 10) / 10}，人气变化 ${
      popularityChange >= 0 ? "+" : ""
    }${popularityChange}。`,
  });
  const performanceId = `show-${selectAbsoluteMonth(state)}-${state.performanceRecords.length + 1}`;
  const excellent = rating === "crowdIgnited" || rating === "legendary";
  state.performanceRecords.push({
    id: performanceId,
    month: selectAbsoluteMonth(state),
    title,
    kind: plan.kind,
    venueLevel: plan.venueLevel,
    rating,
    difference: Math.round(difference * 10) / 10,
    grossPayment,
    upfrontCost,
    netPayment: grossPayment - upfrontCost,
    popularityChange,
    excellent,
  });
  if (excellent && plan.venueLevel === 3) {
    state.performanceMilestones.excellentLevel3 = true;
  }
  if (excellent && plan.venueLevel === 4) {
    state.performanceMilestones.excellentLevel4 = true;
  }
}

function validateCommandSpecific(state: GameState, command: ActionCommand): DomainFailure | null {
  if (command.type === "bandTraining") {
    const target = state.members.find((member) => member.id === command.memberId);
    if (!target) {
      return { code: "MEMBER_NOT_FOUND", message: "找不到要培养的成员" };
    }
    if (target.isPlayer) {
      return {
        code: "INVALID_TARGET",
        message: "乐队训练只能用于四名队友，主角请使用个人训练",
      };
    }
  }

  if (command.type === "albumProduction" && command.mode === "release") {
    if (!state.activeAlbum) {
      return { code: "NO_ACTIVE_ALBUM", message: "目前没有正在制作的专辑" };
    }
    if (state.activeAlbum.progress < 100) {
      return { code: "ALBUM_NOT_READY", message: "专辑尚未完成，不能发行" };
    }
    if (!command.title?.trim() || !command.coverId) {
      return {
        code: "ALBUM_DETAILS_REQUIRED",
        message: "发行前需要确认专辑名称和封面",
      };
    }
  }

  if (
    command.type === "albumProduction" &&
    command.mode !== "release" &&
    state.activeAlbum?.progress === 100
  ) {
    return { code: "ALBUM_NOT_READY", message: "专辑已完成，请在下个月发行" };
  }

  if (command.type === "performance" && command.plan) {
    const plan = command.plan;
    if (plan.venueLevel > state.band.unlockedVenueLevel) {
      return { code: "INVALID_COMMAND", message: "该级别场地尚未解锁" };
    }
    if (plan.kind === "selfOrganized" && plan.venueLevel >= 4) {
      return {
        code: "INVALID_COMMAND",
        message: "四级和五级场地只能通过正式邀请参加",
      };
    }
    if (plan.kind === "invited" && plan.invitationId) {
      const invitation = state.month.performanceInvitations.find(
        (item) => item.id === plan.invitationId,
      );
      if (
        !invitation ||
        invitation.expiresAtMonth !== selectAbsoluteMonth(state) ||
        invitation.venueLevel !== plan.venueLevel
      ) {
        return { code: "INVALID_COMMAND", message: "这份演出邀请已经失效" };
      }
    }
  }

  return null;
}

export function executeAction(state: GameState, command: ActionCommand): ActionExecution {
  if (state.status !== "active") {
    return failure(state, "GAME_ENDED", "乐队生涯已经结束");
  }

  const actionId = command.type;
  if (state.month.usedActions.includes(actionId)) {
    return failure(state, "ACTION_ALREADY_USED", "同一个行动每个月只能执行一次");
  }

  const specificFailure = validateCommandSpecific(state, command);
  if (specificFailure) {
    return failure(state, specificFailure.code, specificFailure.message);
  }

  const apCost = actionPointCost(command);
  if (state.month.actionPointsRemaining < apCost) {
    return failure(state, "NOT_ENOUGH_ACTION_POINTS", "本月剩余行动点不足");
  }

  const fundsNeeded = requiredFunds(state, command);
  if (fundsNeeded > 0 && fundsNeeded > state.band.funds) {
    return failure(state, "NOT_ENOUGH_FUNDS", "乐队资金不足，无法执行这个行动");
  }

  const relevantMembers = resolveRelevantMembers(state, command);
  const nextState = cloneGameState(state);
  const effects: EffectRecord[] = [];
  const messages: string[] = [];

  switch (command.type) {
    case "personalTraining": {
      const player = selectPlayer(nextState);
      addStat(player, command.stat, 2, effects);
      changeStatus(player, -1, effects);
      messages.push(`${player.name} 完成个人训练。`);
      break;
    }
    case "social": {
      const player = selectPlayer(nextState);
      addStat(player, "popularity", 1, effects);
      messages.push(`${player.name} 扩展了自己的音乐圈。`);
      break;
    }
    case "partTime": {
      const player = selectPlayer(nextState);
      addFunds(nextState, 3_000, effects);
      changeStatus(player, -1, effects);
      messages.push("兼职收入存入乐队公共账户。");
      break;
    }
    case "rest": {
      const player = selectPlayer(nextState);
      changeStatus(player, 2, effects);
      messages.push(`${player.name} 暂时放下工作，好好休息了一次。`);
      break;
    }
    case "bandTraining": {
      const member = nextState.members.find((item) => item.id === command.memberId)!;
      addStat(member, command.stat, 2, effects);
      changeStatus(member, -1, effects);
      messages.push(`${member.name} 完成了针对性训练。`);
      break;
    }
    case "rehearsal": {
      nextState.members.forEach((member) => {
        addStat(member, "professional", 1, effects);
        changeStatus(member, -1, effects);
      });
      messages.push("全员完成一次完整排练。");
      break;
    }
    case "albumProduction": {
      if (command.mode === "release") {
        const releaseFailure = releaseAlbum(nextState, command, effects, messages);
        if (releaseFailure) {
          return failure(state, releaseFailure.code, releaseFailure.message);
        }
        break;
      }

      if (!nextState.activeAlbum) {
        nextState.activeAlbum = createAlbumDraft(nextState, command.title);
        messages.push("一张新专辑开始制作。");
      }

      const previousProgress = nextState.activeAlbum.progress;
      const progress = command.mode === "concentrated" ? 20 : 10;
      if (fundsNeeded > 0) {
        addFunds(nextState, -fundsNeeded, effects);
      }
      nextState.activeAlbum.progress = clamp(previousProgress + progress, 0, 100);
      effects.push({
        target: nextState.activeAlbum.id,
        label: "albumProgress",
        amount: nextState.activeAlbum.progress - previousProgress,
        unit: "progress",
      });
      if (command.mode === "concentrated") {
        nextState.members.forEach((member) => changeStatus(member, -1, effects));
      }
      resolveAlbumCheckpoints(nextState, previousProgress, effects, messages);
      messages.push(`专辑进度达到 ${nextState.activeAlbum.progress}%。`);
      break;
    }
    case "performance": {
      resolvePerformance(nextState, command.plan, effects, messages);
      break;
    }
    case "promotion": {
      addFunds(nextState, -1_000, effects);
      nextState.members.forEach((member) => addStat(member, "popularity", 1, effects));
      addBasePopularity(
        nextState,
        2 +
          STYLE_MODIFIERS[nextState.band.genre].promotionPopularity +
          (nextState.activeContract?.promotionBonus ?? 0),
        effects,
      );
      nextState.month.hadPublicActivity = true;
      messages.push("宣传内容已经公开发布。");
      break;
    }
    case "teamBuilding": {
      addFunds(nextState, -1_000, effects);
      nextState.members.forEach((member) => {
        addStat(member, "belonging", 2, effects);
        changeStatus(member, 1, effects);
      });
      messages.push("全员一起度过了一段轻松的时间。");
      break;
    }
  }

  nextState.month.actionPointsRemaining -= apCost;
  nextState.month.usedActions.push(actionId);
  const extra = rollActionExtra(nextState, command, relevantMembers);
  applyActionExtraEffect(nextState, command, extra, effects);
  const feedback: ActionFeedback = {
    actionId,
    title: ACTION_TITLES[actionId],
    actionPointsSpent: apCost,
    effects,
    messages: [...messages, extra.message],
    extra,
  };
  nextState.month.feedback.push(feedback);
  nextState.history.push({
    id: `action-${selectAbsoluteMonth(nextState)}-${nextState.month.feedback.length}`,
    month: selectAbsoluteMonth(nextState),
    type: "action",
    title: ACTION_TITLES[actionId],
    description: messages.join(" "),
  });

  return {
    ok: true,
    state: nextState,
    feedback,
  };
}
