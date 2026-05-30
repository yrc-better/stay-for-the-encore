import {
  ENDING_RULES,
  type EndingRequirement,
  type EndingTitleRule,
  type EndingTrigger,
  type EndingWeight
} from "../config/endingRules";
import type { GameState } from "../types";

export interface EndingResult {
  trigger: EndingTrigger;
  titleId: string;
  titleLabel: string;
  score: number;
  summary: string;
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function totalSales(state: GameState): number {
  return state.releases.reduce((sum, release) => sum + release.sales, 0);
}

function uniqueStyleTags(state: GameState): number {
  return new Set(state.works.flatMap((work) => work.styleTags)).size;
}

function historyTagCount(state: GameState, tag: string): number {
  return state.history.filter((entry) => entry.tags.includes(tag)).length;
}

function requirementMet(state: GameState, requirement: EndingRequirement): boolean {
  if (requirement.kind === "playerMin") return state.player[requirement.key] >= requirement.value;
  if (requirement.kind === "playerMax") return state.player[requirement.key] <= requirement.value;
  if (requirement.kind === "anyPlayerMin") {
    return requirement.keys.some((key) => state.player[key] >= requirement.value);
  }
  if (requirement.kind === "bandMin") return state.band[requirement.key] >= requirement.value;
  if (requirement.kind === "relationshipAvgMin") {
    return average(Object.values(state.relationships)) >= requirement.value;
  }
  if (requirement.kind === "counterMin") return state.counters[requirement.key] >= requirement.value;
  if (requirement.kind === "uniqueStyleTagsMin") return uniqueStyleTags(state) >= requirement.value;
  if (requirement.kind === "totalSalesMin") return totalSales(state) >= requirement.value;
  if (requirement.kind === "totalSalesMax") return totalSales(state) <= requirement.value;
  if (requirement.kind === "historyTagMin") return historyTagCount(state, requirement.tag) >= requirement.count;
  return false;
}

function ruleEligible(state: GameState, rule: EndingTitleRule): boolean {
  const all = rule.requiredAll?.every((requirement) => requirementMet(state, requirement)) ?? true;
  const any = rule.requiredAny
    ? rule.requiredAny.some((group) => group.every((requirement) => requirementMet(state, requirement)))
    : true;
  return all && any;
}

function weightScore(state: GameState, weight: EndingWeight): number {
  if (weight.kind === "player") return state.player[weight.key] * weight.weight;
  if (weight.kind === "band") return state.band[weight.key] * weight.weight;
  if (weight.kind === "relationshipAverage") return average(Object.values(state.relationships)) * weight.weight;
  if (weight.kind === "counter") return state.counters[weight.key] * 10 * weight.weight;
  if (weight.kind === "uniqueStyleTags") return uniqueStyleTags(state) * 10 * weight.weight;
  if (weight.kind === "totalSales") return Math.min(totalSales(state) / 1000, 100) * weight.weight;
  if (weight.kind === "recordingQualityMax") {
    return Math.max(0, ...state.recordings.map((recording) => recording.quality)) * weight.weight;
  }
  if (weight.kind === "releaseCriticalScoreMax") {
    return Math.max(0, ...state.releases.map((release) => release.criticalScore)) * weight.weight;
  }
  if (weight.kind === "historyTag") return historyTagCount(state, weight.tag) * 10 * weight.weight;
  return 0;
}

export function evaluateEnding(state: GameState, trigger: EndingTrigger): EndingResult {
  const ranked = ENDING_RULES.filter((rule) => ruleEligible(state, rule))
    .map((rule) => ({
      rule,
      score: rule.weights.reduce((sum, weight) => sum + weightScore(state, weight), 0)
    }))
    .sort((a, b) => b.score - a.score || b.rule.priority - a.rule.priority);

  const winner = ranked[0] ?? { rule: ENDING_RULES[0], score: 0 };
  return {
    trigger,
    titleId: winner.rule.id,
    titleLabel: winner.rule.label,
    score: Math.round(winner.score),
    summary: `你以「${winner.rule.label}」的身份结束了这一段乐队人生。`
  };
}
