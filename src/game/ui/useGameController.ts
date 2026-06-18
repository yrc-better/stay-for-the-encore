import { useMemo, useState } from "react";
import { EVENTS } from "../content/events";
import type { ActionId } from "../content/actions";
import { createRouteIntroFeedback } from "../content/routeIntro";
import { createStoryEventFeedback, isStoryEvent } from "../content/storyFeedback";
import type { EndingTrigger } from "../config/endingRules";
import { performAction } from "../rules/actions";
import { applyEffects } from "../rules/effects";
import { evaluateEnding, type EndingResult } from "../rules/ending";
import { getAvailableEvents } from "../rules/events";
import { getEventCategory, getRemainingMonthlyEventSlots, selectMonthlyEventIds } from "../rules/eventSelection";
import { createInitialState } from "../state/createInitialState";
import { advanceMonth } from "../state/month";
import { clearSave, hasStoredSave, loadSave, saveGame } from "../storage/saveGame";
import type { Feedback, GameEvent, GameState, RouteId } from "../types";

const FAREWELL_SHOW_EVENT_ID = "career.fallback.farewell_show";
const FAREWELL_SHOW_REQUESTED_FLAG = "career.farewellShowRequested";
const RETIREMENT_EVENT_ID = "career.fallback.retirement_night";
const RETIREMENT_REQUESTED_FLAG = "career.retirementRequested";

const ENDING_STORY_EVENTS: Partial<
  Record<EndingTrigger, { eventId: string; requestedFlag: string; resolvedFlag: string }>
> = {
  farewell: {
    eventId: FAREWELL_SHOW_EVENT_ID,
    requestedFlag: FAREWELL_SHOW_REQUESTED_FLAG,
    resolvedFlag: "career.farewellShowResolved"
  },
  retirement: {
    eventId: RETIREMENT_EVENT_ID,
    requestedFlag: RETIREMENT_REQUESTED_FLAG,
    resolvedFlag: "career.retirementResolved"
  }
};

function queueMonthlyEvents(state: GameState): GameState {
  return {
    ...state,
    queuedEvents: selectMonthlyEventIds(state, EVENTS)
  };
}

function queueRequestedStoryEvent(
  state: GameState,
  { eventId, requestedFlag }: { eventId: string; requestedFlag: string }
): GameState {
  return {
    ...state,
    flags: {
      ...state.flags,
      [requestedFlag]: true
    },
    queuedEvents: [eventId, ...state.queuedEvents.filter((queuedEventId) => queuedEventId !== eventId)]
  };
}

function resolveEvent(state: GameState, event: GameEvent): GameState {
  const resolved = {
    ...state,
    eventLog: [
      ...state.eventLog,
      {
        id: event.id,
        month: state.month,
        category: getEventCategory(event)
      }
    ],
    eventCooldowns: event.cooldownMonths
      ? { ...state.eventCooldowns, [event.id]: event.cooldownMonths }
      : state.eventCooldowns
  };
  const remainingQueuedEvents = state.queuedEvents.filter((eventId) => eventId !== event.id);
  const anchorIds = selectMonthlyEventIds({ ...resolved, queuedEvents: [] }, EVENTS, { maxRandomEvents: 0 }).filter(
    (eventId) => !remainingQueuedEvents.includes(eventId)
  );
  const remainingSlots = getRemainingMonthlyEventSlots(resolved);

  return {
    ...resolved,
    queuedEvents: [...anchorIds, ...remainingQueuedEvents].slice(0, remainingSlots)
  };
}

export function useGameController() {
  const loaded = useMemo(() => {
    const hadStoredSave = hasStoredSave();
    const save = loadSave();
    return {
      save,
      saveRecoveryMessage: hadStoredSave && !save ? "存档已损坏，已回到新游戏。" : null
    };
  }, []);
  const [state, setState] = useState<GameState | null>(loaded.save?.state ?? null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [ending, setEnding] = useState<EndingResult | null>(null);
  const [pendingEnding, setPendingEnding] = useState<EndingResult | null>(null);
  const [dismissedStoryEventIds, setDismissedStoryEventIds] = useState<string[]>([]);
  const activeEvent = useMemo(() => {
    if (!state || state.queuedEvents.length === 0 || getRemainingMonthlyEventSlots(state) <= 0) return null;
    return getAvailableEvents(state)[0] ?? null;
  }, [state]);
  const activeStoryEvent =
    activeEvent && isStoryEvent(activeEvent) && !dismissedStoryEventIds.includes(activeEvent.id) ? activeEvent : null;
  const visibleFeedback = feedback ?? (activeStoryEvent ? createStoryEventFeedback(activeStoryEvent) : null);

  function start(route: RouteId, bandName?: string) {
    const next = queueMonthlyEvents(createInitialState(route, bandName));
    saveGame(next);
    setState(next);
    setFeedback(createRouteIntroFeedback(route, next.bandName));
    setEnding(null);
    setDismissedStoryEventIds([]);
  }

  function act(actionId: ActionId) {
    if (!state) return;
    const result = performAction(state, actionId);
    saveGame(result.state);
    setState(result.state);
    setFeedback(result.feedback);
  }

  function nextMonth() {
    if (!state) return;
    const next = queueMonthlyEvents(advanceMonth(state));
    saveGame(next);
    setState(next);
  }

  function chooseEvent(choiceId: string) {
    if (!state || !activeEvent) return;
    const choice = activeEvent.choices.find((candidate) => candidate.id === choiceId);
    if (!choice) return;

    const next = resolveEvent(applyEffects(state, choice.effects), activeEvent);
    saveGame(next);
    setState(next);
    setFeedback(choice.feedback);
    setPendingEnding(choice.endingTrigger ? evaluateEnding(next, choice.endingTrigger) : null);
  }

  function showEnding(trigger: EndingTrigger) {
    if (!state) return;
    const endingStoryEvent = ENDING_STORY_EVENTS[trigger];
    if (endingStoryEvent && state.flags[endingStoryEvent.resolvedFlag] === undefined) {
      const next = queueRequestedStoryEvent(state, endingStoryEvent);
      saveGame(next);
      setState(next);
      setFeedback(null);
      setEnding(null);
      setPendingEnding(null);
      setDismissedStoryEventIds((eventIds) => eventIds.filter((eventId) => eventId !== endingStoryEvent.eventId));
      return;
    }
    setEnding(evaluateEnding(state, trigger));
  }

  function reset() {
    clearSave();
    setState(null);
    setFeedback(null);
    setEnding(null);
    setPendingEnding(null);
    setDismissedStoryEventIds([]);
  }

  function closeFeedback() {
    if (feedback) {
      setFeedback(null);
      if (pendingEnding) {
        setEnding(pendingEnding);
        setPendingEnding(null);
      }
      return;
    }
    if (activeStoryEvent) {
      setDismissedStoryEventIds((eventIds) =>
        eventIds.includes(activeStoryEvent.id) ? eventIds : [...eventIds, activeStoryEvent.id]
      );
    }
  }

  return {
    state,
    activeEvent,
    feedback: visibleFeedback,
    ending,
    saveRecoveryMessage: loaded.saveRecoveryMessage,
    start,
    act,
    chooseEvent,
    nextMonth,
    showEnding,
    closeFeedback,
    closeEnding: () => setEnding(null),
    reset
  };
}
