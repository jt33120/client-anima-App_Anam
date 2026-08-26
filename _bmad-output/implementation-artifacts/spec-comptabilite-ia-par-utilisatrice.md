---
title: 'Comptabilité IA par utilisatrice'
type: 'feature'
created: '2026-08-26'
status: 'done'
review_loop_iteration: 1
baseline_commit: '5bc50f5c46991b5585716e7c9c123e608eb1d3ff'
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-Anima-2026-07-22/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/3-4-allocation-residuelle-metrage-exactement-une-fois.md'
  - '{project-root}/_bmad-output/implementation-artifacts/2-3-pipeline-serveur-securite-d-abord.md'
  - '{project-root}/_bmad-output/implementation-artifacts/4-9-synthese-periodique-modele-fort.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `usage_ia` attribue déjà des jetons à une utilisatrice, mais ne permet pas d'expliquer précisément quel sous-appel a coûté quoi. La détection de détresse et la synthèse périodique échappent en outre au registre, ce qui sous-estime le coût réel.

**Approach:** Enrichir chaque écriture d'une opération et de sa capacité, d'un instantané d'accès premium, d'une exemption de quota indépendante, du tarif versionné et d'un coût USD exact en `numeric`. Faire transiter conversation, sécurité et synthèse par ce même contrat idempotent, sans déplacer la décision de quota chez le fournisseur.

## Boundaries & Constraints

**Always:** conserver l'unicité `(utilisatrice_id, cle_idempotence)`, le deny-by-default et l'absence de contenu art. 9 ; calculer le coût côté serveur avec des décimaux exacts et un tarif daté ; enregistrer la sécurité comme coût financier tout en la marquant hors quota ; conserver `post_premiere_seance` comme trace de compatibilité et de reprise, tandis que `reservation_quota_ia` porte la décision transactionnelle du quota ; mesurer une réponse fournisseur même si son contenu est ensuite rejeté ou si la persistance métier échoue.

**Ask First:** tout changement de devise, de fournisseur ou de sémantique de quota ; tout besoin d'exposer ce registre à l'utilisatrice ou à une interface d'administration.

**Never:** créer ou stocker une clé fournisseur par utilisatrice ; exposer une clé ou ce registre au navigateur ; inventer une ligne Stripe pour l'accès offert ; rendre la détection dépendante d'un quota, d'un paywall ou d'une écriture de métrage ; modifier les fichiers UI, menu, arbre, Moi ou `render/conversation` ; inclure prompt, réponse, verbatim ou état clinique dans `usage_ia`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Conversation | réponse complète ou flux interrompu après production | une ligne idempotente, opération/capacité, jetons, premium, tarif et coût exacts | métrage best-effort ; aucun faux coût si rien n'a été produit |
| Détection | appel fort réussi, même sortie illisible | coût enregistré avec `exempte_quota=true` et `comptabilise_financierement=true` | blocage egress/exception sans réponse = aucune ligne ; le repli sûr reste prioritaire |
| Synthèse | appel fort réussi puis sortie rejetée, écriture refusée ou rejeu | coût enregistré une fois par utilisatrice et période couverte | clé stable ; panne de métrage ne fait pas échouer le job |
| Tarif inconnu | modèle non catalogué | ligne conservée, tarif signalé inconnu, coût laissé `null` plutôt qu'un faux zéro | alerte sans contenu sensible |
| Accès offert | `abonnement.etat='actif'`, `offert_le` non nul, ids Stripe nuls | instantané premium vrai ; aucun changement de la projection d'abonnement | aucune création ou mutation Stripe |

</frozen-after-approval>

## Code Map

