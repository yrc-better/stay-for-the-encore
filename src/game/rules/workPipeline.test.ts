import { describe, expect, it } from "vitest";
import { createInitialState } from "../state/createInitialState";
import { applyEffects } from "./effects";
import { createRecording } from "./recording";
import { createRelease } from "./release";

describe("work pipeline", () => {
  it("creates a draft from a riff, advances completion, and turns it into a song", () => {
    let state = createInitialState("writer");
    state = applyEffects(state, [
      { kind: "addRiff", riff: { titleSeed: "雨后的失真", quality: 24, styleTags: ["delay"], source: "write_riff" } }
    ]);

    state = applyEffects(state, [
      {
        kind: "advanceWork",
        amount: 35,
        sourceRiffId: state.riffs[0].id,
        qualityAmount: 0,
        authorship: "player_led",
        styleTags: ["delay"]
      }
    ]);
    expect(state.works[0].completion).toBe(35);
    expect(state.works[0].quality).toBeGreaterThanOrEqual(42);

    state = applyEffects(state, [{ kind: "advanceWork", workId: state.works[0].id, amount: 70, qualityAmount: 16 }]);
    expect(state.works[0].stage).toBe("song");
    expect(state.works[0].completion).toBe(100);
  });

  it("creates a demo recording from a completed and rehearsed song", () => {
    const state = createInitialState("writer");
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

    const recording = createRecording(state, "work.1");

    expect(recording.type).toBe("demo");
    expect(recording.quality).toBeGreaterThanOrEqual(43);
    expect(recording.released).toBe(false);
  });

  it("creates a single release from one strong unreleased recording", () => {
    const state = createInitialState("writer");
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

    const release = createRelease(state);

    expect(release.type).toBe("single");
    expect(release.title).toBe("雨后的失真");
    expect(release.recordingIds).toEqual(["recording.1"]);
    expect(release.sales).toBeGreaterThan(0);
    expect(release.criticalScore).toBeGreaterThanOrEqual(60);
    expect(release.fameImpact).toBeGreaterThan(0);
  });

  it("creates albums only when enough unreleased recordings are bundled", () => {
    const state = createInitialState("writer");
    state.player.fame = 35;
    state.band.fans = 400;
    state.band.reputation = 38;
    state.band.workQuality = 72;

    for (let index = 1; index <= 6; index += 1) {
      state.works.push({
        id: `work.${index}`,
        title: `城市回声 ${index}`,
        stage: "song",
        sourceRiffIds: [`riff.${index}`],
        completion: 100,
        quality: 70,
        rehearsal: 60,
        styleTags: ["city"],
        authorship: "shared",
        tension: 0
      });
      state.recordings.push({
        id: `recording.${index}`,
        createdAt: "2029-03",
        workId: `work.${index}`,
        type: "demo",
        quality: 68,
        rawness: 32,
        released: false
      });
    }

    const release = createRelease(state);

    expect(release.type).toBe("album");
    expect(release.recordingIds).toHaveLength(6);
    expect(release.title).toContain("城市回声");
  });

  it("can increase rehearsal through advanceWork", () => {
    let state = createInitialState("writer");
    state.works.push({
      id: "work.1",
      title: "雨后的失真",
      stage: "song",
      sourceRiffIds: ["riff.1"],
      completion: 100,
      quality: 58,
      rehearsal: 0,
      styleTags: ["delay"],
      authorship: "shared",
      tension: 0
    });

    state = applyEffects(state, [{ kind: "advanceWork", workId: "work.1", amount: 0, rehearsalAmount: 15 }]);

    expect(state.works[0].rehearsal).toBe(15);
  });

  it("advances the same draft when advanceWork has no workId", () => {
    let state = createInitialState("writer");
    state = applyEffects(state, [
      { kind: "addRiff", riff: { titleSeed: "雨后的失真", quality: 24, styleTags: ["delay"], source: "write_riff" } }
    ]);

    state = applyEffects(state, [{ kind: "advanceWork", amount: 35, qualityAmount: 8, authorship: "shared" }]);
    state = applyEffects(state, [{ kind: "advanceWork", amount: 35, qualityAmount: 8, authorship: "shared" }]);

    expect(state.works).toHaveLength(1);
    expect(state.works[0].completion).toBe(70);
  });

  it("increases rehearsal on an existing work when advanceWork has no workId", () => {
    let state = createInitialState("writer");
    state.works.push(
      {
        id: "work.1",
        title: "排练室草稿",
        stage: "draft",
        sourceRiffIds: ["riff.1"],
        completion: 55,
        quality: 46,
        rehearsal: 0,
        styleTags: ["delay"],
        authorship: "shared",
        tension: 0
      },
      {
        id: "work.2",
        title: "雨后的失真",
        stage: "song",
        sourceRiffIds: ["riff.2"],
        completion: 100,
        quality: 58,
        rehearsal: 10,
        styleTags: ["delay"],
        authorship: "shared",
        tension: 0
      }
    );

    state = applyEffects(state, [{ kind: "advanceWork", amount: 0, rehearsalAmount: 15 }]);

    expect(state.works[0].rehearsal).toBe(0);
    expect(state.works[1].rehearsal).toBe(25);
    expect(state.works[1].quality).toBe(58);
  });

  it("does not create a work for an unknown explicit workId", () => {
    let state = createInitialState("writer");
    state.works.push({
      id: "work.1",
      title: "雨后的失真",
      stage: "draft",
      sourceRiffIds: ["riff.1"],
      completion: 35,
      quality: 58,
      rehearsal: 0,
      styleTags: ["delay"],
      authorship: "shared",
      tension: 0
    });

    state = applyEffects(state, [{ kind: "advanceWork", workId: "work.missing", amount: 65, rehearsalAmount: 15 }]);

    expect(state.works).toHaveLength(1);
    expect(state.works[0].completion).toBe(35);
    expect(state.works[0].rehearsal).toBe(0);
  });

  it("creates a song when initial advanceWork completion reaches 100", () => {
    let state = createInitialState("writer");
    state = applyEffects(state, [
      { kind: "addRiff", riff: { titleSeed: "雨后的失真", quality: 24, styleTags: ["delay"], source: "write_riff" } }
    ]);

    state = applyEffects(state, [{ kind: "advanceWork", amount: 120, qualityAmount: 8 }]);

    expect(state.works[0].stage).toBe("song");
    expect(state.works[0].completion).toBe(100);
  });

  it("clamps new work tension to 100", () => {
    let state = createInitialState("writer");
    state = applyEffects(state, [
      { kind: "addRiff", riff: { titleSeed: "雨后的失真", quality: 24, styleTags: ["delay"], source: "write_riff" } }
    ]);

    state = applyEffects(state, [{ kind: "advanceWork", amount: 35, tensionAmount: 150 }]);

    expect(state.works[0].tension).toBe(100);
  });
});
