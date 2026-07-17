import { describe, expect, it } from "vitest";
import { CANDIDATES } from "./candidates";
import { EVENTS } from "./events";
import type { EventContent, EventPool, GenreId } from "./types";

const EVENT_CATALOG: readonly EventContent[] = EVENTS;

const REQUIRED_POOLS: readonly EventPool[] = [
  "member",
  "album",
  "performance",
  "equipment",
  "publicOpinion",
  "industry",
  "life",
  "genre",
];

const REQUIRED_GENRES: readonly GenreId[] = [
  "pop",
  "indie",
  "punk",
  "metal",
];

const REQUIRED_EVENT_CHAINS = [
  "creative-disagreement-repair",
  "old-venue-reunion",
  "commercial-pressure",
  "member-life-choice",
] as const;

function expectUnique(ids: readonly string[]) {
  expect(new Set(ids).size).toBe(ids.length);
}

describe("事件目录契约", () => {
  it("至少提供四十个事件并覆盖全部事件池", () => {
    expect(EVENT_CATALOG.length).toBeGreaterThanOrEqual(40);

    for (const pool of REQUIRED_POOLS) {
      expect(EVENT_CATALOG.some((event) => event.pool === pool)).toBe(true);
    }
  });

  it("每种风格至少有两条专属事件", () => {
    for (const genre of REQUIRED_GENRES) {
      const genreEvents = EVENT_CATALOG.filter(
        (event) =>
          event.pool === "genre" &&
          event.genres?.length === 1 &&
          event.genres[0] === genre,
      );

      expect(genreEvents.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("事件、选择和结果 ID 在整个目录中不重复", () => {
    const eventIds = EVENT_CATALOG.map((event) => event.id);
    const choiceIds = EVENT_CATALOG.flatMap((event) =>
      event.choices.map((choice) => choice.id),
    );
    const outcomeIds = EVENT_CATALOG.flatMap((event) =>
      event.choices.flatMap((choice) =>
        choice.outcomes.map((outcome) => outcome.id),
      ),
    );

    expectUnique(eventIds);
    expectUnique(choiceIds);
    expectUnique(outcomeIds);
    expectUnique([...eventIds, ...choiceIds, ...outcomeIds]);
  });

  it("每个事件有两个选择，每个选择有结果且所有权重为正", () => {
    for (const event of EVENT_CATALOG) {
      expect(event.choices).toHaveLength(2);

      for (const choice of event.choices) {
        expect(choice.outcomes.length).toBeGreaterThan(0);
        for (const outcome of choice.outcomes) {
          expect(outcome.weight).toBeGreaterThan(0);
        }
      }
    }
  });

  it("每个事件都包含正面、负面和中性结果", () => {
    for (const event of EVENT_CATALOG) {
      const tones = new Set(
        event.choices.flatMap((choice) =>
          choice.outcomes.map((outcome) => outcome.tone),
        ),
      );

      expect(tones).toEqual(new Set(["positive", "negative", "neutral"]));
    }
  });

  it("十二名候选人每人至少拥有一条精确限定的专属事件", () => {
    const candidateIds: ReadonlySet<string> = new Set(
      CANDIDATES.map((candidate) => candidate.id),
    );
    const memberSpecificEvents = EVENT_CATALOG.filter(
      (event) => event.requiresMemberIds !== undefined,
    );

    expect(memberSpecificEvents.length).toBeGreaterThanOrEqual(
      CANDIDATES.length,
    );

    for (const event of memberSpecificEvents) {
      expect(event.requiresMemberIds).toHaveLength(1);
      expect(candidateIds.has(event.requiresMemberIds![0])).toBe(true);
      expect(event.once).toBe(true);
      expect(event.minMonth).toBeGreaterThanOrEqual(3);
      expect(event.cooldownMonths).toBeGreaterThan(0);
    }

    for (const candidate of CANDIDATES) {
      const candidateEvents = memberSpecificEvents.filter(
        (event) => event.requiresMemberIds?.[0] === candidate.id,
      );
      expect(candidateEvents.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("四条事件链各有两个一次性事件并由第一节安排后续", () => {
    const scheduledTargets = new Set<string>();

    for (const chainId of REQUIRED_EVENT_CHAINS) {
      const chainEvents = EVENT_CATALOG.filter(
        (event) => event.chainId === chainId,
      );
      expect(chainEvents).toHaveLength(2);
      expect(chainEvents.every((event) => event.once === true)).toBe(true);
      expect(chainEvents.every((event) => event.choices.length === 2)).toBe(
        true,
      );

      const outgoingEvents = chainEvents.filter((event) =>
        event.choices.some((choice) =>
          choice.outcomes.some((outcome) => outcome.nextEventId),
        ),
      );
      expect(outgoingEvents).toHaveLength(1);

      const firstPartOutcomes = outgoingEvents[0].choices.flatMap(
        (choice) => choice.outcomes,
      );
      const nextIds = firstPartOutcomes.flatMap((outcome) =>
        outcome.nextEventId ? [outcome.nextEventId] : [],
      );
      expect(nextIds).toHaveLength(firstPartOutcomes.length);
      expect(new Set(nextIds).size).toBe(1);
      nextIds.forEach((id) => scheduledTargets.add(id));
    }

    expect(scheduledTargets.size).toBe(REQUIRED_EVENT_CHAINS.length);
  });

  it("所有 nextEventId 都引用同一事件链中的现有事件", () => {
    const eventsById = new Map(
      EVENT_CATALOG.map((event) => [event.id, event]),
    );

    for (const event of EVENT_CATALOG) {
      for (const choice of event.choices) {
        for (const outcome of choice.outcomes) {
          if (!outcome.nextEventId) {
            continue;
          }

          const nextEvent = eventsById.get(outcome.nextEventId);
          expect(nextEvent).toBeDefined();
          expect(event.chainId).toBeTruthy();
          expect(nextEvent?.chainId).toBe(event.chainId);
          expect([1, 2]).toContain(outcome.nextEventDelayMonths);
        }
      }
    }
  });
});
