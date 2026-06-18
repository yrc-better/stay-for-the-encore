import { describe, expect, it } from "vitest";
import { createInitialState } from "../state/createInitialState";
import { resolveGraduationShow } from "./graduation";

describe("resolveGraduationShow", () => {
  it("rewards a strong graduation show and opens the first career opportunity", () => {
    const state = createInitialState("performer");
    state.band.cohesion = 72;
    state.band.workQuality = 76;
    state.player.stage = 68;
    state.player.stress = 18;
    state.relationships = { vocal: 64, bass: 66, drums: 62 };

    const next = resolveGraduationShow(state);

    expect(next.phase).toBe("career");
    expect(next.careerStage).toBe("early");
    expect(next.flags["campus.graduationShowDone"]).toBe(true);
    expect(next.flags["campus.graduationOutcome"]).toBe("breakthrough");
    expect(next.flags["career.hasLivehouseOffer"]).toBe(true);
    expect(next.player.fame).toBeGreaterThan(state.player.fame);
    expect(next.player.wealth).toBeGreaterThan(state.player.wealth);
    expect(next.band.fans).toBeGreaterThan(state.band.fans);
    expect(next.band.funds).toBeGreaterThan(state.band.funds);
    expect(next.history.at(-1)).toMatchObject({
      type: "performance",
      title: "毕业演出：礼堂被点燃",
      tags: ["campus", "graduation", "breakthrough"]
    });
    expect(next.history.at(-1)?.description).toContain("谢幕");
    expect(next.history.at(-1)?.description).toContain("灯");
  });

  it("records a rough graduation show without handing out a livehouse offer", () => {
    const state = createInitialState("writer");
    state.band.cohesion = 28;
    state.band.workQuality = 24;
    state.player.stage = 22;
    state.player.stress = 82;
    state.relationships = { vocal: 26, bass: 30, drums: 28 };

    const next = resolveGraduationShow(state);

    expect(next.phase).toBe("career");
    expect(next.careerStage).toBe("early");
    expect(next.flags["campus.graduationShowDone"]).toBe(true);
    expect(next.flags["campus.graduationOutcome"]).toBe("rough");
    expect(next.flags["career.hasLivehouseOffer"]).toBeUndefined();
    expect(next.counters.missedOpportunities).toBe(state.counters.missedOpportunities + 1);
    expect(next.player.wealth).toBe(state.player.wealth);
    expect(next.band.funds).toBe(state.band.funds);
    expect(next.history.at(-1)).toMatchObject({
      type: "performance",
      title: "毕业演出：勉强收场",
      tags: ["campus", "graduation", "rough"]
    });
    expect(next.history.at(-1)?.description).toContain("谢幕");
    expect(next.history.at(-1)?.description).toContain("散场");
  });
});
