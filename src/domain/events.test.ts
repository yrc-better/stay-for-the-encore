import { describe, expect, it } from "vitest";
import {
  advanceMonth,
  createInitialGameState,
  prepareMonthEvent,
  resolveEvent,
  type GameState,
  type MemberSeed,
} from ".";

const teammateSeeds: MemberSeed[] = [
  "leadGuitar",
  "bass",
  "drums",
  "keyboard",
].map((role, index) => ({
  id: role,
  name: role,
  age: 22,
  role: role as MemberSeed["role"],
  avatarId: role,
  biography: "",
  quote: "",
  traits: [],
  stats: {
    professional: 50 + index,
    creativity: 45,
    performance: 40,
    popularity: 10,
    belonging: 60,
  },
}));

function initialState(): GameState {
  return createInitialGameState({
    bandName: "潮汐背面",
    genre: "indie",
    protagonist: { name: "陈默", avatarId: "player" },
    selectedMembers: teammateSeeds,
    seed: 42,
    gameId: "event-test",
    createdAt: "2026-07-16T00:00:00.000Z",
  });
}

function startMonth(state: GameState, candidateIds = ["event-a", "event-b"]) {
  return prepareMonthEvent(state, candidateIds);
}

describe("月初事件引擎", () => {
  it("前两月不触发，第三月按概率准备事件，且同月不会重复抽取", () => {
    let state = startMonth(initialState());
    expect(state.pendingEvent).toBeNull();
    expect(state.rng.draws).toBe(0);

    state = advanceMonth(state).state;
    state = startMonth(state);
    expect(state.pendingEvent).toBeNull();
    expect(state.rng.draws).toBe(0);

    state = advanceMonth(state).state;
    state = startMonth(state);
    expect(["event-a", "event-b"]).toContain(state.pendingEvent);
    expect(state.rng.draws).toBe(2);

    const repeated = startMonth(state);
    expect(repeated).toBe(state);
    expect(repeated.rng.draws).toBe(2);
  });

  it("处理通用效果并保存事件选择历史", () => {
    let state = initialState();
    state = advanceMonth(state).state;
    state = advanceMonth(state).state;
    state = startMonth(state, ["event-a"]);

    const result = resolveEvent(state, {
      eventId: "event-a",
      eventTitle: "一次测试事件",
      choiceId: "help",
      choiceLabel: "出手帮忙",
      outcomes: [
        {
          id: "worked",
          weight: 1,
          title: "事情解决了",
          text: "大家记住了这次选择。",
          effects: [
            { type: "funds", amount: -500 },
            {
              type: "basePopularity",
              amount: 2,
              countsAsPublicActivity: true,
            },
            {
              type: "memberStat",
              target: "all",
              stat: "belonging",
              amount: 1,
            },
            {
              type: "status",
              target: "leader",
              direction: "worsen",
              steps: 1,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "kept-a-promise",
            },
          ],
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.state.pendingEvent).toBeNull();
    expect(result.state.eventCooldownMonths).toBe(0);
    expect(result.state.band.funds).toBe(7_500);
    expect(result.state.band.basePopularity).toBe(2);
    expect(result.state.month.hadPublicActivity).toBe(true);
    expect(
      result.state.members.every((member) => member.stats.belonging >= 61),
    ).toBe(true);
    expect(result.state.members[0].status).toBe("good");
    expect(result.state.members[0].hiddenTags).toContain("kept-a-promise");
    expect(result.state.rng.draws).toBe(state.rng.draws + 1);
    expect(result.state.eventHistory).toEqual([
      {
        eventId: "event-a",
        month: 3,
        choiceId: "help",
        outcomeId: "worked",
      },
    ]);
    expect(result.state.history.at(-1)).toEqual({
      id: "event-3-1",
      month: 3,
      type: "event",
      title: "一次测试事件",
      description: "出手帮忙：事情解决了。大家记住了这次选择。",
    });

    const nextMonth = advanceMonth(result.state).state;
    expect(nextMonth.eventCooldownMonths).toBe(1);
  });

  it("使用推进后的 RNG 加权抽取结果，而不是直接读取当前状态取模", () => {
    let state = initialState();
    state = advanceMonth(state).state;
    state = advanceMonth(state).state;
    state = startMonth(state, ["weighted-event"]);
    const drawsBeforeResolution = state.rng.draws;

    const result = resolveEvent(state, {
      eventId: "weighted-event",
      eventTitle: "加权事件",
      choiceId: "choose",
      choiceLabel: "作出选择",
      outcomes: [
        {
          id: "first",
          weight: 1,
          title: "第一种结果",
          text: "新的随机数落在第一个权重区间。",
          effects: [],
        },
        {
          id: "second",
          weight: 2,
          title: "第二种结果",
          text: "当前种子下不会选中这里。",
          effects: [],
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.record.outcomeId).toBe("second");
    expect(result.state.rng.draws).toBe(drawsBeforeResolution + 1);
    expect(result.state.rng.state).not.toBe(state.rng.state);
  });

  it("同一结果中的多个随机队友效果始终落在同一名成员身上", () => {
    let state = initialState();
    state = advanceMonth(state).state;
    state = advanceMonth(state).state;
    state = startMonth(state, ["member-event"]);
    const drawsBeforeResolution = state.rng.draws;

    const result = resolveEvent(state, {
      eventId: "member-event",
      eventTitle: "成员分歧",
      choiceId: "leader-decides",
      choiceLabel: "由队长决定",
      outcomes: [
        {
          id: "member-disappointed",
          weight: 1,
          title: "有人不再说话",
          text: "同一名成员同时承受关系变化并获得剧情标签。",
          effects: [
            {
              type: "memberStat",
              target: "randomBandmate",
              stat: "belonging",
              amount: -2,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "创作分歧",
              target: "randomBandmate",
            },
          ],
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const affected = result.state.members.filter(
      (member) => member.hiddenTags.includes("创作分歧"),
    );
    expect(affected).toHaveLength(1);
    expect(affected[0].isPlayer).toBe(false);
    expect(affected[0].stats.belonging).toBe(58);
    expect(
      result.state.members
        .filter((member) => !member.isPlayer && member.id !== affected[0].id)
        .every((member) => member.stats.belonging === 60),
    ).toBe(true);
    expect(result.state.rng.draws).toBe(drawsBeforeResolution + 2);
  });

  it("事件后至少冷却两个月，并使用 50% / 75% / 必定触发档位", () => {
    const history = [
      {
        eventId: "old-event",
        month: 3,
        choiceId: "choice",
        outcomeId: "outcome",
      },
    ];
    const base = initialState();

    const cooldownTwo = prepareMonthEvent(
      {
        ...base,
        calendar: { ...base.calendar, completedMonths: 5, month: 6 },
        month: { ...base.month, eventPrepared: false },
        eventCooldownMonths: 2,
        eventHistory: history,
      },
      ["new-event"],
    );
    expect(cooldownTwo.pendingEvent).toBeNull();
    expect(cooldownTwo.rng.draws).toBe(0);

    const missesAtFifty = prepareMonthEvent(
      {
        ...base,
        calendar: { ...base.calendar, completedMonths: 5, month: 6 },
        month: { ...base.month, eventPrepared: false },
        rng: { ...base.rng, state: 1456, draws: 0 },
        eventCooldownMonths: 3,
        eventHistory: history,
      },
      ["new-event"],
    );
    expect(missesAtFifty.pendingEvent).toBeNull();
    expect(missesAtFifty.rng.draws).toBe(1);

    const missesAtSeventyFive = prepareMonthEvent(
      {
        ...base,
        calendar: { ...base.calendar, completedMonths: 6, month: 7 },
        month: { ...base.month, eventPrepared: false },
        rng: { ...base.rng, state: 1456, draws: 0 },
        eventCooldownMonths: 4,
        eventHistory: history,
      },
      ["new-event"],
    );
    expect(missesAtSeventyFive.pendingEvent).toBeNull();

    const guaranteed = prepareMonthEvent(
      {
        ...base,
        calendar: { ...base.calendar, completedMonths: 7, month: 8 },
        month: { ...base.month, eventPrepared: false },
        eventCooldownMonths: 5,
        eventHistory: history,
      },
      ["new-event"],
    );
    expect(guaranteed.pendingEvent).toBe("new-event");
    expect(guaranteed.rng.draws).toBe(1);
  });
});
