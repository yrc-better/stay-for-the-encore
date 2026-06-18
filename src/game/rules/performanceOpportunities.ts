import type { GameState } from "../types";

export type PerformanceKind = "street" | "livehouse" | "commercial" | "festival" | "tour";

const NEGOTIATION_ORDER: PerformanceKind[] = ["tour", "festival", "commercial", "livehouse", "street"];

export const NEGOTIATED_PERFORMANCE_EVENT_IDS: Record<PerformanceKind, string> = {
  street: "career.anchor.negotiated_street_show",
  livehouse: "career.anchor.negotiated_livehouse_slot",
  commercial: "career.anchor.negotiated_commercial_show",
  festival: "career.anchor.negotiated_festival_slot",
  tour: "career.anchor.negotiated_tour_offer"
};

export function hasAlbumRelease(state: GameState): boolean {
  return state.releases.some((release) => release.type === "album");
}

export function hasReleaseOfType(state: GameState, type: GameState["releases"][number]["type"]): boolean {
  return state.releases.some((release) => release.type === type);
}

export function getReleaseCount(state: GameState): number {
  return state.releases.length;
}

export function getBestReleaseCriticalScore(state: GameState): number {
  return Math.max(0, ...state.releases.map((release) => release.criticalScore));
}

export function getBestReleaseSales(state: GameState): number {
  return Math.max(0, ...state.releases.map((release) => release.sales));
}

function isCareer(state: GameState): boolean {
  return state.phase === "career" && state.flags["campus.graduationShowDone"] === true;
}

function isPostEarlyCareer(state: GameState): boolean {
  return state.careerStage === "rising" || state.careerStage === "mature" || state.careerStage === "late";
}

export function canAccessPerformanceKind(state: GameState, kind: PerformanceKind): boolean {
  if (!isCareer(state)) return false;

  if (kind === "street") return true;

  if (kind === "livehouse") {
    return state.flags["career.firstLivehouseDone"] === true || state.band.fans >= 45 || state.band.reputation >= 18;
  }

  if (kind === "commercial") {
    return state.player.stage >= 35 && (state.player.fame >= 18 || state.band.fans >= 80 || state.band.reputation >= 22);
  }

  if (kind === "festival") {
    return (
      isPostEarlyCareer(state) &&
      hasAlbumRelease(state) &&
      getBestReleaseCriticalScore(state) >= 65 &&
      state.player.fame >= 28 &&
      state.player.technique >= 50 &&
      state.player.stage >= 45 &&
      state.band.workQuality >= 55 &&
      state.band.reputation >= 25 &&
      state.band.fans >= 120
    );
  }

  return (
    isPostEarlyCareer(state) &&
    hasAlbumRelease(state) &&
    getBestReleaseCriticalScore(state) >= 70 &&
    state.player.fame >= 42 &&
    state.player.technique >= 55 &&
    state.player.stage >= 55 &&
    state.player.health >= 45 &&
    state.band.workQuality >= 65 &&
    state.band.reputation >= 38 &&
    state.band.fans >= 350 &&
    state.band.funds >= 800
  );
}

export function getUnlockedPerformanceKinds(state: GameState): PerformanceKind[] {
  return NEGOTIATION_ORDER.filter((kind) => canAccessPerformanceKind(state, kind)).reverse();
}

export function getNegotiatedPerformanceEventId(state: GameState): string | null {
  const kind = NEGOTIATION_ORDER.find((performanceKind) => canAccessPerformanceKind(state, performanceKind));
  return kind ? NEGOTIATED_PERFORMANCE_EVENT_IDS[kind] : null;
}
