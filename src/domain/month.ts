import {
  MONTHLY_ACTION_POINTS,
  MONTHLY_OPERATING_COST,
} from "./constants";
import { cloneGameState } from "./clone";
import { finishCareer } from "./endings";
import { clamp, shiftStatus } from "./formulas";
import { selectBandAttributes, selectPlayer } from "./selectors";
import type {
  BelongingCrisisState,
  GameState,
  MonthAdvanceResult,
} from "./types";

function settleBelongingCrises(state: GameState): void {
  const previousByMember = new Map(
    state.belongingCrises.map((crisis) => [crisis.memberId, crisis]),
  );
  const nextCrises: BelongingCrisisState[] = [];

  for (const member of state.members) {
    const existing = previousByMember.get(member.id);
    if (existing) {
      if (member.stats.belonging >= 10) {
        continue;
      }

      const monthsRemaining = existing.monthsRemaining - 1;
      if (monthsRemaining <= 0) {
        state.status = "ended";
        state.endingReason = "memberBreakup";
        continue;
      }
      nextCrises.push({ memberId: member.id, monthsRemaining });
      continue;
    }

    if (member.stats.belonging === 0) {
      nextCrises.push({ memberId: member.id, monthsRemaining: 6 });
    }
  }

  state.belongingCrises = nextCrises;
}

function settleFinancialCrisis(state: GameState): void {
  const crisisWasActive = state.financialCrisis.active;

  if (state.band.funds >= 0) {
    state.financialCrisis = {
      active: false,
      monthsRemaining: 0,
      consecutiveNegativeMonths: 0,
    };
    return;
  }

  state.financialCrisis.consecutiveNegativeMonths += 1;
  if (
    !state.financialCrisis.active &&
    (state.band.funds <= -30_000 ||
      state.financialCrisis.consecutiveNegativeMonths >= 6)
  ) {
    state.financialCrisis.active = true;
    state.financialCrisis.monthsRemaining = 6;
  }

  if (crisisWasActive && state.financialCrisis.active) {
    state.financialCrisis.monthsRemaining -= 1;
    if (state.financialCrisis.monthsRemaining <= 0) {
      state.status = "ended";
      state.endingReason = "debtBreakup";
    }
  }
}

function updateVenueUnlocks(state: GameState): void {
  const popularity = Math.round(selectBandAttributes(state).popularity);
  let unlocked: number = state.band.unlockedVenueLevel;

  if (popularity >= 10) {
    unlocked = Math.max(unlocked, 2);
  }
  if (popularity >= 30 && state.releasedAlbums.length >= 1) {
    unlocked = Math.max(unlocked, 3);
  }
  if (
    popularity >= 60 &&
    state.releasedAlbums.length >= 2 &&
    state.performanceMilestones.excellentLevel3
  ) {
    unlocked = Math.max(unlocked, 4);
  }
  if (
    popularity >= 85 &&
    state.releasedAlbums.length >= 4 &&
    state.performanceMilestones.excellentLevel4
  ) {
    unlocked = Math.max(unlocked, 5);
  }

  state.band.unlockedVenueLevel = unlocked as GameState["band"]["unlockedVenueLevel"];
}

function settleContract(state: GameState, completedMonth: number): string | null {
  const contract = state.activeContract;
  if (!contract || completedMonth < contract.deadlineMonth) {
    return null;
  }

  if (contract.albumsDelivered >= contract.albumsRequired) {
    state.activeContract = null;
    return `${contract.title}已经履约结束。`;
  }

  state.band.funds -= contract.signingBonus;
  state.band.basePopularity = clamp(state.band.basePopularity - 3);
  state.history.push({
    id: `contract-breach-${completedMonth}-${contract.kind}`,
    month: completedMonth,
    type: "contract",
    title: `${contract.title}违约`,
    description: `返还签约金 ¥${contract.signingBonus.toLocaleString("zh-CN")}，基础人气 -3。`,
  });
  state.activeContract = null;
  return `未能按期完成发行义务，已返还签约金并失去部分人气。`;
}

