import { describe, expect, it } from "vitest";
import { createInitialState } from "../state/createInitialState";
import type { GameState } from "../types";
import { performAction } from "./actions";

function addRecordableSong(state: GameState): void {
  state.works.push({
    id: "work.1",
    title: "雨后的失真",
    stage: "song",
    sourceRiffIds: ["riff.1"],
    completion: 100,
    quality: 58,
    rehearsal: 30,
    styleTags: ["delay"],
    authorship: "shared",
    tension: 0
  });
}

describe("performAction", () => {
  it("practice guitar consumes stamina, improves technique, and returns feedback", () => {
    const state = createInitialState("writer");
    const result = performAction(state, "practice");

    expect(result.state.player.stamina).toBe(85);
    expect(result.state.player.technique).toBe(45);
    expect(result.feedback.title).toBe("练到指尖发烫");
  });

  it("rest only gives full benefits twice per month", () => {
    let state = createInitialState("writer");
    state.player.stamina = 40;

    state = performAction(state, "rest").state;
    state = performAction(state, "rest").state;
    state = performAction(state, "rest").state;

    expect(state.monthly.actionCounts.rest).toBe(3);
    expect(state.player.stamina).toBe(90);
  });

  it("write_riff creates a riff and returns feedback", () => {
    const state = createInitialState("writer");

    const result = performAction(state, "write_riff");

    expect(result.state.riffs).toHaveLength(1);
    expect(result.state.riffs[0].titleSeed).toBe("雨后的失真");
    expect(result.state.riffs[0].source).toBe("write_riff");
    expect(result.feedback.title).toBe("一段新的 Riff");
  });

  it("band_write after a riff creates and advances a work", () => {
    let state = createInitialState("writer");
    state = performAction(state, "write_riff").state;

    const result = performAction(state, "band_write");

    expect(result.state.works).toHaveLength(1);
    expect(result.state.works[0].completion).toBe(35);
    expect(result.state.works[0].authorship).toBe("shared");
    expect(result.feedback.title).toBe("团体创作");
  });

  it("rehearse increases rehearsal on an existing work without changing quality", () => {
    const state = createInitialState("writer");
    state.works.push({
      id: "work.1",
      title: "雨后的失真",
      stage: "song",
      sourceRiffIds: ["riff.1"],
      completion: 100,
      quality: 58,
      rehearsal: 10,
      styleTags: ["delay"],
      authorship: "shared",
      tension: 0
    });

    const result = performAction(state, "rehearse");

    expect(result.state.works[0].rehearsal).toBe(25);
    expect(result.state.works[0].quality).toBe(58);
    expect(result.feedback.title).toBe("排练室里的统一");
  });

  it("record with a completed rehearsed song and enough funds adds a recording and pays the cost", () => {
    const state = createInitialState("writer");
    addRecordableSong(state);

    const result = performAction(state, "record");

    expect(result.state.recordings).toHaveLength(1);
    expect(result.state.recordings[0].workId).toBe("work.1");
    expect(result.state.band.funds).toBe(900);
    expect(result.state.monthly.actionCounts.record).toBe(1);
    expect(result.feedback.title).toBe("录下此刻");
  });

  it("record with no recordable song returns feedback without changing state or action count", () => {
    const state = createInitialState("writer");

    const result = performAction(state, "record");

    expect(result.state).toBe(state);
    expect(result.state.monthly.actionCounts.record).toBeUndefined();
    expect(result.feedback.title).toBe("还录不了");
  });

  it("record with a recordable song but insufficient funds returns feedback without changing state or action count", () => {
    const state = createInitialState("writer");
    addRecordableSong(state);
    state.band.funds = 299;

    const result = performAction(state, "record");

    expect(result.state).toBe(state);
    expect(result.state.recordings).toHaveLength(0);
    expect(result.state.band.funds).toBe(299);
    expect(result.state.monthly.actionCounts.record).toBeUndefined();
    expect(result.feedback.title).toBe("钱还不够");
  });

  it("band_rest gives full benefit once per month and diminished feedback on repeated use", () => {
    let state = createInitialState("writer");
    state.player.health = 70;
    state.player.stress = 40;

    const first = performAction(state, "band_rest");
    const second = performAction(first.state, "band_rest");

    expect(second.state.monthly.actionCounts.band_rest).toBe(2);
    expect(first.state.player.health).toBe(72);
    expect(first.state.player.stress).toBe(34);
    expect(second.state.player.health).toBe(72);
    expect(second.state.player.stress).toBe(34);
    expect(first.feedback.title).toBe("乐队休整");
    expect(second.feedback.title).toBe("休整也需要间隔");
  });
});
