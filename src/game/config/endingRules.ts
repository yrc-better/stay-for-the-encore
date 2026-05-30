import type { BandStatKey, GameCounters, PlayerStatKey } from "../types";

export type EndingTrigger = "retirement" | "farewell" | "lifespan" | "preview";

export type EndingRequirement =
  | { kind: "playerMin"; key: PlayerStatKey; value: number }
  | { kind: "playerMax"; key: PlayerStatKey; value: number }
  | { kind: "anyPlayerMin"; keys: PlayerStatKey[]; value: number }
  | { kind: "bandMin"; key: BandStatKey; value: number }
  | { kind: "relationshipAvgMin"; value: number }
  | { kind: "counterMin"; key: keyof GameCounters; value: number }
  | { kind: "uniqueStyleTagsMin"; value: number }
  | { kind: "totalSalesMin"; value: number }
  | { kind: "totalSalesMax"; value: number }
  | { kind: "historyTagMin"; tag: string; count: number };

export type EndingWeight =
  | { kind: "player"; key: PlayerStatKey; weight: number }
  | { kind: "band"; key: BandStatKey; weight: number }
  | { kind: "relationshipAverage"; weight: number }
  | { kind: "counter"; key: keyof GameCounters; weight: number }
  | { kind: "uniqueStyleTags"; weight: number }
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
