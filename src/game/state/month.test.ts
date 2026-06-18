import { describe, expect, it } from "vitest";
import { createInitialState } from "./createInitialState";
import { advanceMonth, getEffectiveStaminaCap } from "./month";

describe("month advancement", () => {
  it("recovers stamina, clears monthly counters, and moves to the next month", () => {
    const state = createInitialState("writer");
    state.player.stamina = 20;
    state.monthly.actionCounts.rest = 2;
    state.monthly.riskEventsThisMonth = 1;
    state.monthly.abilityProgressGains.technique = 3;

    const next = advanceMonth(state);

    expect(next.month).toBe("2027-06");
    expect(next.player.stamina).toBe(100);
    expect(next.monthly.actionCounts).toEqual({});
    expect(next.monthly.riskEventsThisMonth).toBe(0);
    expect(next.monthly.abilityProgressGains).toEqual({ technique: 0, creativity: 0, stage: 0 });
  });

  it("keeps the player in campus if the graduation show is unresolved", () => {
    const state = createInitialState("writer");

    const next = advanceMonth(state);

    expect(next.month).toBe("2027-06");
    expect(next.phase).toBe("campus");
    expect(next.careerStage).toBe("campus");
  });

  it("moves from campus into early career after the graduation show is resolved", () => {
    const state = createInitialState("writer");
    state.flags["campus.graduationShowDone"] = true;

    const next = advanceMonth(state);

    expect(next.month).toBe("2027-06");
    expect(next.phase).toBe("career");
    expect(next.careerStage).toBe("early");
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

  it("adds an annual summary when advancing from December to January", () => {
    const state = createInitialState("writer");
    state.month = "2027-12";
    state.phase = "career";
    state.careerStage = "early";
    state.player.health = 55;
    state.player.fame = 33;
    state.relationships = { vocal: 50, bass: 40, drums: 60 };
    state.history.push({
      id: "history.1",
      month: "2027-09",
      type: "performance",
      title: "街角演出",
      description: "你们在街角演出。",
      weight: 2,
      tags: ["career", "performance"]
    });
    state.releases.push({
      id: "release.1",
      month: "2027-10",
      type: "single",
      title: "雨后的失真",
      recordingIds: ["recording.1"],
      sales: 800,
      criticalScore: 72,
      fameImpact: 8,
      awards: []
    });

    const next = advanceMonth(state);

    expect(next.month).toBe("2028-01");
    expect(next.annualSummaries).toHaveLength(1);
    expect(next.annualSummaries[0]).toEqual({
      year: 2027,
      month: "2028-01",
      releases: 1,
      totalReleaseSales: 800,
      bestReleaseCriticalScore: 72,
      performances: 1,
      averageRelationship: 50,
      healthDebt: 15,
      fame: 33,
      note: "2027 年结束时，乐队发行了 1 张作品，完成 1 场演出，名气来到 33。"
    });
  });
});
