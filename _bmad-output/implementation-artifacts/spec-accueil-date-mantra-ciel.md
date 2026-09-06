---
title: 'Accueil daté, mantra nu et ciel signé'
type: 'feature'
created: '2026-09-06'
status: 'done'
route: 'one-shot'
---

# Accueil daté, mantra nu et ciel signé

## Intent

**Problem:** L’accueil répétait « Aujourd’hui », séparait la date du mantra et présentait mantra et ciel comme deux cartes équivalentes. L’origine astrologique du ciel n’était pas explicite.

**Approach:** Garder « Aujourd’hui » comme repère de navigation, afficher la date parisienne en grand titre, poser le mantra entre guillemets sans encadré, puis conserver une seule carte de ciel signée par le glyphe et le libellé « Astrologie ».

## Suggested Review Order

**Hiérarchie quotidienne**

- La composition place mantra puis ciel, sans titre intermédiaire ni carte de mantra.
  [`Bibliotheque.tsx:26`](../../render/accueil/Bibliotheque.tsx#L26)

- Le grand titre affiche la date tout en préservant le nom de région.
  [`scene-dom.tsx:853`](../../render/scene-dom.tsx#L853)

- Les tokens existants portent l’espacement, la carte et la signature contrastée.
  [`accueil.module.css:16`](../../render/accueil/accueil.module.css#L16)

**Date et données**

- La date sans année est formatée une seule fois pour le rendu.
  [`date.ts:20`](../../render/accueil/date.ts#L20)

- Le jour parisien descend même si la bibliothèque quotidienne échoue.
  [`page.tsx:164`](../../app/page.tsx#L164)

**Preuves**

- Le test de rendu verrouille guillemets, ordre, absence de carte et signature.
  [`bibliotheque.test.tsx:52`](../../tests/rendu/bibliotheque.test.tsx#L52)

- Les parcours navigateur reconnaissent désormais le titre daté.
  [`_entrer.ts:5`](../../e2e/_entrer.ts#L5)
