import type { EventCategory, GameEvent, GameState } from "../types";
import { triggerMatches } from "./eventTriggers";

export interface EventSelectionOptions {
  random?: () => number;
  maxRandomEvents?: number;
  maxEvents?: number;
}

export const MAX_EVENTS_PER_MONTH = 5;

export function getEventCategory(event: GameEvent): EventCategory {
  return event.category ?? "anchor";
}

function getResolvedEventCountThisMonth(state: GameState): number {
  return state.eventLog.filter((entry) => entry.month === state.month).length;
}

export function getRemainingMonthlyEventSlots(state: GameState, maxEvents = MAX_EVENTS_PER_MONTH): number {
  return Math.max(0, maxEvents - getResolvedEventCountThisMonth(state));
}

function eventWasSeen(state: GameState, eventId: string): boolean {
  return state.eventLog.some((entry) => entry.id === eventId);
}

function eventMatchesMetadata(state: GameState, event: GameEvent): boolean {
  if (event.phase && event.phase !== state.phase) return false;
  if (event.careerStages && !event.careerStages.includes(state.careerStage)) return false;
  if (event.routes && !event.routes.includes(state.route)) return false;
  if ((state.eventCooldowns[event.id] ?? 0) > 0) return false;
  if ((event.once || event.repeatable === false) && eventWasSeen(state, event.id)) return false;
  return true;
}

export function eventMatchesState(state: GameState, event: GameEvent): boolean {
  return eventMatchesMetadata(state, event) && triggerMatches(state, event.trigger);
}

function getWeight(state: GameState, event: GameEvent): number {
  const baseWeight = Math.max(0, event.weight ?? 1);
  if (!event.tags.includes("member")) return baseWeight;

  const matchingStatusBoost = event.tags.some((tag) => {
    if (tag === "vocal" || tag === "bass" || tag === "drums") {
      return state.memberStates[tag].status === "strained" || state.memberStates[tag].status === "away";
    }
    return false;
  });

  return matchingStatusBoost ? baseWeight * 2 : baseWeight;
}

function pickWeightedEvent(state: GameState, events: GameEvent[], random: () => number): GameEvent | null {
  const totalWeight = events.reduce((sum, event) => sum + getWeight(state, event), 0);
  if (totalWeight <= 0) return null;

  let threshold = random() * totalWeight;
  for (const event of events) {
    threshold -= getWeight(state, event);
    if (threshold <= 0) return event;
  }

  return events.at(-1) ?? null;
}

function removeEvent(events: GameEvent[], eventId: string): GameEvent[] {
  return events.filter((event) => event.id !== eventId);
}

export function selectMonthlyEventIds(
  state: GameState,
  events: GameEvent[],
  { random = Math.random, maxRandomEvents = 1, maxEvents = MAX_EVENTS_PER_MONTH }: EventSelectionOptions = {}
): string[] {
  const availableSlots = getRemainingMonthlyEventSlots(state, maxEvents);
  if (availableSlots <= 0) return [];

  const matchingEvents = events.filter((event) => eventMatchesState(state, event));
  const anchorIds = matchingEvents
    .filter((event) => getEventCategory(event) === "anchor" || getEventCategory(event) === "fallback")
    .sort((a, b) => b.priority - a.priority)
    .map((event) => event.id)
    .slice(0, availableSlots);
  let randomCandidates = matchingEvents.filter((event) => {
    const category = getEventCategory(event);
    return category === "random" || category === "rare";
  });
  const selectedRandomIds: string[] = [];
  const randomSlots = Math.max(0, Math.min(maxRandomEvents, availableSlots - anchorIds.length));

  for (let index = 0; index < randomSlots; index += 1) {
    const selected = pickWeightedEvent(state, randomCandidates, random);
    if (!selected) break;
    selectedRandomIds.push(selected.id);
    randomCandidates = removeEvent(randomCandidates, selected.id);
  }

  return [...anchorIds, ...selectedRandomIds];
}