export function advanceMonth(state: GameState): MonthAdvanceResult {
  if (state.status !== "active") {
    return {
      state,
      summary: {
        completedMonth: state.calendar.completedMonths,
        unusedActionPoints: state.month.actionPointsRemaining,
        operatingCost: 0,
        playerStatusRecoveredBy: 0,
        teammateStatusRecoveredBy: 0,
        popularityDecay: 0,
        fundsBeforeSettlement: state.band.funds,
        fundsAfterSettlement: state.band.funds,
        autoSaveDue: false,
        gameEnded: true,
        contractMessage: null,
        newVenueLevel: null,
      },
    };
  }

  const nextState = cloneGameState(state);
  const venueLevelBeforeSettlement = nextState.band.unlockedVenueLevel;
  const completedMonth = nextState.calendar.completedMonths + 1;
  const unusedActionPoints = nextState.month.actionPointsRemaining;
  const player = selectPlayer(nextState);
  const playerStatusBefore = player.status;
  player.status = shiftStatus(player.status, unusedActionPoints);

  for (const teammate of nextState.members.filter((member) => !member.isPlayer)) {
    teammate.status = shiftStatus(teammate.status, 1);
  }

  const fundsBeforeSettlement = nextState.band.funds;
  nextState.band.funds -= MONTHLY_OPERATING_COST;

  let popularityDecay = 0;
  if (nextState.month.hadPublicActivity) {
    nextState.band.publicInactivityMonths = 0;
  } else {
    nextState.band.publicInactivityMonths += 1;
    if (nextState.band.publicInactivityMonths >= 4) {
      const before = nextState.band.basePopularity;
      nextState.band.basePopularity = clamp(before - 1);
      popularityDecay = before - nextState.band.basePopularity;
    }
  }

  const contractMessage = settleContract(nextState, completedMonth);
  settleFinancialCrisis(nextState);
  settleBelongingCrises(nextState);
  updateVenueUnlocks(nextState);

  if (nextState.eventHistory.length > 0 && nextState.pendingEvent === null) {
    nextState.eventCooldownMonths += 1;
  }
  for (const [eventId, months] of Object.entries(nextState.eventCooldowns)) {
    const remaining = Math.max(0, months - 1);
    if (remaining === 0) {
      delete nextState.eventCooldowns[eventId];
    } else {
      nextState.eventCooldowns[eventId] = remaining;
    }
  }

  nextState.calendar.completedMonths = completedMonth;
  if (completedMonth % 12 === 0) {
    nextState.members.forEach((member) => {
      member.age += 1;
    });
  }
  nextState.calendar.year = Math.floor(completedMonth / 12) + 1;
  nextState.calendar.month = (completedMonth % 12) + 1;

  if (
    nextState.status === "active" &&
    completedMonth >= nextState.calendar.maxMonths
  ) {
    nextState.status = "ended";
    nextState.endingReason = "twentiethAnniversary";
  }

  const autoSaveDue = completedMonth % 12 === 0;
  nextState.history.push({
    id: `month-${completedMonth}`,
    month: completedMonth,
    type: "month",
    title: `第 ${completedMonth} 个月结束`,
    description: `运营费 ¥${MONTHLY_OPERATING_COST.toLocaleString(
      "zh-CN",
    )}，月末资金 ¥${nextState.band.funds.toLocaleString("zh-CN")}。`,
  });

  if (nextState.status === "active") {
    nextState.month = {
      actionPointsRemaining: MONTHLY_ACTION_POINTS,
      usedActions: [],
      hadPublicActivity: false,
      feedback: [],
      eventPrepared: false,
      opportunitiesPrepared: false,
      opportunitiesAcknowledged: false,
      performanceInvitations: [],
      commercialOffers: [],
      contractOffers: [],
    };
  }

  const statusOrder = ["excellent", "good", "normal", "tired", "awful"];
  const playerStatusRecoveredBy = Math.max(
    0,
    statusOrder.indexOf(playerStatusBefore) - statusOrder.indexOf(player.status),
  );

  const finalState =
    nextState.status === "ended" &&
    nextState.endingReason &&
    nextState.endingSummary === null
      ? finishCareer(nextState, nextState.endingReason)
      : nextState;

  return {
    state: finalState,
    summary: {
      completedMonth,
      unusedActionPoints,
      operatingCost: MONTHLY_OPERATING_COST,
      playerStatusRecoveredBy,
      teammateStatusRecoveredBy: 1,
      popularityDecay,
      fundsBeforeSettlement,
      fundsAfterSettlement: finalState.band.funds,
      autoSaveDue,
      gameEnded: finalState.status === "ended",
      contractMessage,
      newVenueLevel:
        finalState.band.unlockedVenueLevel > venueLevelBeforeSettlement
          ? finalState.band.unlockedVenueLevel
          : null,
    },
  };
}
