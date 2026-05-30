import { STAMINA } from "../config/balance";
import type { Effect, GameState, PlayerStatKey } from "../types";
import { clamp } from "./clamp";

function id(prefix: string, count: number): string {
  return `${prefix}.${count + 1}`;
}

function clampPlayerStat(state: GameState, key: PlayerStatKey, value: number): number {
  if (key === "stamina") {
    const effectiveCap = STAMINA.baseCap - state.monthly.staminaCapPenalty;
    return clamp(value, STAMINA.min, effectiveCap);
  }
  if (key === "wealth") return Math.max(0, value);
  return clamp(value, 0, 100);
}

export function applyEffects(state: GameState, effects: Effect[]): GameState {
  return effects.reduce<GameState>((current, effect) => {
    if (effect.kind === "playerStat") {
      const nextValue = clampPlayerStat(current, effect.key, current.player[effect.key] + effect.amount);
      const overdraft = effect.key === "stamina" && nextValue < 0 && current.player.stamina >= 0 ? 1 : 0;
      return {
        ...current,
        player: { ...current.player, [effect.key]: nextValue },
        counters: { ...current.counters, overdraftActions: current.counters.overdraftActions + overdraft }
      };
    }
    if (effect.kind === "bandStat") {
      return { ...current, band: { ...current.band, [effect.key]: clamp(current.band[effect.key] + effect.amount, 0, 100000) } };
    }
    if (effect.kind === "relationship") {
      return {
        ...current,
        relationships: {
          ...current.relationships,
          [effect.character]: clamp(current.relationships[effect.character] + effect.amount, 0, 100)
        }
      };
    }
    if (effect.kind === "flag") {
      return { ...current, flags: { ...current.flags, [effect.key]: effect.value } };
    }
    if (effect.kind === "counter") {
      return { ...current, counters: { ...current.counters, [effect.key]: current.counters[effect.key] + effect.amount } };
    }
    if (effect.kind === "addRiff") {
      return {
        ...current,
        riffs: [...current.riffs, { ...effect.riff, id: id("riff", current.riffs.length), createdAt: current.month }]
      };
    }
    if (effect.kind === "addHistory") {
      return {
        ...current,
        history: [...current.history, { ...effect.entry, id: id("history", current.history.length), month: current.month }]
      };
    }
    if (effect.kind === "queueEvent") {
      return { ...current, queuedEvents: [...current.queuedEvents, effect.eventId] };
    }
    return current;
  }, state);
}
