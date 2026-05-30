import type { BandStatKey, CharacterId, PlayerStatKey, RouteId } from "../types";

export const PLAYER_INITIAL_STATS: Record<RouteId, Record<PlayerStatKey, number>> = {
  technician: { stamina: 100, technique: 62, creativity: 38, stage: 28, health: 78, stress: 22, fame: 5, wealth: 800 },
  writer: { stamina: 100, technique: 42, creativity: 62, stage: 34, health: 76, stress: 28, fame: 6, wealth: 860 },
  performer: { stamina: 100, technique: 38, creativity: 36, stage: 62, health: 74, stress: 32, fame: 10, wealth: 700 },
  rebel: { stamina: 100, technique: 45, creativity: 46, stage: 48, health: 70, stress: 38, fame: 8, wealth: 650 }
};

export const BAND_INITIAL_STATS: Record<BandStatKey, number> = {
  cohesion: 52,
  workQuality: 20,
  fans: 18,
  reputation: 12,
  funds: 1200
};

export const RELATIONSHIP_INITIAL_STATS: Record<RouteId, Record<CharacterId, number>> = {
  technician: { vocal: 48, bass: 56, drums: 50 },
  writer: { vocal: 46, bass: 54, drums: 48 },
  performer: { vocal: 58, bass: 50, drums: 56 },
  rebel: { vocal: 42, bass: 48, drums: 45 }
};

export const STAMINA = {
  baseCap: 100,
  monthlyRecovery: 80,
  min: -60,
  lowHealthCapPenalty: 10
} as const;
