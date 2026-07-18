#!/usr/bin/env python3
"""Build the game's licensed portrait and photography artwork.

Portrait input:
  tmp/source-packs/scifaces/100 Human sci-fi faces/{1..100}.png

Photography inputs are downloaded from Pexels into tmp/pexels. The generated
album inputs are public-domain museum scans in tmp/commons. The generated WebP
files are the only binary derivatives intended to be committed.
"""

from __future__ import annotations

import hashlib
import random
import sys
import urllib.request
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PORTRAIT_SOURCE = (
    ROOT / "tmp/source-packs/scifaces/100 Human sci-fi faces"
)
PHOTO_SOURCE = ROOT / "tmp/pexels"
COMMONS_SOURCE = ROOT / "tmp/commons"
OUTPUT = ROOT / "public/assets"


@dataclass(frozen=True)
class PortraitSpec:
    path: str
    source: int
    accent: str
    background: str


@dataclass(frozen=True)
class PhotoSpec:
    path: str
    source: int
    focal_x: float = 0.5
    focal_y: float = 0.5
    tint: str = "#24152f"


@dataclass(frozen=True)
class AlbumSpec:
    path: str
    source: int
    tint: str
    saturation: float
    contrast: float


PORTRAITS = (
    PortraitSpec("portraits/player/player-neon.webp", 83, "#e67aff", "#10131c"),
    PortraitSpec("portraits/player/player-seafoam.webp", 23, "#72e0d2", "#0f181c"),
    PortraitSpec("portraits/player/player-amber.webp", 82, "#ffb45e", "#1c1412"),
    PortraitSpec("portraits/player/player-silver.webp", 25, "#b8c8e8", "#11151c"),
    PortraitSpec("portraits/player/player-redcap.webp", 43, "#ff695f", "#1d1215"),
    PortraitSpec("portraits/player/player-midnight.webp", 54, "#7d9cff", "#101522"),
    PortraitSpec("portraits/candidates/gu-yanchuan.webp", 20, "#d97b82", "#1b1419"),
    PortraitSpec("portraits/candidates/lin-jianxia.webp", 88, "#ff9b62", "#1d1413"),
    PortraitSpec("portraits/candidates/zhou-jibai.webp", 39, "#6dc3d4", "#10181d"),
    PortraitSpec("portraits/candidates/xu-zhiyao.webp", 74, "#67d5c4", "#101918"),
    PortraitSpec("portraits/candidates/tang-wenzhou.webp", 36, "#c8a478", "#191513"),
    PortraitSpec("portraits/candidates/shen-anning.webp", 90, "#b183e4", "#17131d"),
    PortraitSpec("portraits/candidates/wei-xingzhi.webp", 44, "#9aacbc", "#11161a"),
    PortraitSpec("portraits/candidates/su-tang.webp", 17, "#ff735f", "#1e1213"),
    PortraitSpec("portraits/candidates/han-zimo.webp", 78, "#70b7ee", "#101721"),
    PortraitSpec("portraits/candidates/chen-xingyao.webp", 46, "#73c4c7", "#10191b"),
    PortraitSpec("portraits/candidates/song-qinghe.webp", 35, "#9da8c7", "#12151c"),
    PortraitSpec("portraits/candidates/lu-sixian.webp", 92, "#a98ae8", "#15131d"),
    PortraitSpec("portraits/legacy/legacy-lin-xia.webp", 11, "#d67fa8", "#17131a"),
    PortraitSpec("portraits/legacy/legacy-zhou-hang.webp", 62, "#75b6c6", "#10171a"),
    PortraitSpec("portraits/legacy/legacy-tang-ye.webp", 52, "#dc8b61", "#1b1412"),
    PortraitSpec("portraits/legacy/legacy-keyboard.webp", 97, "#9b8bd7", "#14131b"),
)


