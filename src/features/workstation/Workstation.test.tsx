import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { PLAYER_AVATARS } from "../../data/avatars";
import { useGameStore } from "../../store";
import { createTestGame } from "../../test/fixtures";
import { Workstation } from "./Workstation";

const originalPerformAction = useGameStore.getState().performAction;

describe("后台工作站", () => {
  beforeEach(() => {
    useGameStore.setState({
      game: createTestGame(),
      hydrated: true,
      lastFeedback: null,
      lastMonthSummary: null,
      lastError: null,
      performAction: originalPerformAction,
    });
  });

  it("展示乐队档案并执行月内只能一次的行动", async () => {
    const user = userEvent.setup();
    render(<Workstation />);

    expect(screen.getAllByText("潮汐背面").length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "SPAN" &&
          element.textContent?.replace(/\s+/g, "") === "成立第1年第1月",
      ),
    ).toBeInTheDocument();

    const partTimeCard = screen.getByRole("heading", { name: "兼职" }).closest(
      "article",
    );
    expect(partTimeCard).not.toBeNull();
    await user.click(
      within(partTimeCard as HTMLElement).getByRole("button", {
        name: "执行",
      }),
    );

    expect(useGameStore.getState().game?.band.funds).toBe(13_000);
    expect(useGameStore.getState().game?.month.actionPointsRemaining).toBe(2);
    expect(
      within(partTimeCard as HTMLElement).getByRole("button", {
        name: "本月已执行",
      }),
    ).toBeDisabled();
  });

  it("月末结算会推进月份、扣运营费并重置行动", async () => {
    const user = userEvent.setup();
    render(<Workstation />);

    await user.click(screen.getByRole("button", { name: "结束本月" }));
    await user.click(screen.getByRole("button", { name: "确认结算" }));

    const game = useGameStore.getState().game;
    expect(game?.calendar.month).toBe(2);
    expect(game?.band.funds).toBe(9_000);
    expect(game?.month.actionPointsRemaining).toBe(3);
    expect(game?.month.usedActions).toEqual([]);
  });

  it("完整展示行动的固定收益、状态代价和资金成本", () => {
    render(<Workstation />);

    const partTimeCard = screen.getByRole("heading", { name: "兼职" }).closest(
      "article",
    );
    expect(partTimeCard).not.toBeNull();
    expect(
      within(partTimeCard as HTMLElement).getByText("乐队资金 +¥3,000"),
    ).toBeInTheDocument();
    expect(
      within(partTimeCard as HTMLElement).getByText("主角状态下降一级"),
    ).toBeInTheDocument();

    const promotionCard = screen.getByRole("heading", { name: "宣传" }).closest(
      "article",
    );
    expect(promotionCard).not.toBeNull();
    expect(
      within(promotionCard as HTMLElement).getByText("1 AP + ¥1,000"),
    ).toBeInTheDocument();
    expect(
      within(promotionCard as HTMLElement).getByText("乐队基础人气 +2"),
    ).toBeInTheDocument();
  });

  it("成员训练完成后会禁用所有成员页训练入口", async () => {
    const user = userEvent.setup();
    render(<Workstation />);

    await user.click(screen.getByRole("tab", { name: /成员/ }));
    const trainingButtons = screen.getAllByRole("button", { name: "安排训练" });
    await user.click(trainingButtons[0]);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "确认训练",
      }),
    );

    const usedButtons = screen.getAllByRole("button", { name: "本月已执行" });
    expect(usedButtons).toHaveLength(4);
    usedButtons.forEach((button) => expect(button).toBeDisabled());
  });

  it("训练执行失败时在训练弹窗内显示原因", async () => {
    const user = userEvent.setup();
    const game = createTestGame();
    useGameStore.setState({
      game,
      performAction: () => ({
        ok: false,
        state: game,
        error: {
          code: "ACTION_ALREADY_USED",
          message: "同一个行动每个月只能执行一次",
        },
      }),
    });
    render(<Workstation />);

    await user.click(screen.getByRole("tab", { name: /成员/ }));
    await user.click(screen.getAllByRole("button", { name: "安排训练" })[0]);
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "确认训练" }),
    );

    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "同一个行动每个月只能执行一次",
    );
  });

  it("可以从左栏打开完整乐队履历", async () => {
    const user = userEvent.setup();
    render(<Workstation />);

    await user.click(screen.getByRole("button", { name: "乐队履历" }));

    const dialog = screen.getByRole("dialog", { name: "乐队生涯履历" });
    expect(within(dialog).getByText("乐队成立")).toBeInTheDocument();
    expect(within(dialog).getByText("第 0 月")).toBeInTheDocument();
  });

  it("从任意工作页保存后都会显示全局存档提示", async () => {
    const user = userEvent.setup();
    render(<Workstation />);

    await user.click(screen.getByRole("tab", { name: /专辑/ }));
    await user.click(screen.getByRole("button", { name: "保存" }));

    const status = screen.getByRole("region", { name: "存档状态" });
    expect(within(status).getByText("当前进度已保存。")).toBeInTheDocument();

    await user.click(
      within(status).getByRole("button", { name: "关闭通知" }),
    );
    expect(
      screen.queryByRole("region", { name: "存档状态" }),
    ).not.toBeInTheDocument();
  });

  it("头像资源启用后会自动使用 futureAssetPath", () => {
    const avatar = PLAYER_AVATARS.find(
      (item) => item.id === "player-midnight",
    )!;
    const portrait = avatar.portrait as { available: boolean };
    const previousAvailability = portrait.available;
    portrait.available = true;

    try {
      render(<Workstation />);
      expect(
        document.querySelector(
          'img[src="/assets/portraits/player/player-midnight.webp"]',
        ),
      ).toBeInTheDocument();
    } finally {
      portrait.available = previousAvailability;
    }
  });

  it("乐队结束时显示完整结局档案并可返回首页", async () => {
    const user = userEvent.setup();
    const onReturnHome = vi.fn();
    useGameStore.setState({
      game: {
        ...createTestGame(),
        status: "ended",
        endingReason: "debtBreakup",
      },
    });
    render(<Workstation onReturnHome={onReturnHome} />);

    const dialog = screen.getByRole("dialog", {
      name: "潮汐背面生涯档案",
    });
    expect(within(dialog).getByText("债务危机，乐队解散")).toBeInTheDocument();
    expect(within(dialog).getAllByText("潮汐背面").length).toBeGreaterThan(0);
    expect(
      within(dialog).getByText(
        "没有留下正式专辑，但排练室里的声音仍被成员记得。",
      ),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: "返回首页" }),
    );
    expect(onReturnHome).toHaveBeenCalledOnce();
  });
});
