import { createEmptyAbilityProgress } from "../config/abilityGrowth";
import { STAMINA } from "../config/balance";
import { clamp } from "../rules/clamp";
import type { AnnualSummary, CareerStage, GamePhase, GameState, MonthId } from "../types";

export function getEffectiveStaminaCap(state: GameState): number {
  return STAMINA.baseCap - state.monthly.staminaCapPenalty;
}

export function nextMonth(month: MonthId): MonthId {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  const date = new Date(Date.UTC(year, monthNumber, 1));
  const nextYear = date.getUTCFullYear();
  const nextMonthNumber = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${nextYear}-${nextMonthNumber}` as MonthId;
}

function decrementCooldowns(cooldowns: GameState["eventCooldowns"]): GameState["eventCooldowns"] {
  return Object.fromEntries(
    Object.entries(cooldowns)
      .map(([eventId, months]) => [eventId, months - 1] as const)
      .filter(([, months]) => months > 0)
  );
}

function getNextPhase(state: GameState): GamePhase {
  if (state.phase === "career" || state.flags["campus.graduationShowDone"] === true) return "career";
  return "campus";
}

function getCareerStageForPhase(month: MonthId, phase: GamePhase): CareerStage {
  if (phase === "campus") return "campus";

  const [yearText, monthText] = month.split("-");
  const monthIndex = (Number(yearText) - 2027) * 12 + Number(monthText);

  if (monthIndex <= 41) return "early";
  if (monthIndex <= 89) return "rising";
  if (monthIndex <= 185) return "mature";
  return "late";
}

function getYear(month: MonthId): number {
  return Number(month.split("-")[0]);
}

function isInYear(month: MonthId, year: number): boolean {
  return getYear(month) === year;
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function createAnnualSummary(state: GameState, year: number, month: MonthId): AnnualSummary {
  const releases = state.releases.filter((release) => isInYear(release.month, year));
  const performances = state.history.filter((entry) => entry.type === "performance" && isInYear(entry.month, year));
  const totalReleaseSales = releases.reduce((sum, release) => sum + release.sales, 0);
  const bestReleaseCriticalScore = Math.max(0, ...releases.map((release) => release.criticalScore));
  const averageRelationship = Math.round(average(Object.values(state.relationships)));
  const healthDebt = Math.max(0, 70 - state.player.health);

  return {
    year,
    month,
    releases: releases.length,
    totalReleaseSales,
    bestReleaseCriticalScore,
    performances: performances.length,
    averageRelationship,
    healthDebt,
    fame: state.player.fame,
    note: `${year} 年结束时，乐队发行了 ${releases.length} 张作品，完成 ${performances.length} 场演出，名气来到 ${state.player.fame}。`
  };
}

function appendAnnualSummaryIfNeeded(state: GameState, month: MonthId): GameState["annualSummaries"] {
  const currentYear = getYear(state.month);
  const nextYear = getYear(month);
  if (nextYear === currentYear) return state.annualSummaries;
  if (state.annualSummaries.some((summary) => summary.year === currentYear)) return state.annualSummaries;
  return [...state.annualSummaries, createAnnualSummary(state, currentYear, month)];
}

export function advanceMonth(state: GameState): GameState {
  const staminaCapPenalty = state.player.health < 40 ? STAMINA.lowHealthCapPenalty : 0;
  const effectiveCap = STAMINA.baseCap - staminaCapPenalty;
  const recoveredStamina = clamp(state.player.stamina + STAMINA.monthlyRecovery, STAMINA.min, effectiveCap);
  const month = nextMonth(state.month);
  const phase = getNextPhase(state);

  return {
    ...state,
    month,
    phase,
    careerStage: getCareerStageForPhase(month, phase),
    player: { ...state.player, stamina: recoveredStamina },
    annualSummaries: appendAnnualSummaryIfNeeded(state, month),
    monthly: {
      actionCounts: {},
      abilityProgressGains: createEmptyAbilityProgress(),
      staminaCapPenalty,
      riskEventsThisMonth: 0
    },
    eventCooldowns: decrementCooldowns(state.eventCooldowns)
  };
}
