"""Cut characters out of a cream-paper pose sheet into transparent WebP files.

    python tools/cutout_sheet.py <sheet.png> <out_dir> <name1> [name2 name3 name4]

One name  -> the whole image is one character (e.g. the pony).
Four names -> the sheet is a 2x2 grid; cells are found by looking for empty paper
              between the poses, then named left-to-right, top-to-bottom.

Background removal: flood fill from the cell border over paper-coloured pixels, with a
soft alpha ramp for the watercolour edges, and removal of tiny stray specks.
Add --holes to also remove large enclosed paper gaps (e.g. between legs) - check the
result, it can eat light parts of the art.  Writes <name>.webp and updates manifest.json.
Needs: pip install pillow numpy
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

T_LOW = 8.0       # below this distance from paper colour -> fully transparent
T_FLOOD = 26.0    # flood fill passes through pixels closer than this
T_HOLE = 12.0     # enclosed paper holes: pixels this close to paper ...
HOLE_MIN = 120    # ... in a blob at least this big get removed
SPECK_MAX = 80    # separate blobs smaller than this (px) are dropped
PAD = 6           # transparent padding around each output
HOLES = "--holes" in sys.argv


def paper_colour(a):
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    return np.median(border, axis=0)


def longest_zero_run(counts, lo, hi):
    best, start, best_span = None, None, 0
    for i in range(lo, hi + 1):
        if i < hi and counts[i] == 0:
            start = i if start is None else start
        elif start is not None:
            if i - start > best_span:
                best_span, best = i - start, (start + i) // 2
            start = None
    return best if best is not None else lo + int(np.argmin(counts[lo:hi]))


def split_grid(a, bg):
    d = np.sqrt(((a - bg) ** 2).sum(axis=2))
    fg = d > 30
    h, w = fg.shape
    ycut = longest_zero_run(fg.sum(axis=1), int(h * .38), int(h * .62))
    cells = []
    for y0, y1 in ((0, ycut), (ycut, h)):
        cols = fg[y0:y1].sum(axis=0)
        xcut = longest_zero_run(cols, int(w * .38), int(w * .62))
        cells += [(0, y0, xcut, y1), (xcut, y0, w, y1)]
    return cells


def cut(a, bg):
    h, w, _ = a.shape
    d = np.sqrt(((a - bg) ** 2).sum(axis=2))

    # 1) background connected to the border
    cand = Image.fromarray(((d < T_FLOOD) * 255).astype(np.uint8), "L")
    padded = Image.new("L", (w + 2, h + 2), 255)
    padded.paste(cand, (1, 1))
    ImageDraw.floodfill(padded, (0, 0), 128)
    conn = np.asarray(padded)[1:-1, 1:-1] == 128

    alpha = np.ones((h, w), np.float32)
    ramp = np.clip((d - T_LOW) / (T_FLOOD - T_LOW), 0, 1)
    alpha[conn] = ramp[conn]

    # 2) enclosed paper holes (big blobs of almost exact paper colour).
    #    Opt-in (--holes): light parts of the art (helmet plate, letters, the pony) are
    #    close to the paper colour too, so this can punch holes in the character.
    holes = (d < T_HOLE) & ~conn
    if HOLES and holes.any():
        himg = Image.fromarray((holes * 255).astype(np.uint8), "L").copy()  # copy: fromarray images are read-only for floodfill
        harr = np.asarray(himg).copy()
        ys, xs = np.nonzero(harr == 255)
        for y, x in zip(ys, xs):
            if harr[y, x] != 255:
                continue
            ImageDraw.floodfill(himg, (int(x), int(y)), 100)
            arr = np.asarray(himg)
            blob = arr == 100
            keep = 200 if blob.sum() < HOLE_MIN else 50   # 50 = remove, 200 = keep
            himg = Image.fromarray(np.where(blob, keep, arr).astype(np.uint8), "L").copy()
            harr = np.asarray(himg).copy()
        remove = np.asarray(himg) == 50
        # grow the hole by one ring so its soft edge is feathered too
        ring = remove.copy()
        ring[1:] |= remove[:-1]; ring[:-1] |= remove[1:]
        ring[:, 1:] |= remove[:, :-1]; ring[:, :-1] |= remove[:, 1:]
        ring &= d < T_FLOOD
        alpha[ring] = np.minimum(alpha[ring], ramp[ring])

    # 3) un-mix paper colour from soft edges (no cream halo on darker scenes)
    af = alpha[..., None]
    rgb = np.where(af > 0.02, (a - (1 - af) * bg) / np.maximum(af, 1e-3), 0)
    rgba = np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8)
    img = Image.fromarray(rgba, "RGBA")

    # 4) drop tiny stray specks (sheet corners, paper dirt); keep real effect marks
    solid = img.getchannel("A").point(lambda v: 255 if v > 10 else 0)
    sarr = np.asarray(solid).copy()
    for y, x in zip(*np.nonzero(sarr == 255)):
        if sarr[y, x] != 255:
            continue
        ImageDraw.floodfill(solid, (int(x), int(y)), 100)
        arr = np.asarray(solid)
        blob = arr == 100
        if blob.sum() < SPECK_MAX:
            rgba[blob, 3] = 0
        solid = Image.fromarray(np.where(blob, 200, arr).astype(np.uint8), "L").copy()
        sarr = np.asarray(solid).copy()
    img = Image.fromarray(rgba, "RGBA")

    bbox = img.getchannel("A").point(lambda v: 255 if v > 10 else 0).getbbox()
    img = img.crop(bbox)
    out = Image.new("RGBA", (img.width + PAD * 2, img.height + PAD * 2), (0, 0, 0, 0))
    out.paste(img, (PAD, PAD))
    return out


def main():
    args = [a for a in sys.argv[1:] if a != "--holes"]
    sheet, out_dir, names = Path(args[0]), Path(args[1]), args[2:]
    out_dir.mkdir(parents=True, exist_ok=True)
    a = np.asarray(Image.open(sheet).convert("RGB")).astype(np.float32)
    bg = paper_colour(a)
    cells = [(0, 0, a.shape[1], a.shape[0])] if len(names) == 1 else split_grid(a, bg)
    if len(cells) != len(names):
        sys.exit(f"expected {len(cells)} names, got {len(names)}")

    manifest_path = out_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text("utf-8")) if manifest_path.exists() else {}
    for name, (x0, y0, x1, y1) in zip(names, cells):
        cell = a[y0:y1, x0:x1]
        img = cut(cell, paper_colour(cell))
        path = out_dir / f"{name}.webp"
        img.save(path, "WEBP", quality=90, method=6)
        manifest[name] = {"w": img.width, "h": img.height, "src": sheet.name}
        print(f"{name:14s} cell=({x0},{y0},{x1},{y1}) -> {img.size} {path.stat().st_size // 1024} KB")
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), "utf-8")


if __name__ == "__main__":
    main()
