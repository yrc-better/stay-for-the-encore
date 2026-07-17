import type { RngState } from "./types";

const UINT32_RANGE = 0x1_0000_0000;

export function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) {
    return 1;
  }

  return Math.trunc(seed) >>> 0;
}

export function createRng(seed: number): RngState {
  const normalized = normalizeSeed(seed);
  return {
    seed: normalized,
    state: normalized,
    draws: 0,
  };
}

/**
 * A small LCG whose entire state is serializable. It deliberately avoids
 * Math.random so a save loaded midway through a run continues the same stream.
 */
export function nextRandom(rng: RngState): { value: number; rng: RngState } {
  const nextState = (Math.imul(1_664_525, rng.state) + 1_013_904_223) >>> 0;

  return {
    value: nextState / UINT32_RANGE,
    rng: {
      seed: rng.seed,
      state: nextState,
      draws: rng.draws + 1,
    },
  };
}

export function randomInteger(
  rng: RngState,
  minInclusive: number,
  maxInclusive: number,
): { value: number; rng: RngState } {
  const result = nextRandom(rng);
  const width = maxInclusive - minInclusive + 1;

  return {
    value: minInclusive + Math.floor(result.value * width),
    rng: result.rng,
  };
}
