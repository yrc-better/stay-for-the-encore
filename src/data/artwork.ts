import type { EventContent, EventPool, GenreId, PortraitResource } from "./types";
import { resolvePublicPath } from "../config/runtime";

export interface ArtworkResource {
  src: string;
  alt: string;
  width: number;
  height: number;
  srcSet?: string;
  sizes?: string;
  focalPoint?: string;
}

const webpVariant = (src: string, width: 256 | 512): string =>
  src.replace(/\.webp$/u, `-${width}.webp`);

const artworkPath = (path: string): string => resolvePublicPath(path);

const webpSrcSet = (
  src: string,
  variants: readonly (256 | 512)[],
  originalWidth: 1024 | 1536,
): string =>
  [
    ...variants.map((width) => `${webpVariant(src, width)} ${width}w`),
    `${src} ${originalWidth}w`,
  ].join(", ");

export function portraitArtwork(
  portrait: PortraitResource,
  sizes = "(max-width: 720px) 44vw, 160px",
): ArtworkResource {
  const src = artworkPath(portrait.futureAssetPath);

  return {
    src,
    alt: portrait.alt,
    width: 1024,
    height: 1024,
    srcSet: webpSrcSet(src, [256, 512], 1024),
    sizes,
    focalPoint: "50% 36%",
  };
}

export const LEGACY_PORTRAITS = {
  "legacy-lin-xia": {
    src: artworkPath("/assets/portraits/legacy/legacy-lin-xia.webp"),
    alt: "玫红线稿绘制的短发青年林夏头像",
    width: 1024,
    height: 1024,
    srcSet: webpSrcSet(
      artworkPath("/assets/portraits/legacy/legacy-lin-xia.webp"),
      [256, 512],
      1024,
    ),
    sizes: "64px",
    focalPoint: "50% 36%",
  },
  "legacy-zhou-hang": {
    src: artworkPath("/assets/portraits/legacy/legacy-zhou-hang.webp"),
    alt: "青色线稿绘制的蓬松短发青年周航头像",
    width: 1024,
    height: 1024,
    srcSet: webpSrcSet(
      artworkPath("/assets/portraits/legacy/legacy-zhou-hang.webp"),
      [256, 512],
      1024,
    ),
    sizes: "64px",
    focalPoint: "50% 36%",
  },
  "legacy-tang-ye": {
    src: artworkPath("/assets/portraits/legacy/legacy-tang-ye.webp"),
    alt: "琥珀线稿绘制的卷发青年唐野头像",
    width: 1024,
    height: 1024,
    srcSet: webpSrcSet(
      artworkPath("/assets/portraits/legacy/legacy-tang-ye.webp"),
      [256, 512],
      1024,
    ),
    sizes: "64px",
    focalPoint: "50% 36%",
  },
  "legacy-keyboard": {
    src: artworkPath("/assets/portraits/legacy/legacy-keyboard.webp"),
    alt: "紫色线稿绘制的长发青年许澄头像",
    width: 1024,
    height: 1024,
    srcSet: webpSrcSet(
      artworkPath("/assets/portraits/legacy/legacy-keyboard.webp"),
      [256, 512],
      1024,
    ),
    sizes: "64px",
    focalPoint: "50% 36%",
  },
} as const satisfies Readonly<Record<string, ArtworkResource>>;

export type AlbumCoverVariant = "stage-light" | "city-noise" | "night-route";
export type AlbumCoverId = `${GenreId}-${AlbumCoverVariant}`;

const ALBUM_COVER_LABELS: Readonly<Record<AlbumCoverVariant, string>> = {
  "stage-light": "舞台残光",
  "city-noise": "城市噪点",
  "night-route": "夜间公路",
};

export const ALBUM_COVER_VARIANTS = (
  Object.entries(ALBUM_COVER_LABELS) as [AlbumCoverVariant, string][]
).map(([id, label]) => ({ id, label }));

const GENRE_LABELS: Readonly<Record<GenreId, string>> = {
  pop: "流行",
  indie: "独立摇滚",
  punk: "朋克",
  metal: "金属",
};

const GENRE_IDS: readonly GenreId[] = ["pop", "indie", "punk", "metal"];

export const ALBUM_COVERS = Object.fromEntries(
  GENRE_IDS.flatMap((genre) =>
    ALBUM_COVER_VARIANTS.map(({ id: variant, label }) => {
      const coverId: AlbumCoverId = `${genre}-${variant}`;
      const src = artworkPath(`/assets/albums/${genre}/${variant}.webp`);
      return [
        coverId,
        {
          src,
          alt: `${GENRE_LABELS[genre]}风格的${label}无字专辑封面`,
          width: 1024,
          height: 1024,
          srcSet: webpSrcSet(src, [256, 512], 1024),
          sizes: "(max-width: 720px) 42vw, 220px",
          focalPoint: "50% 50%",
        } satisfies ArtworkResource,
      ];
    }),
  ),
) as Readonly<Record<AlbumCoverId, ArtworkResource>>;

