# Carnet celeste — visual review

The redesigned frontend uses an ivory notebook, aubergine ink, lavender/rose/sage surfaces,
Fraunces headings and locally hosted Caveat annotations. The night preference persists locally;
system and explicit high contrast remain available. Backend code and database configuration
are unchanged from production commit `2024cdec7c232aede8b418381f18360576768eda`.

## Evidence

These images show real frontend components. Interior views use synthetic, offline fixtures
through `tests/visual-carnet`; the sign-in screen uses the Next application. No personal session
or production account was created. The local development-only sign-in controls in its capture
are absent from production.

- [Desktop home](accueil-bureau.webp), [mobile home](accueil-mobile.webp), [night](accueil-nuit.webp)
- [Astrology](astrologie-bureau.webp), [conversation](conversation-mobile.webp), [tree](arbre-bureau.webp)
- [Sign-in](connexion-bureau.webp)

Two visual passes covered 390, 768 and 1440 px. Corrections included oversized citations,
handwriting specificity, narrow astrology layout, seed text contrast, mobile composer clearance,
explicit reading failure, OS contrast priority and theme selection when storage rejects writes.
The browser checks found no horizontal overflow or JavaScript exceptions in the reviewed views.
Home includes empty, loading, failure and dense fixtures; conversation includes empty, long-text
and network-error states; tree includes empty and list states. See the portable harness README
for capture commands. Authentication itself was not exercised against production.

## Assets

- `public/marque/carnet-aquarelle.webp`: optimized from the existing project illustration
  `public/marque/header_mainpage.jpg` (94,772 bytes).
- Caveat Medium: Google Fonts, SIL Open Font License 1.1 bundled with the font. Self-hosted
  Latin/Latin Extended subset as WOFF2 (52,320 bytes); no external font requests.
- Existing `GlypheUnivers` artwork is reused for navigation.

## Release

The branch is `codex/carnet-celeste-ui`; the original production and rollback command are
recorded in [deployment.md](../../../_bmad-output/specs/spec-carnet-celeste/deployment.md).
Normal Vercel builds keep the existing schema gate. The read-only remote check reports
pre-existing missing migrations 0091–0093; this frontend change adds no dependency on them.
