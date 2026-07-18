import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../../store";
import { createTestGame } from "../../test/fixtures";
import {
  CareerManagementPanel,
  CareerPerformancePanel,
} from "./CareerPanels";

const storeActions = {
  acceptCommercialOffer: useGameStore.getState().acceptCommercialOffer,
  declineCommercialOffer: useGameStore.getState().declineCommercialOffer,
  signContract: useGameStore.getState().signContract,
  declineContractOffer: useGameStore.getState().declineContractOffer,
  buyEquipment: useGameStore.getState().buyEquipment,
  sellEquipment: useGameStore.getState().sellEquipment,
  endCareer: useGameStore.getState().endCareer,
};

describe("生涯演出与经营面板", () => {
  beforeEach(() => {
    useGameStore.setState({
      game: createTestGame(),
      hydrated: true,
      lastFeedback: null,
      lastMonthSummary: null,
      lastError: null,
      ...storeActions,
    });
  });

  it("按持久化邀请生成包含 invitationId 的完整演出计划", async () => {
    const user = userEvent.setup();
    const game = createTestGame();
    game.band.unlockedVenueLevel = 3;
    game.band.funds = 50_000;
    game.month.performanceInvitations = [
      {
        id: "invite-1-livehouse",
        venueId: "venue-level-2",
        venueName: "海风 Livehouse",
        title: "海风 Livehouse 演出邀约",
        venueLevel: 2,
        fee: 7_500,
        basePopularity: 2,
        actionPointCost: 2,
        difficulty: 45,
        expiresAtMonth: 1,
      },
    ];
    game.performanceRecords = [
      {
        id: "show-1",
        month: 1,
        title: "校园礼堂演出",
        kind: "invited",
        venueLevel: 1,
        rating: "crowdIgnited",
        difference: 12,
        grossPayment: 3_600,
        upfrontCost: 0,
        netPayment: 3_600,
        popularityChange: 2,
        excellent: true,
      },
    ];
    const onPerform = vi.fn();
    const onMessage = vi.fn();

    render(
      <CareerPerformancePanel
        game={game}
        onPerform={onPerform}
        onMessage={onMessage}
      />,
    );

    expect(screen.queryByText("五级场地路线")).not.toBeInTheDocument();
    expect(screen.queryByText("大型巡演与万人场馆")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "解锁场地" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("当前计划风险").length).toBeGreaterThan(1);
    expect(screen.getByText("校园礼堂演出")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "解锁场地" }));

    expect(
      screen.getByRole("dialog", { name: "五级场地路线" }),
    ).toBeInTheDocument();
    expect(screen.getByText("大型巡演与万人场馆")).toBeInTheDocument();
    expect(screen.getAllByText("已永久解锁")).toHaveLength(3);
    expect(screen.getAllByText("尚未解锁")).toHaveLength(2);

    await user.click(
      screen.getByRole("button", { name: "关闭场地路线" }),
    );
    expect(
      screen.queryByRole("dialog", { name: "五级场地路线" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "接受海风 Livehouse 演出邀约",
      }),
    );

    expect(onPerform).toHaveBeenCalledWith({
      kind: "invited",
      invitationId: "invite-1-livehouse",
      venueId: "venue-level-2",
      venueLevel: 2,
      fee: 7_500,
      basePopularity: 2,
      actionPointCost: 2,
      title: "海风 Livehouse 演出邀约",
    });
  });

  it("处理商业、合约、逐级设备、保存和二次结束确认", async () => {
    const user = userEvent.setup();
    const game = createTestGame();
    game.band.funds = 100_000;
    game.month.commercialOffers = [
      {
        id: "commercial-1-brand",
        kind: "brandPromotion",
        title: "独立耳机品牌宣传",
        description: "拍摄一组排练室宣传物料。",
        payout: 8_000,
        popularityGain: 2,
        belongingChange: -1,
        expiresAtMonth: 1,
      },
    ];
    game.month.contractOffers = [
      {
        id: "contract-1-small",
        kind: "smallLabel",
        title: "小型厂牌发行合约",
        signingBonus: 20_000,
        durationMonths: 18,
        albumsRequired: 1,
        expiresAtMonth: 1,
      },
    ];
    useGameStore.setState({ game });

    const onMessage = vi.fn();
    const onSave = vi.fn();
    const onEndCareer = vi.fn();

    render(
      <CareerManagementPanel
        game={game}
        onMessage={onMessage}
        onSave={onSave}
        onEndCareer={onEndCareer}
      />,
    );

    expect(screen.getByText("¥100,000")).toBeInTheDocument();
    expect(screen.getByText("独立耳机品牌宣传")).toBeInTheDocument();
    expect(screen.getByText("小型厂牌发行合约")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "接受独立耳机品牌宣传" }),
    );
    expect(useGameStore.getState().game?.band.funds).toBe(108_000);
    expect(onMessage).toHaveBeenCalledWith(
      expect.stringContaining("合作款进入公共账户"),
    );

    await user.click(
      screen.getByRole("button", { name: "签署小型厂牌发行合约" }),
    );
    expect(useGameStore.getState().game?.activeContract?.kind).toBe(
      "smallLabel",
    );

    await user.click(
      screen.getByRole("button", { name: "将电吉他升级到进阶" }),
    );
    expect(useGameStore.getState().game?.equipment.guitar).toBe("advanced");

    await user.click(screen.getByRole("button", { name: "手动保存" }));
    expect(onSave).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "结束生涯" }));
    expect(
      screen.getByText("确认立即结束当前乐队生涯吗？"),
    ).toBeInTheDocument();
    expect(onEndCareer).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "确认结束" }));
    expect(onEndCareer).toHaveBeenCalledTimes(1);
  });
});
