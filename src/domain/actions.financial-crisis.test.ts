import { describe, expect, it } from "vitest";
import { createTestGame } from "../test/fixtures";
import { executeAction } from "./actions";

describe("负余额行动规则", () => {
  it("负余额时仍可兼职和休息，但不能执行付费行动", () => {
    const game = createTestGame();
    game.band.funds = -5_000;

    const partTime = executeAction(game, { type: "partTime" });
    expect(partTime.ok).toBe(true);
    if (!partTime.ok) return;
    expect(partTime.state.band.funds).toBeGreaterThan(game.band.funds);

    const rest = executeAction(partTime.state, { type: "rest" });
    expect(rest.ok).toBe(true);

    const promotion = executeAction(game, { type: "promotion" });
    expect(promotion.ok).toBe(false);
    if (promotion.ok) return;
    expect(promotion.error.code).toBe("NOT_ENOUGH_FUNDS");
  });
});
