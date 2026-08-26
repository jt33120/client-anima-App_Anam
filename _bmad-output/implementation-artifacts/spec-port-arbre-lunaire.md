---
title: 'Porter le handoff lunaire dans Mon arbre'
type: 'feature'
created: '2026-08-26'
status: 'done'
review_loop_iteration: 2
baseline_commit: '5bc50f5c46991b5585716e7c9c123e608eb1d3ff'
context:
  - '{project-root}/images/assets/design_handoff_arbre_lunaire/README.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-Anima-2026-07-21/DESIGN.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le véritable écran « Mon arbre » dessine encore un éventail SVG simplifié et remplace son état initial par une vieille graine sur un voile violet. Il ignore donc le moteur lunaire Canvas validé et rompt la continuité du ciel étoilé.

**Approach:** Porter la géométrie et la peinture procédurales du handoff officiel dans un moteur Canvas de production, puis l'intégrer sous les interactions DOM existantes. Les 13 premières branches reprennent les emplacements validés ; les suivantes reçoivent des emplacements déterministes stables sans limite ni troncature silencieuse.

## Boundaries & Constraints

**Always:** Canvas logique 1408×2503, palette exacte, quatre couches mises en cache, graine/tronc/racines et branches dans un seul moteur transparent ; états indépendants `naissance=0`, `feuillaison=intensite`, `rayonnement=1` ; seed RNG fixe ; positions stables par rang ; conservation du pan/zoom, des boutons DOM, du clavier, de la vue liste et des fiches ; `render/` reste muet et ne dépend que de `lib/scene`.

**Ask First:** Toute nouvelle dépendance, modification du modèle métier, limite du nombre de branches ou changement de sémantique d'une interaction existante.

**Never:** Utiliser `reference.png` en production ; garder l'ancien SVG comme état alternatif ; ajouter voile violet, fruit, score, compteur, particule, animation de croissance ou aura globale ; modifier menu, aide, Moi, Conversation ou `design/design-spec.md`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Étape 0 | Projection vide | Même Canvas lunaire transparent, graine seule dans le ciel, texte discret sans voile plein | Conserver le chemin accessible vers le tronc incomplet |
| États | Naissance / feuillaison / rayonnement | Trait nu / matière continue / lumière nacre statique selon chaque branche | Borner toute intensité à `[0,1]` |
| Arbre dense | 14 à 60 branches | Toutes rendues et adressables, positions antérieures inchangées | Vue liste reste l'alternative tactile si les ancres deviennent denses |
| Canvas indisponible | `getContext("2d")` absent | Le DOM et les actions restent montables, sans exception | Dégradation visuelle silencieuse, aucun accès aux données |

</frozen-after-approval>

## Code Map

- `images/assets/design_handoff_arbre_lunaire/Arbre de Vie Lunaire.dc.html` -- source géométrique et picturale validée.
- `render/arbre/geometrie.ts` -- repère partagé et placement déterministe des branches/ancres.
- `render/arbre/ArbreInteractif.tsx` -- pan/zoom, DOM accessible, liste et fiches à préserver.
- `render/arbre/EtatVideArbre.tsx` -- copie de l'étape 0, sans dessin alternatif.
- `render/arbre/arbre.module.css` -- intégration transparente dans le ciel étoilé.

## Tasks & Acceptance

**Execution:**
- [x] `render/arbre/geometrie.ts` -- porter les 13 emplacements canoniques et générer une extension stable au-delà.
- [x] `render/arbre/MoteurArbreLunaire.ts` et `render/arbre/ArbreLunaire.tsx` -- porter le moteur Canvas, ses caches et le mapping des états.
- [x] `render/arbre/ArbreInteractif.tsx`, `EtatVideArbre.tsx`, `arbre.module.css` -- remplacer le SVG sans perdre une interaction ni le fond étoilé.
- [x] `tests/geometrie-arbre.test.ts`, `tests/rendu/*arbre*.test.tsx` -- couvrir fidélité structurelle, étape 0, continuum, >13 et interactions.

**Acceptance Criteria:**
- Given une projection vide, when Mon arbre s'affiche, then un unique Canvas lunaire transparent montre l'étape 0 et aucun ancien SVG/voile plein.
- Given des branches dans les trois états, when le moteur rebake, then chacune reçoit indépendamment le rendu du handoff et aucun chiffre ou objet-récompense.
- Given 60 branches ajoutées successivement, when la géométrie est recalculée, then les 60 existent, ont des ancres distinctes et aucune des précédentes ne bouge.
- Given le rendu Canvas, when l'utilisatrice zoome, glisse, utilise le clavier, bascule en liste ou ouvre une fiche, then les comportements existants restent fonctionnels.

## Spec Change Log

- 2026-08-26 — Revue globale, itération 2 : ordre réseau remplacé par `dateNaissance` valide puis `id`; dates absentes/invalides placées après les dates valides et départagées par `id`.
- 2026-08-26 — Revue globale, itération 2 : cible tactile fixée à 44×44 px ; zoom, clavier et vue liste désambiguïsent les branches denses sans réduire le hit-target.
- 2026-08-26 — Revue Blind Hunter + Edge Case Hunter : 14 observations analysées, 10 correctifs produit/test appliqués, aucun finding valide restant.
- 2026-08-26 — Le flux partagé `mulberry32(23)` et la première feuille ont été comparés à l'exécution du prototype officiel.

