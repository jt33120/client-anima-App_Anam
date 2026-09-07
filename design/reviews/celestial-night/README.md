# Celestial night — reviewed 2026-09-06

The founder rejected the V1 mobile home and keyboard screenshots. This iteration defaults to night, replaces earthy surfaces with sky-blue and violet gradients, introduces a generated textured lotus/star background, compacts home content, and gives the scene sole ownership of keyboard geometry.

The seven WebP files are review evidence, with synthetic personal content. Home and conversation captures render the real application components through `tests/visual-carnet/`; the sign-in capture uses the actual Next production build anonymously. No real personal content is captured.

- Home: 390/768/1440 px, short and 251-character quotation, light/night/reinforced contrast, empty/error/loading. 21 scenarios, no browser errors or horizontal overflow.
- Keyboard: actual Chromium and WebKit engines, simulated VisualViewport/keyboard. Eight combinations of iOS/Android geometry and 390/1024 widths. For iOS the layout viewport stays 844 px while VisualViewport is 430 px with offsetTop 56; Android already reduces the layout viewport to 430 px. The reading window stays 252 px, a long draft uses 98 px, and the composer bottom stays 8 px above the keyboard. Draft, zoom handoff and closing restoration are checked. This is not a physical iPhone keyboard test.
- The second visual pass narrows the hero illustration to its own half, reduces decorative opacity to meet AA at the worst possible image pixel, and removes the double focus outline.

Reproduce with the commands in `tests/visual-carnet/README.md` and `node tests/visual-carnet/verify-keyboard.mjs`. Full PNG output remains in `/tmp/anima-night-final` and `/tmp/anima-keyboard-captures` for this session.

The prior production deployment `dpl_DFEd5WyGwpeoQM5fbnTDFUNKC4z4` (commit `40dcd22593c6c69737def3641f51f62c57b7a63c`) is the rollback target. Main and all backend/data code are unchanged by this iteration.
