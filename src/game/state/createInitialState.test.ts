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

  it("creates independent equipment tags and modifiers for each state", () => {
    const state = createInitialState("writer");

    state.equipment.guitar.tags.push("mutated");
    state.equipment.guitar.modifiers!.riffQuality = 99;
    state.equipment.pedals[0].tags.push("mutated-pedal");
    state.equipment.pedals[0].modifiers!.performanceStability = 99;

    const nextState = createInitialState("writer");

    expect(nextState.equipment.guitar.tags).toEqual(["noise", "alternative", "offset"]);
    expect(nextState.equipment.guitar.modifiers?.riffQuality).toBe(2);
    expect(nextState.equipment.pedals[0].tags).toEqual(["drive"]);
    expect(nextState.equipment.pedals[0].modifiers?.performanceStability).toBe(1);
  });
});
