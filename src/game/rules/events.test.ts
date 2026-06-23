import { describe, expect, it } from "vitest";
import { EVENTS } from "../content/events";
import { createInitialState } from "../state/createInitialState";
import type { AnnualSummary, GameState } from "../types";
import { eventMatchesState, selectMonthlyEventIds } from "./eventSelection";
import { getAvailableEvents, triggerMatches } from "./events";

function summary(overrides: Partial<AnnualSummary> = {}): AnnualSummary {
  return {
    year: 2029,
    month: "2030-01",
    releases: 1,
    totalReleaseSales: 1800,
    bestReleaseCriticalScore: 72,
    performances: 3,
    averageRelationship: 55,
    healthDebt: 6,
    fame: 38,
    note: "这一年，乐队第一次有了可以回看的轮廓。",
    ...overrides
  };
}

function careerState(stage: GameState["careerStage"], month: GameState["month"]): GameState {
  const state = createInitialState("writer");
  state.month = month;
  state.phase = "career";
  state.careerStage = stage;
  state.flags["campus.graduationShowDone"] = true;
  return state;
}

describe("event triggers", () => {
  it("matches the prologue rehearsal event in 2027-05", () => {
    const state = createInitialState("writer");
    const events = getAvailableEvents(state);

    expect(events[0].id).toBe("prologue.rehearsal_argument");
  });

  it("treats falsy flag values as present for flagsAll", () => {
    const state = createInitialState("writer");

    for (const value of [false, 0, ""] as const) {
      const flag = `flag.all.${typeof value}`;
      state.flags[flag] = value;

      expect(triggerMatches(state, { flagsAll: [flag] })).toBe(true);
    }
  });

  it("treats falsy flag values as present for flagsNone", () => {
    const state = createInitialState("writer");

    for (const value of [false, 0, ""] as const) {
      const flag = `flag.none.${typeof value}`;
      state.flags[flag] = value;

      expect(triggerMatches(state, { flagsNone: [flag] })).toBe(false);
    }
  });

  it("supports exact flag value predicates for branching story consequences", () => {
    const state = createInitialState("writer");
    state.flags["label.firstContractResolved"] = "signed";

    expect(triggerMatches(state, { flagValues: { "label.firstContractResolved": "signed" } })).toBe(true);
    expect(triggerMatches(state, { flagValues: { "label.firstContractResolved": "independent" } })).toBe(false);
    expect(triggerMatches(state, { flagValues: { "label.missing": "signed" } })).toBe(false);
  });

  it("supports history tag predicates for sandbox aftermath events", () => {
    const state = createInitialState("writer");

    expect(triggerMatches(state, { historyTagMin: { tag: "festival", count: 1 } })).toBe(false);

    state.history.push({
      id: "history.festival.1",
      month: "2030-06",
      type: "performance",
      title: "音乐节侧台",
      description: "专辑把乐队带到音乐节侧台。",
      weight: 4,
      tags: ["career", "festival", "performance", "album"]
    });

    expect(triggerMatches(state, { historyTagMin: { tag: "festival", count: 1 } })).toBe(true);
    expect(triggerMatches(state, { historyTagMin: { tag: "festival", count: 2 } })).toBe(false);
    expect(triggerMatches(state, { historyTagMin: { tag: "tour", count: 1 } })).toBe(false);
  });

  it("excludes the prologue event when its done flag is present", () => {
    const state = createInitialState("writer");
    state.flags["prologue.rehearsalArgumentDone"] = false;

    expect(getAvailableEvents(state).map((event) => event.id)).not.toContain("prologue.rehearsal_argument");
  });

  it("shows the livehouse anchor only after the game reaches the early career phase", () => {
    const state = createInitialState("writer");
    state.month = "2027-06";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["career.hasLivehouseOffer"] = false;

    expect(getAvailableEvents(state).map((event) => event.id)).toContain("career.first_livehouse_offer");
  });

  it("supports stat and relationship threshold predicates", () => {
    const state = createInitialState("writer");

    expect(
      triggerMatches(state, {
        minPlayer: { creativity: 62 },
        maxPlayer: { stress: 28 },
        minBand: { cohesion: 52 },
        minRelationship: { bass: 54 }
      })
    ).toBe(true);
    expect(triggerMatches(state, { minPlayer: { creativity: 63 } })).toBe(false);
    expect(triggerMatches(state, { maxPlayer: { stress: 27 } })).toBe(false);
    expect(triggerMatches(state, { minBand: { cohesion: 53 } })).toBe(false);
    expect(triggerMatches(state, { minRelationship: { bass: 55 } })).toBe(false);
    expect(triggerMatches(state, { maxRelationship: { vocal: 46 } })).toBe(true);
    expect(triggerMatches(state, { maxRelationship: { vocal: 45 } })).toBe(false);
  });

  it("supports member status predicates", () => {
    const state = createInitialState("writer");

    expect(triggerMatches(state, { memberStatus: { bass: "active" } })).toBe(true);
    expect(triggerMatches(state, { memberStatus: { bass: "away" } })).toBe(false);

    state.memberStates.bass.status = "away";

    expect(triggerMatches(state, { memberStatus: { bass: "away" } })).toBe(true);
    expect(triggerMatches(state, { memberStatus: { bass: "active" } })).toBe(false);
  });

  it("supports hasDemo and minRecordings predicates", () => {
    const state = createInitialState("writer");
    state.recordings.push({
      id: "recording.1",
      createdAt: "2027-08",
      workId: "work.1",
      type: "demo",
      quality: 45,
      rawness: 55,
      released: false
    });

    expect(triggerMatches(state, { hasDemo: true, minRecordings: 1 })).toBe(true);
    expect(triggerMatches(state, { minRecordings: 2 })).toBe(false);
  });

  it("supports album release and media score predicates", () => {
    const state = createInitialState("writer");

    expect(triggerMatches(state, { hasAlbum: true })).toBe(false);
    expect(triggerMatches(state, { hasReleaseType: "single" })).toBe(false);
    expect(triggerMatches(state, { minReleases: 1 })).toBe(false);
    expect(triggerMatches(state, { minReleaseCriticalScore: 70 })).toBe(false);
    expect(triggerMatches(state, { minReleaseSales: 500 })).toBe(false);

    state.releases.push({
      id: "release.1",
      month: "2028-03",
      type: "single",
      title: "第一首单曲",
      recordingIds: ["recording.1"],
      sales: 600,
      criticalScore: 72,
      fameImpact: 10,
      awards: []
    });

    expect(triggerMatches(state, { hasAlbum: true })).toBe(false);
    expect(triggerMatches(state, { hasReleaseType: "single" })).toBe(true);
    expect(triggerMatches(state, { hasReleaseType: "album" })).toBe(false);
    expect(triggerMatches(state, { minReleases: 1 })).toBe(true);
    expect(triggerMatches(state, { minReleaseCriticalScore: 70 })).toBe(true);
    expect(triggerMatches(state, { minReleaseCriticalScore: 80 })).toBe(false);
    expect(triggerMatches(state, { minReleaseSales: 500 })).toBe(true);
    expect(triggerMatches(state, { minReleaseSales: 700 })).toBe(false);

    state.releases.push({
      id: "release.2",
      month: "2029-05",
      type: "album",
      title: "第一张长片",
      recordingIds: ["recording.2", "recording.3"],
      sales: 1800,
      criticalScore: 68,
      fameImpact: 12,
      awards: []
    });

    expect(triggerMatches(state, { hasAlbum: true })).toBe(true);
    expect(triggerMatches(state, { hasReleaseType: "album" })).toBe(true);
    expect(triggerMatches(state, { minReleases: 2 })).toBe(true);
  });

  it("supports annual summary predicates from the latest completed year", () => {
    const state = createInitialState("writer");

    expect(triggerMatches(state, { minAnnualSummaries: 1 })).toBe(false);

    state.annualSummaries.push(summary());

    expect(
      triggerMatches(state, {
        minAnnualSummaries: 1,
        minLastYearReleases: 1,
        minLastYearPerformances: 3,
        minLastYearReleaseSales: 1800,
        minLastYearCriticalScore: 72,
        minLastYearAverageRelationship: 55,
        maxLastYearHealthDebt: 6,
        minLastYearFame: 38
      })
    ).toBe(true);
    expect(triggerMatches(state, { minAnnualSummaries: 2 })).toBe(false);
    expect(triggerMatches(state, { minLastYearReleaseSales: 1801 })).toBe(false);
    expect(triggerMatches(state, { minLastYearCriticalScore: 73 })).toBe(false);
    expect(triggerMatches(state, { minLastYearAverageRelationship: 56 })).toBe(false);
    expect(triggerMatches(state, { maxLastYearHealthDebt: 5 })).toBe(false);
    expect(triggerMatches(state, { minLastYearFame: 39 })).toBe(false);
  });

  it("can select campus random events after the prologue anchor is resolved", () => {
    const state = createInitialState("writer");
    state.flags["prologue.rehearsalArgumentDone"] = true;

    const eventIds = selectMonthlyEventIds(state, EVENTS, { random: () => 0, maxRandomEvents: 2 });

    expect(eventIds.some((eventId) => eventId.startsWith("campus.random."))).toBe(true);
  });

  it("selects the graduation show anchor after the prologue conflict is resolved", () => {
    const state = createInitialState("writer");
    state.flags["prologue.rehearsalArgumentDone"] = true;

    const eventIds = selectMonthlyEventIds(state, EVENTS, { random: () => 0 });

    expect(eventIds[0]).toBe("campus.anchor.graduation_show");
  });

  it("provides a fallback first stage opportunity after a rough graduation", () => {
    const state = createInitialState("writer");
    state.month = "2027-06";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;
    state.flags["campus.graduationOutcome"] = "rough";

    const eventIds = selectMonthlyEventIds(state, EVENTS, { random: () => 0 });

    expect(eventIds[0]).toBe("career.fallback.first_open_stage");
  });

  it("can select early career random opportunities after the first stage is resolved", () => {
    const state = createInitialState("writer");
    state.month = "2027-07";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;
    state.flags["career.firstLivehouseDone"] = true;

    const eventIds = selectMonthlyEventIds(state, EVENTS, { random: () => 0, maxRandomEvents: 3 });

    expect(eventIds.some((eventId) => eventId.startsWith("career.random."))).toBe(true);
  });

  it("keeps festival and tour invitations locked until the band has an album", () => {
    const state = createInitialState("writer");
    state.month = "2030-06";
    state.phase = "career";
    state.careerStage = "rising";
    state.flags["campus.graduationShowDone"] = true;
    state.player.fame = 70;
    state.player.technique = 70;
    state.player.stage = 70;
    state.band.workQuality = 80;
    state.band.reputation = 70;
    state.band.fans = 900;
    state.band.funds = 2400;

    const festival = EVENTS.find((event) => event.id === "career.rare.festival_side_stage_invite");
    const tour = EVENTS.find((event) => event.id === "career.rare.album_tour_invite");

    expect(festival).toBeDefined();
    expect(tour).toBeDefined();
    expect(eventMatchesState(state, festival!)).toBe(false);
    expect(eventMatchesState(state, tour!)).toBe(false);
  });

  it("can match festival and tour invitations after a strong album release", () => {
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

    const festival = EVENTS.find((event) => event.id === "career.rare.festival_side_stage_invite");
    const tour = EVENTS.find((event) => event.id === "career.rare.album_tour_invite");

    expect(festival).toBeDefined();
    expect(tour).toBeDefined();
    expect(eventMatchesState(state, festival!)).toBe(true);
    expect(eventMatchesState(state, tour!)).toBe(true);
  });

  it("unlocks festival and tour aftermath from completed performance history", () => {
    const state = createInitialState("writer");
    state.month = "2030-08";
    state.phase = "career";
    state.careerStage = "rising";
    state.flags["campus.graduationShowDone"] = true;
    state.player.fame = 64;
    state.player.stage = 62;
    state.band.fans = 760;
    state.band.reputation = 58;

    const festivalAftermath = EVENTS.find((event) => event.id === "career.random.festival_afterglow_hangover");
    const tourAftermath = EVENTS.find((event) => event.id === "career.random.tour_van_silence");

    expect(festivalAftermath).toBeDefined();
    expect(tourAftermath).toBeDefined();
    expect(eventMatchesState(state, festivalAftermath!)).toBe(false);
    expect(eventMatchesState(state, tourAftermath!)).toBe(false);

    state.history.push({
      id: "history.festival.1",
      month: "2030-07",
      type: "performance",
      title: "音乐节侧台",
      description: "陌生观众从远处走近。",
      weight: 4,
      tags: ["career", "festival", "performance", "album"]
    });

    expect(eventMatchesState(state, festivalAftermath!)).toBe(true);
    expect(eventMatchesState(state, tourAftermath!)).toBe(false);

    state.history.push({
      id: "history.tour.1",
      month: "2030-07",
      type: "performance",
      title: "第一次专辑巡演",
      description: "几座城市把专辑变成路线。",
      weight: 5,
      tags: ["career", "tour", "performance", "album"]
    });

    expect(eventMatchesState(state, tourAftermath!)).toBe(true);
  });

  it("unlocks release reaction events from release results", () => {
    const state = createInitialState("writer");
    state.month = "2028-02";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;
    state.player.fame = 24;
    state.band.fans = 160;
    state.band.reputation = 28;

    const blogReview = EVENTS.find((event) => event.id === "career.random.first_release_blog_review");
    const commercialPressure = EVENTS.find((event) => event.id === "career.random.release_commercial_pressure");

    expect(blogReview).toBeDefined();
    expect(commercialPressure).toBeDefined();
    expect(eventMatchesState(state, blogReview!)).toBe(false);
    expect(eventMatchesState(state, commercialPressure!)).toBe(false);

    state.releases.push({
      id: "release.1",
      month: "2028-01",
      type: "single",
      title: "雨后的失真",
      recordingIds: ["recording.1"],
      sales: 900,
      criticalScore: 66,
      fameImpact: 8,
      awards: []
    });

    expect(eventMatchesState(state, blogReview!)).toBe(true);
    expect(eventMatchesState(state, commercialPressure!)).toBe(true);
  });

  it("unlocks album-specific producer attention after a strong album", () => {
    const state = createInitialState("writer");
    state.month = "2031-04";
    state.phase = "career";
    state.careerStage = "rising";
    state.flags["campus.graduationShowDone"] = true;
    state.player.fame = 42;
    state.band.fans = 600;
    state.band.reputation = 48;
    state.releases.push({
      id: "release.1",
      month: "2031-02",
      type: "single",
      title: "旧单曲",
      recordingIds: ["recording.1"],
      sales: 900,
      criticalScore: 72,
      fameImpact: 8,
      awards: []
    });

    const producerNote = EVENTS.find((event) => event.id === "career.rare.album_producer_note");

    expect(producerNote).toBeDefined();
    expect(eventMatchesState(state, producerNote!)).toBe(false);

    state.releases.push({
      id: "release.2",
      month: "2031-03",
      type: "album",
      title: "第一张长片",
      recordingIds: ["recording.2", "recording.3", "recording.4", "recording.5", "recording.6", "recording.7"],
      sales: 4200,
      criticalScore: 78,
      fameImpact: 16,
      awards: []
    });

    expect(eventMatchesState(state, producerNote!)).toBe(true);
  });

  it("unlocks fan stories from live proof, release proof, and visible audience growth", () => {
    const state = careerState("early", "2028-03");
    state.player.fame = 18;
    state.band.fans = 90;
    state.band.reputation = 20;

    const regularFan = EVENTS.find((event) => event.id === "career.random.first_regular_fan");
    const fanClip = EVENTS.find((event) => event.id === "career.random.fan_recording_clip");
    const chorusMoment = EVENTS.find((event) => event.id === "career.rare.fan_chorus_moment");
    const misreadLyric = EVENTS.find((event) => event.id === "career.random.fan_misread_lyric");
    const expectationPressure = EVENTS.find((event) => event.id === "career.random.fan_expectation_pressure");

    expect(regularFan).toBeDefined();
    expect(fanClip).toBeDefined();
    expect(chorusMoment).toBeDefined();
    expect(misreadLyric).toBeDefined();
    expect(expectationPressure).toBeDefined();
    expect(eventMatchesState(state, regularFan!)).toBe(true);
    expect(eventMatchesState(state, fanClip!)).toBe(false);
    expect(eventMatchesState(state, chorusMoment!)).toBe(false);
    expect(eventMatchesState(state, misreadLyric!)).toBe(false);
    expect(eventMatchesState(state, expectationPressure!)).toBe(false);

    state.releases.push({
      id: "release.1",
      month: "2028-02",
      type: "single",
      title: "雨后的失真",
      recordingIds: ["recording.1"],
      sales: 1200,
      criticalScore: 70,
      fameImpact: 8,
      awards: []
    });
    state.player.fame = 34;
    state.band.fans = 260;
    state.band.reputation = 32;
    state.band.workQuality = 62;

    expect(eventMatchesState(state, fanClip!)).toBe(true);
    expect(eventMatchesState(state, chorusMoment!)).toBe(true);
    expect(eventMatchesState(state, misreadLyric!)).toBe(false);
    expect(eventMatchesState(state, expectationPressure!)).toBe(false);

    state.flags["fan.firstRegularSeen"] = true;

    expect(eventMatchesState(state, misreadLyric!)).toBe(true);
    expect(eventMatchesState(state, expectationPressure!)).toBe(false);

    state.flags["fan.chorusMoment"] = true;
    state.player.fame = 40;
    state.band.fans = 460;
    state.band.reputation = 38;

    expect(eventMatchesState(state, expectationPressure!)).toBe(true);
  });

  it("keeps label and first contract stories locked behind release credibility", () => {
    const state = careerState("rising", "2030-05");
    state.player.fame = 42;
    state.band.fans = 520;
    state.band.reputation = 48;
    state.band.workQuality = 72;

    const labelEmail = EVENTS.find((event) => event.id === "career.random.label_a_and_r_email");
    const termsTable = EVENTS.find((event) => event.id === "career.rare.contract_terms_table");
    const firstContract = EVENTS.find((event) => event.id === "career.anchor.first_contract_decision");

    expect(labelEmail).toBeDefined();
    expect(termsTable).toBeDefined();
    expect(firstContract).toBeDefined();
    expect(eventMatchesState(state, labelEmail!)).toBe(false);
    expect(eventMatchesState(state, termsTable!)).toBe(false);
    expect(eventMatchesState(state, firstContract!)).toBe(false);

    state.releases.push({
      id: "release.1",
      month: "2030-03",
      type: "ep",
      title: "潮湿房间",
      recordingIds: ["recording.1", "recording.2", "recording.3"],
      sales: 1900,
      criticalScore: 73,
      fameImpact: 12,
      awards: []
    });

    expect(eventMatchesState(state, labelEmail!)).toBe(true);
    expect(eventMatchesState(state, termsTable!)).toBe(false);
    expect(eventMatchesState(state, firstContract!)).toBe(false);

    state.flags["label.aAndREmailReplied"] = true;

    expect(eventMatchesState(state, termsTable!)).toBe(true);
    expect(eventMatchesState(state, firstContract!)).toBe(false);

    state.flags["label.contractTermsDiscussed"] = true;

    expect(eventMatchesState(state, firstContract!)).toBe(true);
  });

  it("branches label aftermath stories based on the first contract decision", () => {
    const state = careerState("rising", "2030-09");
    state.player.fame = 45;
    state.band.fans = 520;
    state.band.reputation = 45;
    state.band.workQuality = 68;
    state.releases.push({
      id: "release.1",
      month: "2030-03",
      type: "ep",
      title: "潮湿房间",
      recordingIds: ["recording.1", "recording.2", "recording.3"],
      sales: 1900,
      criticalScore: 73,
      fameImpact: 12,
      awards: []
    });

    const deadlinePressure = EVENTS.find((event) => event.id === "career.random.label_deadline_pressure");
    const indieScramble = EVENTS.find((event) => event.id === "career.random.indie_distribution_scramble");

    expect(deadlinePressure).toBeDefined();
    expect(indieScramble).toBeDefined();
    expect(eventMatchesState(state, deadlinePressure!)).toBe(false);
    expect(eventMatchesState(state, indieScramble!)).toBe(false);

    state.flags["label.firstContractResolved"] = "signed";

    expect(eventMatchesState(state, deadlinePressure!)).toBe(true);
    expect(eventMatchesState(state, indieScramble!)).toBe(false);

    state.flags["label.firstContractResolved"] = "independent";

    expect(eventMatchesState(state, deadlinePressure!)).toBe(false);
    expect(eventMatchesState(state, indieScramble!)).toBe(true);
  });

  it("unlocks life pressure aftermath stories from prior life events", () => {
    const state = careerState("early", "2028-09");
    state.player.wealth = 520;
    state.player.stress = 48;
    state.player.fame = 22;
    state.band.funds = 360;
    state.band.workQuality = 52;

    const familyQuestion = EVENTS.find((event) => event.id === "career.random.family_reality_question");
    const rentWeek = EVENTS.find((event) => event.id === "career.random.rent_due_rehearsal_week");
    const dayJobNight = EVENTS.find((event) => event.id === "career.random.day_job_night_rehearsal");
    const familyVisit = EVENTS.find((event) => event.id === "career.random.family_backstage_visit");
    const rentWarning = EVENTS.find((event) => event.id === "career.random.rent_noise_warning");
    const dayJobRecording = EVENTS.find((event) => event.id === "career.random.day_job_before_recording");

    expect(familyQuestion).toBeDefined();
    expect(rentWeek).toBeDefined();
    expect(dayJobNight).toBeDefined();
    expect(familyVisit).toBeDefined();
    expect(rentWarning).toBeDefined();
    expect(dayJobRecording).toBeDefined();
    expect(familyQuestion!.choices.every((choice) => choice.effects.some((effect) => effect.kind === "flag" && effect.key === "life.familyRealityQuestioned"))).toBe(true);
    expect(rentWeek!.choices.every((choice) => choice.effects.some((effect) => effect.kind === "flag" && effect.key === "life.rentPressureFelt"))).toBe(true);
    expect(dayJobNight!.choices.every((choice) => choice.effects.some((effect) => effect.kind === "flag" && effect.key === "life.dayJobRehearsalStrain"))).toBe(true);
    expect(eventMatchesState(state, familyVisit!)).toBe(false);
    expect(eventMatchesState(state, rentWarning!)).toBe(false);
    expect(eventMatchesState(state, dayJobRecording!)).toBe(false);

    state.flags["life.familyRealityQuestioned"] = "honest";

    expect(eventMatchesState(state, familyVisit!)).toBe(true);
    expect(eventMatchesState(state, rentWarning!)).toBe(false);
    expect(eventMatchesState(state, dayJobRecording!)).toBe(false);

    state.flags["life.rentPressureFelt"] = "extra_show";

    expect(eventMatchesState(state, rentWarning!)).toBe(true);
    expect(eventMatchesState(state, dayJobRecording!)).toBe(false);

    state.flags["life.dayJobRehearsalStrain"] = "pushed";

    expect(eventMatchesState(state, dayJobRecording!)).toBe(true);
  });

  it("unlocks first album story beats from album-level release progress", () => {
    const state = careerState("rising", "2030-07");
    state.player.fame = 38;
    state.band.fans = 420;
    state.band.reputation = 42;
    state.band.workQuality = 68;

    const trackOrder = EVENTS.find((event) => event.id === "career.anchor.first_album_track_order");
    const masterNight = EVENTS.find((event) => event.id === "career.anchor.master_submitted_night");
    const albumReview = EVENTS.find((event) => event.id === "career.random.first_album_review");
    const sequenceSecondGuess = EVENTS.find((event) => event.id === "career.random.album_sequence_second_guess");
    const reviewAftertaste = EVENTS.find((event) => event.id === "career.random.album_review_aftertaste");

    expect(trackOrder).toBeDefined();
    expect(masterNight).toBeDefined();
    expect(albumReview).toBeDefined();
    expect(sequenceSecondGuess).toBeDefined();
    expect(reviewAftertaste).toBeDefined();
    expect(eventMatchesState(state, trackOrder!)).toBe(false);
    expect(eventMatchesState(state, masterNight!)).toBe(false);
    expect(eventMatchesState(state, albumReview!)).toBe(false);
    expect(eventMatchesState(state, sequenceSecondGuess!)).toBe(false);
    expect(eventMatchesState(state, reviewAftertaste!)).toBe(false);

    state.recordings.push(
      {
        id: "recording.1",
        createdAt: "2030-04",
        workId: "work.1",
        type: "album_track",
        quality: 70,
        rawness: 45,
        released: false
      },
      {
        id: "recording.2",
        createdAt: "2030-05",
        workId: "work.2",
        type: "album_track",
        quality: 72,
        rawness: 42,
        released: false
      },
      {
        id: "recording.3",
        createdAt: "2030-06",
        workId: "work.3",
        type: "album_track",
        quality: 68,
        rawness: 48,
        released: false
      }
    );

    expect(eventMatchesState(state, trackOrder!)).toBe(true);
    expect(eventMatchesState(state, masterNight!)).toBe(false);

    state.flags["album.firstTrackOrderLocked"] = true;

    expect(eventMatchesState(state, masterNight!)).toBe(true);
    expect(eventMatchesState(state, sequenceSecondGuess!)).toBe(true);
    expect(eventMatchesState(state, albumReview!)).toBe(false);
    expect(eventMatchesState(state, reviewAftertaste!)).toBe(false);

    state.releases.push({
      id: "release.1",
      month: "2030-08",
      type: "album",
      title: "第一张长片",
      recordingIds: ["recording.1", "recording.2", "recording.3"],
      sales: 2600,
      criticalScore: 76,
      fameImpact: 18,
      awards: []
    });

    expect(eventMatchesState(state, albumReview!)).toBe(true);
    expect(eventMatchesState(state, reviewAftertaste!)).toBe(false);

    state.flags["album.firstReviewSeen"] = true;

    expect(eventMatchesState(state, reviewAftertaste!)).toBe(true);
  });

  it("unlocks member risk events from low relationships and high pressure", () => {
    const state = createInitialState("writer");
    state.month = "2028-04";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;
    state.player.stress = 62;
    state.relationships.vocal = 31;
    state.relationships.bass = 36;
    state.relationships.drums = 34;

    const vocalRisk = EVENTS.find((event) => event.id === "career.random.member_vocal_ownership_conflict");
    const bassRisk = EVENTS.find((event) => event.id === "career.random.member_bass_silent_balance");
    const drumsRisk = EVENTS.find((event) => event.id === "career.random.member_drums_missed_rehearsal");

    expect(vocalRisk).toBeDefined();
    expect(bassRisk).toBeDefined();
    expect(drumsRisk).toBeDefined();
    expect(eventMatchesState(state, vocalRisk!)).toBe(true);
    expect(eventMatchesState(state, bassRisk!)).toBe(true);
    expect(eventMatchesState(state, drumsRisk!)).toBe(true);

    state.relationships.vocal = 60;
    state.relationships.bass = 60;
    state.relationships.drums = 60;
    state.player.stress = 20;

    expect(eventMatchesState(state, vocalRisk!)).toBe(false);
    expect(eventMatchesState(state, bassRisk!)).toBe(false);
    expect(eventMatchesState(state, drumsRisk!)).toBe(false);
  });

  it("member risk choices can push teammates into strained status", () => {
    const bassRisk = EVENTS.find((event) => event.id === "career.random.member_bass_silent_balance");
    const distantChoice = bassRisk?.choices.find((choice) => choice.id === "leave_bass_to_handle_it");

    expect(distantChoice?.effects).toContainEqual({
      kind: "memberStatus",
      character: "bass",
      status: "strained",
      note: "周航还在按时出现，但他开始把真正的疲惫藏到最安静的地方。"
    });
  });

  it("unlocks a bass temporary leave story after sustained strain", () => {
    const state = createInitialState("writer");
    state.month = "2028-05";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;
    state.flags["member.bassCarriesTooMuch"] = true;
    state.player.stress = 70;
    state.relationships.bass = 24;
    state.memberStates.bass.status = "strained";

    const leaveEvent = EVENTS.find((event) => event.id === "career.rare.member_bass_temporary_leave");

    expect(leaveEvent).toBeDefined();
    expect(eventMatchesState(state, leaveEvent!)).toBe(true);
  });

  it("unlocks a return or session bassist story while bass is away", () => {
    const state = createInitialState("writer");
    state.month = "2028-06";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;
    state.flags["member.bassTemporaryLeave"] = true;
    state.memberStates.bass.status = "away";

    const returnEvent = EVENTS.find((event) => event.id === "career.fallback.member_bass_return_or_session");

    expect(returnEvent).toBeDefined();
    expect(eventMatchesState(state, returnEvent!)).toBe(true);
  });

  it("unlocks a vocalist authorship showdown after sustained strain and rising attention", () => {
    const state = createInitialState("writer");
    state.month = "2028-08";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;
    state.flags["member.vocalOwnershipWound"] = true;
    state.player.fame = 28;
    state.relationships.vocal = 24;
    state.band.workQuality = 58;
    state.memberStates.vocal.status = "strained";

    const showdown = EVENTS.find((event) => event.id === "career.rare.member_vocal_authorship_showdown");

    expect(showdown).toBeDefined();
    expect(eventMatchesState(state, showdown!)).toBe(true);
  });

  it("unlocks a drummer burnout story after sustained strain and high pressure", () => {
    const state = createInitialState("writer");
    state.month = "2028-09";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;
    state.flags["member.drumsFallingBehind"] = true;
    state.player.stress = 72;
    state.relationships.drums = 25;
    state.memberStates.drums.status = "strained";

    const burnout = EVENTS.find((event) => event.id === "career.rare.member_drums_burnout_break");

    expect(burnout).toBeDefined();
    expect(eventMatchesState(state, burnout!)).toBe(true);
  });

  it("unlocks the rising annual review after the band has a strong completed year", () => {
    const state = careerState("rising", "2030-06");
    state.player.fame = 42;
    state.band.reputation = 44;
    state.annualSummaries.push(
      summary({
        releases: 1,
        totalReleaseSales: 2600,
        bestReleaseCriticalScore: 74,
        performances: 4,
        averageRelationship: 58,
        healthDebt: 5,
        fame: 42
      })
    );

    const annualReview = EVENTS.find((event) => event.id === "career.anchor.rising_annual_review");

    expect(annualReview).toBeDefined();
    expect(eventMatchesState(state, annualReview!)).toBe(true);

    state.annualSummaries = [];

    expect(eventMatchesState(state, annualReview!)).toBe(false);
  });

  it("unlocks the mature catalog crossroads from accumulated yearly proof", () => {
    const state = careerState("mature", "2035-02");
    state.player.fame = 60;
    state.band.reputation = 62;
    state.band.fans = 1200;
    state.annualSummaries.push(
      summary({ year: 2032, month: "2033-01", totalReleaseSales: 2400, performances: 3, fame: 48 }),
      summary({ year: 2033, month: "2034-01", totalReleaseSales: 3200, performances: 4, fame: 54 }),
      summary({
        year: 2034,
        month: "2035-01",
        releases: 2,
        totalReleaseSales: 5200,
        bestReleaseCriticalScore: 80,
        performances: 5,
        averageRelationship: 57,
        healthDebt: 8,
        fame: 60
      })
    );

    const crossroads = EVENTS.find((event) => event.id === "career.anchor.mature_catalog_crossroads");

    expect(crossroads).toBeDefined();
    expect(eventMatchesState(state, crossroads!)).toBe(true);

    state.annualSummaries[state.annualSummaries.length - 1] = summary({
      year: 2034,
      month: "2035-01",
      totalReleaseSales: 900,
      performances: 2,
      fame: 35
    });

    expect(eventMatchesState(state, crossroads!)).toBe(false);
  });

  it("unlocks the late legacy question after many years on the road", () => {
    const state = careerState("late", "2043-03");
    state.player.fame = 72;
    state.band.reputation = 70;
    state.annualSummaries = Array.from({ length: 10 }, (_, index) =>
      summary({
        year: 2032 + index,
        month: `${2033 + index}-01`,
        releases: index % 2 === 0 ? 1 : 0,
        totalReleaseSales: 1600 + index * 300,
        bestReleaseCriticalScore: 68 + index,
        performances: 2 + (index % 3),
        averageRelationship: 52,
        healthDebt: 12,
        fame: 44 + index * 3
      })
    );

    const legacy = EVENTS.find((event) => event.id === "career.anchor.late_legacy_question");

    expect(legacy).toBeDefined();
    expect(eventMatchesState(state, legacy!)).toBe(true);

    state.annualSummaries = state.annualSummaries.slice(0, 9);

    expect(eventMatchesState(state, legacy!)).toBe(false);
  });

  it("unlocks the farewell show only after the player requests it", () => {
    const state = careerState("late", "2039-04");
    const farewell = EVENTS.find((event) => event.id === "career.fallback.farewell_show");

    expect(farewell).toBeDefined();
    expect(eventMatchesState(state, farewell!)).toBe(false);

    state.flags["career.farewellShowRequested"] = true;

    expect(eventMatchesState(state, farewell!)).toBe(true);
    expect(farewell!.category).toBe("fallback");
    expect(farewell!.choices.some((choice) => choice.endingTrigger === "farewell")).toBe(true);
  });

  it("unlocks retirement only after the player requests it", () => {
    const state = careerState("early", "2028-04");
    const retirement = EVENTS.find((event) => event.id === "career.fallback.retirement_night");

    expect(retirement).toBeDefined();
    expect(eventMatchesState(state, retirement!)).toBe(false);

    state.flags["career.retirementRequested"] = true;

    expect(eventMatchesState(state, retirement!)).toBe(true);
    expect(retirement!.category).toBe("fallback");
    expect(retirement!.choices.some((choice) => choice.endingTrigger === "retirement")).toBe(true);
  });

  it("unlocks a health collapse ending story from low health and high pressure", () => {
    const state = careerState("early", "2028-08");
    const collapse = EVENTS.find((event) => event.id === "career.fallback.health_collapse");

    expect(collapse).toBeDefined();
    expect(eventMatchesState(state, collapse!)).toBe(false);

    state.player.health = 18;
    state.player.stress = 86;

    expect(eventMatchesState(state, collapse!)).toBe(true);
    expect(collapse!.category).toBe("fallback");
    expect(collapse!.choices.some((choice) => choice.endingTrigger === "healthCollapse")).toBe(true);

    state.player.health = 35;

    expect(eventMatchesState(state, collapse!)).toBe(false);
  });

  it("prioritizes a health warning before the health collapse ending story", () => {
    const state = careerState("early", "2028-08");
    state.player.health = 18;
    state.player.stress = 86;

    const warning = EVENTS.find((event) => event.id === "career.fallback.health_warning");

    expect(warning).toBeDefined();
    expect(eventMatchesState(state, warning!)).toBe(true);
    expect(warning!.choices.some((choice) => choice.endingTrigger)).toBe(false);
    expect(getAvailableEvents(state)[0].id).toBe("career.fallback.health_warning");
  });

  it("unlocks a band breakup ending story from broken member relationships", () => {
    const state = careerState("early", "2028-09");
    const breakup = EVENTS.find((event) => event.id === "career.fallback.band_breakup");

    expect(breakup).toBeDefined();
    expect(eventMatchesState(state, breakup!)).toBe(false);

    state.relationships.vocal = 18;
    state.relationships.bass = 19;
    state.relationships.drums = 20;

    expect(eventMatchesState(state, breakup!)).toBe(true);
    expect(breakup!.category).toBe("fallback");
    expect(breakup!.choices.some((choice) => choice.endingTrigger === "bandBreakup")).toBe(true);

    state.relationships.bass = 30;

    expect(eventMatchesState(state, breakup!)).toBe(false);
  });

  it("prioritizes a breakup warning before the band breakup ending story", () => {
    const state = careerState("early", "2028-09");
    state.relationships.vocal = 18;
    state.relationships.bass = 19;
    state.relationships.drums = 20;

    const warning = EVENTS.find((event) => event.id === "career.fallback.breakup_warning");

    expect(warning).toBeDefined();
    expect(eventMatchesState(state, warning!)).toBe(true);
    expect(warning!.choices.some((choice) => choice.endingTrigger)).toBe(false);
    expect(getAvailableEvents(state)[0].id).toBe("career.fallback.breakup_warning");
  });

  it("can select mature random events from the annual summary pool", () => {
    const state = careerState("mature", "2035-05");
    state.player.fame = 58;
    state.band.reputation = 58;
    state.band.fans = 900;
    state.annualSummaries.push(
      summary({
        year: 2034,
        month: "2035-01",
        releases: 2,
        totalReleaseSales: 4800,
        bestReleaseCriticalScore: 78,
        performances: 4,
        fame: 58
      })
    );

    const matureEvent = EVENTS.find((event) => event.id === "career.random.mature_catalog_audit");
    expect(matureEvent).toBeDefined();

    const eventIds = selectMonthlyEventIds(state, [matureEvent!], { random: () => 0, maxRandomEvents: 1 });

    expect(eventIds).toContain("career.random.mature_catalog_audit");
  });
});
