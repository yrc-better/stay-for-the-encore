import { describe, expect, it } from "vitest";
import { createInitialState } from "../state/createInitialState";
import { applyEffects } from "./effects";

describe("applyEffects", () => {
  it("clamps stats and increments overdraft counter when stamina goes below zero", () => {
    const state = createInitialState("writer");
    state.player.stamina = 10;

    const next = applyEffects(state, [{ kind: "playerStat", key: "stamina", amount: -35 }]);

    expect(next.player.stamina).toBe(-25);
    expect(next.counters.overdraftActions).toBe(1);
  });

  it("adds riffs and queues history entries with generated ids", () => {
    const state = createInitialState("writer");

    const next = applyEffects(state, [
      { kind: "addRiff", riff: { titleSeed: "雨后的失真", quality: 24, styleTags: ["delay"], source: "write_riff" } },
      {
        kind: "addHistory",
        entry: { type: "event", title: "练习室夜谈", description: "主唱没有离开。", weight: 2, tags: ["member"] }
      }
    ]);

    expect(next.riffs).toHaveLength(1);
    expect(next.riffs[0].id).toBe("riff.1");
    expect(next.riffs[0].createdAt).toBe("2027-05");
    expect(next.history[0].id).toBe("history.1");
    expect(next.history[0].month).toBe("2027-05");
  });

  it("clamps normalized band stats to 100", () => {
    const state = createInitialState("writer");

    const next = applyEffects(state, [{ kind: "bandStat", key: "cohesion", amount: 1000 }]);

    expect(next.band.cohesion).toBe(100);
  });

  it("keeps money-like band stats non-negative", () => {
    const state = createInitialState("writer");

    const next = applyEffects(state, [{ kind: "bandStat", key: "funds", amount: -5000 }]);

    expect(next.band.funds).toBe(0);
  });
});
