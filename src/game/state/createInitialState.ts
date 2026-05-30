import { BAND_INITIAL_STATS, PLAYER_INITIAL_STATS, RELATIONSHIP_INITIAL_STATS } from "../config/balance";
import { DEFAULT_EQUIPMENT } from "../config/equipment";
import type { GameState, RouteId } from "../types";

export function createInitialState(route: RouteId): GameState {
  return {
    month: "2027-05",
    route,
    player: { ...PLAYER_INITIAL_STATS[route] },
    band: { ...BAND_INITIAL_STATS },
    relationships: { ...RELATIONSHIP_INITIAL_STATS[route] },
    equipment: {
      guitar: { ...DEFAULT_EQUIPMENT.guitar },
      pedals: DEFAULT_EQUIPMENT.pedals.map((pedal) => ({ ...pedal })),
      amp: { ...DEFAULT_EQUIPMENT.amp }
    },
    monthly: { actionCounts: {}, staminaCapPenalty: 0, riskEventsThisMonth: 0 },
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
    queuedEvents: []
  };
}
