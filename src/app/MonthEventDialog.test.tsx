import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { prepareMonthEvent } from "../domain";
import { useGameStore } from "../store";
import { createTestGame } from "../test/fixtures";
import { MonthEventDialog } from "./MonthEventDialog";

function prepareDialogEvent(eventId: string) {
  let game = createTestGame();
  game = {
    ...game,
    calendar: {
      ...game.calendar,
      completedMonths: 2,
      month: 3,
    },
    month: {
      ...game.month,
      eventPrepared: false,
    },
  };
  return prepareMonthEvent(game, [eventId]);
}

function BoundEventDialog() {
  const game = useGameStore((state) => state.game);
  return game ? <MonthEventDialog game={game} /> : null;
}

describe("月初事件弹窗", () => {
  beforeEach(() => {
    useGameStore.setState({
      game: prepareDialogEvent("rainy-rehearsal"),
      hydrated: true,
      lastFeedback: null,
      lastMonthSummary: null,
      lastError: null,
    });
  });

  it("选择前隐藏精确结果，选择后结算并写入事件历史", async () => {
    const user = userEvent.setup();
    render(<BoundEventDialog />);

    expect(
      screen.getByRole("dialog", { name: "暴雨中的排练日" }),
    ).toBeInTheDocument();
    expect(
      document.querySelector('img[src="/assets/events/pools/life.webp"]'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/归属感 \+1/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /取消这次集合/ }));

    expect(useGameStore.getState().game?.pendingEvent).toBeNull();
    expect(useGameStore.getState().game?.eventHistory).toHaveLength(1);
    expect(screen.getByText("没有数值变化")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "继续本月" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("正确显示负数资金效果", async () => {
    const user = userEvent.setup();
    useGameStore.setState({
      game: prepareDialogEvent("broken-cable"),
      lastFeedback: null,
      lastMonthSummary: null,
      lastError: null,
    });
    render(<BoundEventDialog />);

    await user.click(screen.getByRole("button", { name: /换一套可靠的线材/ }));

    expect(screen.getByText("资金 -¥500")).toBeInTheDocument();
    expect(useGameStore.getState().game?.band.funds).toBe(9_500);
  });
});
