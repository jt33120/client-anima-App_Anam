---
title: Parcours durable piloté par Anam
type: feature
created: 2026-09-08
status: done
baseline_commit: 092794c
review_loop_iteration: 2
context: []
---

<frozen-after-approval reason="Carte blanche et continuation explicite du fondateur">

## Intent
**Problem:** Les pratiques existent, mais Anam ne peut pas encore organiser un suivi durable visible ni déclencher le prochain palier de l’arbre.
**Approach:** Mon parcours réunit repères personnels, cap, synthèse, trois prochains pas maximum et historique. Deux outils natifs permettent à Anam d’ajuster le plan et de reconnaître un passage documenté.

## Boundaries & Constraints
**Always:** Modèle acteur du plan, serveur autorité des écritures. Versions et idempotence, auteur explicite, contexte borné traité comme données, garde SQL consentement/majorité/détresse/72h. Repères utilisateur non modifiables par l’agent. Un palier par passage, jamais de régression, export et effacement complets. Texte français et tokens existants.
**Ask First:** Aucun arbitrage utilisateur nécessaire dans le périmètre autorisé.
**Never:** Déclarer un rayonnement ou créer une branche implicitement, promettre un traitement, mesurer une valeur personnelle, progresser par visite/minuteur/questionnaire, exposer les textes dans URL/logs/localStorage. Préserver opencode.json.

## I/O & Edge-Case Matrix
| Situation | Comportement |
|---|---|
| Cap concret exprimé | Outil ajuste une à trois prochaines étapes ; reçu après commit |
| Passage de la première étape raconté | Citation source vérifiée ; retrait de l’étape, historique et illustration suivante atomiques |
| Source étrangère, étape absente ou argument malformé | Refus sans mutation |
| Deux onglets ou retry | CAS évite l’écrasement ; retry exact retrouve résultat, divergence refusée |
| Pause, détresse ou consentement retiré | Aucune mutation agent ; outils absents ou refus SQL |
| Flux coupé ou DB en panne | Pas de faux succès ; lecture indisponible distincte du vide |
| Compte sans branche | Première reconnaissance fait pousser l’illustration sans branche artificielle |
| Arbre déjà avancé | Palier calculé depuis son état existant ; plafonnement dernière planche |

</frozen-after-approval>

## Code Map
- `lib/domain/suivi-anam.ts`, `lib/data/depot-suivi-anam.ts`, `supabase/migrations/0101_suivi_anam.sql` : état, droits, mutations et provenance.
- `lib/ai/outils-parcours.ts`, `app/api/anam/message/route.ts` : contexte et appels natifs gardés.
- `app/parcours/`, `render/parcours/`, `app/api/anam/suivi/route.ts` : lecture, documents et pause.
- `lib/scene/projection.ts`, `lib/safety/projection-arbre.ts`, `render/arbre/` : palier durable et projection.
- `app/page.tsx`, `render/conversation/`, menu et pied de halte : accès et retour au chat.

## Tasks & Acceptance
**Execution:**
- [x] `supabase/migrations/0101_suivi_anam.sql` et dépôts : stockage, CAS, provenance, write gates et lifecycle.
- [x] `lib/ai/outils-parcours.ts` et route : appel natif, contexte borné, exécution après fin et reçu confirmé.
- [x] `app/parcours/`, `render/parcours/` : état vide/actif/pause/panne, repères, prochain pas et historique.
- [x] Projection arbre : niveau du suivi, continuité de l’existant, évolution sans branche et monotonie.
- [x] Navigation : accès direct depuis chat/Pratiques/menu et brouillons neutres.
- [x] Tests et revue : isolation, concurrence, retry, sécurité, export/effacement, parcours navigateur et captures.

**Acceptance Criteria:**
- Étant donné un compte autorisé, quand Anam ajuste son cap, alors Mon parcours retrouve les étapes enregistrées sans modifier ses repères.
- Étant donné un premier pas existant, quand Anam reconnaît une expérience source, alors historique et prochaine illustration sont persistés une fois.
- Étant donné une pause ou un conflit, quand un appel de suivi arrive, alors aucun faux succès ni progression ne paraît.
- Étant donné 390, 768 ou 1440 pixels, quand le parcours est ouvert, alors les actions et les textes restent accessibles sans débordement.

## Spec Change Log
- Revue indépendante : verrous consentement, reçus avant les anciens effets du tour, suppression des faux succès natifs, projection indisponible, comparaison de conflits et identité du compte au montage.
- Les bornes Unicode des outils restent compatibles avec le tampon du fournisseur.

## Design Notes
Halte Mon parcours dans le carnet céleste existant. Cap et prochain pas en tête, suite courte, repères éditables, passages datés et lien arbre. Aucun score ou série. Liens vers chat avec intentions fermées seulement ; notes personnelles jamais préremplies dans URL.

## Verification
Vitest ciblé et suite complète, lint, TypeScript, build, Graft check. Supabase local pour RLS/CAS/exports/effacement. Playwright authentifié et captures 390/768/1440 ; preuve fournisseur synthétique distincte du transport simulé.

## Final result
Implémentation locale terminée. Deux passes de revue corrigées, 6 756 tests et sept parcours navigateur verts, TypeScript/lint/build réussis. Voir [preuve de vérification](verification-parcours-anam.md) et [revue visuelle](../../design/reviews/parcours/README.md). Migration distante et déploiement non exécutés.
