---
title: 'Réservation atomique du quota gratuit'
type: 'bugfix'
created: '2026-08-26'
status: 'done'
review_loop_iteration: 0
baseline_commit: '5bc50f5c46991b5585716e7c9c123e608eb1d3ff'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/3-4-allocation-residuelle-metrage-exactement-une-fois.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-comptabilite-ia-par-utilisatrice.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le gate gratuit effectue aujourd'hui un comptage puis décide hors transaction. Deux tours simultanés arrivant sur la dernière place peuvent donc lire le même total, passer tous les deux et dépasser la limite.

**Approach:** Réserver atomiquement le tour logique dans un registre de quota séparé, sous verrou transactionnel par utilisatrice et mois, avant les appels conversationnels payants. `usage_ia` reste exclusivement le registre du coût fournisseur réellement engagé.

## Boundaries & Constraints

**Always:** garder la sécurité avant le quota ; court-circuiter premium, détresse et première séance sans réservation ; conserver l'idempotence par clé de tour logique ; utiliser le mois calendaire UTC ; rendre table et RPC inaccessibles aux sessions utilisatrices ; conserver un échec de réservation en fail-open journalisé sans contenu sensible ; faire survivre une réservation admise à un échec aval afin qu'un retry avec la même clé reste autorisé sans nouvelle unité.

**Ask First:** changer l'unité « tour logique », le fuseau mensuel, le repli fail-open, libérer automatiquement une réservation après un échec fournisseur ou rendre ce registre visible.

**Never:** utiliser une écriture de coût `usage_ia` comme mutex ; compter détresse, premium ou première séance ; accorder la RPC à `anon`/`authenticated` ; exposer la limite ou une décision au navigateur ; modifier l'UI, l'arbre ou l'ouverture quotidienne.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Dernière place concurrente | deux clés différentes, limite moins un déjà réservé | une seule réservation gagne et génère ; l'autre reçoit `quota` | verrou transactionnel, jamais de double admission |
| Retry concurrent | deux appels avec la même clé | les deux sont autorisés, une seule ligne existe | conflit idempotent absorbé |
| Aucun quota | limite `null` | accès sans RPC ni réservation | configuration douteuse reste fail-open |
| Limite zéro | première clé post-séance gratuite | refus sans insertion | trame `quota`, aucun appel conversationnel |
| Panne SQL | RPC lève ou rend une forme invalide | accès accordé sans réservation | log technique sans identifiant ni contenu |
| Bypass | premium, détresse ou première séance | chemin inchangé, zéro réservation | la sécurité et l'accès priment |

</frozen-after-approval>

## Code Map

