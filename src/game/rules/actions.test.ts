import { describe, expect, it } from "vitest";
import { createInitialState } from "../state/createInitialState";
import { performAction } from "./actions";

describe("performAction", () => {
  it("practice guitar consumes stamina, improves technique, and returns feedback", () => {
    const state = createInitialState("writer");
    const result = performAction(state, "practice");

    expect(result.state.player.stamina).toBe(85);
    expect(result.state.player.technique).toBe(45);
    expect(result.feedback.title).toBe("练到指尖发烫");
  });

  it("rest only gives full benefits twice per month", () => {
    let state = createInitialState("writer");
    state.player.stamina = 40;

    state = performAction(state, "rest").state;
    state = performAction(state, "rest").state;
    state = performAction(state, "rest").state;

    expect(state.monthly.actionCounts.rest).toBe(3);
    expect(state.player.stamina).toBe(90);
  });
});
