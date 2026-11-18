# A Gift for the Princess

A small illustrated storybook made as a birthday gift: a sealed book, a nine-page story about a little knight, and a cake with candles to blow out at the end.

Static site, no build step — served by GitHub Pages from the repository root.

## Run locally

```bash
python -m http.server 5173
```

Then open http://localhost:5173. Add `?dev` to the URL for the motion/effects controls, `#p0`–`#p8` to jump to a page, or `#finale` to jump to the cake.

## Files

- `index.html` — the story pages (text, scenes, poses are in `PAGES` / `SCENES`)
- `intro.js`, `intro.css` — the sealed storybook opening
- `finale.js`, `finale.css` — gift, cake, wish, candles, closing (words in `TEXT`)
- `assets/characters/` — knight poses (transparent WebP) + `manifest.json`
- `assets/scenes/` — background paintings
- `tools/cutout_sheet.py` — cut poses out of a cream-paper pose sheet
- `tools/prepare_bg.py` — resize a background painting to WebP
