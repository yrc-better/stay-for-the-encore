import type { Effect } from "../types";

export type ActionId =
  | "practice"
  | "write_riff"
  | "study_style"
  | "part_time_job"
  | "rest"
  | "socialize"
  | "visit_guitar_shop"
  | "breakthrough"
  | "rehearse"
  | "band_write"
  | "record"
  | "perform"
  | "member_talk"
  | "promote"
  | "negotiate"
  | "band_rest";

export interface ActionDefinition {
  id: ActionId;
  label: string;
  group: "personal" | "band";
  staminaCost: number;
  effects: Effect[];
}

export const ACTIONS: Record<ActionId, ActionDefinition> = {
  practice: { id: "practice", label: "练琴", group: "personal", staminaCost: 15, effects: [{ kind: "playerStat", key: "technique", amount: 3 }, { kind: "playerStat", key: "stress", amount: 2 }] },
  write_riff: {
    id: "write_riff",
    label: "写 Riff",
    group: "personal",
    staminaCost: 18,
    effects: [
      { kind: "playerStat", key: "creativity", amount: 2 },
      { kind: "playerStat", key: "stress", amount: 2 },
      { kind: "addRiff", riff: { titleSeed: "雨后的失真", quality: 24, styleTags: ["delay"], source: "write_riff" } }
    ]
  },
  study_style: { id: "study_style", label: "研究风格", group: "personal", staminaCost: 12, effects: [{ kind: "playerStat", key: "creativity", amount: 1 }, { kind: "playerStat", key: "wealth", amount: -150 }] },
  part_time_job: { id: "part_time_job", label: "打工", group: "personal", staminaCost: 22, effects: [{ kind: "playerStat", key: "wealth", amount: 450 }, { kind: "playerStat", key: "stress", amount: 3 }, { kind: "playerStat", key: "health", amount: -1 }] },
  rest: { id: "rest", label: "休息", group: "personal", staminaCost: 0, effects: [{ kind: "playerStat", key: "stamina", amount: 25 }, { kind: "playerStat", key: "stress", amount: -8 }, { kind: "playerStat", key: "health", amount: 2 }] },
  socialize: { id: "socialize", label: "社交", group: "personal", staminaCost: 12, effects: [{ kind: "playerStat", key: "fame", amount: 1 }] },
  visit_guitar_shop: { id: "visit_guitar_shop", label: "逛乐器店", group: "personal", staminaCost: 10, effects: [{ kind: "playerStat", key: "stress", amount: -1 }] },
  breakthrough: { id: "breakthrough", label: "自我突破", group: "personal", staminaCost: 35, effects: [{ kind: "playerStat", key: "creativity", amount: 6 }, { kind: "playerStat", key: "stress", amount: 10 }, { kind: "playerStat", key: "health", amount: -4 }] },
  rehearse: {
    id: "rehearse",
    label: "排练",
    group: "band",
    staminaCost: 25,
    effects: [
      { kind: "bandStat", key: "cohesion", amount: 4 },
      { kind: "advanceWork", amount: 0, rehearsalAmount: 15 },
      { kind: "playerStat", key: "stage", amount: 1 },
      { kind: "playerStat", key: "stress", amount: 3 }
    ]
  },
  band_write: {
    id: "band_write",
    label: "团体创作",
    group: "band",
    staminaCost: 30,
    effects: [
      { kind: "advanceWork", amount: 35, qualityAmount: 8, authorship: "shared" },
      { kind: "bandStat", key: "workQuality", amount: 4 },
      { kind: "bandStat", key: "cohesion", amount: 1 }
    ]
  },
  record: { id: "record", label: "录音", group: "band", staminaCost: 35, effects: [{ kind: "bandStat", key: "funds", amount: -300 }, { kind: "playerStat", key: "fame", amount: 3 }] },
  perform: { id: "perform", label: "演出", group: "band", staminaCost: 40, effects: [{ kind: "playerStat", key: "fame", amount: 6 }, { kind: "playerStat", key: "wealth", amount: 300 }, { kind: "bandStat", key: "fans", amount: 10 }, { kind: "playerStat", key: "stage", amount: 2 }, { kind: "playerStat", key: "health", amount: -3 }] },
  member_talk: { id: "member_talk", label: "成员谈话", group: "band", staminaCost: 12, effects: [{ kind: "playerStat", key: "stress", amount: -2 }] },
  promote: { id: "promote", label: "宣传", group: "band", staminaCost: 18, effects: [{ kind: "playerStat", key: "fame", amount: 4 }, { kind: "bandStat", key: "fans", amount: 8 }, { kind: "playerStat", key: "wealth", amount: -100 }, { kind: "playerStat", key: "stress", amount: 2 }] },
  negotiate: { id: "negotiate", label: "谈合作", group: "band", staminaCost: 20, effects: [{ kind: "flag", key: "contract.hasLabelIntro", value: true }] },
  band_rest: { id: "band_rest", label: "休整", group: "band", staminaCost: 0, effects: [{ kind: "bandStat", key: "cohesion", amount: 2 }, { kind: "playerStat", key: "stress", amount: -6 }, { kind: "playerStat", key: "health", amount: 2 }] }
};
