import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

  afterEach(() => {
    vi.unstubAllGlobals();
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
    const settingsButton = screen.getByRole("button", { name: "设置" });
    expect(
      screen.queryByRole("button", { name: "保存" }),
    ).not.toBeInTheDocument();

    await user.click(settingsButton);
    const settingsDialog = screen.getByRole("dialog", { name: "设置" });
    expect(within(settingsDialog).getByText("本地存档")).toBeInTheDocument();
    expect(
      within(settingsDialog).getByText("主动结束生涯"),
    ).toBeInTheDocument();

    await user.click(
      within(settingsDialog).getByRole("button", { name: "手动保存" }),
    );

    const status = screen.getByRole("region", { name: "存档状态" });
    expect(within(status).getByText("当前进度已保存。")).toBeInTheDocument();

    await user.click(
      within(status).getByRole("button", { name: "关闭通知" }),
    );
    expect(
      screen.queryByRole("region", { name: "存档状态" }),
    ).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "设置" }),
    ).not.toBeInTheDocument();
    expect(settingsButton).toHaveFocus();
  });

  it("设置内二次确认后才能主动结束生涯", async () => {
    const user = userEvent.setup();
    render(<Workstation />);

    await user.click(screen.getByRole("button", { name: "设置" }));
    const settingsDialog = screen.getByRole("dialog", { name: "设置" });

    await user.click(
      within(settingsDialog).getByRole("button", { name: "主动结束" }),
    );
    expect(useGameStore.getState().game?.status).toBe("active");

    const confirmation = within(settingsDialog).getByRole("alert");
    const continueButton = within(confirmation).getByRole("button", {
      name: "继续经营",
    });
    expect(continueButton).toHaveFocus();

    await user.click(continueButton);
    expect(useGameStore.getState().game?.status).toBe("active");
    expect(within(settingsDialog).queryByRole("alert")).not.toBeInTheDocument();

    await user.click(
      within(settingsDialog).getByRole("button", { name: "主动结束" }),
    );
    await user.click(
      within(settingsDialog).getByRole("button", { name: "确认结束" }),
    );

    expect(useGameStore.getState().game?.status).toBe("ended");
    expect(
      screen.queryByRole("dialog", { name: "设置" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "潮汐背面生涯档案" }),
    ).toBeInTheDocument();
  });

  it("可以在设置内提交游戏反馈且前端请求不包含收件地址", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<Workstation />);

    await user.click(screen.getByRole("button", { name: "设置" }));
    const settingsDialog = screen.getByRole("dialog", { name: "设置" });

    await user.selectOptions(
      within(settingsDialog).getByRole("combobox", { name: "反馈类型" }),
      "balance",
    );
    await user.type(
      within(settingsDialog).getByRole("textbox", { name: "反馈内容" }),
      "演出收益偏低，希望场地解锁节奏更顺畅。",
    );
    await user.click(
      within(settingsDialog).getByRole("button", { name: "提交反馈" }),
    );

    await waitFor(() => {
      expect(
        within(settingsDialog).getByRole("status"),
      ).toHaveTextContent("反馈已送达");
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/feedback",
      expect.objectContaining({
        method: "POST",
      }),
    );

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(requestInit.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      category: "balance",
      message: "演出收益偏低，希望场地解锁节奏更顺畅。",
      website: "",
      context: {
        bandName: "潮汐背面",
        genre: "indie",
        year: 1,
        month: 1,
      },
    });
    expect(body.submissionId).toEqual(expect.any(String));
    expect(body.submittedAt).toEqual(expect.any(String));
    expect(body).not.toHaveProperty("to");
    expect(body).not.toHaveProperty("email");
  });

  it("反馈提交期间禁用重复操作并显示进度", async () => {
    let resolveFetch!: (response: Response) => void;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<Workstation />);

    await user.click(screen.getByRole("button", { name: "设置" }));
    const settingsDialog = screen.getByRole("dialog", { name: "设置" });
    const feedbackInput = within(settingsDialog).getByRole("textbox", {
      name: "反馈内容",
    });
    await user.type(feedbackInput, "希望增加更多演出随机事件。");
    await user.click(
      within(settingsDialog).getByRole("button", { name: "提交反馈" }),
    );

    expect(
      within(settingsDialog).getByRole("button", { name: "正在提交" }),
    ).toBeDisabled();
    expect(feedbackInput).toBeDisabled();

    resolveFetch(
      Response.json({ ok: true }, { status: 202 }),
    );
    await waitFor(() => {
      expect(
        within(settingsDialog).getByRole("status"),
      ).toHaveTextContent("反馈已送达");
    });
  });

  it("反馈无效时聚焦字段，投递失败时保留草稿和幂等标识", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: false,
          message: "反馈暂时未能送达，请稍后再试。",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<Workstation />);

    await user.click(screen.getByRole("button", { name: "设置" }));
    const settingsDialog = screen.getByRole("dialog", { name: "设置" });
    const feedbackInput = within(settingsDialog).getByRole("textbox", {
      name: "反馈内容",
    });

    await user.type(feedbackInput, "太短");
    await user.click(
      within(settingsDialog).getByRole("button", { name: "提交反馈" }),
    );
    expect(within(settingsDialog).getByRole("alert")).toHaveTextContent(
      "请填写 5 到 1000 个字符的反馈",
    );
    expect(feedbackInput).toHaveFocus();
    expect(feedbackInput).toHaveAttribute("aria-invalid", "true");
    expect(fetchMock).not.toHaveBeenCalled();

    await user.clear(feedbackInput);
    await user.type(feedbackInput, "希望增加更多演出随机事件。");
    await user.click(
      within(settingsDialog).getByRole("button", { name: "提交反馈" }),
    );

    await waitFor(() => {
      expect(within(settingsDialog).getByRole("alert")).toHaveTextContent(
        "反馈暂时未能送达，请稍后再试。",
      );
    });
    expect(feedbackInput).toHaveValue("希望增加更多演出随机事件。");
    expect(feedbackInput).not.toHaveAttribute("aria-invalid");

    const firstRequest = fetchMock.mock.calls[0][1] as RequestInit;
    const firstBody = JSON.parse(String(firstRequest.body)) as Record<
      string,
      unknown
    >;

    await user.click(
      within(settingsDialog).getByRole("button", { name: "关闭设置" }),
    );
    const currentGame = useGameStore.getState().game!;
    act(() => {
      useGameStore.setState({
        game: {
          ...currentGame,
          calendar: {
            ...currentGame.calendar,
            month: 2,
          },
        },
      });
    });
    await user.click(screen.getByRole("button", { name: "设置" }));
    const reopenedDialog = screen.getByRole("dialog", { name: "设置" });
    const reopenedInput = within(reopenedDialog).getByRole("textbox", {
      name: "反馈内容",
    });
    expect(reopenedInput).toHaveValue("希望增加更多演出随机事件。");

    await user.click(
      within(reopenedDialog).getByRole("button", { name: "提交反馈" }),
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const secondRequest = fetchMock.mock.calls[1][1] as RequestInit;
    const secondBody = JSON.parse(String(secondRequest.body)) as Record<
      string,
      unknown
    >;
    expect(secondBody.submissionId).toBe(firstBody.submissionId);
    expect(secondBody.submittedAt).toBe(firstBody.submittedAt);
    expect(secondBody).toEqual(firstBody);
  });

  it("提交中关闭并重开设置时持续展示进度和最终结果", async () => {
    let resolveFetch!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
      ),
    );
    const user = userEvent.setup();
    render(<Workstation />);

    await user.click(screen.getByRole("button", { name: "设置" }));
    let settingsDialog = screen.getByRole("dialog", { name: "设置" });
    await user.type(
      within(settingsDialog).getByRole("textbox", { name: "反馈内容" }),
      "第一条仍在发送中的反馈。",
    );
    await user.click(
      within(settingsDialog).getByRole("button", { name: "提交反馈" }),
    );
    await user.click(
      within(settingsDialog).getByRole("button", { name: "关闭设置" }),
    );

    await user.click(screen.getByRole("button", { name: "设置" }));
    settingsDialog = screen.getByRole("dialog", { name: "设置" });
    const reopenedInput = within(settingsDialog).getByRole("textbox", {
      name: "反馈内容",
    });
    expect(reopenedInput).toBeDisabled();
    expect(
      within(settingsDialog).getByRole("button", { name: "正在提交" }),
    ).toBeDisabled();

    await act(async () => {
      resolveFetch(Response.json({ ok: true }, { status: 202 }));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(
        within(settingsDialog).getByRole("status"),
      ).toHaveTextContent("反馈已送达");
    });
    expect(reopenedInput).toHaveValue("");
    expect(reopenedInput).not.toBeDisabled();
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
