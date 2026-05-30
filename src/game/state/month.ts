import { STAMINA } from "../config/balance";
import { clamp } from "../rules/clamp";
import type { GameState, MonthId } from "../types";

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

export function advanceMonth(state: GameState): GameState {
  const staminaCapPenalty = state.player.health < 40 ? STAMINA.lowHealthCapPenalty : 0;
  const effectiveCap = STAMINA.baseCap - staminaCapPenalty;
  const recoveredStamina = clamp(state.player.stamina + STAMINA.monthlyRecovery, STAMINA.min, effectiveCap);

  return {
    ...state,
    month: nextMonth(state.month),
    player: { ...state.player, stamina: recoveredStamina },
    monthly: { actionCounts: {}, staminaCapPenalty, riskEventsThisMonth: 0 }
  };
}
