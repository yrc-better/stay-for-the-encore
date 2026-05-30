import { describe, expect, it, beforeEach } from "vitest";
import { createInitialState } from "../state/createInitialState";
import { clearSave, loadSave, saveGame, SAVE_KEY, SAVE_VERSION } from "./saveGame";

function validPayload() {
  return {
    version: SAVE_VERSION,
    createdAt: "2027-05-01T00:00:00.000Z",
    updatedAt: "2027-05-01T00:00:00.000Z",
    state: createInitialState("writer")
  };
}

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
    const { version, ...payload } = validPayload();
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));

    expect(loadSave()).toBeNull();
  });

  it("rejects wrong version saves", () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...validPayload(), version: SAVE_VERSION + 1 }));

    expect(loadSave()).toBeNull();
  });

  it("rejects missing state saves", () => {
    const { state, ...payload } = validPayload();
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));

    expect(loadSave()).toBeNull();
  });

  it("rejects invalid JSON saves", () => {
    localStorage.setItem(SAVE_KEY, "{not valid json");

    expect(loadSave()).toBeNull();
  });

  it("rejects malformed state shape saves", () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...validPayload(), state: {} }));

    expect(loadSave()).toBeNull();
  });

  it("rejects saves with malformed timestamps", () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...validPayload(), createdAt: null }));

    expect(loadSave()).toBeNull();
  });

  it("preserves createdAt across saves", () => {
    saveGame(createInitialState("writer"));
    const first = loadSave();

    saveGame(createInitialState("performer"));
    const second = loadSave();

    expect(second?.createdAt).toBe(first?.createdAt);
    expect(second?.updatedAt).toEqual(expect.any(String));
    expect(second?.state.route).toBe("performer");
  });

  it("clears saves", () => {
    saveGame(createInitialState("writer"));
    clearSave();

    expect(loadSave()).toBeNull();
  });
});
