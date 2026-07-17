import type { GameState } from "./types";

/**
 * Game state only contains serializable data. A single clone boundary keeps
 * action, event and month settlement paths in sync as the save schema grows.
 */
export function cloneGameState(state: GameState): GameState {
  if (typeof structuredClone === "function") {
    return structuredClone(state);
  }

  return JSON.parse(JSON.stringify(state)) as GameState;
}
