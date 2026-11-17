"""Generate Focuzap PNG icons (a focus target) with no third-party deps.

Dark teal disc, bright green ring, white center.

Usage: python3 tools/make_icons.py
"""
import math
import os
import struct
import zlib

TEAL = (7, 94, 84)     # #075E54
GREEN = (37, 211, 102)  # #25D366
WHITE = (255, 255, 255)
SS = 4  # supersampling factor


def color_at(d):
    """Color of a point at normalized distance d from the center (1 = edge)."""
    if d <= 0.235:
        return WHITE
    if 0.51 <= d <= 0.71:
        return GREEN
    return TEAL


def pixel(size, pad, x, y):
    """Supersampled RGBA for pixel (x, y). `pad` is transparent margin in px."""
    c = size / 2
    r = size / 2 - pad
    acc = [0, 0, 0]
    hits = 0
    for sy in range(SS):
        for sx in range(SS):
            d = math.hypot(x + (sx + 0.5) / SS - c, y + (sy + 0.5) / SS - c) / r
            if d <= 1.0:
                col = color_at(d)
                for i in range(3):
                    acc[i] += col[i]
                hits += 1
    if not hits:
        return (0, 0, 0, 0)
    return (*(round(v / hits) for v in acc), round(255 * hits / (SS * SS)))


def png(size, pad=0):
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            row += bytes(pixel(size, pad, x, y))
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "..", "icons")
    os.makedirs(out, exist_ok=True)
    # Toolbar sizes fill the canvas. The 128px icon follows the Chrome Web
    # Store guideline: 96px artwork with 16px of transparent padding.
    for size, pad in ((16, 0), (32, 0), (48, 0), (128, 16)):
        with open(os.path.join(out, f"icon-{size}.png"), "wb") as f:
            f.write(png(size, pad))
        print(f"icons/icon-{size}.png")
