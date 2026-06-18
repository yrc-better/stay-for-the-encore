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
  epilogue: string;
  reasons: string[];
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

function annualSummaryCount(state: GameState): number {
  return state.annualSummaries.length;
}

function annualReleaseTotal(state: GameState): number {
  return state.annualSummaries.reduce((sum, summary) => sum + summary.releases, 0);
}

function annualPerformanceTotal(state: GameState): number {
  return state.annualSummaries.reduce((sum, summary) => sum + summary.performances, 0);
}

function annualSalesTotal(state: GameState): number {
  return state.annualSummaries.reduce((sum, summary) => sum + summary.totalReleaseSales, 0);
}

function annualHealthDebtTotal(state: GameState): number {
  return state.annualSummaries.reduce((sum, summary) => sum + summary.healthDebt, 0);
}

function historyTagCount(state: GameState, tag: string): number {
  return state.history.filter((entry) => entry.tags.includes(tag)).length;
}

function maxRecordingQuality(state: GameState): number {
  return Math.max(0, ...state.recordings.map((recording) => recording.quality));
}

function maxReleaseCriticalScore(state: GameState): number {
  return Math.max(0, ...state.releases.map((release) => release.criticalScore));
}

function averageRelationship(state: GameState): number {
  return Math.round(average(Object.values(state.relationships)));
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
    case "annualSummaryCountMin":
      return annualSummaryCount(state) >= requirement.value;
    case "annualReleaseTotalMin":
      return annualReleaseTotal(state) >= requirement.value;
    case "annualPerformanceTotalMin":
      return annualPerformanceTotal(state) >= requirement.value;
    case "annualSalesTotalMin":
      return annualSalesTotal(state) >= requirement.value;
    case "annualSalesTotalMax":
      return annualSalesTotal(state) <= requirement.value;
    case "annualHealthDebtTotalMin":
      return annualHealthDebtTotal(state) >= requirement.value;
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
    case "annualSummaryCount":
      return annualSummaryCount(state) * weight.weight;
    case "annualReleaseTotal":
      return annualReleaseTotal(state) * weight.weight;
    case "annualPerformanceTotal":
      return annualPerformanceTotal(state) * weight.weight;
    case "annualSalesTotal":
      return clamp(annualSalesTotal(state) / 1000, 0, 100) * weight.weight;
    case "annualHealthDebtTotal":
      return annualHealthDebtTotal(state) * weight.weight;
    case "totalSales":
      return clamp(totalSales(state) / 1000, 0, 100) * weight.weight;
    case "recordingQualityMax":
      return maxRecordingQuality(state) * weight.weight;
    case "releaseCriticalScoreMax":
      return maxReleaseCriticalScore(state) * weight.weight;
    case "historyTag":
      return historyTagCount(state, weight.tag) * 10 * weight.weight;
    default:
      return assertNever(weight);
  }
}

function representativeHistoryTitles(state: GameState): string[] {
  return state.history
    .filter((entry) =>
      entry.tags.some((tag) =>
        ["tour", "legacy", "festival", "annual", "catalog", "underground", "street", "livehouse"].includes(tag)
      )
    )
    .map((entry) => entry.title)
    .slice(0, 3);
}

function createEndingReasons(state: GameState): string[] {
  const reasons = [
    `最高录音质量 ${maxRecordingQuality(state)}`,
    `发行总销量 ${totalSales(state)}`,
    `成员关系平均 ${averageRelationship(state)}`,
    `健康 ${state.player.health}，压力 ${state.player.stress}`
  ];
  const years = annualSummaryCount(state);
  const historyTitles = representativeHistoryTitles(state);

  if (years > 0) {
    reasons.push(`完整年度 ${years} 年`);
    reasons.push(`年度发行总计 ${annualReleaseTotal(state)} 张`);
    reasons.push(`年度演出总计 ${annualPerformanceTotal(state)} 场`);
    reasons.push(`年度发行销量总计 ${annualSalesTotal(state)}`);
    reasons.push(`年度健康债总计 ${annualHealthDebtTotal(state)}`);
  }
  if (historyTitles.length > 0) {
    reasons.push(`代表履历 ${historyTitles.join(" / ")}`);
  }

  return reasons;
}

function createEndingSummary(state: GameState, rule: EndingTitleRule): string {
  const base = `你以「${rule.label}」的身份结束了这一段乐队人生。`;
  const years = annualSummaryCount(state);
  if (years === 0) return base;
  return `${base}${years} 年的年度回声把这段路钉在履历里。`;
}

const EPILOGUES: Record<string, string> = {
  technical_master:
    "最后一次收线时，音箱里没有多余的噪声。你把拨片放进琴盒，像把多年练习留下的茧也一并收好；谢幕以后，仍有人记得那些被你磨到发亮的音色。",
  guitar_hero:
    "返场的喊声慢慢退下去，你站在舞台边缘，看见灯光把地板烤出一层白雾。最后一个和弦落下时，观众先安静了一秒，然后才把掌声还给你。",
  long_road_witness:
    "最后一盏灯落下时，台下还有人不肯离开。你们在散场的门边彼此点头，像把这些年每一次上路、每一次回城、每一次没有说出口的继续，都放进了同一个谢幕里。",
  catalog_keeper:
    "旧歌在最后一场里按年份排开，像一排没有褪色的灯。谢幕时你忽然发现，所谓曲库不是文件夹里的名字，而是每个年份都有一首歌替你们留在原地。",
  burned_live_hero:
    "返场结束后，后台只剩白光和喘息。你扶着琴箱站了很久，身体比掌声更早知道这条路走到了哪里；可门外还有人在喊你们的名字。",
  underground_torchbearer:
    "散场后，门口还有年轻乐队等着和你们说话。那些没卖出多少的歌、那些低矮舞台上的灯，终于变成别人继续开声以前的一点火。",
  sound_shaper:
    "灯光退下去以后，留在耳朵里的不是掌声，而是一种你亲手塑出来的空气。你知道它不属于某一首歌，而属于你们多年里反复寻找的声音。",
  unknown_craftsman:
    "没有盛大的谢幕，也没有太多人知道你把多少夜晚留在琴弦上。散场时你关掉电源，听见房间安静下来，像一件终于完成的手工活。",
  early_career:
    "灯还没有真正亮到你们身上，故事就先停在这里。排练室的门没有关死，琴还靠在墙边，像在等下一次有人重新数拍。"
};

function createEndingEpilogue(ruleId: string): string {
  return EPILOGUES[ruleId] ?? EPILOGUES.early_career;
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
      summary: "这一段乐队人生还没有沉淀出明确的称号。",
      epilogue: createEndingEpilogue("early_career"),
      reasons: createEndingReasons(state)
    };
  }

  return {
    trigger,
    titleId: winner.rule.id,
    titleLabel: winner.rule.label,
    score: Math.round(winner.score),
    summary: createEndingSummary(state, winner.rule),
    epilogue: createEndingEpilogue(winner.rule.id),
    reasons: createEndingReasons(state)
  };
}
