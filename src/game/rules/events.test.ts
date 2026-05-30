import { describe, expect, it } from "vitest";
import { createInitialState } from "../state/createInitialState";
import { getAvailableEvents, triggerMatches } from "./events";

describe("event triggers", () => {
  it("matches the prologue rehearsal event in 2027-05", () => {
    const state = createInitialState("writer");
    const events = getAvailableEvents(state);

    expect(events[0].id).toBe("prologue.rehearsal_argument");
  });

  it("treats falsy flag values as present for flagsAll", () => {
    const state = createInitialState("writer");

    for (const value of [false, 0, ""] as const) {
      const flag = `flag.all.${typeof value}`;
      state.flags[flag] = value;

      expect(triggerMatches(state, { flagsAll: [flag] })).toBe(true);
    }
  });

  it("treats falsy flag values as present for flagsNone", () => {
    const state = createInitialState("writer");

    for (const value of [false, 0, ""] as const) {
      const flag = `flag.none.${typeof value}`;
      state.flags[flag] = value;

      expect(triggerMatches(state, { flagsNone: [flag] })).toBe(false);
    }
  });

  it("excludes the prologue event when its done flag is present", () => {
    const state = createInitialState("writer");
    state.flags["prologue.rehearsalArgumentDone"] = false;

    expect(getAvailableEvents(state).map((event) => event.id)).not.toContain("prologue.rehearsal_argument");
  });

  it("sorts the prologue event before the livehouse offer when both are available", () => {
    const state = createInitialState("writer");
    state.flags["career.hasLivehouseOffer"] = false;

    expect(getAvailableEvents(state).map((event) => event.id).slice(0, 2)).toEqual([
      "prologue.rehearsal_argument",
      "career.first_livehouse_offer"
    ]);
  });

  it("supports stat and relationship threshold predicates", () => {
    const state = createInitialState("writer");

    expect(
      triggerMatches(state, {
        minPlayer: { creativity: 62 },
        maxPlayer: { stress: 28 },
        minBand: { cohesion: 52 },
        minRelationship: { bass: 54 }
      })
    ).toBe(true);
    expect(triggerMatches(state, { minPlayer: { creativity: 63 } })).toBe(false);
    expect(triggerMatches(state, { maxPlayer: { stress: 27 } })).toBe(false);
    expect(triggerMatches(state, { minBand: { cohesion: 53 } })).toBe(false);
    expect(triggerMatches(state, { minRelationship: { bass: 55 } })).toBe(false);
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
