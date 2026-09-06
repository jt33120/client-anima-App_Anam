---
title: 'Afficher Anam de dos au chargement'
type: 'feature'
created: '2026-09-06'
status: 'done'
route: 'one-shot'
---

# Afficher Anam de dos au chargement

## Intent

**Problem:** Le portail de lancement affiche encore l’arbre alors que ce visuel doit être réservé à l’évolution.

**Approach:** Remplacer l’arbre par l’asset officiel `anam-veille`, qui représente Anam de dos, sans modifier la durée ni la sortie du portail.

## Suggested Review Order

- Le portail réutilise le système d’images existant et charge le portrait en priorité.
  [`PortailAnam.tsx:98`](../../render/portail/PortailAnam.tsx#L98)

- La silhouette reste entière sur les écrans courts et larges.
  [`portail.module.css:63`](../../render/portail/portail.module.css#L63)

- Le test garantit le portrait Veille et l’absence de canevas.
  [`portail.test.tsx:220`](../../tests/rendu/portail.test.tsx#L220)
