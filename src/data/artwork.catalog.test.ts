import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALBUM_COVERS,
  ENDING_ARTWORK,
  EVENT_POOL_ARTWORK,
  GENRE_ARTWORK,
  LEGACY_PORTRAITS,
  OPENING_ARTWORK,
  SPECIAL_EVENT_IDS,
  VENUE_ARTWORK,
  portraitArtwork,
  resolveEndingArtwork,
  resolveEventArtwork,
  type ArtworkResource,
} from "./artwork";
import { PLAYER_AVATARS } from "./avatars";
import { CANDIDATES } from "./candidates";
import { EVENTS } from "./events";

const root = process.cwd();

function localPath(src: string): string {
  return join(root, "public", src.replace(/^\//u, ""));
}

function expectWebp(resource: ArtworkResource, variants: readonly number[] = []) {
  const variantSources = variants.map((width) =>
    resource.src.replace(/\.webp$/u, `-${width}.webp`),
  );
  const sources = [
    resource.src,
    ...variantSources,
  ];
  if (variants.length > 0) {
    const declaredSources = resource.srcSet
      ?.split(",")
      .map((entry) => entry.trim().split(/\s+/u)[0]);
    expect(declaredSources, `${resource.src} srcSet`).toEqual([
      ...variantSources,
      resource.src,
    ]);
    expect(resource.sizes, `${resource.src} sizes`).toBeTruthy();
  }
  for (const src of sources) {
    const path = localPath(src);
    expect(statSync(path).size, src).toBeGreaterThan(1_500);
    const header = readFileSync(path).subarray(0, 12);
    expect(header.subarray(0, 4).toString("ascii"), src).toBe("RIFF");
    expect(header.subarray(8, 12).toString("ascii"), src).toBe("WEBP");
  }
}

describe("production artwork catalog", () => {
  it("ships all 18 formal portraits plus four legacy-save portraits", () => {
    const formal = [
      ...PLAYER_AVATARS.map((avatar) => avatar.portrait),
      ...CANDIDATES.map((candidate) => candidate.portrait),
    ];
    expect(formal).toHaveLength(18);
    expect(new Set(formal.map((portrait) => portrait.futureAssetPath)).size).toBe(
      18,
    );
    for (const portrait of formal) {
      expect(portrait.available).toBe(true);
      expectWebp(portraitArtwork(portrait), [256, 512]);
    }

    const legacy = Object.values(LEGACY_PORTRAITS);
    expect(legacy).toHaveLength(4);
    for (const portrait of legacy) expectWebp(portrait, [256, 512]);
  });

  it("ships every genre-specific album cover and opening illustration", () => {
    const covers = Object.values(ALBUM_COVERS);
    expect(covers).toHaveLength(12);
    expect(new Set(covers.map((cover) => cover.src)).size).toBe(12);
    for (const cover of covers) expectWebp(cover, [256, 512]);

    expect(Object.values(GENRE_ARTWORK)).toHaveLength(4);
    for (const artwork of Object.values(GENRE_ARTWORK)) {
      expectWebp(artwork, [512]);
    }
    expect(Object.values(OPENING_ARTWORK)).toHaveLength(2);
    for (const artwork of Object.values(OPENING_ARTWORK)) {
      expectWebp(artwork, [512]);
    }
  });

  it("maps all 60 events and gives every priority story its own scene", () => {
    expect(EVENTS).toHaveLength(60);
    expect(Object.values(EVENT_POOL_ARTWORK)).toHaveLength(8);
    expect(SPECIAL_EVENT_IDS.size).toBe(28);

    const mapped = EVENTS.map((event) => ({
      event,
      artwork: resolveEventArtwork(event),
    }));
    expect(mapped.every(({ artwork }) => artwork.src.endsWith(".webp"))).toBe(
      true,
    );
    for (const artwork of Object.values(EVENT_POOL_ARTWORK)) {
      expectWebp(artwork, [512]);
    }
    for (const { event, artwork } of mapped) {
      if (SPECIAL_EVENT_IDS.has(event.id)) {
        expect(artwork.src).toBe(`/assets/events/special/${event.id}.webp`);
        expectWebp(artwork, [512]);
      }
    }
  });

  it("ships all five venue levels and nine ending posters", () => {
    expect(Object.values(VENUE_ARTWORK)).toHaveLength(5);
    for (const artwork of Object.values(VENUE_ARTWORK)) {
      expectWebp(artwork, [512]);
    }

    const endingTitles = Object.keys(ENDING_ARTWORK);
    expect(endingTitles).toHaveLength(9);
    const endings = endingTitles.map(resolveEndingArtwork);
    expect(new Set(endings.map((artwork) => artwork.src)).size).toBe(9);
    for (const artwork of endings) expectWebp(artwork, [512]);
  });
});
