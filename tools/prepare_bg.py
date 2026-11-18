"""Convert a background painting to a web-sized WebP.

    python tools/prepare_bg.py <source.png> <out.webp> [max_side=1536]

Keeps the aspect ratio, never upscales, quality 82 (watercolour hides compression well).
Needs: pip install pillow
"""
import sys
from pathlib import Path

from PIL import Image

src, out = Path(sys.argv[1]), Path(sys.argv[2])
max_side = int(sys.argv[3]) if len(sys.argv) > 3 else 1536

im = Image.open(src).convert("RGB")
scale = min(1.0, max_side / max(im.size))
if scale < 1:
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
out.parent.mkdir(parents=True, exist_ok=True)
im.save(out, "WEBP", quality=82, method=6)
print(f"{out.name:22s} {im.size} {out.stat().st_size // 1024} KB")
