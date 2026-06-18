import type { EventTrigger, GameState } from "../types";
import {
  getBestReleaseCriticalScore,
  getBestReleaseSales,
  getReleaseCount,
  hasAlbumRelease,
  hasReleaseOfType
} from "./performanceOpportunities";

function hasFlag(state: GameState, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(state.flags, key);
}

function latestAnnualSummary(state: GameState): GameState["annualSummaries"][number] | null {
  return state.annualSummaries.at(-1) ?? null;
}

export function triggerMatches(state: GameState, trigger: EventTrigger): boolean {
  const latestSummary = latestAnnualSummary(state);

  if (trigger.months && !trigger.months.includes(state.month)) return false;
  if (trigger.flagsAll?.some((flag) => !hasFlag(state, flag))) return false;
  if (trigger.flagsNone?.some((flag) => hasFlag(state, flag))) return false;
  if (trigger.hasRiff && state.riffs.length === 0) return false;
  if (trigger.hasCompletedSong && !state.works.some((work) => work.stage === "song")) return false;
  if (trigger.hasDemo && !state.recordings.some((recording) => recording.type === "demo")) return false;
  if (trigger.hasAlbum && !hasAlbumRelease(state)) return false;
  if (trigger.hasReleaseType && !hasReleaseOfType(state, trigger.hasReleaseType)) return false;
  if (trigger.minRecordings && state.recordings.length < trigger.minRecordings) return false;
  if (trigger.minReleases && getReleaseCount(state) < trigger.minReleases) return false;
  if (trigger.minAnnualSummaries && state.annualSummaries.length < trigger.minAnnualSummaries) return false;
  if (trigger.minLastYearReleases && (!latestSummary || latestSummary.releases < trigger.minLastYearReleases)) {
    return false;
  }
  if (
    trigger.minLastYearPerformances &&
    (!latestSummary || latestSummary.performances < trigger.minLastYearPerformances)
  ) {
    return false;
  }
  if (
    trigger.minLastYearReleaseSales &&
    (!latestSummary || latestSummary.totalReleaseSales < trigger.minLastYearReleaseSales)
  ) {
    return false;
  }
  if (
    trigger.minLastYearCriticalScore &&
    (!latestSummary || latestSummary.bestReleaseCriticalScore < trigger.minLastYearCriticalScore)
  ) {
    return false;
  }
  if (
    trigger.minLastYearAverageRelationship &&
    (!latestSummary || latestSummary.averageRelationship < trigger.minLastYearAverageRelationship)
  ) {
    return false;
  }
  if (trigger.maxLastYearHealthDebt !== undefined && (!latestSummary || latestSummary.healthDebt > trigger.maxLastYearHealthDebt)) {
    return false;
  }
  if (trigger.minLastYearFame && (!latestSummary || latestSummary.fame < trigger.minLastYearFame)) return false;
  if (trigger.minReleaseCriticalScore && getBestReleaseCriticalScore(state) < trigger.minReleaseCriticalScore) {
    return false;
  }
  if (trigger.minReleaseSales && getBestReleaseSales(state) < trigger.minReleaseSales) return false;
  if (
    trigger.minPlayer &&
    Object.entries(trigger.minPlayer).some(([key, value]) => state.player[key as keyof typeof state.player] < value!)
  ) {
    return false;
  }
  if (
    trigger.maxPlayer &&
    Object.entries(trigger.maxPlayer).some(([key, value]) => state.player[key as keyof typeof state.player] > value!)
  ) {
    return false;
  }
  if (
    trigger.minBand &&
    Object.entries(trigger.minBand).some(([key, value]) => state.band[key as keyof typeof state.band] < value!)
  ) {
    return false;
  }
  if (
    trigger.minRelationship &&
    Object.entries(trigger.minRelationship).some(
      ([key, value]) => state.relationships[key as keyof typeof state.relationships] < value!
    )
  ) {
    return false;
  }
  if (
    trigger.maxRelationship &&
    Object.entries(trigger.maxRelationship).some(
      ([key, value]) => state.relationships[key as keyof typeof state.relationships] > value!
    )
  ) {
    return false;
  }
  if (
    trigger.memberStatus &&
    Object.entries(trigger.memberStatus).some(
      ([key, value]) => state.memberStates[key as keyof typeof state.memberStates].status !== value
    )
  ) {
    return false;
  }
  return true;
}
