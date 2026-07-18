import { describe, expect, it } from "vitest";
import { selectBandAttributes } from "./selectors";
import { simulateCareer } from "./simulation";
import {
  GENRES,
  MEMBER_STAT_KEYS,
  type GameState,
  type Genre,
} from "./types";

const LONG_RUN_SEEDS = [
  1, 7, 19, 42, 87, 123, 512, 2_027, 65_537, 999_983, -17, 0xffff_ffff,
] as const;

function expectAllNumbersFinite(value: unknown, path = "state"): void {
  if (typeof value === "number") {
    expect(Number.isFinite(value), `${path} must be finite`).toBe(true);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      expectAllNumbersFinite(item, `${path}[${index}]`),
    );
    return;
  }
  if (typeof value === "object" && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      expectAllNumbersFinite(item, `${path}.${key}`);
    }
  }
}

function expectAttributesInBounds(state: GameState): void {
  for (const member of state.members) {
    for (const stat of MEMBER_STAT_KEYS) {
      expect(member.stats[stat]).toBeGreaterThanOrEqual(0);
      expect(member.stats[stat]).toBeLessThanOrEqual(100);
    }
  }

  const attributes = selectBandAttributes(state);
  for (const key of [
    "creativity",
    "musicianship",
    "stagecraft",
    "popularity",
    "teamSpirit",
  ] as const) {
    expect(attributes[key]).toBeGreaterThanOrEqual(0);
    expect(attributes[key]).toBeLessThanOrEqual(100);
  }
  expect(state.band.basePopularity).toBeGreaterThanOrEqual(0);
  expect(state.band.basePopularity).toBeLessThanOrEqual(100);
  expect(state.activeAlbum?.progress ?? 0).toBeGreaterThanOrEqual(0);
  expect(state.activeAlbum?.progress ?? 0).toBeLessThanOrEqual(100);
  for (const album of state.releasedAlbums) {
    expect(album.quality).toBeGreaterThanOrEqual(0.5);
    expect(album.quality).toBeLessThanOrEqual(5);
  }
}

describe("确定性长局模拟", () => {
  it("十二个不同 seed 均能无死锁地完成 240 个月", () => {
    const results = LONG_RUN_SEEDS.map((seed) => {
      const result = simulateCareer(seed);
      expect(result.months).toBe(240);
      expect(result.state.calendar.completedMonths).toBe(240);
      expect(result.state.status).toBe("ended");
      expect(result.endingReason).toBe("twentiethAnniversary");
      expect(result.state.endingSummary).not.toBeNull();
      expect(result.albums).toBe(result.state.releasedAlbums.length);
      expect(result.performances).toBe(result.state.performanceRecords.length);
      expect(result.highestVenue).toBe(result.state.band.unlockedVenueLevel);
      expectAllNumbersFinite(result.state);
      expectAttributesInBounds(result.state);
      return result;
    });

    expect(
      Math.max(...results.map((result) => result.highestVenue)),
    ).toBeGreaterThanOrEqual(3);
    expect(results.some((result) => result.albums > 0)).toBe(true);
    expect(results.some((result) => result.performances > 0)).toBe(true);
  }, 15_000);

  it.each(GENRES)("让 %s 风格安全走到生涯结局", (genre: Genre) => {
    const seed = GENRES.indexOf(genre) + 10_000;
    const result = simulateCareer(seed, 240, { genre });

    expect(result.state.band.genre).toBe(genre);
    expect(result.months).toBe(240);
    expect(result.state.status).toBe("ended");
    expect(result.endingReason).toBe("twentiethAnniversary");
    expectAllNumbersFinite(result.state);
    expectAttributesInBounds(result.state);
  });

  it("同一 seed 与策略会生成完全相同的长局结果", () => {
    const first = simulateCareer(2_026, 96, {
      genre: "indie",
      performanceIntervalMonths: 3,
    });
    const second = simulateCareer(2_026, 96, {
      genre: "indie",
      performanceIntervalMonths: 3,
    });

    expect(second).toEqual(first);
    expect(first.months).toBe(96);
    expect(first.state.pendingEvent).toBeNull();
    expect(first.state.eventHistory).toEqual([]);
  });
});
