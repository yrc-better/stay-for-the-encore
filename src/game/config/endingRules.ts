import type { BandStatKey, GameCounters, PlayerStatKey } from "../types";

export type EndingTrigger = "retirement" | "farewell" | "healthCollapse" | "bandBreakup" | "lifespan" | "preview";

export type EndingRequirement =
  | { kind: "playerMin"; key: PlayerStatKey; value: number }
  | { kind: "playerMax"; key: PlayerStatKey; value: number }
  | { kind: "anyPlayerMin"; keys: PlayerStatKey[]; value: number }
  | { kind: "bandMin"; key: BandStatKey; value: number }
  | { kind: "relationshipAvgMin"; value: number }
  | { kind: "counterMin"; key: keyof GameCounters; value: number }
  | { kind: "uniqueStyleTagsMin"; value: number }
  | { kind: "annualSummaryCountMin"; value: number }
  | { kind: "annualReleaseTotalMin"; value: number }
  | { kind: "annualPerformanceTotalMin"; value: number }
  | { kind: "annualSalesTotalMin"; value: number }
  | { kind: "annualSalesTotalMax"; value: number }
  | { kind: "annualHealthDebtTotalMin"; value: number }
  | { kind: "totalSalesMin"; value: number }
  | { kind: "totalSalesMax"; value: number }
  | { kind: "historyTagMin"; tag: string; count: number };

export type EndingWeight =
  | { kind: "player"; key: PlayerStatKey; weight: number }
  | { kind: "band"; key: BandStatKey; weight: number }
  | { kind: "relationshipAverage"; weight: number }
  | { kind: "counter"; key: keyof GameCounters; weight: number }
  | { kind: "uniqueStyleTags"; weight: number }
  | { kind: "annualSummaryCount"; weight: number }
  | { kind: "annualReleaseTotal"; weight: number }
  | { kind: "annualPerformanceTotal"; weight: number }
  | { kind: "annualSalesTotal"; weight: number }
  | { kind: "annualHealthDebtTotal"; weight: number }
  | { kind: "totalSales"; weight: number }
  | { kind: "recordingQualityMax"; weight: number }
  | { kind: "releaseCriticalScoreMax"; weight: number }
  | { kind: "historyTag"; tag: string; weight: number };

export interface EndingTitleRule {
  id: string;
  label: string;
  priority: number;
  requiredAll?: EndingRequirement[];
  requiredAny?: EndingRequirement[][];
  weights: EndingWeight[];
}