PHOTO_AUTHORS = {
    1205651: ("Emily Ranquist", "photography-of-people-graduating"),
    8512640: ("Big Bag Films", "a-band-doing-a-rehearsal"),
    7086730: ("cottonbro studio", "a-two-men-in-the-recording-studio"),
    17815566: ("Lucas Agustín", "stage-without-musicians"),
    2263435: ("Teddy Yang", "stage-lights"),
    20532119: ("Sami TÜRK", "crowd-and-illuminated-stage-at-concert"),
    1943411: ("Wendy Wei", "photo-of-electric-guitar-and-drum-set"),
    32789944: ("Marcelo Mora", "guitar-pedal-board-on-stage-with-bass-guitar"),
    3689546: ("Luis Quintero", "photo-of-people-using-their-phones"),
    20571205: ("Rumeysa", "vinyl-on-a-record-player"),
    8133244: ("Anna Pou", "music-producer-working-in-a-studio"),
    19452357: ("K", "musical-instruments-on-a-stage"),
    19658083: ("JIUN-JE LIN", "illuminated-stage-of-an-empty-theater"),
    5026349: ("Asia Culture Center", "empty-concert-hall-with-rows-of-chairs"),
    29585548: ("Alec Doualetas", "outdoor-concert-stage-with-empty-seating"),
    14229532: ("Alejandro Pacheco", "empty-rock-concert-stage-in-the-stadium"),
    4988133: ("Tima Miroshnichenko", "a-man-in-the-control-panel-of-a-music-studio"),
    33288216: ("Tong Quan", "street-musician-playing-guitar-at-night"),
    18282601: ("Yosy Rahav", "woman-holding-guitar-and-shouting-in-rain"),
    8107236: ("MART PRODUCTION", "man-walking-carrying-his-guitar"),
    7088377: ("cottonbro studio", "person-playing-keyboard"),
    11044768: ("John Taran", "computers-and-musical-equipment-in-a-music-studio"),
    27677829: ("Farhad Irani", "studio-music"),
    8198161: ("RDNE Stock project", "band-playing-in-a-studio"),
    8198632: (
        "RDNE Stock project",
        "view-of-a-band-playing-instruments-at-the-rehearsal",
    ),
    8198569: ("RDNE Stock project", "people-playing-instrument-in-the-living-room"),
    30033776: ("Mustapha Damilola", "capturing-live-concert-with-green-stage-lights"),
    10177855: ("cottonbro studio", "a-man-playing-guitar-in-the-bar"),
    7088378: ("cottonbro studio", "a-band-rehearsing-inside-the-studio"),
}


ALBUMS = (
    AlbumSpec("albums/pop/stage-light.webp", 1, "#411b49", 1.06, 1.04),
    AlbumSpec("albums/pop/city-noise.webp", 2, "#51203e", 1.08, 1.05),
    AlbumSpec("albums/pop/night-route.webp", 4, "#3d274f", 1.02, 1.04),
    AlbumSpec("albums/indie/stage-light.webp", 9, "#173744", 0.76, 1.02),
    AlbumSpec("albums/indie/city-noise.webp", 11, "#24323e", 0.72, 1.06),
    AlbumSpec("albums/indie/night-route.webp", 12, "#2b3440", 0.74, 1.05),
    AlbumSpec("albums/punk/stage-light.webp", 3, "#551527", 1.12, 1.18),
    AlbumSpec("albums/punk/city-noise.webp", 5, "#4e162b", 1.10, 1.20),
    AlbumSpec("albums/punk/night-route.webp", 8, "#501a23", 1.08, 1.18),
    AlbumSpec("albums/metal/stage-light.webp", 6, "#172d4a", 0.68, 1.22),
    AlbumSpec("albums/metal/city-noise.webp", 7, "#162b44", 0.66, 1.20),
    AlbumSpec("albums/metal/night-route.webp", 10, "#152a43", 0.64, 1.23),
)


GENRES = (
    PhotoSpec("illustrations/genres/pop.webp", 8512640, 0.50, 0.52, "#3a163f"),
    PhotoSpec("illustrations/genres/indie.webp", 8198569, 0.50, 0.50, "#1c3340"),
    PhotoSpec("illustrations/genres/punk.webp", 10177855, 0.53, 0.48, "#4b151d"),
    PhotoSpec("illustrations/genres/metal.webp", 2263435, 0.50, 0.52, "#142f4c"),
)


OPENING = (
    PhotoSpec(
        "illustrations/opening/graduation-night.webp",
        1205651,
        0.50,
        0.47,
        "#182840",
    ),
    PhotoSpec(
        "illustrations/opening/first-rehearsal.webp",
        8512640,
        0.50,
        0.54,
        "#36163f",
    ),
)


