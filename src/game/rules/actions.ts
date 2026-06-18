import { ACTIONS, type ActionId } from "../content/actions";
import { FEEDBACK } from "../content/feedback";
import type { Effect, Feedback, GameState } from "../types";
import { applyEffects } from "./effects";
import { getNegotiatedPerformanceEventId } from "./performanceOpportunities";
import { createRecording } from "./recording";
import { createReleaseEffects, hasReleasableRecordings } from "./release";

export interface PerformedAction {
  state: GameState;
  feedback: Feedback;
}

const RECORDING_COST = 300;
const DIMINISHED_RECOVERY_EFFECTS = [{ kind: "playerStat" as const, key: "stamina" as const, amount: 0 }];
const MEMBER_SENSITIVE_ACTIONS = new Set<ActionId>(["rehearse", "band_write", "record", "perform"]);

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

function getMemberPressureEffects(state: GameState, actionId: ActionId): Effect[] {
  if (!MEMBER_SENSITIVE_ACTIONS.has(actionId)) return [];

  const statuses = Object.values(state.memberStates).map((member) => member.status);
  const awayCount = statuses.filter((status) => status === "away").length;
  const strainedCount = statuses.filter((status) => status === "strained").length;
  if (awayCount === 0 && strainedCount === 0) return [];

  return [
    { kind: "bandStat", key: "cohesion", amount: awayCount * -3 + strainedCount * -1 },
    { kind: "playerStat", key: "stress", amount: awayCount * 4 + strainedCount * 2 }
  ];
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
  if (actionId === "release") {
    if (!hasReleasableRecordings(state)) {
      return { state, feedback: FEEDBACK.noReleasableRecording };
    }
    dynamicEffects.push(...createReleaseEffects(state));
  }
  if (actionId === "negotiate") {
    const eventId = getNegotiatedPerformanceEventId(state);
    if (eventId && !state.queuedEvents.includes(eventId)) {
      dynamicEffects.push({ kind: "queueEvent" as const, eventId });
    }
  }
  dynamicEffects.push(...getMemberPressureEffects(state, actionId));
  const fullEffects = [{ kind: "playerStat" as const, key: "stamina" as const, amount: -action.staminaCost }, ...dynamicEffects];
  const isDiminishedRest = actionId === "rest" && count >= 2;
  const isDiminishedBandRest = actionId === "band_rest" && count >= 1;
  const effects = isDiminishedRest || isDiminishedBandRest ? DIMINISHED_RECOVERY_EFFECTS : fullEffects;
  const next = incrementActionCount(applyEffects(state, effects), actionId);
  if (isDiminishedRest) return { state: next, feedback: FEEDBACK.restDiminished };
  if (isDiminishedBandRest) return { state: next, feedback: FEEDBACK.bandRestDiminished };
  return { state: next, feedback: FEEDBACK[actionId] };
}
