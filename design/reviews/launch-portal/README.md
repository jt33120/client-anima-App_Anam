# Anam launch portal review — 2026-09-08

## Direction

A finite entrance: the official back-facing Anam rises gently into celestial light, small stars
wake around her, and the lowercase signature appears above the welcome. The original launch
lifecycle remains unchanged. No new runtime dependencies, image API or video download.

## First pass

Chromium and WebKit, 390/768/1440 wide, paper, reduced motion, reinforced contrast, 844×390
landscape and missing portrait: 16 scenarios passed with no script errors or horizontal overflow.
The scene fits each viewport; the overlay passes pointer input through and disappears on time.

Visual critique: the central hierarchy is clear and the silhouette has room to breathe. The
halo is too pale on a large screen. The legacy portrait is only 180 px wide and visibly soft
when stretched to the launch size. Correct by reducing halo intensity and encoding the full
source for this use, then repeat the same captures.

## Asset provenance

Source: existing project illustration `images/phase-c/anam-veille-cut.png` (848×1264, transparent).
Export: `public/scene/portail/anam-portail.webp` (720 px wide), Sharp resize without enlargement,
WebP quality 88, alpha quality 100. No change to the person's appearance; existing PNG fallback.
The stars are plain decorative CSS points, hidden from assistive technology.

## Validation

See `results.json` and the browser captures. The preview is `/?portail=1` in the existing local
Vite harness, using synthetic content. Capture animation phases explicitly before advancing the
portal lifecycle; no production timing override exists.

Two pre-existing design checks still assumed the palette before the Carnet overlay. Updated
them to validate generated CSS parity against `design/tokens.json` before accepting its colors,
and to require the current token-backed browser theme color.

## Final pass

A second pass caught the intrinsic height of the new `<picture>` overflowing its grid row and
crossing the signature. Pinning the artwork inside its reserved frame fixed this in both engines;
the capture script now checks the portrait and signature bounds as well as the overall scene.

The final composition preserves clear separation between illustration and typography, with a
sharper face/hair/dress outline and a quieter halo. All 18 browser scenarios pass, including a
resource held indefinitely in each engine. No overflow, overlap, console error or retained overlay.
40 focused tests, TypeScript, ESLint and generated token parity pass. `launch-mobile.mp4` shows
the real finite sequence and its transition to the synthetic home preview.

Reproduce: start the existing Vite harness and run `node tests/visual-carnet/capture-portail.mjs`.
Set `CARNET_BASE_URL` if the harness uses a different port. No production deployment was made.