POOLS = (
    PhotoSpec("events/pools/member.webp", 8198632, 0.50, 0.54, "#162d43"),
    PhotoSpec("events/pools/album.webp", 7086730, 0.52, 0.50, "#39242b"),
    PhotoSpec("events/pools/performance.webp", 20532119, 0.50, 0.50, "#3a1e20"),
    PhotoSpec("events/pools/equipment.webp", 32789944, 0.48, 0.62, "#143441"),
    PhotoSpec("events/pools/public-opinion.webp", 3689546, 0.50, 0.48, "#3f1729"),
    PhotoSpec("events/pools/industry.webp", 8133244, 0.60, 0.50, "#182b3d"),
    PhotoSpec("events/pools/life.webp", 33288216, 0.58, 0.48, "#142b3c"),
    PhotoSpec("events/pools/genre.webp", 19452357, 0.56, 0.50, "#2a2050"),
)


SPECIAL_SOURCE = {
    "candidate-gu-yanchuan-annotated-score": (11044768, 0.52, 0.50, "#21344a"),
    "candidate-lin-jianxia-first-bend": (10177855, 0.48, 0.52, "#4c1522"),
    "candidate-zhou-jibai-two-guitar-letter": (19452357, 0.60, 0.50, "#242654"),
    "candidate-xu-zhiyao-warehouse-key": (17815566, 0.50, 0.52, "#3d2028"),
    "candidate-tang-wenzhou-four-beats": (8198569, 0.44, 0.52, "#3f281b"),
    "candidate-shen-anning-fifteen-seconds": (30033776, 0.50, 0.48, "#173b38"),
    "candidate-wei-xingzhi-tempo-log": (4988133, 0.54, 0.52, "#202b3c"),
    "candidate-su-tang-one-listen-rescue": (8198632, 0.50, 0.52, "#1d3149"),
    "candidate-han-zimo-three-endings": (7088377, 0.52, 0.50, "#283446"),
    "candidate-chen-xingyao-breathing-chords": (27677829, 0.58, 0.52, "#30204e"),
    "candidate-song-qinghe-backup-routing": (32789944, 0.52, 0.62, "#173646"),
    "candidate-lu-sixian-night-road-intro": (33288216, 0.62, 0.48, "#162c42"),
    "pop-chorus-challenge": (8512640, 0.50, 0.52, "#411941"),
    "pop-dance-remix": (20532119, 0.50, 0.48, "#4a2228"),
    "indie-zine-interview": (8198569, 0.52, 0.52, "#213443"),
    "indie-room-take": (8198161, 0.52, 0.50, "#3b2b1d"),
    "punk-benefit-show": (10177855, 0.48, 0.52, "#50151d"),
    "punk-stage-barrier": (3689546, 0.50, 0.46, "#46152b"),
    "metal-double-kick-clinic": (1943411, 0.56, 0.54, "#18334d"),
    "metal-night-festival": (2263435, 0.50, 0.52, "#17304f"),
    "creative-split-session": (7086730, 0.54, 0.50, "#3e2630"),
    "creative-split-follow-up": (7088378, 0.50, 0.52, "#3f2734"),
    "old-venue-message": (19658083, 0.50, 0.52, "#422126"),
    "old-venue-return-night": (20532119, 0.50, 0.48, "#492329"),
    "sponsor-revision-request": (8133244, 0.62, 0.50, "#203448"),
    "sponsor-release-review": (11044768, 0.52, 0.50, "#26374c"),
    "bandmate-relocation-offer": (8107236, 0.54, 0.52, "#2f271f"),
    "bandmate-schedule-decision": (7088378, 0.50, 0.52, "#402736"),
}

SPECIAL = tuple(
    PhotoSpec(f"events/special/{event_id}.webp", source, x, y, tint)
    for event_id, (source, x, y, tint) in SPECIAL_SOURCE.items()
)


VENUES = (
    PhotoSpec("venues/level-1.webp", 17815566, 0.50, 0.50, "#3f2028"),
    PhotoSpec("venues/level-2.webp", 19658083, 0.50, 0.52, "#3e2024"),
    PhotoSpec("venues/level-3.webp", 5026349, 0.50, 0.48, "#193246"),
    PhotoSpec("venues/level-4.webp", 29585548, 0.50, 0.48, "#243446"),
    PhotoSpec("venues/level-5.webp", 14229532, 0.48, 0.52, "#3a2521"),
)


