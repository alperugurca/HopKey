"""
Run to regenerate HopKey extension icons.
pip install pillow
"""
import os
import math
from PIL import Image, ImageDraw, ImageFont

SIZES = [16, 48, 128]
ICONS_DIR = os.path.join(os.path.dirname(__file__), "icons")
os.makedirs(ICONS_DIR, exist_ok=True)

# HopKey brand colors
BG_COLOR    = (17, 17, 27)      # #11111b  deep dark
ACCENT      = (137, 180, 250)   # #89b4fa  blue
ACCENT2     = (203, 166, 247)   # #cba6f7  purple
TEXT_COLOR  = (205, 214, 244)   # #cdd6f4  white


def draw_rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.ellipse([x0, y0, x0 + 2*radius, y0 + 2*radius], fill=fill)
    draw.ellipse([x1 - 2*radius, y0, x1, y0 + 2*radius], fill=fill)
    draw.ellipse([x0, y1 - 2*radius, x0 + 2*radius, y1], fill=fill)
    draw.ellipse([x1 - 2*radius, y1 - 2*radius, x1, y1], fill=fill)


def make_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded background
    radius = max(int(size * 0.18), 2)
    draw_rounded_rect(draw, (0, 0, size - 1, size - 1), radius, BG_COLOR + (255,))

    if size <= 16:
        # Simple: just draw "H" letter
        font_size = int(size * 0.65)
        try:
            font = ImageFont.truetype("arialbd.ttf", font_size)
        except Exception:
            try:
                font = ImageFont.truetype("arial.ttf", font_size)
            except Exception:
                font = ImageFont.load_default()
        bbox = draw.textbbox((0, 0), "H", font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        x = (size - tw) // 2 - bbox[0]
        y = (size - th) // 2 - bbox[1]
        draw.text((x, y), "H", fill=ACCENT + (255,), font=font)
    else:
        # Draw "H" with a small arc/hop arrow above it
        pad = int(size * 0.12)
        font_size = int(size * 0.48)
        try:
            font = ImageFont.truetype("arialbd.ttf", font_size)
        except Exception:
            try:
                font = ImageFont.truetype("arial.ttf", font_size)
            except Exception:
                font = ImageFont.load_default()

        # Draw "H" slightly below center to leave room for arc
        text = "H"
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = (size - tw) // 2 - bbox[0]
        ty = int(size * 0.42) - bbox[1]
        draw.text((tx, ty), text, fill=ACCENT + (255,), font=font)

        # Draw hop arc above "H" — a parabolic dotted arc
        arc_w = int(size * 0.52)
        arc_h = int(size * 0.22)
        arc_cx = size // 2
        arc_cy = int(size * 0.28)
        lw = max(int(size * 0.045), 1)

        # Draw arc as polyline
        points = []
        steps = 30
        for i in range(steps + 1):
            t = i / steps  # 0..1
            angle = math.pi * t  # 0..pi (left to right top arc)
            px = arc_cx + (arc_w // 2) * math.cos(math.pi - angle)
            py = arc_cy - arc_h * math.sin(angle)
            points.append((px, py))

        for i in range(len(points) - 1):
            draw.line([points[i], points[i+1]], fill=ACCENT2 + (255,), width=lw)

        # Arrow tip at end of arc (right side)
        tip = points[-1]
        arr = int(size * 0.1)
        draw.polygon([
            tip,
            (tip[0] - arr, tip[1] - arr // 2),
            (tip[0] - arr // 2, tip[1] + arr // 2),
        ], fill=ACCENT2 + (255,))

    return img


for size in SIZES:
    img = make_icon(size)
    path = os.path.join(ICONS_DIR, f"icon{size}.png")
    img.save(path)
    print(f"Generated icon{size}.png ({size}x{size})")

print("Done.")
