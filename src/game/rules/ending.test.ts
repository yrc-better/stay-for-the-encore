import { describe, expect, it } from "vitest";
import { createInitialState } from "../state/createInitialState";
import { evaluateEnding } from "./ending";

describe("evaluateEnding", () => {
  it("selects technical master when technique dominates", () => {
    const state = createInitialState("technician");
    state.player.technique = 88;
    state.recordings.push({
      id: "recording.1",
      createdAt: "2027-08",
      workId: "work.1",
      type: "demo",
      quality: 70,
      rawness: 30,
      released: false
    });

    const ending = evaluateEnding(state, "retirement");

    expect(ending.titleId).toBe("technical_master");
    expect(ending.trigger).toBe("retirement");
  });

  it("does not need gameplay UI tendency state", () => {
    const state = createInitialState("writer");
    state.player.creativity = 82;
    state.band.workQuality = 70;

    const ending = evaluateEnding(state, "preview");

    expect(ending.titleId).toBe("sound_shaper");
  });
});
