import type { AbilityKey, PlayerStatKey } from "../types";

export const ABILITY_KEYS: AbilityKey[] = ["technique", "creativity", "stage"];
export const ABILITY_PROGRESS_PER_POINT = 9;
export const MONTHLY_ABILITY_PROGRESS_CAP = 8;

export function createEmptyAbilityProgress(): Record<AbilityKey, number> {
  return { technique: 0, creativity: 0, stage: 0 };
}

export function isAbilityKey(key: PlayerStatKey): key is AbilityKey {
  return ABILITY_KEYS.includes(key as AbilityKey);
}