ENDINGS = (
    PhotoSpec("endings/commercial-superstar.webp", 20532119, 0.50, 0.48, "#4c2328"),
    PhotoSpec("endings/live-king.webp", 2263435, 0.50, 0.52, "#17334f"),
    PhotoSpec("endings/technical-benchmark.webp", 11044768, 0.52, 0.50, "#20354b"),
    PhotoSpec("endings/creative-icons.webp", 7086730, 0.54, 0.50, "#3e2732"),
    PhotoSpec("endings/underground-legend.webp", 10177855, 0.48, 0.52, "#50151f"),
    PhotoSpec("endings/evergreen-band.webp", 8512640, 0.50, 0.52, "#39173e"),
    PhotoSpec("endings/lost-genius.webp", 4988133, 0.56, 0.52, "#263146"),
    PhotoSpec("endings/one-hit-wonder.webp", 17815566, 0.50, 0.54, "#3c2028"),
    PhotoSpec("endings/own-voice.webp", 8198161, 0.50, 0.52, "#3b2a1c"),
)


def rgb(hex_color: str) -> tuple[int, int, int]:
    value = hex_color.removeprefix("#")
    return tuple(int(value[index : index + 2], 16) for index in (0, 2, 4))


def save_variants(
    image: Image.Image,
    relative_path: str,
    widths: tuple[int, ...],
    quality: int = 84,
) -> None:
    destination = OUTPUT / relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "WEBP", quality=quality, method=6)
    for width in widths:
        height = round(image.height * width / image.width)
        resized = image.resize((width, height), Image.Resampling.LANCZOS)
        variant = destination.with_name(f"{destination.stem}-{width}.webp")
        resized.save(variant, "WEBP", quality=quality, method=6)


def build_portrait(spec: PortraitSpec) -> None:
    source = PORTRAIT_SOURCE / f"{spec.source}.png"
    if not source.exists():
        raise FileNotFoundError(f"Missing GatlingArt portrait: {source}")
    gray = ImageOps.autocontrast(Image.open(source).convert("L"), cutoff=1)
    colored = ImageOps.colorize(
        gray,
        black="#f2f5ff",
        mid=spec.accent,
        white=spec.background,
    ).resize((1024, 1024), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", colored.size, spec.background)
    canvas = Image.blend(canvas, colored, 0.96)

    glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    accent = (*rgb(spec.accent), 64)
    glow_draw.ellipse((160, 80, 920, 860), fill=accent)
    glow = glow.filter(ImageFilter.GaussianBlur(180))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), glow).convert("RGB")

    frame = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    frame_draw = ImageDraw.Draw(frame)
    frame_draw.rectangle((28, 28, 995, 995), outline=(*rgb(spec.accent), 118), width=2)
    frame_draw.line((28, 94, 28, 28, 94, 28), fill=(*rgb(spec.accent), 210), width=5)
    frame_draw.line((930, 995, 995, 995, 995, 930), fill=(*rgb(spec.accent), 150), width=3)
    canvas = Image.alpha_composite(canvas.convert("RGBA"), frame).convert("RGB")
    save_variants(canvas, spec.path, (256, 512), quality=88)


def ensure_photo(source_id: int) -> Path:
    source = PHOTO_SOURCE / f"{source_id}.jpg"
    if source.exists() and source.stat().st_size > 10_000:
        return source
    PHOTO_SOURCE.mkdir(parents=True, exist_ok=True)
    url = (
        f"https://images.pexels.com/photos/{source_id}/"
        f"pexels-photo-{source_id}.jpeg?auto=compress&cs=tinysrgb&w=2400"
    )
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        source.write_bytes(response.read())
    return source


def focal_crop(
    image: Image.Image,
    width: int,
    height: int,
    focal_x: float,
    focal_y: float,
) -> Image.Image:
    target_ratio = width / height
    source_ratio = image.width / image.height
    if source_ratio > target_ratio:
        crop_height = image.height
        crop_width = round(crop_height * target_ratio)
        left = round(focal_x * image.width - crop_width / 2)
        left = max(0, min(left, image.width - crop_width))
        box = (left, 0, left + crop_width, crop_height)
    else:
        crop_width = image.width
        crop_height = round(crop_width / target_ratio)
        top = round(focal_y * image.height - crop_height / 2)
        top = max(0, min(top, image.height - crop_height))
        box = (0, top, crop_width, top + crop_height)
    return image.crop(box).resize((width, height), Image.Resampling.LANCZOS)