export const ENDING_RULES: EndingTitleRule[] = [
  {
    id: "technical_master",
    label: "技术宗师",
    priority: 80,
    requiredAll: [{ kind: "playerMin", key: "technique", value: 80 }],
    weights: [
      { kind: "player", key: "technique", weight: 1.4 },
      { kind: "recordingQualityMax", weight: 0.5 }
    ]
  },
  {
    id: "guitar_hero",
    label: "吉他英雄",
    priority: 80,
    requiredAll: [{ kind: "playerMin", key: "stage", value: 80 }],
    weights: [
      { kind: "player", key: "stage", weight: 1.3 },
      { kind: "band", key: "fans", weight: 0.5 }
    ]
  },
  {
    id: "long_road_witness",
    label: "长路见证者",
    priority: 90,
    requiredAll: [
      { kind: "annualSummaryCountMin", value: 5 },
      { kind: "annualPerformanceTotalMin", value: 18 }
    ],
    requiredAny: [
      [{ kind: "historyTagMin", tag: "tour", count: 1 }],
      [{ kind: "historyTagMin", tag: "legacy", count: 1 }],
      [{ kind: "annualSalesTotalMin", value: 10000 }]
    ],
    weights: [
      { kind: "annualSummaryCount", weight: 8 },
      { kind: "annualPerformanceTotal", weight: 1.6 },
      { kind: "annualSalesTotal", weight: 0.8 },
      { kind: "historyTag", tag: "tour", weight: 3 },
      { kind: "historyTag", tag: "legacy", weight: 2 }
    ]
  },
  {
    id: "catalog_keeper",
    label: "曲库守望者",
    priority: 94,
    requiredAll: [
      { kind: "annualSummaryCountMin", value: 4 },
      { kind: "annualReleaseTotalMin", value: 8 },
      { kind: "annualSalesTotalMin", value: 15000 },
      { kind: "bandMin", key: "workQuality", value: 70 }
    ],
    requiredAny: [
      [{ kind: "historyTagMin", tag: "catalog", count: 1 }],
      [{ kind: "historyTagMin", tag: "annual", count: 1 }]
    ],
    weights: [
      { kind: "annualReleaseTotal", weight: 9 },
      { kind: "annualSalesTotal", weight: 2 },
      { kind: "band", key: "workQuality", weight: 0.5 },
      { kind: "historyTag", tag: "catalog", weight: 2 }
    ]
  },
  {
    id: "burned_live_hero",
    label: "燃尽的现场英雄",
    priority: 96,
    requiredAll: [
      { kind: "playerMin", key: "stage", value: 80 },
      { kind: "playerMax", key: "health", value: 40 },
      { kind: "annualPerformanceTotalMin", value: 30 },
      { kind: "annualHealthDebtTotalMin", value: 80 }
    ],
    requiredAny: [
      [{ kind: "historyTagMin", tag: "tour", count: 1 }],
      [{ kind: "historyTagMin", tag: "festival", count: 1 }],
      [{ kind: "historyTagMin", tag: "performance", count: 5 }]
    ],
    weights: [
      { kind: "annualPerformanceTotal", weight: 7 },
      { kind: "annualHealthDebtTotal", weight: 5 },
      { kind: "player", key: "stage", weight: 1 },
      { kind: "player", key: "fame", weight: 1 },
      { kind: "historyTag", tag: "tour", weight: 5 },
      { kind: "historyTag", tag: "festival", weight: 4 }
    ]
  },
  {
    id: "underground_torchbearer",
    label: "地下传火者",
    priority: 92,
    requiredAll: [
      { kind: "annualSummaryCountMin", value: 3 },
      { kind: "annualPerformanceTotalMin", value: 12 },
      { kind: "annualSalesTotalMax", value: 5000 },
      { kind: "playerMax", key: "fame", value: 55 },
      { kind: "bandMin", key: "reputation", value: 55 }
    ],
    requiredAny: [
      [{ kind: "historyTagMin", tag: "underground", count: 1 }],
      [{ kind: "historyTagMin", tag: "street", count: 2 }],
      [{ kind: "historyTagMin", tag: "livehouse", count: 2 }]
    ],
    weights: [
      { kind: "band", key: "reputation", weight: 1.4 },
      { kind: "annualSummaryCount", weight: 8 },
      { kind: "annualPerformanceTotal", weight: 2 },
      { kind: "historyTag", tag: "underground", weight: 4 },
      { kind: "historyTag", tag: "street", weight: 2 },
      { kind: "historyTag", tag: "livehouse", weight: 2 }
    ]
  },
  {
    id: "sound_shaper",
    label: "声音塑造者",
    priority: 85,
    requiredAll: [{ kind: "playerMin", key: "creativity", value: 78 }],
    weights: [
      { kind: "player", key: "creativity", weight: 1.4 },
      { kind: "band", key: "workQuality", weight: 0.7 }
    ]
  },
  {
    id: "unknown_craftsman",
    label: "无名匠人",
    priority: 40,
    requiredAll: [{ kind: "playerMax", key: "fame", value: 40 }],
    requiredAny: [
      [{ kind: "playerMin", key: "technique", value: 65 }],
      [{ kind: "playerMin", key: "creativity", value: 65 }]
    ],
    weights: [
      { kind: "player", key: "technique", weight: 0.8 },
      { kind: "player", key: "creativity", weight: 0.8 },
      { kind: "player", key: "fame", weight: -0.5 }
    ]
  }
];
