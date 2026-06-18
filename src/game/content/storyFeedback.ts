import type { Feedback, GameEvent } from "../types";

export function isStoryEvent(event: GameEvent): boolean {
  const category = event.category ?? "anchor";
  return category === "anchor" || category === "fallback";
}

export function createStoryEventFeedback(event: GameEvent): Feedback {
  return {
    title: event.title,
    body: event.body
  };
}
