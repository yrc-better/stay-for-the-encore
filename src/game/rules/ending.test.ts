import { describe, expect, it } from "vitest";
import { ENDING_RULES, type EndingTitleRule } from "../config/endingRules";
import { createInitialState } from "../state/createInitialState";
import type { AnnualSummary } from "../types";
import { evaluateEnding } from "./ending";

function annualSummary(year: number, overrides: Partial<AnnualSummary> = {}): AnnualSummary {
  return {
    year,
    month: `${year + 1}-01`,
    releases: 1,
    totalReleaseSales: 2200,
    bestReleaseCriticalScore: 72,
    performances: 4,
    averageRelationship: 56,
    healthDebt: 8,
    fame: 42,
    note: `${year} 年留下了可以回看的痕迹。`,
    ...overrides
  };
}

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

  it("selects a long-road ending from annual summaries and career history", () => {
    const state = createInitialState("performer");
    state.phase = "career";
    state.careerStage = "late";
    state.player.stage = 78;
    state.player.fame = 68;
    state.band.reputation = 72;
    state.annualSummaries = Array.from({ length: 6 }, (_, index) =>
      annualSummary(2032 + index, {
        totalReleaseSales: 2400 + index * 300,
        performances: 4 + (index % 2),
        fame: 45 + index * 4
      })
    );
    state.history.push(
      {
        id: "history.1",
        month: "2034-05",
        type: "performance",
        title: "第一次专辑巡演",
        description: "你们把专辑带上路。",
        weight: 5,
        tags: ["career", "tour", "performance", "album"]
      },
      {
        id: "history.2",
        month: "2038-09",
        type: "performance",
        title: "周年专场",
        description: "很多年被重新数了一遍。",
        weight: 6,
        tags: ["career", "late", "legacy", "performance"]
      }
    );

    const ending = evaluateEnding(state, "farewell");

    expect(ending.titleId).toBe("long_road_witness");
    expect(ending.titleLabel).toBe("长路见证者");
    expect(ending.reasons).toContain("完整年度 6 年");
    expect(ending.reasons).toContain("年度演出总计 27 场");
    expect(ending.reasons).toContain("代表履历 第一次专辑巡演 / 周年专场");
    expect(ending.summary).toContain("6 年的年度回声");
  });

  it("selects a catalog keeper ending for a deep body of releases", () => {
    const state = createInitialState("writer");
    state.phase = "career";
    state.careerStage = "mature";
    state.player.creativity = 76;
    state.player.fame = 62;
    state.band.workQuality = 82;
    state.band.reputation = 68;
    state.annualSummaries = Array.from({ length: 5 }, (_, index) =>
      annualSummary(2031 + index, {
        releases: 2,
        totalReleaseSales: 5000,
        bestReleaseCriticalScore: 78,
        performances: 3,
        fame: 48 + index * 3
      })
    );
    state.history.push({
      id: "history.catalog",
      month: "2035-03",
      type: "release",
      title: "曲库进入长期规划",
      description: "旧歌不再只是过去的证明。",
      weight: 5,
      tags: ["career", "annual", "catalog"]
    });

    const ending = evaluateEnding(state, "retirement");

    expect(ending.titleId).toBe("catalog_keeper");
    expect(ending.titleLabel).toBe("曲库守望者");
    expect(ending.reasons).toContain("年度发行总计 10 张");
    expect(ending.reasons).toContain("年度发行销量总计 25000");
    expect(ending.reasons).toContain("代表履历 曲库进入长期规划");
    expect(ending.epilogue).toContain("旧歌");
    expect(ending.epilogue).toContain("谢幕");
  });

  it("selects a burned live hero ending for heavy touring at a health cost", () => {
    const state = createInitialState("performer");
    state.phase = "career";
    state.careerStage = "late";
    state.player.stage = 88;
    state.player.fame = 74;
    state.player.health = 28;
    state.player.stress = 82;
    state.band.fans = 1800;
    state.band.reputation = 70;
    state.annualSummaries = Array.from({ length: 5 }, (_, index) =>
      annualSummary(2034 + index, {
        releases: 1,
        totalReleaseSales: 1800,
        performances: 8,
        healthDebt: 24,
        fame: 58 + index * 3
      })
    );
    state.history.push({
      id: "history.tour",
      month: "2038-08",
      type: "performance",
      title: "专辑被带上巡演路",
      description: "每晚的谢幕都像在问还能不能撑到下一站。",
      weight: 5,
      tags: ["career", "tour", "performance", "album"]
    });

    const ending = evaluateEnding(state, "farewell");

    expect(ending.titleId).toBe("burned_live_hero");
    expect(ending.titleLabel).toBe("燃尽的现场英雄");
    expect(ending.reasons).toContain("年度演出总计 40 场");
    expect(ending.reasons).toContain("年度健康债总计 120");
    expect(ending.epilogue).toContain("返场");
    expect(ending.epilogue).toContain("扶着琴箱");
  });

  it("selects an underground torchbearer ending for low-sales scenes with strong reputation", () => {
    const state = createInitialState("rebel");
    state.phase = "career";
    state.careerStage = "mature";
    state.player.fame = 42;
    state.player.stage = 69;
    state.band.reputation = 72;
    state.band.fans = 480;
    state.annualSummaries = Array.from({ length: 4 }, (_, index) =>
      annualSummary(2030 + index, {
        releases: 1,
        totalReleaseSales: 400,
        bestReleaseCriticalScore: 69,
        performances: 5,
        fame: 35 + index
      })
    );
    state.history.push(
      {
        id: "history.street",
        month: "2031-04",
        type: "performance",
        title: "地铁口的临时人潮",
        description: "没有灯光，但每个停下的人都像一束临时追光。",
        weight: 3,
        tags: ["career", "street", "performance", "underground"]
      },
      {
        id: "history.livehouse",
        month: "2033-11",
        type: "performance",
        title: "回到老 Livehouse",
        description: "年轻乐队在门口等你们下台。",
        weight: 4,
        tags: ["career", "livehouse", "underground"]
      }
    );

    const ending = evaluateEnding(state, "farewell");

    expect(ending.titleId).toBe("underground_torchbearer");
    expect(ending.titleLabel).toBe("地下传火者");
    expect(ending.reasons).toContain("年度发行销量总计 1600");
    expect(ending.reasons).toContain("代表履历 地铁口的临时人潮 / 回到老 Livehouse");
    expect(ending.epilogue).toContain("门口");
    expect(ending.epilogue).toContain("年轻乐队");
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
