import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
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
  afterEach(() => vi.useRealTimers());

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

  it("rejects saves with invalid createdAt timestamp strings", () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...validPayload(), createdAt: "not-a-date" }));

    expect(loadSave()).toBeNull();
  });

  it("rejects saves with invalid updatedAt timestamp strings", () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...validPayload(), updatedAt: "not-a-date" }));

    expect(loadSave()).toBeNull();
  });

  it("rejects saves with impossible createdAt calendar dates", () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...validPayload(), createdAt: "2027-02-31T00:00:00.000Z" }));

    expect(loadSave()).toBeNull();
  });

  it("rejects saves with impossible updatedAt calendar dates", () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...validPayload(), updatedAt: "2027-02-31T00:00:00.000Z" }));

    expect(loadSave()).toBeNull();
  });

  it("preserves createdAt across saves", () => {
    const firstTime = new Date("2027-05-01T00:00:00.000Z");
    const secondTime = new Date("2027-05-02T03:04:05.006Z");
    vi.useFakeTimers();
    vi.setSystemTime(firstTime);

    saveGame(createInitialState("writer"));
    const first = loadSave();

    vi.setSystemTime(secondTime);
    saveGame(createInitialState("performer"));
    const second = loadSave();

    expect(first?.createdAt).toBe(firstTime.toISOString());
    expect(first?.updatedAt).toBe(firstTime.toISOString());
    expect(second?.createdAt).toBe(first?.createdAt);
    expect(second?.updatedAt).toBe(secondTime.toISOString());
    expect(second?.updatedAt).not.toBe(first?.updatedAt);
    expect(second?.state.route).toBe("performer");
  });

  it("clears saves", () => {
    saveGame(createInitialState("writer"));
    clearSave();

    expect(loadSave()).toBeNull();
  });
});