export function resolveAlbumCover(
  coverId: string | null | undefined,
): ArtworkResource | undefined {
  return coverId && Object.hasOwn(ALBUM_COVERS, coverId)
    ? ALBUM_COVERS[coverId as AlbumCoverId]
    : undefined;
}

export const GENRE_ARTWORK = Object.fromEntries(
  GENRE_IDS.map((genre) => {
    const src = artworkPath(`/assets/illustrations/genres/${genre}.webp`);
    return [
      genre,
      {
        src,
        alt: `${GENRE_LABELS[genre]}乐队气质的舞台摄影`,
        width: 1536,
        height: 1024,
        srcSet: webpSrcSet(src, [512], 1536),
        sizes: "(max-width: 720px) 88vw, 420px",
        focalPoint: "50% 50%",
      } satisfies ArtworkResource,
    ];
  }),
) as Readonly<Record<GenreId, ArtworkResource>>;

export const OPENING_ARTWORK = {
  graduationNight: {
    src: artworkPath("/assets/illustrations/opening/graduation-night.webp"),
    alt: "毕业典礼上同学们把学位帽抛向空中的瞬间",
    width: 1536,
    height: 1024,
    srcSet: webpSrcSet(
      artworkPath("/assets/illustrations/opening/graduation-night.webp"),
      [512],
      1536,
    ),
    sizes: "(max-width: 720px) 92vw, 720px",
    focalPoint: "58% 48%",
  },
  firstRehearsal: {
    src: artworkPath("/assets/illustrations/opening/first-rehearsal.webp"),
    alt: "紫色霓虹灯下正在合奏的五人乐队",
    width: 1536,
    height: 1024,
    srcSet: webpSrcSet(
      artworkPath("/assets/illustrations/opening/first-rehearsal.webp"),
      [512],
      1536,
    ),
    sizes: "(max-width: 720px) 92vw, 720px",
    focalPoint: "50% 52%",
  },
} as const satisfies Readonly<Record<string, ArtworkResource>>;

export const EVENT_POOL_ARTWORK: Readonly<Record<EventPool, ArtworkResource>> = {
  member: {
    src: artworkPath("/assets/events/pools/member.webp"),
    srcSet: webpSrcSet(
      artworkPath("/assets/events/pools/member.webp"),
      [512],
      1536,
    ),
    sizes: "(max-width: 720px) 92vw, 640px",
    alt: "深夜排练室里围绕新旋律讨论的乐队成员",
    width: 1536,
    height: 864,
    focalPoint: "50% 48%",
  },
  album: {
    src: artworkPath("/assets/events/pools/album.webp"),
    srcSet: webpSrcSet(
      artworkPath("/assets/events/pools/album.webp"),
      [512],
      1536,
    ),
    sizes: "(max-width: 720px) 92vw, 640px",
    alt: "铺满歌词纸和录音设备的专辑制作台",
    width: 1536,
    height: 864,
    focalPoint: "50% 52%",
  },
  performance: {
    src: artworkPath("/assets/events/pools/performance.webp"),
    srcSet: webpSrcSet(
      artworkPath("/assets/events/pools/performance.webp"),
      [512],
      1536,
    ),
    sizes: "(max-width: 720px) 92vw, 640px",
    alt: "演出开始前被舞台灯照亮的空舞台",
    width: 1536,
    height: 864,
    focalPoint: "50% 50%",
  },
  equipment: {
    src: artworkPath("/assets/events/pools/equipment.webp"),
    srcSet: webpSrcSet(
      artworkPath("/assets/events/pools/equipment.webp"),
      [512],
      1536,
    ),
    sizes: "(max-width: 720px) 92vw, 640px",
    alt: "排练室地面上的效果器、线材和工具箱",
    width: 1536,
    height: 864,
    focalPoint: "50% 58%",
  },
  publicOpinion: {
    src: artworkPath("/assets/events/pools/public-opinion.webp"),
    srcSet: webpSrcSet(
      artworkPath("/assets/events/pools/public-opinion.webp"),
      [512],
      1536,
    ),
    sizes: "(max-width: 720px) 92vw, 640px",
    alt: "手机屏幕光映照着散落的乐队评论和海报",
    width: 1536,
    height: 864,
    focalPoint: "50% 50%",
  },
  industry: {
    src: artworkPath("/assets/events/pools/industry.webp"),
    srcSet: webpSrcSet(
      artworkPath("/assets/events/pools/industry.webp"),
      [512],
      1536,
    ),
    sizes: "(max-width: 720px) 92vw, 640px",
    alt: "音乐行业会面桌上的耳机、文件和试听设备",
    width: 1536,
    height: 864,
    focalPoint: "50% 50%",
  },
  life: {
    src: artworkPath("/assets/events/pools/life.webp"),
    srcSet: webpSrcSet(
      artworkPath("/assets/events/pools/life.webp"),
      [512],
      1536,
    ),
    sizes: "(max-width: 720px) 92vw, 640px",
    alt: "城市雨夜里背着乐器赶往排练的身影",
    width: 1536,
    height: 864,
    focalPoint: "56% 46%",
  },
  genre: {
    src: artworkPath("/assets/events/pools/genre.webp"),
    srcSet: webpSrcSet(
      artworkPath("/assets/events/pools/genre.webp"),
      [512],
      1536,
    ),
    sizes: "(max-width: 720px) 92vw, 640px",
    alt: "四束不同色彩的舞台灯交汇在乐器上",
    width: 1536,
    height: 864,
    focalPoint: "50% 50%",
  },
};

