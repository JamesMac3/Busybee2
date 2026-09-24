"""Generate the proposed Busy Bee Lawn & Landscape logo system.

Single source of truth for the emblem geometry and the outlined lettering.
Writes:
  src/brand/logoData.js   data module used by the <BrandLogo> React component
  public/brand/*.svg      standalone SVG files for every layout x tone
  public/favicon.svg      emblem favicon

Lettering is converted to outlines from Archivo (SIL Open Font License), so the
logo never depends on web fonts loading.

Usage (from the project root):
  pip install fonttools uharfbuzz
  python tools/brand/generate_logo.py path/to/Archivo[wdth,wght].ttf
"""

import json
import sys
from xml.sax.saxutils import escape
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
FONT_PATH = Path(sys.argv[1])

# ---------------------------------------------------------------- palette
COLORS = {
    "forest": "#13402a",
    "charcoal": "#1c2220",
    "honey": "#e8b11c",
    "paper": "#fbfaf6",
    "sage": "#86bf95",
}

# Each tone maps emblem parts and lettering to colors. `stripes: None` leaves
# the stripes as gaps, so the body still reads as a banded bee in one color.
TONES = {
    "color": {"wing": "forest", "head": "charcoal", "body": "honey", "stripes": "charcoal", "word": "charcoal", "sub": "forest"},
    "reverse": {"wing": "sage", "head": "paper", "body": "honey", "stripes": None, "word": "paper", "sub": "honey"},
    "mono-light": {"wing": "charcoal", "head": "charcoal", "body": "charcoal", "stripes": None, "word": "charcoal", "sub": "charcoal"},
    "mono-dark": {"wing": "paper", "head": "paper", "body": "paper", "stripes": None, "word": "paper", "sub": "paper"},
}

# ---------------------------------------------------------------- emblem (64 x 64)
# Two leaf-shaped wings (a nod to lawn and landscape), a round head with
# antennae, and a banded body that tapers to a stinger point.
EMBLEM = {
    "wings": [
        "M29.5 28C21.5 28 10.5 23 4.5 10.5C13.5 9.6 25.5 15.5 29.5 28Z",
        "M34.5 28C42.5 28 53.5 23 59.5 10.5C50.5 9.6 38.5 15.5 34.5 28Z",
    ],
    "head": {"cx": 32, "cy": 16.8, "r": 6},
    "antennae": "M29.6 12L25.8 4M34.4 12L38.2 4",
    "antennaWidth": 2.8,
    "body": [
        "M23 33A9 9 0 0 1 41 33V34.5H23Z",
        "M23 39.5H41V44H23Z",
        "M23 49H41V50L32 60L23 50Z",
    ],
    "stripes": [
        "M23 34.5H41V39.5H23Z",
        "M23 44H41V49H23Z",
    ],
}

# ---------------------------------------------------------------- lettering
font_bytes = FONT_PATH.read_bytes()
tt = TTFont(FONT_PATH)
UPM = tt["head"].unitsPerEm


def shape(text, wght, wdth, size, tracking):
    """Shape text with HarfBuzz (kerning included) and return (path d, width, cap height)."""
    face = hb.Face(font_bytes)
    font = hb.Font(face)
    font.set_variations({"wght": wght, "wdth": wdth})
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": False})
    glyph_set = tt.getGlyphSet(location={"wght": wght, "wdth": wdth})
    order = tt.getGlyphOrder()
    scale = size / UPM
    pen = SVGPathPen(glyph_set, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    x = 0.0
    n = len(buf.glyph_infos)
    for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        name = order[info.codepoint]
        glyph_set[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x + pos.x_offset * scale, 0)))
        x += pos.x_advance * scale
        if i < n - 1:
            x += tracking
    # Cap height from the "H" outline at this instance.
    from fontTools.pens.boundsPen import BoundsPen
    bp = BoundsPen(glyph_set)
    glyph_set[tt.getBestCmap()[ord("H")]].draw(bp)
    cap = bp.bounds[3] * scale
    return pen.getCommands(), x, cap


WORD_SIZE = 36
word_d, word_w, word_cap = shape("BUSY BEE", wght=800, wdth=112, size=WORD_SIZE, tracking=1.2)

# Subline: tracked out so it spans exactly the wordmark's width.
SUB_SIZE = 14.2
_, sub_natural, _ = shape("LAWN & LANDSCAPE", wght=650, wdth=100, size=SUB_SIZE, tracking=0)
sub_track = (word_w - sub_natural) / (len("LAWN & LANDSCAPE") - 1)
sub_d, sub_w, sub_cap = shape("LAWN & LANDSCAPE", wght=650, wdth=100, size=SUB_SIZE, tracking=sub_track)

# ---------------------------------------------------------------- layouts
E = 64  # emblem box
GAP_TEXT = 8.5  # between word baseline and subline cap top

