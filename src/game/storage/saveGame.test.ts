import { describe, expect, it, beforeEach } from "vitest";
import { createInitialState } from "../state/createInitialState";
import { clearSave, loadSave, saveGame, SAVE_VERSION } from "./saveGame";

describe("saveGame storage", () => {
  beforeEach(() => localStorage.clear());

  it("saves and loads versioned game state", () => {
    const state = createInitialState("writer");

    saveGame(state);
    const loaded = loadSave();

    expect(loaded?.version).toBe(SAVE_VERSION);
    expect(loaded?.state.route).toBe("writer");
  });

  it("rejects missing version saves", () => {
    localStorage.setItem("band-simulator-save", JSON.stringify({ state: createInitialState("writer") }));

    expect(loadSave()).toBeNull();
  });

  it("clears saves", () => {
    saveGame(createInitialState("writer"));
    clearSave();

    expect(loadSave()).toBeNull();
  });
});