def stable_seed(value: str) -> int:
    return int.from_bytes(hashlib.sha256(value.encode()).digest()[:8])


def grade_photo(image: Image.Image, spec: PhotoSpec) -> Image.Image:
    image = ImageEnhance.Color(image).enhance(0.84)
    image = ImageEnhance.Contrast(image).enhance(1.11)
    image = ImageEnhance.Brightness(image).enhance(0.79)
    image = Image.blend(image, Image.new("RGB", image.size, spec.tint), 0.10)

    vignette = Image.new("L", image.size, 140)
    draw = ImageDraw.Draw(vignette)
    margin_x = round(image.width * 0.08)
    margin_y = round(image.height * 0.05)
    draw.ellipse(
        (
            margin_x,
            margin_y,
            image.width - margin_x,
            image.height - margin_y,
        ),
        fill=0,
    )
    vignette = vignette.filter(ImageFilter.GaussianBlur(max(36, image.width // 11)))

    bottom = Image.linear_gradient("L").resize(image.size)
    bottom = bottom.point(lambda value: max(0, round((value - 112) * 0.72)))
    mask = ImageChops_lighter(vignette, bottom)
    image = Image.composite(Image.new("RGB", image.size, "#070a0f"), image, mask)

    randomizer = random.Random(stable_seed(spec.path))
    noise = Image.effect_noise(image.size, randomizer.uniform(4.0, 7.0)).convert("RGB")
    image = Image.blend(image, noise, 0.018)
    return image


def ImageChops_lighter(first: Image.Image, second: Image.Image) -> Image.Image:
    # Importing here keeps the top-level import list focused on the core pipeline.
    from PIL import ImageChops

    return ImageChops.lighter(first, second)


def build_photo(
    spec: PhotoSpec,
    dimensions: tuple[int, int],
    widths: tuple[int, ...] = (512,),
) -> None:
    source = ImageOps.exif_transpose(Image.open(ensure_photo(spec.source))).convert("RGB")
    image = focal_crop(source, *dimensions, spec.focal_x, spec.focal_y)
    image = grade_photo(image, spec)
    save_variants(image, spec.path, widths)


def build_album(spec: AlbumSpec) -> None:
    source_path = COMMONS_SOURCE / f"small-worlds-{spec.source}.jpg"
    if not source_path.exists():
        raise FileNotFoundError(f"Missing Small Worlds source: {source_path}")
    source = ImageOps.exif_transpose(Image.open(source_path)).convert("RGB")
    # Trim scan margins and the lower signature area before the square crop.
    trim = (
        round(source.width * 0.055),
        round(source.height * 0.045),
        round(source.width * 0.945),
        round(source.height * 0.90),
    )
    image = ImageOps.fit(
        source.crop(trim),
        (1024, 1024),
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.48),
    )
    image = ImageEnhance.Color(image).enhance(spec.saturation)
    image = ImageEnhance.Contrast(image).enhance(spec.contrast)
    image = ImageEnhance.Brightness(image).enhance(0.86)
    image = Image.blend(image, Image.new("RGB", image.size, spec.tint), 0.075)

    frame = Image.new("RGBA", image.size, (0, 0, 0, 0))
    frame_draw = ImageDraw.Draw(frame)
    frame_draw.rectangle(
        (26, 26, 997, 997),
        outline=(*rgb("#f2f4f8"), 72),
        width=2,
    )
    image = Image.alpha_composite(image.convert("RGBA"), frame).convert("RGB")
    save_variants(image, spec.path, (256, 512), quality=88)


def main() -> int:
    for portrait in PORTRAITS:
        build_portrait(portrait)
    for spec in ALBUMS:
        build_album(spec)
    for spec in (*GENRES, *OPENING):
        build_photo(spec, (1536, 1024))
    for spec in (*POOLS, *SPECIAL):
        build_photo(spec, (1536, 864))
    for spec in (*VENUES, *ENDINGS):
        build_photo(spec, (1536, 960))

    expected = (
        len(PORTRAITS) * 3
        + len(ALBUMS) * 3
        + (len(GENRES) + len(OPENING) + len(POOLS) + len(SPECIAL) + len(VENUES) + len(ENDINGS))
        * 2
    )
    generated = len(tuple(OUTPUT.rglob("*.webp")))
    print(f"Generated {generated} WebP files (expected {expected}).")
    return 0 if generated == expected else 1


if __name__ == "__main__":
    sys.exit(main())
