import { ACTIONS, type ActionId } from "../content/actions";
import { FEEDBACK } from "../content/feedback";
import type { Feedback, GameState } from "../types";
import { applyEffects } from "./effects";
import { createRecording } from "./recording";

export interface PerformedAction {
  state: GameState;
  feedback: Feedback;
}

const RECORDING_COST = 300;
const DIMINISHED_RECOVERY_EFFECTS = [{ kind: "playerStat" as const, key: "stamina" as const, amount: 0 }];

function incrementActionCount(state: GameState, actionId: ActionId): GameState {
  return {
    ...state,
    monthly: {
      ...state.monthly,
      actionCounts: {
        ...state.monthly.actionCounts,
        [actionId]: (state.monthly.actionCounts[actionId] ?? 0) + 1
      }
    }
  };
}

export function performAction(state: GameState, actionId: ActionId): PerformedAction {
  const action = ACTIONS[actionId];
  const count = state.monthly.actionCounts[actionId] ?? 0;
  const dynamicEffects = [...action.effects];
  if (actionId === "record") {
    const target = state.works.find((work) => work.stage === "song" && work.rehearsal >= 30);
    if (!target) {
      return { state, feedback: FEEDBACK.noRecordableWork };
    }
    if (state.band.funds < RECORDING_COST) {
      return { state, feedback: FEEDBACK.insufficientFunds };
    }
    dynamicEffects.push({ kind: "addRecording" as const, recording: createRecording(state, target.id) });
  }
  const fullEffects = [{ kind: "playerStat" as const, key: "stamina" as const, amount: -action.staminaCost }, ...dynamicEffects];
  const isDiminishedRest = actionId === "rest" && count >= 2;
  const isDiminishedBandRest = actionId === "band_rest" && count >= 1;
  const effects = isDiminishedRest || isDiminishedBandRest ? DIMINISHED_RECOVERY_EFFECTS : fullEffects;
  const next = incrementActionCount(applyEffects(state, effects), actionId);
  if (isDiminishedRest) return { state: next, feedback: FEEDBACK.restDiminished };
  if (isDiminishedBandRest) return { state: next, feedback: FEEDBACK.bandRestDiminished };
  return { state: next, feedback: FEEDBACK[actionId] };
}