## Design Notes

La géométrie pure est partagée entre le moteur Canvas et la couche DOM afin d'empêcher tout décalage visuel des ancres. L'extension après le treizième emplacement sélectionne des positions déterministes dans l'ellipse de canopée en maximisant leur distance aux positions déjà attribuées ; elle dépend uniquement du rang, jamais de l'effectif final.

Le rang visuel ne dépend pas de l'ordre de livraison : les branches à date valide sont triées chronologiquement, puis par `id`. Une date absente ou non parseable rejoint un groupe de repli situé après les dates valides, lui-même trié par `id`. Dans le flux nominal, une naissance plus récente s'ajoute donc sans déplacer les précédentes ; le repli privilégie la reproductibilité lorsque la chronologie manque.

Chaque accroche DOM conserve 44×44 px à l'écran grâce au contre-zoom. Lorsque la densité produit des recouvrements, le zoom sépare les ancres et la vue liste ainsi que le clavier restent les chemins non spatiaux exhaustifs.

## Verification

**Commands:**
- `npx vitest run tests/arbre-lunaire.test.ts tests/geometrie-arbre.test.ts tests/arbre-rendu.test.ts tests/arbre-sans-fruit.test.ts tests/rendu/arbre-lunaire.test.tsx tests/rendu/moteur-arbre-lunaire.test.tsx tests/rendu/arbre-cycle.test.tsx tests/rendu/arbre-gestes.test.tsx tests/rendu/arbre-mesure.test.tsx tests/rendu/tronc-incomplet.test.tsx tests/rendu/arbre-gratuit.test.tsx tests/rendu/lotus-et-arbre-vide.test.tsx tests/rendu/arbre-sans-mesure.test.tsx` -- 13 fichiers, 157 tests passants.
- `npx tsc --noEmit` -- aucune erreur TypeScript.
- `npm run lint` -- aucune erreur ESLint.
- Revue visuelle sur la vraie scène étoilée -- graine et arbre 13 branches à 390, 768 et 1440 px ; aucun débordement ni erreur console.

## Suggested Review Order

**Entrée et conservation des interactions**

- Superpose le Canvas lunaire aux contrôles DOM existants, sans modifier leur sémantique.
  [`ArbreInteractif.tsx:436`](../../render/arbre/ArbreInteractif.tsx#L436)

- Isole molette, pincement et clavier des couches de fiche et d'état vide.
  [`ArbreInteractif.tsx:191`](../../render/arbre/ArbreInteractif.tsx#L191)

- Garantit 44 px écran ; zoom, clavier et liste désambiguïsent les fortes densités.
  [`ArbreInteractif.tsx:277`](../../render/arbre/ArbreInteractif.tsx#L277)

**Géométrie et peinture lunaire**

- Stabilise le rang par date valide, puis identifiant ; le repli vient après.
  [`geometrie.ts:189`](../../render/arbre/geometrie.ts#L189)

- Porte le repère officiel et étend les routes sans plafond silencieux.
  [`geometrie.ts:209`](../../render/arbre/geometrie.ts#L209)

- Reprend exactement le flux feuille canonique, puis stabilise chaque rang supplémentaire.
  [`MoteurArbreLunaire.ts:155`](../../render/arbre/MoteurArbreLunaire.ts#L155)

- Met en cache séparément base, bois, feuilles et lueur selon leurs vraies dépendances.
  [`MoteurArbreLunaire.ts:233`](../../render/arbre/MoteurArbreLunaire.ts#L233)

- Garde graine et arbre dans un moteur transparent, sans voile ni SVG alternatif.
  [`MoteurArbreLunaire.ts:477`](../../render/arbre/MoteurArbreLunaire.ts#L477)

- Adapte le moteur impératif au cycle React sans le reconstruire.
  [`ArbreLunaire.tsx:18`](../../render/arbre/ArbreLunaire.tsx#L18)

**Preuves de régression**

- Instrumente réellement chaque couche Canvas, le cache, les joints et la continuité.
  [`moteur-arbre-lunaire.test.tsx:141`](../../tests/rendu/moteur-arbre-lunaire.test.tsx#L141)

- Verrouille le premier échantillon officiel et la stabilité de 60 feuillages.
  [`arbre-lunaire.test.ts:93`](../../tests/arbre-lunaire.test.ts#L93)

- Prouve l'invariance par permutation, dates invalides comprises, sans muter l'entrée.
  [`geometrie-arbre.test.ts:59`](../../tests/geometrie-arbre.test.ts#L59)

- Vérifie chaque point de chaque segment dans le portrait logique.
  [`geometrie-arbre.test.ts:125`](../../tests/geometrie-arbre.test.ts#L125)

- Mesure 44×44 px à trois largeurs et jusqu'à 60 branches.
  [`arbre-gestes.test.tsx:72`](../../tests/rendu/arbre-gestes.test.tsx#L72)

- Couvre le clic clavier post-glisser, le pinch nul et la molette de copie.
  [`arbre-gestes.test.tsx:159`](../../tests/rendu/arbre-gestes.test.tsx#L159)