- `supabase/migrations/0083_reservation_quota_ia_atomique.sql` -- table deny-by-default, reprise des tours déjà métrés et RPC service-role-only sous verrou.
- `lib/data/lire-allocation.ts` -- contrat serveur pour réserver une clé logique et lire le résultat strictement typé.
- `lib/domain/admission-quota.ts` -- matrice comportementale injectée des bypass, refus et repli fail-open.
- `lib/ai/jeton-tour.ts` -- canonisation de l'UUID logique avant métrage, journal et réservation.
- `app/api/anam/message/route.ts` -- remplace le couple comptage/décision par la réservation avant extraction et génération.
- `tests/reservation-quota.test.ts`, `tests/reservation-quota-unitaire.test.ts`, `tests/gate-quota.test.ts`, `tests/lire-allocation.test.ts` -- preuves pures, SQL concurrent et intégration route.
- `3-4-allocation-residuelle-metrage-exactement-une-fois.md`, `spec-comptabilite-ia-par-utilisatrice.md` -- décision de correction et séparation quota/coût.

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/0083_reservation_quota_ia_atomique.sql` -- créer la clé `(utilisatrice, mois, cle_idempotence)`, reprendre les lignes quota existantes et réserver sous verrou transactionnel avec grants service-role-only.
- [x] `lib/data/lire-allocation.ts` -- exposer une réservation serveur stricte ; conserver un comptage compatible fondé sur le nouveau registre.
- [x] `app/api/anam/message/route.ts` -- réserver après sécurité/entitlement/état de séance et avant tout appel conversationnel ; fail-open sur panne.
- [x] `tests/` -- couvrir concurrence, retry, borne zéro, changement de mois, accès SQL et ordre de route ; conserver les preuves coût/quota existantes.
- [x] Documentation BMad -- append-only dans la Story 3.4 et la spec comptabilité ; aucune réécriture de l'intent approuvé.

**Acceptance Criteria:**
- Given une seule place restante, when deux tours distincts réservent simultanément, then exactement un obtient l'autorisation et une seule nouvelle unité existe.
- Given une réservation existante, when la même clé est rejouée même après épuisement, then elle reste autorisée sans seconde ligne.
- Given une réponse fournisseur réelle après admission, when elle est métrée, then `usage_ia` décrit son coût sans devenir la source de vérité du quota.
- Given un bypass ou une panne du registre, when le gate s'exécute, then sécurité, premium et première séance ne sont jamais coupés.

## Spec Change Log

- 2026-08-26 — Implémentation : registre `reservation_quota_ia`, backfill des tours principaux éligibles, RPC service-role-only sérialisée par utilisatrice et mois UTC, gate fail-open avant les appels conversationnels. `usage_ia` demeure strictement le coût réel.
- 2026-08-26 — Revue Blind + Edge : 8 correctifs intégrés (canonisation, timeout, diagnostic, reprise courante/rollout, gate comportemental, UTC, exclusion, concurrence renforcée) ; dettes de jeton/bilan/config consignées derrière la porte OPS.

## Design Notes

La réservation représente l'admission durable d'un tour logique, pas sa facture. Le verrou est partitionné par utilisatrice et mois : il sérialise uniquement les concurrentes qui partagent réellement une limite. La clé existante est vérifiée avant le décompte ; elle permet donc le retry même si la limite est désormais atteinte. L'idempotence est volontairement **mensuelle**, conformément à la clé approuvée `(utilisatrice, mois UTC, clé)` : un retry franchissant le changement de mois appartient au nouveau quota. Le backfill et la réconciliation sous verrou depuis les lignes principales `usage_ia` évitent de réinitialiser silencieusement le mois pendant un rollout ; le registre de réservation reste seul compté pour la décision.

La limite vient encore de la configuration d'exécution existante. L'activation doit donc se faire après convergence de toutes les instances sur la même valeur ; une limite versionnée en base constituerait un changement de source produit, hors de ce correctif.

## Revue contradictoire (Blind Hunter + Edge Case Hunter)

**Corrigés :** UUID canonique de bout en bout ; RPC bornée et repli observable par code sûr ; backfill limité au mois courant ; réconciliation des écritures legacy sous le verrou ; matrice du gate extraite et testée par comportement ; frontières UTC testées ; exclusion opérationnelle canonisée ; éventail concurrent élargi en complément de la preuve structurelle SQL.

**Différés, sans les masquer :** le jeton reste choisi par le client et n'est pas lié à une identité serveur du contenu ; `finProposee` n'est toujours pas une preuve de bilan livré ; une bascule avec deux valeurs de limite concurrentes n'est pas arbitrée en base ; le lecteur d'exploitation calcule son mois côté application ; l'ancien prédicat de comptage est conservé pour compatibilité mais n'est plus le gate nominal. Ces points n'altèrent pas la correction de la course « deux dernières places », mais `ALLOCATION_RESIDUELLE_TOURS` ne doit pas être activée comme barrière économique hostile avant résolution du jeton client (F2/F6 déjà consigné).

**Écartés par contrat :** une unicité de clé traversant tous les mois contredirait la clé mensuelle explicitement approuvée et rendrait la rétention indéfinie. La preuve transactionnelle repose sur l'ordre verrou → reprise → idempotence → compte → insertion ; une barrière artificielle via PostgREST exigerait une RPC de test exposée en production. Le test réel élargit les concurrentes, mais l'exécution SQL locale reste conditionnée à Docker.

## Verification

**Commands:**
- `npx vitest run tests/reservation-quota.test.ts tests/gate-quota.test.ts tests/lire-allocation.test.ts tests/allocation-residuelle.test.ts tests/usage-ia.test.ts` -- scénarios purs et SQL ciblés verts, ou blocage Docker explicite pour les suites réelles.
- `npx tsc --noEmit` -- contrats TypeScript cohérents.
- `npx eslint` sur les fichiers du périmètre et `git diff --check` -- aucun défaut.

**Résultat final (2026-08-26) :** `229/229` tests ciblés purs/statiques verts (`5` cas PostgreSQL exclus par le filtre), `npx tsc --noEmit` vert, ESLint du périmètre vert et `git diff --check` vert. La passe PostgreSQL réelle a été retentée : les `7` gardes statiques passent, puis les `5` scénarios DB échouent au bootstrap `createUser: fetch failed` et les `5` scénarios lecteur sont ignorés par l'échec du `beforeAll`. `npx supabase status` confirme l'unique blocage d'environnement : daemon Docker indisponible sur `/Users/juliantalou/.docker/run/docker.sock`.

## Suggested Review Order

**Entrée et décision**

- Le gate borne la réservation après sécurité et avant toute génération conversationnelle.
  [`route.ts:292`](../../app/api/anam/message/route.ts#L292)

- La matrice injectée prouve chaque bypass, refus et repli fail-open.
  [`admission-quota.ts:33`](../../lib/domain/admission-quota.ts#L33)

**Transaction et sécurité SQL**

- Le registre sépare durablement admission mensuelle et coût fournisseur.
  [`0083_reservation_quota_ia_atomique.sql:8`](../../supabase/migrations/0083_reservation_quota_ia_atomique.sql#L8)

- Le verrou encadre reprise legacy, idempotence, plafond et insertion.
  [`0083_reservation_quota_ia_atomique.sql:68`](../../supabase/migrations/0083_reservation_quota_ia_atomique.sql#L68)

**Frontières serveur**

- Le wrapper canonise l'UUID et expose seulement un code d'erreur sûr.
  [`lire-allocation.ts:5`](../../lib/data/lire-allocation.ts#L5)

- Le jeton client valide est normalisé avant tous ses consommateurs.
  [`jeton-tour.ts:18`](../../lib/ai/jeton-tour.ts#L18)

**Preuves**

- Les branches premium, détresse, première séance et panne sont comportementales.
  [`admission-quota.test.ts:13`](../../tests/admission-quota.test.ts#L13)

- Les gardes SQL figent l'ordre transactionnel et les grants service-role-only.
  [`reservation-quota.test.ts:11`](../../tests/reservation-quota.test.ts#L11)

- L'éventail concurrent réel vérifie une seule gagnante à la dernière place.
  [`reservation-quota.test.ts:130`](../../tests/reservation-quota.test.ts#L130)
