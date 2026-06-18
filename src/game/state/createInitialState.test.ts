import { describe, expect, it } from "vitest";
import { createInitialState } from "./createInitialState";

describe("createInitialState", () => {
  it("creates writer route stats from the data spec", () => {
    const state = createInitialState("writer");

    expect(state.bandName).toBe("未命名乐队");
    expect(state.month).toBe("2027-05");
    expect(state.route).toBe("writer");
    expect(state.player.creativity).toBe(62);
    expect(state.player.stress).toBe(28);
    expect(state.player.stamina).toBe(100);
    expect(state.band.funds).toBe(1200);
    expect(state.relationships.vocal).toBe(46);
    expect(state.memberStates.vocal).toEqual({
      status: "active",
      note: "林夏把旋律拉到台前，也在等乐队证明彼此值得信任。",
      updatedAt: "2027-05"
    });
    expect(state.memberStates.bass).toEqual({
      status: "active",
      note: "周航像队内的秤，习惯先稳住所有人的重量。",
      updatedAt: "2027-05"
    });
    expect(state.memberStates.drums).toEqual({
      status: "active",
      note: "唐野总是最先听出大家有没有散掉。",
      updatedAt: "2027-05"
    });
    expect(state.abilityProgress).toEqual({ technique: 0, creativity: 0, stage: 0 });
    expect(state.monthly.actionCounts).toEqual({});
    expect(state.monthly.abilityProgressGains).toEqual({ technique: 0, creativity: 0, stage: 0 });
    expect(state.counters.overdraftActions).toBe(0);
    expect(state.equipment.guitar.name).toBe("二手 Jazzmaster");
    expect(state.phase).toBe("campus");
    expect(state.careerStage).toBe("campus");
    expect(state.eventLog).toEqual([]);
    expect(state.eventCooldowns).toEqual({});
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

  it("stores a trimmed custom band name", () => {
    const state = createInitialState("writer", "  海边回声  ");

    expect(state.bandName).toBe("海边回声");
  });
});
