import { EVENTS } from "../content/events";
import type { GameEvent, GameState } from "../types";
import { eventMatchesState } from "./eventSelection";
import { triggerMatches } from "./eventTriggers";

export { triggerMatches };

function getEventById(eventId: string): GameEvent | undefined {
  return EVENTS.find((event) => event.id === eventId);
}

function getQueuedEvents(state: GameState): GameEvent[] {
  return state.queuedEvents
    .map(getEventById)
    .filter((event): event is GameEvent => Boolean(event))
    .filter((event) => eventMatchesState(state, event));
}

export function getAvailableEvents(state: GameState): GameEvent[] {
  const queuedEvents = getQueuedEvents(state);
  if (queuedEvents.length > 0) return queuedEvents;

  return EVENTS.filter((event) => eventMatchesState(state, event)).sort((a, b) => b.priority - a.priority);
}
