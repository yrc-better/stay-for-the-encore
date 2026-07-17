import { describe, expect, it } from "vitest";
import { createTestGame } from "../test/fixtures";
import { prepareMonthOpportunities } from "./career";

function preparedForSeed(seed: number) {
  const game = createTestGame();
  const spreadSeed = Math.imul(seed, 2_654_435_761) >>> 0;
  game.rng = { seed: spreadSeed, state: spreadSeed, draws: 0 };
  game.band.unlockedVenueLevel = 5;
  game.band.basePopularity = 100;
  game.members.forEach((member) => {
    member.stats.popularity = 100;
  });
  return prepareMonthOpportunities(game);
}

describe("月初职业机会", () => {
  it("同一存档随机状态生成完全一致的持久化机会", () => {
    const first = preparedForSeed(77);
    const second = preparedForSeed(77);

    expect(first.month.performanceInvitations).toEqual(
      second.month.performanceInvitations,
    );
    expect(first.month.commercialOffers).toEqual(
      second.month.commercialOffers,
    );
    expect(first.month.contractOffers).toEqual(second.month.contractOffers);
    expect(first.rng).toEqual(second.rng);
  });

  it("邀请数量覆盖零至三且永远不越界", () => {
    const counts = Array.from(
      { length: 240 },
      (_, index) =>
        preparedForSeed(index + 1).month.performanceInvitations.length,
    );

    expect(Math.min(...counts)).toBe(0);
    expect(Math.max(...counts)).toBe(3);
    expect(counts.every((count) => count >= 0 && count <= 3)).toBe(true);
  });

  it("生成后再次准备不会重抽机会或推进随机种子", () => {
    const first = preparedForSeed(42);
    const second = prepareMonthOpportunities(first);

    expect(second).toBe(first);
  });
});
