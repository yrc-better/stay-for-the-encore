import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GameState } from "../../domain";
import { createTestGame } from "../../test/fixtures";
import { EndingExperience } from "./EndingExperience";

function createEndedGame(): GameState {
  const base = createTestGame();
  const memberSummaries = base.members.map((member, index) => ({
    memberId: member.id,
    name: member.name,
    role: member.role,
    headline: `成员结语 ${index + 1}`,
    belonging: 84 - index * 9,
  }));

  return {
    ...base,
    status: "ended",
    endingReason: "twentiethAnniversary",
    calendar: {
      ...base.calendar,
      completedMonths: 240,
      year: 20,
      month: 12,
    },
    releasedAlbums: [
      {
        id: "album-tide",
        title: "逆流而上",
        coverId: "indie-stage-light",
        quality: 4.8,
        releasedInMonth: 37,
        listeners: 128_000,
        grossRevenue: 98_000,
        netRevenue: 74_000,
      },
    ],
    performanceRecords: [
      {
        id: "show-final",
        month: 126,
        title: "万人体育馆终场",
        kind: "invited",
        venueLevel: 5,
        rating: "legendary",
        difference: 32,
        grossPayment: 180_000,
        upfrontCost: 0,
        netPayment: 180_000,
        popularityChange: 12,
        excellent: true,
      },
    ],
    history: [
      ...base.history,
      {
        id: "first-release",
        month: 37,
        type: "album",
        title: "发行《逆流而上》",
        description: "第一张正式专辑被越来越多人听见。",
      },
      {
        id: "final-show",
        month: 126,
        type: "milestone",
        title: "万人体育馆终场",
        description: "乐队留下了被反复谈起的一晚。",
      },
    ],
    endingSummary: {
      title: "长青乐队",
      reason: "twentiethAnniversary",
      tags: ["五个人走到了最后", "留下杰作", "不会展示的第三项"],
      representativeAlbumId: "album-tide",
      keyPerformanceId: "show-final",
      memberSummaries,
      biography:
        "潮汐背面共同走过了二十年，作品与舞台让五个人始终拥有同一个坐标。",
    },
  };
}

describe("EndingExperience", () => {
  it("展示完整结局档案并提供两个明确出口", async () => {
    const user = userEvent.setup();
    const onReturnHome = vi.fn();
    const onRestart = vi.fn();
    const game = createEndedGame();

    render(
      <EndingExperience
        game={game}
        onReturnHome={onReturnHome}
        onRestart={onRestart}
      />,
    );

    const dialog = screen.getByRole("dialog", {
      name: "潮汐背面生涯档案",
    });
    expect(within(dialog).getByText("长青乐队")).toBeInTheDocument();
    expect(
      within(dialog).getByText("乐队走过二十周年"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("五个人走到了最后"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("留下杰作")).toBeInTheDocument();
    expect(
      within(dialog).queryByText("不会展示的第三项"),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByText("《逆流而上》")).toBeInTheDocument();
    expect(
      dialog.querySelector(
        'img[src="/assets/albums/indie/stage-light.webp"]',
      ),
    ).toBeInTheDocument();
    expect(
      dialog.querySelector('img[src="/assets/venues/level-5.webp"]'),
    ).toBeInTheDocument();
    expect(
      dialog.querySelector('img[src="/assets/endings/evergreen-band.webp"]'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getAllByText("万人体育馆终场").length,
    ).toBeGreaterThanOrEqual(1);

    const memberList = within(dialog).getByRole("list", {
      name: "五名成员最终状态",
    });
    expect(within(memberList).getAllByRole("listitem")).toHaveLength(5);
    expect(memberList.querySelectorAll("img")).toHaveLength(5);
    for (const member of game.members) {
      expect(within(memberList).getByText(member.name)).toBeInTheDocument();
    }

    expect(
      within(dialog).getByRole("heading", { name: "精选时间线" }),
    ).toBeInTheDocument();
    const returnButton = within(dialog).getByRole("button", {
      name: "返回首页",
    });
    expect(returnButton).toHaveFocus();

    await user.click(
      within(dialog).getByRole("button", { name: "重新组建乐队" }),
    );
    await user.click(returnButton);
    expect(onRestart).toHaveBeenCalledOnce();
    expect(onReturnHome).toHaveBeenCalledOnce();
  });

  it("旧迁移档没有 endingSummary 时仍安全展示可读取记录", () => {
    const base = createTestGame();
    const legacyGame: GameState = {
      ...base,
      status: "ended",
      endingReason: "playerEnded",
      endingSummary: null,
      calendar: {
        ...base.calendar,
        completedMonths: 28,
        year: 3,
        month: 5,
      },
    };

    render(
      <EndingExperience game={legacyGame} onReturnHome={() => undefined} />,
    );

    const dialog = screen.getByRole("dialog", {
      name: "潮汐背面生涯档案",
    });
    expect(within(dialog).getByText("乐队生涯档案")).toBeInTheDocument();
    expect(
      within(dialog).getByText("队长决定结束乐队生涯"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("旧档迁移")).toBeInTheDocument();
    expect(
      within(dialog).getByText(/没有保留完整的结局摘要/),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "没有留下正式专辑，但排练室里的声音仍被成员记得。",
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "重新组建乐队" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "返回首页" }),
    ).toBeInTheDocument();
  });
});
