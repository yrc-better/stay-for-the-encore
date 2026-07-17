import { describe, expect, it } from "vitest";
import type { MemberSeed } from "../domain";
import { createGameStore } from "./gameStore";

const roles = ["leadGuitar", "bass", "drums", "keyboard"] as const;
const members: MemberSeed[] = roles.map((role) => ({
  id: role,
  name: role,
  age: 22,
  role,
  avatarId: role,
  biography: "",
  quote: "",
  traits: [],
  stats: {
    professional: 50,
    creativity: 45,
    performance: 40,
    popularity: 10,
    belonging: 60,
  },
}));

describe("game store 事件入口", () => {
  it("可以准备并处理月初事件", () => {
    const store = createGameStore(null);
    store.getState().startNewGame({
      bandName: "潮汐背面",
      genre: "indie",
      protagonist: { name: "陈默", avatarId: "player" },
      selectedMembers: members,
      seed: 42,
      gameId: "store-event-test",
      createdAt: "2026-07-16T00:00:00.000Z",
    });

    store.getState().endMonth();
    store.getState().endMonth();

    let preparedEvent = store.getState().prepareEvent(["broken-cable"]);
    while (
      preparedEvent === null &&
      (store.getState().game?.calendar.completedMonths ?? 0) < 4
    ) {
      store.getState().endMonth();
      preparedEvent = store.getState().prepareEvent(["broken-cable"]);
    }
    expect(preparedEvent).toBe("broken-cable");
    const fundsBeforeEvent = store.getState().game?.band.funds ?? 0;
    const result = store.getState().resolveEvent({
      eventId: "broken-cable",
      choiceId: "replace",
    });

    expect(result?.ok).toBe(true);
    expect(store.getState().game?.pendingEvent).toBeNull();
    expect(store.getState().game?.band.funds).toBe(fundsBeforeEvent - 500);
    expect(result?.ok && result.record.outcomeId).toBe("clean-signal");
    expect(store.getState().game?.eventHistory).toHaveLength(1);
    expect(store.getState().game?.history.at(-1)).toMatchObject({
      type: "event",
      title: "接触不良的线材",
    });
    expect(store.getState().lastError).toBeNull();
  });
});
