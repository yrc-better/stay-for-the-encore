import { describe, expect, it } from "vitest";
import { createInitialState } from "./createInitialState";
import { advanceMonth, getEffectiveStaminaCap } from "./month";

describe("month advancement", () => {
  it("recovers stamina, clears monthly counters, and moves to the next month", () => {
    const state = createInitialState("writer");
    state.player.stamina = 20;
    state.monthly.actionCounts.rest = 2;
    state.monthly.riskEventsThisMonth = 1;

    const next = advanceMonth(state);

    expect(next.month).toBe("2027-06");
    expect(next.player.stamina).toBe(100);
    expect(next.monthly.actionCounts).toEqual({});
    expect(next.monthly.riskEventsThisMonth).toBe(0);
  });

  it("uses effective stamina cap when health is low", () => {
    const state = createInitialState("writer");
    state.player.health = 35;
    state.player.stamina = 50;

    const next = advanceMonth(state);

    expect(next.monthly.staminaCapPenalty).toBe(10);
    expect(getEffectiveStaminaCap(next)).toBe(90);
    expect(next.player.stamina).toBe(90);
  });
});