export const SPECIAL_EVENT_IDS: ReadonlySet<string> = new Set([
  "candidate-gu-yanchuan-annotated-score",
  "candidate-lin-jianxia-first-bend",
  "candidate-zhou-jibai-two-guitar-letter",
  "candidate-xu-zhiyao-warehouse-key",
  "candidate-tang-wenzhou-four-beats",
  "candidate-shen-anning-fifteen-seconds",
  "candidate-wei-xingzhi-tempo-log",
  "candidate-su-tang-one-listen-rescue",
  "candidate-han-zimo-three-endings",
  "candidate-chen-xingyao-breathing-chords",
  "candidate-song-qinghe-backup-routing",
  "candidate-lu-sixian-night-road-intro",
  "pop-chorus-challenge",
  "pop-dance-remix",
  "indie-zine-interview",
  "indie-room-take",
  "punk-benefit-show",
  "punk-stage-barrier",
  "metal-double-kick-clinic",
  "metal-night-festival",
  "creative-split-session",
  "creative-split-follow-up",
  "old-venue-message",
  "old-venue-return-night",
  "sponsor-revision-request",
  "sponsor-release-review",
  "bandmate-relocation-offer",
  "bandmate-schedule-decision",
] as const);

export function resolveEventArtwork(
  event: Pick<EventContent, "id" | "pool" | "title">,
): ArtworkResource {
  if (!SPECIAL_EVENT_IDS.has(event.id)) {
    return EVENT_POOL_ARTWORK[event.pool];
  }
  const src = artworkPath(`/assets/events/special/${event.id}.webp`);

  return {
    src,
    srcSet: webpSrcSet(src, [512], 1536),
    sizes: "(max-width: 720px) 92vw, 640px",
    alt: `事件“${event.title}”的情境插图`,
    width: 1536,
    height: 864,
    focalPoint: "50% 50%",
  };
}

export const VENUE_ARTWORK = Object.fromEntries(
  ([1, 2, 3, 4, 5] as const).map((level) => {
    const src = artworkPath(`/assets/venues/level-${level}.webp`);

    return [
      level,
      {
        src,
        srcSet: webpSrcSet(src, [512], 1536),
        sizes: "(max-width: 720px) 86vw, 420px",
        alt: `${level}级演出场地场景`,
        width: 1536,
        height: 960,
        focalPoint: "50% 50%",
      } satisfies ArtworkResource,
    ];
  }),
) as Readonly<Record<1 | 2 | 3 | 4 | 5, ArtworkResource>>;

export const ENDING_ARTWORK = {
  商业巨星: {
    slug: "commercial-superstar",
    alt: "聚光灯和城市广告屏中的商业巨星结局海报",
  },
  现场之王: {
    slug: "live-king",
    alt: "万人合唱与舞台灯海中的现场之王结局海报",
  },
  技术标杆: {
    slug: "technical-benchmark",
    alt: "精密设备和复杂演奏剪影构成的技术标杆结局海报",
  },
  创作名团: {
    slug: "creative-icons",
    alt: "堆叠手稿与录音母带中的创作名团结局海报",
  },
  地下传奇: {
    slug: "underground-legend",
    alt: "贴满海报的地下现场构成的地下传奇结局海报",
  },
  长青乐队: {
    slug: "evergreen-band",
    alt: "跨越多年舞台记忆的长青乐队结局海报",
  },
  失落天才: {
    slug: "lost-genius",
    alt: "空旷录音室里未被听见的母带构成的失落天才结局海报",
  },
  昙花一现: {
    slug: "one-hit-wonder",
    alt: "闪光灯散去后空舞台构成的昙花一现结局海报",
  },
  自己的声音: {
    slug: "own-voice",
    alt: "清晨排练室里仍亮着灯的自己的声音结局海报",
  },
} as const;

export type EndingArtworkTitle = keyof typeof ENDING_ARTWORK;

export function resolveEndingArtwork(title: string): ArtworkResource {
  const entry =
    Object.hasOwn(ENDING_ARTWORK, title)
      ? ENDING_ARTWORK[title as EndingArtworkTitle]
      : ENDING_ARTWORK.自己的声音;
  const src = artworkPath(`/assets/endings/${entry.slug}.webp`);

  return {
    src,
    srcSet: webpSrcSet(src, [512], 1536),
    sizes: "(max-width: 720px) 100vw, 1100px",
    alt: entry.alt,
    width: 1536,
    height: 960,
    focalPoint: "50% 50%",
  };
}
