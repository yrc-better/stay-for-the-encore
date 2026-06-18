import { describe, expect, it } from "vitest";
import { EVENTS } from "./events";
import type { RouteId } from "../types";

describe("event content", () => {
  it("uses unique event and choice ids", () => {
    const eventIds = EVENTS.map((event) => event.id);
    const choiceIds = EVENTS.flatMap((event) => event.choices.map((choice) => `${event.id}.${choice.id}`));

    expect(new Set(eventIds).size).toBe(eventIds.length);
    expect(new Set(choiceIds).size).toBe(choiceIds.length);
  });

  it("provides playable choices with feedback text", () => {
    for (const event of EVENTS) {
      expect(event.title).not.toBe("");
      expect(event.title).not.toContain("剧情点");
      expect(event.body).not.toBe("");
      expect(event.category).toBeDefined();
      expect(event.choices.length).toBeGreaterThan(0);

      for (const choice of event.choices) {
        expect(choice.label).not.toBe("");
        expect(choice.feedback.title).not.toBe("");
        expect(choice.feedback.title).not.toContain("剧情点");
        expect(choice.feedback.body).not.toBe("");
      }
    }
  });

  it("includes the next story packs for sandbox career play", () => {
    const plannedEventIds = [
      "career.random.first_regular_fan",
      "career.random.fan_recording_clip",
      "career.rare.fan_chorus_moment",
      "career.random.label_a_and_r_email",
      "career.rare.contract_terms_table",
      "career.random.label_image_request",
      "career.anchor.first_contract_decision",
      "career.random.family_reality_question",
      "career.random.rent_due_rehearsal_week",
      "career.random.day_job_night_rehearsal",
      "career.random.style_no_longer_us",
      "career.random.electronic_texture_trial",
      "career.random.guitar_wall_or_space",
      "career.anchor.first_album_track_order",
      "career.random.studio_third_day",
      "career.rare.producer_cut_long_song",
      "career.anchor.master_submitted_night",
      "career.random.first_album_review",
      "career.random.old_song_rights_talk",
      "career.anchor.classic_catalog_tour",
      "career.random.turning_producer",
      "career.rare.young_band_cover",
      "career.anchor.comeback_old_faces"
    ];

    const eventIds = new Set(EVENTS.map((event) => event.id));

    for (const eventId of plannedEventIds) {
      expect(eventIds).toContain(eventId);
    }
  });

  it("gives random events complete sandbox metadata", () => {
    const randomEvents = EVENTS.filter((event) => event.category === "random" || event.category === "rare");

    expect(randomEvents.length).toBeGreaterThan(0);
    for (const event of randomEvents) {
      expect(event.weight).toBeGreaterThan(0);
      expect(event.cooldownMonths).toBeGreaterThan(0);
      expect(event.rarity).toBeDefined();
      expect(event.repeatable).toEqual(expect.any(Boolean));
    }
  });

  it("has at least three campus random events for each start route", () => {
    const routes: RouteId[] = ["technician", "writer", "performer", "rebel"];

    for (const route of routes) {
      const routeEvents = EVENTS.filter(
          (event) =>
            event.phase === "campus" &&
            event.category === "random" &&
            event.routes?.includes(route)
      );

      expect(routeEvents.length).toBeGreaterThanOrEqual(3);
    }
  });
});
