import { describe, expect, it } from "vitest";
import type { GameEvent } from "../types";
import { createStoryEventFeedback, isStoryEvent } from "./storyFeedback";

function event(category: GameEvent["category"]): GameEvent {
  return {
    id: `event.${category}`,
    title: "开放舞台的保底名额",
    tags: [],
    category,
    priority: 1,
    once: true,
    trigger: {},
    body: "没有后台，没有报酬，只有十分钟和一盏很低的灯。",
    choices: []
  };
}

describe("storyFeedback", () => {
  it("treats fallback opportunities as story events without adding a title prefix", () => {
    const fallback = event("fallback");

    expect(isStoryEvent(fallback)).toBe(true);
    expect(createStoryEventFeedback(fallback).title).toBe("开放舞台的保底名额");
  });

  it("does not treat ordinary random events as story events", () => {
    expect(isStoryEvent(event("random"))).toBe(false);
  });
});
