---
title: 'Simplifier l’explication de l’arbre vide'
type: 'feature'
created: '2026-09-06'
status: 'done'
route: 'one-shot'
---

# Simplifier l’explication de l’arbre vide

## Intent

**Problem:** L’état graine présente une longue explication dans un encadré qui masque le ciel et surcharge l’écran.

**Approach:** Afficher une explication courte directement sur le ciel et une phrase discrète sous la graine.

## Suggested Review Order

- L’explication courte remplace le bloc éditorial sans retirer le chemin vers le tronc.
  [`EtatVideArbre.tsx:40`](../../render/arbre/EtatVideArbre.tsx#L40)

- Le message accompagne la graine et disparaît avec elle dès la première branche.
  [`ArbreInteractif.tsx:463`](../../render/arbre/ArbreInteractif.tsx#L463)

- Le placement utilise les tokens existants et aucune surface de carte.
  [`arbre.module.css:203`](../../render/arbre/arbre.module.css#L203)

- Les scénarios ciblés gardent le contenu et le parcours mobile accessibles.
  [`lotus-et-arbre-vide.test.tsx:148`](../../tests/rendu/lotus-et-arbre-vide.test.tsx#L148)
