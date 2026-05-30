import { describe, expect, it } from "vitest";
import { createInitialState } from "./createInitialState";

describe("createInitialState", () => {
  it("creates writer route stats from the data spec", () => {
    const state = createInitialState("writer");

    expect(state.month).toBe("2027-05");
    expect(state.route).toBe("writer");
    expect(state.player.creativity).toBe(62);
    expect(state.player.stress).toBe(28);
    expect(state.player.stamina).toBe(100);
    expect(state.band.funds).toBe(1200);
    expect(state.relationships.vocal).toBe(46);
    expect(state.monthly.actionCounts).toEqual({});
    expect(state.counters.overdraftActions).toBe(0);
    expect(state.equipment.guitar.name).toBe("二手 Jazzmaster");
  });
});
