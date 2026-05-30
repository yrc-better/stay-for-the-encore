import { describe, expect, it } from "vitest";
import { createInitialState } from "../state/createInitialState";
import { getAvailableEvents, triggerMatches } from "./events";

describe("event triggers", () => {
  it("matches the prologue rehearsal event in 2027-05", () => {
    const state = createInitialState("writer");
    const events = getAvailableEvents(state);

    expect(events[0].id).toBe("prologue.rehearsal_argument");
  });

  it("supports hasDemo and minRecordings predicates", () => {
    const state = createInitialState("writer");
    state.recordings.push({
      id: "recording.1",
      createdAt: "2027-08",
      workId: "work.1",
      type: "demo",
      quality: 45,
      rawness: 55,
      released: false
    });

    expect(triggerMatches(state, { hasDemo: true, minRecordings: 1 })).toBe(true);
    expect(triggerMatches(state, { minRecordings: 2 })).toBe(false);
  });
});