# Horizontal: the emblem is scaled to the lettering block's height (not the
# other way round), so the lettering stays large when the lockup is set small.
block = word_cap + GAP_TEXT + sub_cap
H_HEIGHT = 48
h_emblem_scale = H_HEIGHT / E
h_gap = 12
h_top = (H_HEIGHT - block) / 2
horizontal = {
    "width": round(H_HEIGHT + h_gap + word_w + 1, 2),
    "height": H_HEIGHT,
    "emblem": [0, 0, h_emblem_scale],
    "word": [H_HEIGHT + h_gap, round(h_top + word_cap, 2)],
    "sub": [H_HEIGHT + h_gap, round(h_top + word_cap + GAP_TEXT + sub_cap, 2)],
}

# Stacked: emblem centred above the lettering.
s_width = max(word_w, E) + 2
s_emblem_scale = 1.25
s_emblem_size = E * s_emblem_scale
s_word_base = s_emblem_size + 8 + word_cap
stacked = {
    "width": round(s_width, 2),
    "height": round(s_word_base + GAP_TEXT + sub_cap + 1, 2),
    "emblem": [round((s_width - s_emblem_size) / 2, 2), 0, s_emblem_scale],
    "word": [round((s_width - word_w) / 2, 2), round(s_word_base, 2)],
    "sub": [round((s_width - word_w) / 2, 2), round(s_word_base + GAP_TEXT + sub_cap, 2)],
}

emblem_layout = {"width": E, "height": E, "emblem": [0, 0, 1]}

LAYOUTS = {"horizontal": horizontal, "stacked": stacked, "emblem": emblem_layout}

# ---------------------------------------------------------------- writers
out_js = ROOT / "src" / "brand" / "logoData.js"
out_js.parent.mkdir(parents=True, exist_ok=True)
out_js.write_text(
    "// Generated by tools/brand/generate_logo.py. Do not edit by hand.\n"
    "// Proposed brand direction for Busy Bee Lawn & Landscape.\n"
    f"export const COLORS = {json.dumps(COLORS, indent=2)};\n\n"
    f"export const TONES = {json.dumps(TONES, indent=2)};\n\n"
    f"export const EMBLEM = {json.dumps(EMBLEM, indent=2)};\n\n"
    f"export const WORD = {json.dumps({'d': word_d, 'width': round(word_w, 2)})};\n\n"
    f"export const SUB = {json.dumps({'d': sub_d, 'width': round(sub_w, 2)})};\n\n"
    f"export const LAYOUTS = {json.dumps(LAYOUTS, indent=2)};\n",
    encoding="utf-8",
)


def svg_markup(layout_name, tone_name, title="Busy Bee Lawn & Landscape"):
    lay = LAYOUTS[layout_name]
    tone = TONES[tone_name]
    c = lambda k: COLORS[tone[k]]
    ex, ey, es = lay["emblem"]
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {lay["width"]} {lay["height"]}" '
        f'width="{lay["width"]}" height="{lay["height"]}" role="img" aria-labelledby="t">',
        f"<title id=\"t\">{escape(title if layout_name != 'emblem' else 'Busy Bee emblem')}</title>",
        f'<g transform="translate({ex} {ey}) scale({es})">',
        *[f'<path fill="{c("wing")}" d="{d}"/>' for d in EMBLEM["wings"]],
        f'<path fill="none" stroke="{c("head")}" stroke-width="{EMBLEM["antennaWidth"]}" stroke-linecap="square" d="{EMBLEM["antennae"]}"/>',
        f'<circle fill="{c("head")}" cx="{EMBLEM["head"]["cx"]}" cy="{EMBLEM["head"]["cy"]}" r="{EMBLEM["head"]["r"]}"/>',
        *[f'<path fill="{c("body")}" d="{d}"/>' for d in EMBLEM["body"]],
    ]
    if tone["stripes"]:
        parts += [f'<path fill="{c("stripes")}" d="{d}"/>' for d in EMBLEM["stripes"]]
    parts.append("</g>")
    if layout_name != "emblem":
        wx, wy = lay["word"]
        sx, sy = lay["sub"]
        parts.append(f'<path fill="{c("word")}" transform="translate({wx} {wy})" d="{word_d}"/>')
        parts.append(f'<path fill="{c("sub")}" transform="translate({sx} {sy})" d="{sub_d}"/>')
    parts.append("</svg>")
    return "\n".join(parts) + "\n"


brand_dir = ROOT / "public" / "brand"
brand_dir.mkdir(parents=True, exist_ok=True)
for layout_name in LAYOUTS:
    for tone_name in TONES:
        (brand_dir / f"busy-bee-{layout_name}-{tone_name}.svg").write_text(svg_markup(layout_name, tone_name), encoding="utf-8")
(ROOT / "public" / "favicon.svg").write_text(svg_markup("emblem", "color"), encoding="utf-8")

print(f"word {word_w:.1f} wide, cap {word_cap:.1f}; sub tracking {sub_track:.2f}")
print("horizontal", horizontal["width"], "x", horizontal["height"])
print("stacked", stacked["width"], "x", stacked["height"])
