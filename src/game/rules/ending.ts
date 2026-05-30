import {
  ENDING_RULES,
  type EndingRequirement,
  type EndingTitleRule,
  type EndingTrigger,
  type EndingWeight
} from "../config/endingRules";
import type { GameState } from "../types";
import { clamp } from "./clamp";

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

function assertNever(value: never): never {
  throw new Error(`Unhandled ending rule variant: ${JSON.stringify(value)}`);
}

function requirementMet(state: GameState, requirement: EndingRequirement): boolean {
  switch (requirement.kind) {
    case "playerMin":
      return state.player[requirement.key] >= requirement.value;
    case "playerMax":
      return state.player[requirement.key] <= requirement.value;
    case "anyPlayerMin":
      return requirement.keys.some((key) => state.player[key] >= requirement.value);
    case "bandMin":
      return state.band[requirement.key] >= requirement.value;
    case "relationshipAvgMin":
      return average(Object.values(state.relationships)) >= requirement.value;
    case "counterMin":
      return state.counters[requirement.key] >= requirement.value;
    case "uniqueStyleTagsMin":
      return uniqueStyleTags(state) >= requirement.value;
    case "totalSalesMin":
      return totalSales(state) >= requirement.value;
    case "totalSalesMax":
      return totalSales(state) <= requirement.value;
    case "historyTagMin":
      return historyTagCount(state, requirement.tag) >= requirement.count;
    default:
      return assertNever(requirement);
  }
}

function ruleEligible(state: GameState, rule: EndingTitleRule): boolean {
  const all = rule.requiredAll?.every((requirement) => requirementMet(state, requirement)) ?? true;
  const any = rule.requiredAny
    ? rule.requiredAny.some((group) => group.every((requirement) => requirementMet(state, requirement)))
    : true;
  return all && any;
}

function weightScore(state: GameState, weight: EndingWeight): number {
  switch (weight.kind) {
    case "player":
      return state.player[weight.key] * weight.weight;
    case "band":
      return state.band[weight.key] * weight.weight;
    case "relationshipAverage":
      return average(Object.values(state.relationships)) * weight.weight;
    case "counter":
      return state.counters[weight.key] * 10 * weight.weight;
    case "uniqueStyleTags":
      return uniqueStyleTags(state) * 10 * weight.weight;
    case "totalSales":
      return clamp(totalSales(state) / 1000, 0, 100) * weight.weight;
    case "recordingQualityMax":
      return Math.max(0, ...state.recordings.map((recording) => recording.quality)) * weight.weight;
    case "releaseCriticalScoreMax":
      return Math.max(0, ...state.releases.map((release) => release.criticalScore)) * weight.weight;
    case "historyTag":
      return historyTagCount(state, weight.tag) * 10 * weight.weight;
    default:
      return assertNever(weight);
  }
}

export function evaluateEnding(state: GameState, trigger: EndingTrigger): EndingResult {
  const ranked = ENDING_RULES.filter((rule) => ruleEligible(state, rule))
    .map((rule) => ({
      rule,
      score: rule.weights.reduce((sum, weight) => sum + weightScore(state, weight), 0)
    }))
    .sort((a, b) => b.score - a.score || b.rule.priority - a.rule.priority);

  const winner = ranked[0];
  if (!winner) {
    return {
      trigger,
      titleId: "early_career",
      titleLabel: "未定之路",
      score: 0,
      summary: "这一段乐队人生还没有沉淀出明确的称号。"
    };
  }

  return {
    trigger,
    titleId: winner.rule.id,
    titleLabel: winner.rule.label,
    score: Math.round(winner.score),
    summary: `你以「${winner.rule.label}」的身份结束了这一段乐队人生。`
  };
}
