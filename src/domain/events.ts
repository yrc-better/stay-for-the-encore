import { cloneGameState } from "./clone";
import { clamp, shiftStatus } from "./formulas";
import { nextRandom, randomInteger } from "./rng";
import type {
  EventEffect,
  EventChoiceResolution,
  EventHistoryEntry,
  EventMemberTarget,
  EventOutcomeCandidate,
  EventResolutionResult,
  GameState,
  Member,
} from "./types";

function uniqueCandidateIds(candidateIds: readonly string[]): string[] {
  return [...new Set(candidateIds.map((id) => id.trim()).filter(Boolean))];
}

function triggerProbability(cooldownMonths: number): number {
  if (cooldownMonths < 3) {
    return 0;
  }
  if (cooldownMonths === 3) {
    return 0.5;
  }
  if (cooldownMonths === 4) {
    return 0.75;
  }
  return 1;
}

/**
 * Prepares at most one event for the current month. Content filtering stays in
 * the data/application layer: the domain only receives IDs that are eligible
 * for this month and selects one through the serializable RNG.
 */
export function prepareMonthEvent(
  state: GameState,
  candidateIds: readonly string[],
): GameState {
  if (
    state.status !== "active" ||
    state.pendingEvent !== null ||
    state.month.eventPrepared
  ) {
    return state;
  }

  const currentMonth = state.calendar.completedMonths + 1;
  const dueScheduled = state.scheduledEvents.find(
    (scheduled) =>
      scheduled.dueMonth <= currentMonth &&
      candidateIds.includes(scheduled.eventId),
  );
  const candidates = uniqueCandidateIds(candidateIds).filter(
    (eventId) =>
      !state.completedEventIds.includes(eventId) &&
      (state.eventCooldowns[eventId] ?? 0) <= 0,
  );
  if (candidates.length === 0) {
    return state;
  }

  const nextState = cloneGameState(state);
  nextState.month.eventPrepared = true;

  if (currentMonth <= 2) {
    return nextState;
  }

  if (dueScheduled) {
    nextState.pendingEvent = dueScheduled.eventId;
    return nextState;
  }

  const firstEvent = nextState.eventHistory.length === 0;
  let shouldTrigger = false;

  if (firstEvent) {
    const probability =
      currentMonth === 3 ? 0.5 : currentMonth === 4 ? 0.75 : 1;
    if (probability === 1) {
      shouldTrigger = true;
    } else {
      const roll = nextRandom(nextState.rng);
      nextState.rng = roll.rng;
      shouldTrigger = roll.value < probability;
    }
  } else {
    const probability = triggerProbability(nextState.eventCooldownMonths);
    if (probability === 0) {
      return nextState;
    }
    if (probability === 1) {
      shouldTrigger = true;
    } else {
      const roll = nextRandom(nextState.rng);
      nextState.rng = roll.rng;
      shouldTrigger = roll.value < probability;
    }
  }

  if (!shouldTrigger) {
    return nextState;
  }

  const selection = randomInteger(nextState.rng, 0, candidates.length - 1);
  nextState.rng = selection.rng;
  nextState.pendingEvent = candidates[selection.value];
  return nextState;
}

interface EventResolutionContext {
  randomBandmate: Member | null | undefined;
}

function resolveTargetMembers(
  state: GameState,
  target: EventMemberTarget,
  context: EventResolutionContext,
): Member[] {
  if (target === "all") {
    return state.members;
  }
  if (target === "leader") {
    return state.members.filter((member) => member.isPlayer);
  }
  if (target === "randomBandmate") {
    if (context.randomBandmate !== undefined) {
      return context.randomBandmate ? [context.randomBandmate] : [];
    }

    const teammates = state.members.filter((member) => !member.isPlayer);
    if (teammates.length === 0) {
      context.randomBandmate = null;
      return [];
    }
    const selection = randomInteger(state.rng, 0, teammates.length - 1);
    state.rng = selection.rng;
    context.randomBandmate = teammates[selection.value];
    return [context.randomBandmate];
  }
  if (target.startsWith("member:")) {
    const memberId = target.slice("member:".length);
    return state.members.filter((member) => member.id === memberId);
  }
  return state.members.filter((member) => member.role === target);
}

