import { describe, expect, it } from "vitest";
import { createInitialState } from "../state/createInitialState";
import { advanceMonth } from "../state/month";
import type { GameState } from "../types";
import { performAction } from "./actions";
import { getAvailableEvents } from "./events";

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
  it("practice guitar consumes stamina, builds technique progress, and returns feedback", () => {
    const state = createInitialState("writer");
    const result = performAction(state, "practice");

    expect(result.state.player.stamina).toBe(85);
    expect(result.state.player.technique).toBe(42);
    expect(result.state.abilityProgress.technique).toBe(3);
    expect(result.state.monthly.abilityProgressGains.technique).toBe(3);
    expect(result.feedback.title).toBe("练到指尖发烫");
  });

  it("practice raises technique only after several months of progress", () => {
    let state = createInitialState("writer");

    state = performAction(state, "practice").state;
    state = advanceMonth(state);
    state = performAction(state, "practice").state;
    state = advanceMonth(state);
    state = performAction(state, "practice").state;

    expect(state.player.technique).toBe(43);
    expect(state.abilityProgress.technique).toBe(0);
  });

  it("same-month practice cannot raise technique by itself", () => {
    let state = createInitialState("writer");

    state = performAction(state, "practice").state;
    state = performAction(state, "practice").state;
    state = performAction(state, "practice").state;

    expect(state.player.technique).toBe(42);
    expect(state.abilityProgress.technique).toBe(8);
    expect(state.monthly.abilityProgressGains.technique).toBe(8);
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

  it("release with no unreleased recording returns feedback without changing state or action count", () => {
    const state = createInitialState("writer");

    const result = performAction(state, "release");

    expect(result.state).toBe(state);
    expect(result.state.monthly.actionCounts.release).toBeUndefined();
    expect(result.feedback.title).toBe("还没有可发行的录音");
  });

  it("release publishes an unreleased recording and writes career results", () => {
    const state = createInitialState("writer");
    state.month = "2027-09";
    state.phase = "career";
    state.careerStage = "early";
    state.player.fame = 18;
    state.band.fans = 90;
    state.band.reputation = 24;
    state.band.workQuality = 64;
    state.works.push({
      id: "work.1",
      title: "雨后的失真",
      stage: "song",
      sourceRiffIds: ["riff.1"],
      completion: 100,
      quality: 68,
      rehearsal: 55,
      styleTags: ["delay"],
      authorship: "shared",
      tension: 0
    });
    state.recordings.push({
      id: "recording.1",
      createdAt: "2027-08",
      workId: "work.1",
      type: "demo",
      quality: 66,
      rawness: 34,
      released: false
    });

    const result = performAction(state, "release");

    expect(result.state.releases).toHaveLength(1);
    expect(result.state.releases[0].type).toBe("single");
    expect(result.state.recordings[0].released).toBe(true);
    expect(result.state.band.fans).toBeGreaterThan(90);
    expect(result.state.band.funds).toBeGreaterThan(1200);
    expect(result.state.player.fame).toBeGreaterThan(18);
    expect(result.state.history.at(-1)?.title).toContain("发行");
    expect(result.state.monthly.actionCounts.release).toBe(1);
    expect(result.feedback.title).toBe("作品上线");
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

  it("negotiating queues a small performance lead before album gates open", () => {
    const state = createInitialState("writer");
    state.month = "2027-08";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;

    const result = performAction(state, "negotiate");

    expect(result.state.queuedEvents).toContain("career.anchor.negotiated_street_show");
    expect(result.state.queuedEvents).not.toContain("career.anchor.negotiated_festival_slot");
    expect(result.state.queuedEvents).not.toContain("career.anchor.negotiated_tour_offer");
  });

  it("negotiating can queue festival and tour offers only after album requirements are met", () => {
    const state = createInitialState("writer");
    state.month = "2030-06";
    state.phase = "career";
    state.careerStage = "rising";
    state.flags["campus.graduationShowDone"] = true;
    state.player.fame = 70;
    state.player.technique = 70;
    state.player.stage = 70;
    state.player.health = 70;
    state.band.workQuality = 80;
    state.band.reputation = 70;
    state.band.fans = 900;
    state.band.funds = 2400;
    state.releases.push({
      id: "release.1",
      month: "2030-04",
      type: "album",
      title: "第一张长片",
      recordingIds: ["recording.1", "recording.2"],
      sales: 2000,
      criticalScore: 78,
      fameImpact: 20,
      awards: []
    });

    const result = performAction(state, "negotiate");

    expect(result.state.queuedEvents).toContain("career.anchor.negotiated_tour_offer");
  });

  it("keeps a negotiated commercial show available when fame unlocks it before fan count does", () => {
    const state = createInitialState("writer");
    state.month = "2028-04";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;
    state.player.fame = 18;
    state.player.stage = 35;
    state.band.fans = 18;

    const result = performAction(state, "negotiate");

    expect(result.state.queuedEvents).toContain("career.anchor.negotiated_commercial_show");
    expect(getAvailableEvents(result.state).map((event) => event.id)).toContain(
      "career.anchor.negotiated_commercial_show"
    );
  });

  it("applies penalties to band actions when a teammate is away", () => {
    const baselineState = createInitialState("writer");
    addRecordableSong(baselineState);
    const baseline = performAction(baselineState, "record");

    const state = createInitialState("writer");
    state.memberStates.bass = {
      status: "away",
      note: "周航仍在暂别，低频只能先靠临时处理。",
      updatedAt: "2028-06"
    };
    state.band.cohesion = 52;
    state.player.stress = 28;
    addRecordableSong(state);

    const result = performAction(state, "record");

    expect(result.state.recordings).toHaveLength(1);
    expect(result.state.band.cohesion).toBe(49);
    expect(result.state.player.stress).toBe(32);
    expect(result.state.recordings[0].quality).toBeLessThan(baseline.state.recordings[0].quality);
  });
});
