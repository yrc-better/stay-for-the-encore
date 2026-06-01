import { useMemo, useState } from "react";
import type { ActionId } from "../content/actions";
import type { EndingTrigger } from "../config/endingRules";
import { performAction } from "../rules/actions";
import { applyEffects } from "../rules/effects";
import { evaluateEnding, type EndingResult } from "../rules/ending";
import { getAvailableEvents } from "../rules/events";
import { createInitialState } from "../state/createInitialState";
import { advanceMonth } from "../state/month";
import { clearSave, loadSave, saveGame } from "../storage/saveGame";
import type { Feedback, GameState, RouteId } from "../types";

export function useGameController() {
  const loaded = useMemo(() => loadSave(), []);
  const [state, setState] = useState<GameState | null>(loaded?.state ?? null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [ending, setEnding] = useState<EndingResult | null>(null);
  const activeEvent = useMemo(() => (state ? getAvailableEvents(state)[0] ?? null : null), [state]);

  function start(route: RouteId, bandName?: string) {
    const next = createInitialState(route, bandName);
    saveGame(next);
    setState(next);
    setFeedback(null);
    setEnding(null);
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
    const next = advanceMonth(state);
    saveGame(next);
    setState(next);
  }

  function chooseEvent(choiceId: string) {
    if (!state || !activeEvent) return;
    const choice = activeEvent.choices.find((candidate) => candidate.id === choiceId);
    if (!choice) return;

    const next = applyEffects(state, choice.effects);
    saveGame(next);
    setState(next);
    setFeedback(choice.feedback);
  }

  function showEnding(trigger: EndingTrigger) {
    if (!state) return;
    setEnding(evaluateEnding(state, trigger));
  }

  function reset() {
    clearSave();
    setState(null);
    setFeedback(null);
    setEnding(null);
  }

  return {
    state,
    activeEvent,
    feedback,
    ending,
    start,
    act,
    chooseEvent,
    nextMonth,
    showEnding,
    closeFeedback: () => setFeedback(null),
    closeEnding: () => setEnding(null),
    reset
  };
}
