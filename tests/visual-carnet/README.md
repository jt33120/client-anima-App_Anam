# Local visual review

This harness renders the actual `SceneDom`, `Bibliotheque`, `FicheSocle`, conversation and tree components with synthetic fixtures. The natal and numerology fixture uses the same pure calculations as `tests/rendu/fiche-socle.test.tsx`. It imports no session or database client and adds no application route.

From the repository root, using the existing dependencies:

```sh
node node_modules/vite/bin/vite.js --config tests/visual-carnet/vite.config.mjs
```

Open `http://127.0.0.1:4179/`. The regular scene navigation opens Anam and Mon évolution. Dedicated previews:

- `/socle?univers=astrologie`
- `/socle?univers=numerologie`
- `/?view=seuil`
- `/?state=empty` for unwritten daily content and an empty tree/conversation
- `/?state=error` for a failed daily-library read
- `/?state=dense` for a long daily quotation
- `/?state=loading` for visible pending-link indicators

The real theme button switches between paper and night. The capture script also applies the existing reinforced-contrast preference.

To capture the home screen and the bottom of its universe section at 390, 768 and 1440 pixels:

```sh
node tests/visual-carnet/capture.mjs
```

PNG captures and `home-results.json` are written to the operating system temporary directory under `anima-carnet-captures`. Set `CARNET_SCREENSHOT_DIR` to choose another output directory. The script blocks every `/api/` request, records browser errors, and exits unsuccessfully on a document-level horizontal overflow or browser error.

This is a visual fixture, so Next routing, pending links and images use small local adapters. It does not validate production authentication, data loading, persistence, or delivery. Those checks remain separate from this harness.

For the eight botanical illustrations, run `node tests/visual-carnet/capture-metamorphose.mjs /tmp/anima-metamorphose full`.
It checks the direct seed entry, all eight stages, focus restoration and unchanged personal
content at 390/768/1440 px in Chromium and 390 px in WebKit. The contexts include paper,
reinforced contrast, branches, list, incomplete trunk and unavailable data. Results and captures
are written to the selected directory. `quick` limits the run to seed/illumination in Chromium;
`chromium` runs all contexts without WebKit.

## Review performed on 2026-09-06

The first desktop pass found that the global display size made the daily quotation and the universe section compete with the page title, and that global CSS overrode the handwritten annotation font. Dedicated citation/section tokens and more specific annotation selectors fixed both issues. Universe cards switch to a glyph/title composition on medium widths to preserve the text measure; the final full-width psychology card retains a horizontal arrangement.

The second pass reviewed paper, night and reinforced contrast at all three widths, plus empty, failed, dense and loading states: 21 scenarios, no browser errors and no document-level horizontal overflow. The mobile page introduction was shortened after this review, and the failed-read state was recaptured with its actual retry control. The displayed text, original conditional actions, AI attribution and semantic ordering remain intact.

## Celestial night correction — 2026-09-06

Night is now the default, including before hydration. The theme switch is in the persistent header. The home header is compact; daily quotations keep a reading size even with the dense fixture. New captures are versioned in `design/reviews/celestial-night/`.

Run `node tests/visual-carnet/verify-keyboard.mjs` to exercise the actual Chromium/WebKit engines with simulated iOS and Android keyboard geometry at 390/1024 px. It checks the visible message area, send control, draft persistence, keyboard closing and native zoom handoff. This does not reproduce a physical OS keyboard. The script blocks API requests and uses synthetic data. `CARNET_CAPTURE_DIR` and `CARNET_BASE_URL` can override output and harness locations.
