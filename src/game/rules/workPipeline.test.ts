import { describe, expect, it } from "vitest";
import { createInitialState } from "../state/createInitialState";
import { applyEffects } from "./effects";
import { createRecording } from "./recording";

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
});