- `supabase/migrations/0081_comptabilite_ia.sql` -- extension additive du registre, contraintes et documentation.
- `lib/ai/tarification.ts` -- catalogue daté et calcul décimal exact, indépendant de Supabase.
- `lib/ai/metrage.ts` -- contrat unique d'écriture, idempotence et persistance des dimensions financières.
- `lib/safety/detecteur-detresse.ts`, `lib/safety/pipeline.ts` -- remontée de l'usage fournisseur sans changer le verdict ni le repli sûr.
- `lib/safety/reconceptualisation-pipeline.ts`, `lib/safety/retour-theme-pipeline.ts`, `lib/safety/hypothese-enneagramme-pipeline.ts`, `lib/safety/compactage-pipeline.ts` -- normalisation anti-faux-zéro et conservation de l'usage après réponse fournisseur.
- `app/api/anam/message/route.ts` -- instantané premium partagé et étiquetage des sous-appels existants ; aucune UI.
- `lib/ordonnanceur/jobs/synthese.ts` -- métrage idempotent dès qu'une réponse fournisseur a été consommée.
- `tests/*metrage*`, `tests/detecteur-detresse.test.ts`, `tests/pipeline-securite.test.ts`, `tests/synthese-job.test.ts`, `tests/usage-ia.test.ts` -- preuves ciblées.

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/0081_comptabilite_ia.sql` -- ajouter les dimensions avec défauts compatibles, `cout_usd numeric`, contraintes non négatives et commentaires ; laisser RLS/policies inchangées.
- [x] `lib/ai/tarification.ts`, `lib/ai/metrage.ts` -- centraliser prix, calcul exact et écriture ; rendre opération, capacité, premium et exemption explicites à chaque appelant.
- [x] `lib/safety/detecteur-detresse.ts`, `lib/safety/pipeline.ts`, `app/api/anam/message/route.ts` -- propager puis métriser l'usage de détection ; étiqueter tous les appels conversationnels sans toucher au rendu.
- [x] `lib/ordonnanceur/jobs/synthese.ts` -- métriser la synthèse avec une clé stable dérivée de sa période et un instantané premium vrai garanti par l'egress d'éligibilité.
- [x] `tests/` -- couvrir calculs exacts, modèle inconnu, compatibilité, idempotence, séparation coût/quota, sécurité et synthèse.

**Acceptance Criteria:**
- Given un appel Mistral catalogué, when son usage est enregistré, then le coût `numeric` est reproductible depuis les jetons et les deux prix unitaires persistés, sans flottant JavaScript.
- Given une détection de détresse réussie, when le quota mensuel est lu, then sa ligne financière existe mais ne compte jamais comme tour résiduel.
- Given un rejeu du même tour ou de la même période de synthèse, when le métrage repasse, then la première ligne reste seule et inchangée.
- Given l'accès offert existant, when un appel est métré, then `premium_au_moment_appel=true` sans identifiant ni événement Stripe fabriqué.

### Review Findings

- [x] [Review][Patch] Publier l'usage de détection avant toute persistance d'audit ou d'épisode [`lib/safety/pipeline.ts`].
- [x] [Review][Patch] Conserver l'usage du compactage quand son écriture métier échoue [`lib/safety/compactage-pipeline.ts`].
- [x] [Review][Patch] Centraliser le repli anti-faux-zéro pour toutes les réponses non streamées [`lib/ai/metrage.ts`].
- [x] [Review][Patch] Borner et absorber le métrage de synthèse sans bloquer sa persistance [`lib/ordonnanceur/jobs/synthese.ts`].
- [x] [Review][Patch] Inclure le début et la fin dans la clé idempotente de synthèse [`lib/ordonnanceur/jobs/synthese.ts`].
- [x] [Review][Patch] Borner la lecture premium partagée et conserver `null` en cas de doute [`app/api/anam/message/route.ts`].
- [x] [Review][Patch] Rendre le catalogue sûr face aux propriétés du prototype JavaScript [`lib/ai/tarification.ts`].
- [x] [Review][Patch] Dériver prix persistés et coût de la même source entière [`lib/ai/tarification.ts`].
- [x] [Review][Patch] Versionner explicitement l'absence d'un modèle dans le catalogue courant [`lib/ai/tarification.ts`].
- [x] [Review][Patch] Contraindre les opérations métier admises en base [`supabase/migrations/0081_comptabilite_ia.sql`].
- [x] [Review][Patch] Rendre la contrainte tarif connu/inconnu bidirectionnelle [`supabase/migrations/0081_comptabilite_ia.sql`].
- [x] [Review][Patch] Tolérer les compteurs historiques négatifs sans autoriser de nouvelles anomalies [`supabase/migrations/0081_comptabilite_ia.sql`].
- [x] [Review][Patch] Aligner les compteurs PostgreSQL sur la plage des entiers sûrs acceptés [`supabase/migrations/0081_comptabilite_ia.sql`].
- [x] [Review][Patch] Renforcer le test interdisant chaque nom de clé fournisseur individuellement [`tests/metrage-registre.test.ts`].
- [x] [Review][Patch] Ajouter un garde mutant prouvant le filtre explicite `exempte_quota=false` [`tests/comptabilite-ia-cablage.test.ts`].

Constats écartés après triage : les retries physiques restent volontairement dédupliqués par sous-appel logique dans cette tranche ; reconceptualisation, retour de thème et hypothèse rendaient déjà leur usage malgré un échec de persistance (seul le compactage avait le défaut) ; `tier` peut légitimement être relevé au-dessus de la capacité déclarée par le niveau de sécurité.

## Spec Change Log

- 2026-08-26, revue adversariale : le registre reste délibérément idempotent par **sous-appel logique**. Un rejeu portant exactement la même clé n'ajoute ni ligne ni coût, conformément à l'unicité approuvée ; ce registre n'est donc pas une réconciliation de facture par tentative HTTP physique. La synthèse distingue désormais deux tranches dont la fin diffère (`début + fin`). Une future comptabilité par tentative exigerait un identifiant d'appel physique et une seconde règle d'unicité, sans réutiliser le marqueur de quota logique.

## Design Notes

Les tarifs courants sont représentés en unités entières sub-dollar par jeton puis sérialisés en chaîne décimale vers Postgres. Un modèle inconnu reste visible avec coût `null` : zéro voudrait dire « gratuit », ce que le système ne sait pas.

Le quota et la comptabilité n'ont pas la même sémantique, mais partagent ici la même granularité idempotente : un sous-appel logique. `reservation_quota_ia` admet atomiquement les tours gratuits ; `post_premiere_seance` reste une trace de compatibilité et de backfill ; `exempte_quota` décrit l'exemption sur le registre financier. Les dimensions financières décrivent le coût exact calculé pour la première exécution enregistrée de cette clé. Les tentatives fournisseur additionnelles strictement identiques sont volontairement dédupliquées dans cette tranche, plutôt que comptées de façon non atomique ou confondues avec des tours de quota.

## Verification

**Commands:**
- `npx vitest run tests/tarification-ia.test.ts tests/metrage-registre.test.ts tests/metrage-resolution.test.ts tests/comptabilite-ia-cablage.test.ts tests/detecteur-detresse.test.ts tests/pipeline-securite.test.ts tests/pipeline-episode.test.ts tests/reconceptualisation-pipeline.test.ts tests/retour-theme-pipeline.test.ts tests/hypothese-enneagramme-pipeline.test.ts tests/compactage-carte.test.ts tests/synthese-job.test.ts tests/gate-quota.test.ts tests/proposer-abonnement.test.ts tests/journal-route.test.ts` -- 181/181 scénarios purs ciblés verts.
- `npx tsc --noEmit` -- contrats TypeScript cohérents.
- `npx eslint` sur les 24 fichiers TypeScript du périmètre -- aucun défaut.
- `npx supabase status` -- blocage d'environnement confirmé : impossible d'inspecter les conteneurs, daemon Docker indisponible sur `/Users/juliantalou/.docker/run/docker.sock`. Les trois suites SQL restent présentes pour la vérification dès que la pile locale tourne ; aucun échec de test SQL n'est masqué derrière ce statut `done`.

## Amendement 2026-08-26 — quota atomique séparé du coût

La correction de concurrence de la Story 3.4 ne change pas la sémantique comptable de ce document. `usage_ia` reste le registre du coût fournisseur réellement produit. L'admission d'un tour gratuit vit désormais dans `reservation_quota_ia`, avec sa propre idempotence mensuelle et sa RPC atomique service-role-only ; aucune écriture de coût n'est utilisée comme verrou. Une réservation survit à l'échec aval, tandis qu'un retry portant la même clé logique n'ajoute ni unité de quota ni ligne de coût supplémentaire.
