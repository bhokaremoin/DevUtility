#!/usr/bin/env python3
"""Generate app icons for DevUtility macOS app."""

import os

from PIL import Image, ImageChops, ImageDraw, ImageFilter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "../macos/DevUtility-macOS/Assets.xcassets/AppIcon.appiconset")
MENUBAR_DIR = os.path.join(SCRIPT_DIR, "../macos/DevUtility-macOS/Assets.xcassets/MenuBarIcon.imageset")

ICONS = [
    ("icon_16x16.png", 16),
    ("icon_16x16@2x.png", 32),
    ("icon_32x32.png", 32),
    ("icon_32x32@2x.png", 64),
    ("icon_128x128.png", 128),
    ("icon_128x128@2x.png", 256),
    ("icon_256x256.png", 256),
    ("icon_256x256@2x.png", 512),
    ("icon_512x512.png", 512),
    ("icon_512x512@2x.png", 1024),
]

BG         = (28, 28, 30, 255)       # #1C1C1E — dark charcoal
BOARD      = (235, 235, 240, 255)    # near-white clipboard
BOLT_TOP   = (155, 155, 160, 255)    # light grey  (top of bolt)
BOLT_BOT   = (38,  38,  40,  255)    # near-black  (bottom of bolt)


def rounded_rect_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


def bolt_polygon(bx, by, bw, bh):
    """Classic 8-point lightning bolt polygon."""
    return [
        (bx + bw * 0.36, by),
        (bx + bw * 0.74, by),
        (bx + bw * 0.50, by + bh * 0.46),
        (bx + bw * 0.80, by + bh * 0.46),
        (bx + bw * 0.44, by + bh),
        (bx + bw * 0.06, by + bh),
        (bx + bw * 0.28, by + bh * 0.54),
        (bx + bw * 0.00, by + bh * 0.54),
    ]


def make_gradient(size, color_top, color_bottom):
    """Vertical linear gradient image (RGBA)."""
    top = Image.new("RGBA", (size, size), color_top)
    bot = Image.new("RGBA", (size, size), color_bottom)
    mask = Image.linear_gradient("L").resize((size, size))
    # composite: mask=0 → top, mask=255 → bot
    return Image.composite(top, bot, mask)


def draw_highlight(img, s):
    """Soft radial highlight at top for depth."""
    h = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(h).ellipse([s*0.1, -s*0.1, s*0.9, s*0.45], fill=(255, 255, 255, 18))
    img.alpha_composite(h.filter(ImageFilter.GaussianBlur(radius=s * 0.10)))


def draw_full_icon(img, s):
    """Clipboard body + clip + amber bolt for medium/large sizes."""
    d = ImageDraw.Draw(img, "RGBA")

    # — Clipboard body —
    bl, bt, br, bb = s*0.18, s*0.24, s*0.82, s*0.87
    d.rounded_rectangle([bl, bt, br, bb], radius=s*0.05, fill=BOARD)

    # — Clip tab at top —
    cl, ct, cr, cb = s*0.35, s*0.13, s*0.65, s*0.31
    d.rounded_rectangle([cl, ct, cr, cb], radius=s*0.04, fill=BOARD)
    # inner hole to suggest a real clip
    pad = s * 0.04
    d.rounded_rectangle(
        [cl + pad, ct + pad*0.8, cr - pad, cb - pad*0.4],
        radius=s*0.025, fill=BG
    )

    # — Gradient lightning bolt, centred in body —
    bw = (br - bl) * 0.50
    bh = (bb - bt) * 0.60
    bx = (bl + br) / 2 - bw / 2
    by = (bt + bb) / 2 - bh / 2 + s * 0.02

    bolt_mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(bolt_mask).polygon(bolt_polygon(bx, by, bw, bh), fill=255)
    img.paste(make_gradient(s, BOLT_TOP, BOLT_BOT), mask=bolt_mask)


def draw_tiny_icon(img, s):
    """Just the bolt on dark bg for 16/32 px."""
    bw, bh = s * 0.54, s * 0.70
    bx = (s - bw) / 2
    by = (s - bh) / 2
    bolt_mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(bolt_mask).polygon(bolt_polygon(bx, by, bw, bh), fill=255)
    img.paste(make_gradient(s, BOLT_TOP, BOLT_BOT), mask=bolt_mask)


def generate_icon(filename, size):
    scale = 2
    rs = size * scale

    img = Image.new("RGBA", (rs, rs), BG)
    draw_highlight(img, rs)

    if size <= 32:
        draw_tiny_icon(img, rs)
    else:
        draw_full_icon(img, rs)

    radius = int(rs * 0.22)
    result = Image.new("RGBA", (rs, rs), (0, 0, 0, 0))
    result.paste(img, mask=rounded_rect_mask(rs, radius))
    result = result.resize((size, size), Image.LANCZOS)
    result.save(os.path.join(OUTPUT_DIR, filename), "PNG")
    print(f"[OK] {filename} ({size}x{size})")


def generate_menubar_icon(filename, size):
    """Template icon: clipboard outline with bolt cutout."""
    scale = 8
    rs = size * scale

    img = Image.new("RGBA", (rs, rs), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")

    BLACK = (0, 0, 0, 255)
    lw = max(2, int(rs * 0.058))

    # Clipboard body (filled)
    bl, bt, br, bb = rs*0.10, rs*0.22, rs*0.80, rs*0.94
    d.rounded_rectangle([bl, bt, br, bb], radius=rs*0.07, fill=BLACK)

    # Clip tab (filled, sits above body)
    cl, ct, cr, cb = rs*0.28, rs*0.06, rs*0.62, rs*0.28
    d.rounded_rectangle([cl, ct, cr, cb], radius=rs*0.05, fill=BLACK)
    # inner hole
    pad = rs * 0.05
    d.rounded_rectangle(
        [cl + pad, ct + pad*0.8, cr - pad, cb - pad*0.4],
        radius=rs*0.03, fill=(0, 0, 0, 0)
    )

    # Cut the bolt shape out of the clipboard so background shows through
    bw = (br - bl) * 0.58
    bh = (bb - bt) * 0.60
    bx = (bl + br) / 2 - bw / 2
    by = (bt + bb) / 2 - bh / 2 + rs * 0.03
    bolt_pts = bolt_polygon(bx, by, bw, bh)

    # Erase bolt area from img using alpha channel manipulation
    bolt_mask = Image.new("L", (rs, rs), 255)   # 255 = keep
    ImageDraw.Draw(bolt_mask).polygon(bolt_pts, fill=0)  # 0 = erase

    r, g, b, a = img.split()
    new_a = ImageChops.multiply(a, bolt_mask)
    img = Image.merge("RGBA", (r, g, b, new_a))

    img = img.resize((size, size), Image.LANCZOS)
    img.save(os.path.join(MENUBAR_DIR, filename), "PNG")
    print(f"[OK] {filename} ({size}x{size}) [menubar]")


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for filename, size in ICONS:
        generate_icon(filename, size)

    os.makedirs(MENUBAR_DIR, exist_ok=True)
    generate_menubar_icon("menubar_icon.png", 18)
    generate_menubar_icon("menubar_icon@2x.png", 36)


if __name__ == "__main__":
    main()
