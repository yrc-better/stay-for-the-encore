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

type CurrentState = ReturnType<typeof createInitialState>;
type LegacyState = Partial<Record<keyof CurrentState, unknown>> & {
  monthly?: Partial<Record<keyof CurrentState["monthly"], unknown>>;
};

function legacyStateWithoutAbilityProgress(): LegacyState {
  const state = createInitialState("writer");
  const legacyState: LegacyState = { ...state, monthly: { ...state.monthly } };
  delete legacyState.abilityProgress;
  delete legacyState.monthly?.abilityProgressGains;
  return legacyState;
}

function legacyStateWithoutMemberStates(): LegacyState {
  const legacyState: LegacyState = { ...createInitialState("writer") };
  delete legacyState.memberStates;
  return legacyState;
}

function legacyStateWithoutAnnualSummaries(): LegacyState {
  const legacyState: LegacyState = { ...createInitialState("writer") };
  delete legacyState.annualSummaries;
  return legacyState;
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
    expect(loaded?.state.bandName).toBe("未命名乐队");
  });

  it("loads old saves without a band name using the default name", () => {
    const payload = validPayload();
    const { bandName: _bandName, ...legacyState } = payload.state;
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...payload, state: legacyState }));

    const loaded = loadSave();

    expect(loaded?.state.bandName).toBe("未命名乐队");
  });

  it("migrates version 1 saves into phase-aware state", () => {
    const legacyState = legacyStateWithoutAbilityProgress();
    delete legacyState.phase;
    delete legacyState.careerStage;
    delete legacyState.eventLog;
    delete legacyState.eventCooldowns;
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        createdAt: "2027-05-01T00:00:00.000Z",
        updatedAt: "2027-05-01T00:00:00.000Z",
        state: legacyState
      })
    );

    const loaded = loadSave();

    expect(loaded?.version).toBe(SAVE_VERSION);
    expect(loaded?.state.phase).toBe("campus");
    expect(loaded?.state.careerStage).toBe("campus");
    expect(loaded?.state.eventLog).toEqual([]);
    expect(loaded?.state.eventCooldowns).toEqual({});
    expect(loaded?.state.abilityProgress).toEqual({ technique: 0, creativity: 0, stage: 0 });
    expect(loaded?.state.monthly.abilityProgressGains).toEqual({ technique: 0, creativity: 0, stage: 0 });
  });

  it("migrates version 2 saves into long-term ability progress state", () => {
    const legacyState = legacyStateWithoutAbilityProgress();
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 2,
        createdAt: "2027-05-01T00:00:00.000Z",
        updatedAt: "2027-05-01T00:00:00.000Z",
        state: legacyState
      })
    );

    const loaded = loadSave();

    expect(loaded?.version).toBe(SAVE_VERSION);
    expect(loaded?.state.abilityProgress).toEqual({ technique: 0, creativity: 0, stage: 0 });
    expect(loaded?.state.monthly.abilityProgressGains).toEqual({ technique: 0, creativity: 0, stage: 0 });
  });

  it("migrates version 3 saves into member state", () => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 3,
        createdAt: "2027-05-01T00:00:00.000Z",
        updatedAt: "2027-05-01T00:00:00.000Z",
        state: legacyStateWithoutMemberStates()
      })
    );

    const loaded = loadSave();

    expect(loaded?.version).toBe(SAVE_VERSION);
    expect(loaded?.state.memberStates.bass).toEqual({
      status: "active",
      note: "周航像队内的秤，习惯先稳住所有人的重量。",
      updatedAt: "2027-05"
    });
  });

  it("migrates version 4 saves into annual summaries state", () => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 4,
        createdAt: "2027-05-01T00:00:00.000Z",
        updatedAt: "2027-05-01T00:00:00.000Z",
        state: legacyStateWithoutAnnualSummaries()
      })
    );

    const loaded = loadSave();

    expect(loaded?.version).toBe(SAVE_VERSION);
    expect(loaded?.state.annualSummaries).toEqual([]);
  });

  it("rejects current saves with missing member state", () => {
    const payload = validPayload();
    const { memberStates: _memberStates, ...state } = payload.state;
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...payload, state }));

    expect(loadSave()).toBeNull();
  });

  it("rejects current saves with missing annual summaries", () => {
    const payload = validPayload();
    const { annualSummaries: _annualSummaries, ...state } = payload.state;
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...payload, state }));

    expect(loadSave()).toBeNull();
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

  it("rejects saves with missing monthly counters", () => {
    const payload = validPayload();
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...payload, state: { ...payload.state, monthly: {} } }));

    expect(loadSave()).toBeNull();
  });

  it("rejects current saves with missing ability progress", () => {
    const payload = validPayload();
    const { abilityProgress: _abilityProgress, ...state } = payload.state;
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...payload, state }));

    expect(loadSave()).toBeNull();
  });

  it("rejects saves with null history entries", () => {
    const payload = validPayload();
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...payload, state: { ...payload.state, history: [null] } }));

    expect(loadSave()).toBeNull();
  });

  it("rejects saves with null works", () => {
    const payload = validPayload();
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...payload, state: { ...payload.state, works: [null] } }));

    expect(loadSave()).toBeNull();
  });

  it("rejects saves with null queued events", () => {
    const payload = validPayload();
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...payload, state: { ...payload.state, queuedEvents: [null] } }));

    expect(loadSave()).toBeNull();
  });

  it("rejects saves with empty equipment", () => {
    const payload = validPayload();
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...payload, state: { ...payload.state, equipment: {} } }));

    expect(loadSave()).toBeNull();
  });

  it("rejects saves with missing guitar equipment", () => {
    const payload = validPayload();
    const { guitar: _guitar, ...equipment } = payload.state.equipment;
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...payload, state: { ...payload.state, equipment } }));

    expect(loadSave()).toBeNull();
  });

  it("rejects saves with non-array pedals", () => {
    const payload = validPayload();
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        ...payload,
        state: { ...payload.state, equipment: { ...payload.state.equipment, pedals: {} } }
      })
    );

    expect(loadSave()).toBeNull();
  });

  it("rejects saves with a pedal missing a string name", () => {
    const payload = validPayload();
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        ...payload,
        state: { ...payload.state, equipment: { ...payload.state.equipment, pedals: [{ name: null }] } }
      })
    );

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
