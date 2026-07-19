import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { prepareMonthEvent } from "../domain";
import { useGameStore } from "../store";
import { createTestGame } from "../test/fixtures";
import { App } from "./App";

function gameWithEventAndOpportunity() {
  const base = createTestGame();
  const withEvent = prepareMonthEvent(
    {
      ...base,
      calendar: {
        ...base.calendar,
        completedMonths: 2,
        month: 3,
      },
      month: {
        ...base.month,
        eventPrepared: false,
      },
    },
    ["rainy-rehearsal"],
  );

  return {
    ...withEvent,
    month: {
      ...withEvent.month,
      opportunitiesPrepared: true,
      opportunitiesAcknowledged: false,
      performanceInvitations: [
        {
          id: "invite-test",
          venueId: "small-livehouse",
          venueName: "小型 Livehouse",
          title: "周末拼盘演出邀约",
          venueLevel: 1 as const,
          fee: 4_000,
          basePopularity: 2,
          actionPointCost: 2 as const,
          difficulty: 20,
          expiresAtMonth: 3,
        },
      ],
    },
  };
}

describe("月初叙事弹窗队列", () => {
  beforeEach(() => {
    useGameStore.setState({
      game: gameWithEventAndOpportunity(),
      hydrated: true,
      lastFeedback: null,
      lastMonthSummary: null,
      lastError: null,
    });
  });

  it("随机事件及结果关闭后才展示本月机会", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "继续游戏" }));

    const eventDialog = await screen.findByRole("dialog", {
      name: "暴雨中的排练日",
    });
    expect(
      screen.queryByRole("dialog", { name: "本月机会" }),
    ).not.toBeInTheDocument();

    await user.click(
      within(eventDialog).getByRole("button", { name: /取消这次集合/ }),
    );
    expect(
      screen.queryByRole("dialog", { name: "本月机会" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "继续本月" }));

    const opportunityDialog = await screen.findByRole("dialog", {
      name: "本月机会",
    });
    expect(
      within(opportunityDialog).getByText("周末拼盘演出邀约"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);

    await user.click(
      within(opportunityDialog).getByRole("button", { name: "收下消息" }),
    );
    await waitFor(() => {
      expect(
        useGameStore.getState().game?.month.opportunitiesAcknowledged,
      ).toBe(true);
    });
    expect(
      screen.queryByRole("dialog", { name: "本月机会" }),
    ).not.toBeInTheDocument();
  });
});
