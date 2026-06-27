#!/usr/bin/env python3
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import struct


ROOT = Path(__file__).resolve().parents[1]
BUILD_DIR = ROOT / "build"
ICONSET = BUILD_DIR / "icon.iconset"
if ICONSET.exists():
    for file_path in ICONSET.glob("*.png"):
        file_path.unlink()
ICONSET.mkdir(parents=True, exist_ok=True)


def make_base(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    for y in range(size):
        ratio = y / max(size - 1, 1)
        r = int(82 * (1 - ratio) + 122 * ratio)
        g = int(214 * (1 - ratio) + 162 * ratio)
        b = int(197 * (1 - ratio) + 255 * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    inset = int(size * 0.13)
    draw.rounded_rectangle(
        [inset, inset, size - inset, size - inset],
        radius=int(size * 0.18),
        fill=(11, 17, 24, 230),
        outline=(237, 244, 255, 70),
        width=max(1, size // 64),
    )

    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", int(size * 0.48))
    except OSError:
        font = ImageFont.load_default()

    text = "B"
    bbox = draw.textbbox((0, 0), text, font=font)
    x = (size - (bbox[2] - bbox[0])) / 2
    y = (size - (bbox[3] - bbox[1])) / 2 - size * 0.03
    draw.text((x, y), text, fill=(237, 244, 255, 255), font=font)
    return image


base = make_base(1024)
sizes = [16, 32, 128, 256, 512]
for size in sizes:
    resized = base.resize((size, size), Image.Resampling.LANCZOS).convert("RGB")
    resized.save(ICONSET / f"icon_{size}x{size}.png")
    resized_2x = base.resize((size * 2, size * 2), Image.Resampling.LANCZOS).convert("RGB")
    resized_2x.save(ICONSET / f"icon_{size}x{size}@2x.png")

icns_chunks = []
chunk_types = {
    16: b"icp4",
    32: b"icp5",
    64: b"icp6",
    128: b"ic07",
    256: b"ic08",
    512: b"ic09",
    1024: b"ic10",
}

for size, chunk_type in chunk_types.items():
    png_path = ICONSET / (
        f"icon_{size // 2}x{size // 2}@2x.png"
        if size in {64, 1024}
        else f"icon_{size}x{size}.png"
    )
    if size == 64:
        png_path = ICONSET / "icon_32x32@2x.png"
    if size == 1024:
        png_path = ICONSET / "icon_512x512@2x.png"
    data = png_path.read_bytes()
    icns_chunks.append(chunk_type + struct.pack(">I", len(data) + 8) + data)

icns_data = b"".join(icns_chunks)
(BUILD_DIR / "icon.icns").write_bytes(b"icns" + struct.pack(">I", len(icns_data) + 8) + icns_data)
print(BUILD_DIR / "icon.icns")
