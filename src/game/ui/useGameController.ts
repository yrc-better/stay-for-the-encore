import { useMemo, useState } from "react";
import type { ActionId } from "../content/actions";
import type { EndingTrigger } from "../config/endingRules";
import { performAction } from "../rules/actions";
import { evaluateEnding, type EndingResult } from "../rules/ending";
import { createInitialState } from "../state/createInitialState";
import { advanceMonth } from "../state/month";
import { clearSave, loadSave, saveGame } from "../storage/saveGame";
import type { Feedback, GameState, RouteId } from "../types";

export function useGameController() {
  const loaded = useMemo(() => loadSave(), []);
  const [state, setState] = useState<GameState | null>(loaded?.state ?? null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [ending, setEnding] = useState<EndingResult | null>(null);

  function start(route: RouteId) {
    const next = createInitialState(route);
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
    feedback,
    ending,
    start,
    act,
    nextMonth,
    showEnding,
    closeFeedback: () => setFeedback(null),
    closeEnding: () => setEnding(null),
    reset
  };
}
