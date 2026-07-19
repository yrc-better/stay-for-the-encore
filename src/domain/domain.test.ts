import { describe, expect, it } from "vitest";
import {
  advanceMonth,
  calculateBandAttributes,
  createInitialGameState,
  executeAction,
  type Member,
  type MemberSeed,
  type NewGameInput,
} from ".";

const teammateSeeds: MemberSeed[] = [
  {
    id: "guitar",
    name: "吉他手",
    age: 22,
    role: "leadGuitar",
    avatarId: "guitar",
    biography: "",
    quote: "",
    traits: [],
    stats: {
      professional: 70,
      creativity: 60,
      performance: 50,
      popularity: 20,
      belonging: 70,
    },
  },
  {
    id: "bass",
    name: "贝斯手",
    age: 22,
    role: "bass",
    avatarId: "bass",
    biography: "",
    quote: "",
    traits: [],
    stats: {
      professional: 60,
      creativity: 40,
      performance: 40,
      popularity: 10,
      belonging: 60,
    },
  },
  {
    id: "drums",
    name: "鼓手",
    age: 22,
    role: "drums",
    avatarId: "drums",
    biography: "",
    quote: "",
    traits: [],
    stats: {
      professional: 50,
      creativity: 30,
      performance: 60,
      popularity: 30,
      belonging: 50,
    },
  },
  {
    id: "keyboard",
    name: "键盘手",
    age: 22,
    role: "keyboard",
    avatarId: "keyboard",
    biography: "",
    quote: "",
    traits: [],
    stats: {
      professional: 40,
      creativity: 70,
      performance: 30,
      popularity: 40,
      belonging: 40,
    },
  },
];

function newGameInput(overrides: Partial<NewGameInput> = {}): NewGameInput {
  return {
    bandName: "潮汐背面",
    genre: "indie",
    protagonist: {
      name: "陈默",
      avatarId: "player",
    },
    selectedMembers: teammateSeeds,
    seed: 42,
    gameId: "test-game",
    createdAt: "2026-07-16T00:00:00.000Z",
    ...overrides,
  };
}

