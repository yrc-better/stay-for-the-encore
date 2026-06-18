import { BAND_INITIAL_STATS, PLAYER_INITIAL_STATS, RELATIONSHIP_INITIAL_STATS } from "../config/balance";
import { createEmptyAbilityProgress } from "../config/abilityGrowth";
import { normalizeBandName } from "../config/defaults";
import { DEFAULT_EQUIPMENT } from "../config/equipment";
import { createInitialMemberStates } from "../config/members";
import type { EquipmentItem, GameState, RouteId } from "../types";

function cloneEquipmentItem(item: EquipmentItem): EquipmentItem {
  return {
    ...item,
    tags: [...item.tags],
    modifiers: item.modifiers ? { ...item.modifiers } : undefined
  };
}

export function createInitialState(route: RouteId, bandName?: string): GameState {
  return {
    bandName: normalizeBandName(bandName),
    month: "2027-05",
    phase: "campus",
    careerStage: "campus",
    route,
    player: { ...PLAYER_INITIAL_STATS[route] },
    abilityProgress: createEmptyAbilityProgress(),
    band: { ...BAND_INITIAL_STATS },
    relationships: { ...RELATIONSHIP_INITIAL_STATS[route] },
    memberStates: createInitialMemberStates("2027-05"),
    equipment: {
      guitar: cloneEquipmentItem(DEFAULT_EQUIPMENT.guitar),
      pedals: DEFAULT_EQUIPMENT.pedals.map(cloneEquipmentItem),
      amp: cloneEquipmentItem(DEFAULT_EQUIPMENT.amp)
    },
    monthly: {
      actionCounts: {},
      abilityProgressGains: createEmptyAbilityProgress(),
      staminaCapPenalty: 0,
      riskEventsThisMonth: 0
    },
    counters: {
      overdraftActions: 0,
      missedOpportunities: 0,
      healthCrises: 0,
      iconicPerformances: 0,
      contractCompromises: 0
    },
    flags: {},
    riffs: [],
    works: [],
    recordings: [],
    releases: [],
    history: [],
    annualSummaries: [],
    queuedEvents: [],
    eventLog: [],
    eventCooldowns: {}
  };
}
