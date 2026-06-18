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

  it("turns positive core ability gains into long-term progress", () => {
    const state = createInitialState("writer");

    const next = applyEffects(state, [{ kind: "playerStat", key: "creativity", amount: 6 }]);

    expect(next.player.creativity).toBe(62);
    expect(next.abilityProgress.creativity).toBe(6);
    expect(next.monthly.abilityProgressGains.creativity).toBe(6);
  });

  it("keeps non-ability player stats immediate", () => {
    const state = createInitialState("writer");

    const next = applyEffects(state, [{ kind: "playerStat", key: "fame", amount: 3 }]);

    expect(next.player.fame).toBe(9);
    expect(next.abilityProgress).toEqual({ technique: 0, creativity: 0, stage: 0 });
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

  it("adds a release and marks included recordings as released", () => {
    const state = createInitialState("writer");
    state.recordings.push(
      {
        id: "recording.1",
        createdAt: "2027-08",
        workId: "work.1",
        type: "demo",
        quality: 62,
        rawness: 38,
        released: false
      },
      {
        id: "recording.2",
        createdAt: "2027-08",
        workId: "work.2",
        type: "demo",
        quality: 58,
        rawness: 42,
        released: false
      }
    );

    const next = applyEffects(state, [
      {
        kind: "addRelease",
        release: {
          type: "single",
          title: "雨后的失真",
          recordingIds: ["recording.1"],
          sales: 120,
          criticalScore: 64,
          fameImpact: 4,
          awards: []
        }
      }
    ]);

    expect(next.releases).toHaveLength(1);
    expect(next.releases[0].id).toBe("release.1");
    expect(next.recordings[0].released).toBe(true);
    expect(next.recordings[0].type).toBe("single");
    expect(next.recordings[1].released).toBe(false);
    expect(next.recordings[1].type).toBe("demo");
  });

  it("updates a member status with a month-stamped story note", () => {
    const state = createInitialState("writer");
    state.month = "2028-04";

    const next = applyEffects(state, [
      {
        kind: "memberStatus",
        character: "bass",
        status: "away",
        note: "周航把贝斯盒留在排练室门口，说自己需要先离开一阵。"
      }
    ]);

    expect(next.memberStates.bass).toEqual({
      status: "away",
      note: "周航把贝斯盒留在排练室门口，说自己需要先离开一阵。",
      updatedAt: "2028-04"
    });
    expect(next.memberStates.vocal.status).toBe("active");
  });
});