describe("乐队领域规则", () => {
  it("按照固定公式计算六项乐队属性", () => {
    const members: Member[] = [
      {
        id: "player",
        name: "主角",
        age: 22,
        role: "leader",
        avatarId: "player",
        biography: "",
        quote: "",
        traits: [],
        stats: {
          professional: 80,
          creativity: 90,
          performance: 70,
          popularity: 50,
          belonging: 80,
        },
        isPlayer: true,
        status: "normal",
        hiddenTags: [],
      },
      ...teammateSeeds.map((seed) => ({
        ...seed,
        role: seed.role,
        isPlayer: false,
        status: "normal" as const,
        hiddenTags: [],
      })),
    ];

    const attributes = calculateBandAttributes(members, {
      basePopularity: 20,
      funds: 12_345,
      conflictPenalty: 5,
      temporaryTeamBonus: 2,
    });

    expect(attributes.musicianship).toBe(54);
    expect(attributes.creativity).toBe(80.8);
    expect(attributes.teamSpirit).toBe(57);
    expect(attributes.stagecraft).toBe(59.4);
    expect(attributes.popularity).toBe(22.5);
    expect(attributes.funds).toBe(12_345);
  });

  it("开局为五人固定阵容和每月三个行动点", () => {
    const state = createInitialGameState(newGameInput());

    expect(state.members).toHaveLength(5);
    expect(state.members[0].stats).toEqual({
      professional: 50,
      creativity: 50,
      performance: 45,
      popularity: 5,
      belonging: 80,
    });
    expect(state.band.funds).toBe(10_000);
    expect(state.month.actionPointsRemaining).toBe(3);
  });

  it("行动固定生效，同一行动每月只能执行一次", () => {
    const initial = createInitialGameState(newGameInput());
    const first = executeAction(initial, {
      type: "personalTraining",
      stat: "professional",
    });

    expect(first.ok).toBe(true);
    if (!first.ok) return;

    expect(first.state.members[0].stats.professional).toBe(52);
    expect(first.state.month.actionPointsRemaining).toBe(2);

    const repeated = executeAction(first.state, {
      type: "personalTraining",
      stat: "creativity",
    });
    expect(repeated.ok).toBe(false);
    if (repeated.ok) return;
    expect(repeated.error.code).toBe("ACTION_ALREADY_USED");
  });

  it("正面和负面追加都会产生小幅实际效果，且不抵消固定成长", () => {
    const positiveInitial = createInitialGameState(
      newGameInput({ seed: 0, gameId: "positive-extra" }),
    );
    const positive = executeAction(positiveInitial, {
      type: "personalTraining",
      stat: "professional",
    });
    expect(positive.ok).toBe(true);
    if (!positive.ok) return;

    expect(positive.feedback.extra.kind).toBe("positive");
    expect(positive.state.members[0].stats.professional).toBe(52);
    expect(positive.state.band.funds).toBe(10_500);
    expect(positive.feedback.effects).toContainEqual({
      target: "band",
      label: "funds",
      amount: 500,
      unit: "currency",
    });

    const negativeInitial = createInitialGameState(
      newGameInput({ seed: 42, gameId: "negative-extra" }),
    );
    const negative = executeAction(negativeInitial, {
      type: "personalTraining",
      stat: "professional",
    });
    expect(negative.ok).toBe(true);
    if (!negative.ok) return;

    expect(negative.feedback.extra.kind).toBe("negative");
    expect(negative.state.members[0].stats.professional).toBe(52);
    expect(negative.state.band.funds).toBe(9_500);
    expect(negative.feedback.effects).toContainEqual({
      target: "band",
      label: "funds",
      amount: -500,
      unit: "currency",
    });
  });

  it("主角已经精疲力尽时，兼职负面剧情与实际扣款保持一致", () => {
    const initial = createInitialGameState(
      newGameInput({ seed: 42, gameId: "exhausted-part-time" }),
    );
    initial.members[0].status = "awful";

    const result = executeAction(initial, { type: "partTime" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.feedback.extra.kind).toBe("negative");
    expect(result.feedback.extra.message).toContain("拿出 ¥500");
    expect(result.feedback.extra.message).not.toContain("状态额外下降");
    expect(result.state.band.funds).toBe(12_500);
    expect(result.feedback.effects).toContainEqual({
      target: "band",
      label: "funds",
      amount: -500,
      unit: "currency",
    });
  });

  it("状态接近边界时，反馈记录裁剪后的实际变化级数", () => {
    const initial = createInitialGameState(
      newGameInput({ seed: 0, gameId: "actual-status-shift" }),
    );
    initial.members[0].status = "good";

    const result = executeAction(initial, { type: "rest" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.state.members[0].status).toBe("excellent");
    expect(result.feedback.effects).toContainEqual({
      target: result.state.members[0].id,
      label: "status",
      amount: 1,
      unit: "level",
    });
  });

  it("同级自主演出比受邀演出承担额外难度惩罚", () => {
    const invitedInitial = createInitialGameState(
      newGameInput({ seed: 42, gameId: "invited-performance" }),
    );
    const invited = executeAction(invitedInitial, {
      type: "performance",
      plan: {
        kind: "invited",
        venueLevel: 1,
        fee: 2_000,
        basePopularity: 1,
        actionPointCost: 2,
        title: "同级受邀测试",
      },
    });
    expect(invited.ok).toBe(true);
    if (!invited.ok) return;

    const selfOrganizedInitial = createInitialGameState(
      newGameInput({ seed: 42, gameId: "self-performance" }),
    );
    const selfOrganized = executeAction(selfOrganizedInitial, {
      type: "performance",
      plan: {
        kind: "selfOrganized",
        venueLevel: 1,
        fee: 2_000,
        basePopularity: 1,
        actionPointCost: 2,
        title: "同级自主测试",
      },
    });
    expect(selfOrganized.ok).toBe(true);
    if (!selfOrganized.ok) return;

    expect(invited.feedback.messages[0]).toContain("全场沸腾");
    expect(selfOrganized.feedback.messages[0]).toContain("稳定发挥");
  });

  it("月末让队友自然恢复，未使用行动点恢复主角并扣运营费", () => {
    const initial = createInitialGameState(newGameInput({ seed: 1_456 }));
    const rehearsed = executeAction(initial, { type: "rehearsal" });
    expect(rehearsed.ok).toBe(true);
    if (!rehearsed.ok) return;

    expect(rehearsed.state.members.every((member) => member.status === "tired")).toBe(
      true,
    );

    const month = advanceMonth(rehearsed.state);

    expect(month.state.members[0].status).toBe("good");
    expect(
      month.state.members.slice(1).every((member) => member.status === "normal"),
    ).toBe(true);
    expect(month.state.band.funds).toBe(9_000);
    expect(month.state.calendar.month).toBe(2);
    expect(month.state.month.actionPointsRemaining).toBe(3);
  });

  it("普通专辑制作不降低状态，集中制作降低全员状态", () => {
    const initial = createInitialGameState(newGameInput());
    const normal = executeAction(initial, {
      type: "albumProduction",
      mode: "normal",
    });
    expect(normal.ok).toBe(true);
    if (!normal.ok) return;
    expect(normal.state.activeAlbum?.progress).toBe(10);
    expect(normal.state.members.every((member) => member.status === "normal")).toBe(
      true,
    );

    const nextMonth = advanceMonth(normal.state).state;
    const concentrated = executeAction(nextMonth, {
      type: "albumProduction",
      mode: "concentrated",
    });
    expect(concentrated.ok).toBe(true);
    if (!concentrated.ok) return;
    expect(concentrated.state.activeAlbum?.progress).toBe(30);
    expect(concentrated.state.members[0].status).toBe("good");
    expect(
      concentrated.state.members.slice(1).every((member) => member.status === "normal"),
    ).toBe(true);
  });
});
