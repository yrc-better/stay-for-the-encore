import { describe, expect, it } from "vitest";
import { EVENTS } from "../content/events";
import { createInitialState } from "../state/createInitialState";
import type { GameEvent } from "../types";
import { selectMonthlyEventIds } from "./eventSelection";

const anchorEvent: GameEvent = {
  id: "anchor.graduation",
  title: "毕业演出",
  tags: ["anchor"],
  category: "anchor",
  priority: 100,
  once: true,
  trigger: {},
  body: "排练室的灯还亮着。",
  choices: []
};

const lowWeightEvent: GameEvent = {
  id: "random.low",
  title: "低权重事件",
  tags: ["random"],
  category: "random",
  rarity: "common",
  weight: 1,
  priority: 10,
  once: false,
  trigger: {},
  body: "一个普通机会。",
  choices: []
};

const highWeightEvent: GameEvent = {
  id: "random.high",
  title: "高权重事件",
  tags: ["random"],
  category: "random",
  rarity: "common",
  weight: 3,
  priority: 10,
  once: false,
  trigger: {},
  body: "一个更常见的机会。",
  choices: []
};

describe("selectMonthlyEventIds", () => {
  it("keeps anchor events first and picks a weighted random event with injected randomness", () => {
    const state = createInitialState("writer");

    const eventIds = selectMonthlyEventIds(state, [lowWeightEvent, anchorEvent, highWeightEvent], {
      random: () => 0.9
    });

    expect(eventIds).toEqual(["anchor.graduation", "random.high"]);
  });

  it("caps the total monthly event queue at five events", () => {
    const state = createInitialState("writer");
    const anchorEvents = Array.from({ length: 3 }, (_, index): GameEvent => {
      return {
        ...anchorEvent,
        id: `anchor.${index + 1}`,
        priority: 100 - index
      };
    });
    const randomEvents = Array.from({ length: 4 }, (_, index): GameEvent => {
      return {
        ...highWeightEvent,
        id: `random.${index + 1}`
      };
    });

    const eventIds = selectMonthlyEventIds(state, [...anchorEvents, ...randomEvents], {
      random: () => 0,
      maxRandomEvents: 4
    });

    expect(eventIds).toHaveLength(5);
    expect(eventIds.slice(0, 3)).toEqual(["anchor.1", "anchor.2", "anchor.3"]);
  });

  it("excludes events that are on cooldown", () => {
    const state = createInitialState("writer");
    state.eventCooldowns["random.high"] = 1;

    const eventIds = selectMonthlyEventIds(state, [lowWeightEvent, highWeightEvent], {
      random: () => 0.9
    });

    expect(eventIds).toEqual(["random.low"]);
  });

  it("excludes one-time events already recorded in the event log", () => {
    const state = createInitialState("writer");
    state.eventLog.push({ id: "random.low", month: state.month, category: "random" });

    const oneTimeEvent = { ...lowWeightEvent, once: true };
    const eventIds = selectMonthlyEventIds(state, [oneTimeEvent, highWeightEvent], {
      random: () => 0
    });

    expect(eventIds).toEqual(["random.high"]);
  });

  it("filters events by phase and career stage metadata", () => {
    const state = createInitialState("writer");
    const careerEvent: GameEvent = {
      ...highWeightEvent,
      id: "random.career",
      phase: "career",
      careerStages: ["early"]
    };

    const eventIds = selectMonthlyEventIds(state, [careerEvent, lowWeightEvent], {
      random: () => 0.5
    });

    expect(eventIds).toEqual(["random.low"]);
  });

  it("filters events by route metadata", () => {
    const state = createInitialState("writer");
    const technicianEvent: GameEvent = {
      ...highWeightEvent,
      id: "random.technician",
      routes: ["technician"]
    };
    const writerEvent: GameEvent = {
      ...lowWeightEvent,
      id: "random.writer",
      routes: ["writer"]
    };

    const eventIds = selectMonthlyEventIds(state, [technicianEvent, writerEvent], {
      random: () => 0
    });

    expect(eventIds).toEqual(["random.writer"]);
  });

  it("raises selection weight for member events matching strained teammates", () => {
    const state = createInitialState("writer");
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;
    state.player.stress = 65;
    state.relationships.vocal = 30;
    state.relationships.bass = 30;
    state.memberStates.bass.status = "strained";

    const events: GameEvent[] = [
      EVENTS.find((event) => event.id === "career.random.member_vocal_ownership_conflict")!,
      EVENTS.find((event) => event.id === "career.random.member_bass_silent_balance")!
    ];

    const eventIds = selectMonthlyEventIds(state, events, { random: () => 0.45, maxRandomEvents: 1 });

    expect(eventIds).toEqual(["career.random.member_bass_silent_balance"]);
  });
});
