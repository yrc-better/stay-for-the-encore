import { describe, expect, it } from "vitest";
import { ENDING_RULES, type EndingTitleRule } from "../config/endingRules";
import { createInitialState } from "../state/createInitialState";
import { evaluateEnding } from "./ending";

describe("evaluateEnding", () => {
  it("returns early career fallback for a fresh preview", () => {
    const state = createInitialState("writer");

    const ending = evaluateEnding(state, "preview");

    expect(ending.titleId).toBe("early_career");
    expect(ending.titleLabel).toBe("未定之路");
    expect(ending.titleId).not.toBe("technical_master");
    expect(ending.score).toBe(0);
    expect(ending.trigger).toBe("preview");
    expect(ending.summary).toBe("这一段乐队人生还没有沉淀出明确的称号。");
  });

  it("selects technical master when technique dominates", () => {
    const state = createInitialState("technician");
    state.player.technique = 88;
    state.recordings.push({
      id: "recording.1",
      createdAt: "2027-08",
      workId: "work.1",
      type: "demo",
      quality: 70,
      rawness: 30,
      released: false
    });

    const ending = evaluateEnding(state, "retirement");

    expect(ending.titleId).toBe("technical_master");
    expect(ending.trigger).toBe("retirement");
  });

  it("does not need gameplay UI tendency state", () => {
    const state = createInitialState("writer");
    state.player.creativity = 82;
    state.band.workQuality = 70;

    const ending = evaluateEnding(state, "preview");

    expect(ending.titleId).toBe("sound_shaper");
  });

  it("selects unknown craftsman through requiredAny creativity", () => {
    const state = createInitialState("writer");
    state.player.creativity = 65;
    state.player.technique = 42;
    state.player.fame = 40;

    const ending = evaluateEnding(state, "farewell");

    expect(ending.titleId).toBe("unknown_craftsman");
  });

  it("uses priority to break tied ending scores", () => {
    const state = createInitialState("technician");
    state.player.technique = 80;
    state.player.creativity = 80;
    state.player.fame = 41;
    state.band.workQuality = 0;

    const ending = evaluateEnding(state, "retirement");

    expect(ending.titleId).toBe("sound_shaper");
    expect(ending.score).toBe(112);
  });

  it("scores eligible rules with empty recordings and releases", () => {
    const state = createInitialState("technician");
    state.player.technique = 80;
    state.player.fame = 41;

    const ending = evaluateEnding(state, "lifespan");

    expect(ending.titleId).toBe("technical_master");
    expect(Number.isFinite(ending.score)).toBe(true);
  });

  it("clamps negative total sales score to zero", () => {
    const initialRuleCount = ENDING_RULES.length;
    const rule: EndingTitleRule = {
      id: "sales_floor_test",
      label: "Sales Floor Test",
      priority: 100,
      requiredAll: [{ kind: "playerMin", key: "stamina", value: 0 }],
      weights: [{ kind: "totalSales", weight: 1 }]
    };
    ENDING_RULES.push(rule);

    try {
      const state = createInitialState("writer");
      state.releases.push({
        id: "release.1",
        month: "2027-09",
        type: "single",
        title: "Debt Single",
        recordingIds: [],
        sales: -5000,
        criticalScore: 40,
        fameImpact: 0,
        awards: []
      });

      const ending = evaluateEnding(state, "preview");

      expect(ending.titleId).toBe("sales_floor_test");
      expect(ending.score).toBe(0);
    } finally {
      ENDING_RULES.splice(initialRuleCount);
    }
  });
});
