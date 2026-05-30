import { EVENTS } from "../content/events";
import type { EventTrigger, GameEvent, GameState } from "../types";

export function triggerMatches(state: GameState, trigger: EventTrigger): boolean {
  if (trigger.months && !trigger.months.includes(state.month)) return false;
  if (trigger.flagsAll?.some((flag) => !state.flags[flag])) return false;
  if (trigger.flagsNone?.some((flag) => state.flags[flag])) return false;
  if (trigger.hasRiff && state.riffs.length === 0) return false;
  if (trigger.hasCompletedSong && !state.works.some((work) => work.stage === "song")) return false;
  if (trigger.hasDemo && !state.recordings.some((recording) => recording.type === "demo")) return false;
  if (trigger.minRecordings && state.recordings.length < trigger.minRecordings) return false;
  if (trigger.minPlayer && Object.entries(trigger.minPlayer).some(([key, value]) => state.player[key as keyof typeof state.player] < value!)) return false;
  if (trigger.maxPlayer && Object.entries(trigger.maxPlayer).some(([key, value]) => state.player[key as keyof typeof state.player] > value!)) return false;
  if (trigger.minBand && Object.entries(trigger.minBand).some(([key, value]) => state.band[key as keyof typeof state.band] < value!)) return false;
  if (
    trigger.minRelationship &&
    Object.entries(trigger.minRelationship).some(([key, value]) => state.relationships[key as keyof typeof state.relationships] < value!)
  ) {
    return false;
  }
  return true;
}

export function getAvailableEvents(state: GameState): GameEvent[] {
  return EVENTS.filter((event) => triggerMatches(state, event.trigger)).sort((a, b) => b.priority - a.priority);
}