function applyEffect(
  state: GameState,
  effect: EventEffect,
  context: EventResolutionContext,
): void {
  switch (effect.type) {
    case "funds":
      state.band.funds += effect.amount;
      return;
    case "basePopularity":
      state.band.basePopularity = clamp(
        state.band.basePopularity + effect.amount,
      );
      if (effect.countsAsPublicActivity) {
        state.month.hadPublicActivity = true;
      }
      return;
    case "memberStat":
      for (const member of resolveTargetMembers(state, effect.target, context)) {
        member.stats[effect.stat] = clamp(
          member.stats[effect.stat] + effect.amount,
        );
      }
      return;
    case "status": {
      const direction = effect.direction === "improve" ? 1 : -1;
      for (const member of resolveTargetMembers(state, effect.target, context)) {
        member.status = shiftStatus(member.status, direction * effect.steps);
      }
      return;
    }
    case "storyTag":
      for (const member of resolveTargetMembers(
        state,
        effect.target ?? "leader",
        context,
      )) {
        if (effect.operation === "add") {
          if (!member.hiddenTags.includes(effect.tag)) {
            member.hiddenTags.push(effect.tag);
          }
        } else {
          member.hiddenTags = member.hiddenTags.filter(
            (tag) => tag !== effect.tag,
          );
        }
      }
  }
}

function selectWeightedOutcome(
  state: GameState,
  outcomes: readonly EventOutcomeCandidate[],
): EventOutcomeCandidate | null {
  const totalWeight = outcomes.reduce(
    (total, outcome) => total + Math.max(0, outcome.weight),
    0,
  );
  if (outcomes.length === 0 || totalWeight <= 0) {
    return null;
  }

  const roll = nextRandom(state.rng);
  state.rng = roll.rng;
  let cursor = roll.value * totalWeight;

  for (const outcome of outcomes) {
    cursor -= Math.max(0, outcome.weight);
    if (cursor < 0) {
      return outcome;
    }
  }

  return outcomes[outcomes.length - 1];
}

export function resolveEvent(
  state: GameState,
  resolution: EventChoiceResolution,
): EventResolutionResult {
  if (state.status !== "active") {
    return {
      ok: false,
      state,
      error: {
        code: "GAME_ENDED",
        message: "游戏已经结束，无法处理事件",
      },
    };
  }
  if (state.pendingEvent === null) {
    return {
      ok: false,
      state,
      error: {
        code: "NO_PENDING_EVENT",
        message: "当前没有待处理事件",
      },
    };
  }
  if (state.pendingEvent !== resolution.eventId) {
    return {
      ok: false,
      state,
      error: {
        code: "EVENT_MISMATCH",
        message: "提交的事件与当前待处理事件不一致",
      },
    };
  }

  const nextState = cloneGameState(state);
  const outcome = selectWeightedOutcome(nextState, resolution.outcomes);
  if (!outcome) {
    return {
      ok: false,
      state,
      error: {
        code: "NO_EVENT_OUTCOMES",
        message: "这个选择没有可结算的事件结果",
      },
    };
  }

  const context: EventResolutionContext = {
    randomBandmate: undefined,
  };
  for (const effect of outcome.effects) {
    applyEffect(nextState, effect, context);
  }

  const month = nextState.calendar.completedMonths + 1;
  const record: EventHistoryEntry = {
    eventId: resolution.eventId,
    month,
    choiceId: resolution.choiceId,
    outcomeId: outcome.id,
  };
  nextState.pendingEvent = null;
  nextState.eventCooldownMonths = 0;
  nextState.eventCooldowns[resolution.eventId] =
    resolution.cooldownMonths ?? 6;
  if (!resolution.repeatable) {
    nextState.completedEventIds.push(resolution.eventId);
  }
  nextState.scheduledEvents = nextState.scheduledEvents.filter(
    (scheduled) => scheduled.eventId !== resolution.eventId,
  );
  if (outcome.nextEventId) {
    nextState.scheduledEvents.push({
      eventId: outcome.nextEventId,
      dueMonth: month + Math.max(1, outcome.nextEventDelayMonths ?? 1),
      chainId: resolution.chainId ?? resolution.eventId,
    });
  }
  nextState.eventHistory.push(record);
  nextState.history.push({
    id: `event-${month}-${nextState.eventHistory.length}`,
    month,
    type: "event",
    title: resolution.eventTitle,
    description: `${resolution.choiceLabel}：${outcome.title}。${outcome.text}`,
  });

  return {
    ok: true,
    state: nextState,
    record,
  };
}
