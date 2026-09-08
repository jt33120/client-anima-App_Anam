---
title: Nuit et numérologie personnelle validée
type: feature
created: 2026-09-08
status: done
baseline_commit: b8063db1aa7f610a50f9f9639a4ff8184ff04f98
review_loop_iteration: 0
context: []
---
<frozen-after-approval reason="Intention explicite de réalisation et de déploiement fournie par Julian">
## Intent
**Problem:** Le mode Papier ne convient plus. Les univers exposent des listes techniques avant les repères utiles. La numérologie ne propose pas de synthèse personnelle ni de moyen contrôlé de la confier à Anam.
**Approach:** Garder Nuit, simplifier Astrologie et proposer deux lectures numérologiques IA à partir des calculs existants. Une notation de pertinence et un partage explicite relient seulement le portrait accepté à la conversation.

## Boundaries & Constraints
**Always:** Authentification et consentement art.9 vivant ; calculs serveur ; chiffres et année seulement vers l’IA ; nom complet facultatif déjà collecté, contenant prénoms et nom de naissance. Séparer interprétation symbolique et fait. Retirer le partage à note ≤4, retrait explicite, changement des entrées ou nouvelle année. Conserver les préférences d’accessibilité.
**Ask First:** Seule une décision qui dépasse le mandat explicite nécessite clarification ; réalisation, migrations et déploiement sont autorisés.
**Never:** Ajouter le prénom d’adresse au nom complet ; accepter un texte IA ou des chiffres calculés par le client ; conserver un partage sur une nouvelle analyse ; introduire diagnostic, prédiction certaine ou trait sensible ; inclure opencode.json.

## I/O & Edge-Case Matrix
| Situation | Entrée | Résultat attendu | Échec |
|---|---|---|---|
| Première lecture | Année et nombres serveur | Clic Créer ma lecture → JSON validé guidanceAnnee, visionLongTerme, portrait | Erreur française et réessai borné ; nombres toujours lisibles |
| Cache actuel | Même signature/version/année | Relire sans appel IA | Échec de lecture distinct de vide |
| Nom absent | Date disponible | Guidance et portrait sur chiffres disponibles ; lien facultatif pour nom | Ne pas inventer de nombres |
| Notes | 1–5 entiers | Persister note ; 5 seul rend possible partagerAnam | Rejeter 0,6,fraction,ID étranger |
| Partage | ID actuel, note 5, choix explicite | Portrait serveur seul ajouté comme hypothèse au contexte | Note ≤4 ou retrait exclut aussitôt |
| Révocation/entrée modifiée | Droits retirés, date/nom/année changé | Aucun ancien texte servi ou partagé | Échec fermé, aucune fuite IA |
| Concurrence | Deux créations identiques | Une réservation durable ; coût borné | Bail expiré récupérable, pas de boucle infinie |
</frozen-after-approval>

## Code Map
- `render/carnet/ThemeCarnet.tsx`, `render/surimpression.tsx`, `app/layout.tsx` : choix du thème et en-tête.
- `render/socle/FicheSocle.tsx`, `lib/domain/fiche-socle.ts`, `render/socle/types.ts` : présentation et ordre des repères.
- `lib/data/lire-numerologie.ts`, `lib/astro/numerologie.ts` : données facultatives et calculs existants.
- `lib/ai/egress-guard.ts`, `lib/ai/port.ts`, `lib/ai/metrage.ts`, `lib/ai/texte-du-jour.ts` : garde, fournisseur, métrage et cache exemplaires.
- `lib/data/lire-contexte-anam.ts`, `lib/domain/contexte-anam.ts` : mémoire de la conversation.
- `supabase/migrations/0094*`, `0095*`, `0098*` : écritures serveur réservées et export actuel.

## Tasks & Acceptance
**Execution:**
- [x] `supabase/migrations/0099_lectures_numerologie.sql` : table privée, réservations atomiques bornées, finalisation serveur, notation authentifiée, retrait, invalidation et export ; FK cascade effacement.
- [x] `lib/domain/lecture-numerologie.ts`, `lib/data/depot-lecture-numerologie.ts`, `lib/ai/lecture-numerologie.ts`, `app/api/numerologie/route.ts` : contrats, messages bornés et prudents, validation JSON, cache et génération. Ajouter capacité/métrage dédiés et inventaires export/effacement.
- [x] `lib/data/lire-contexte-anam.ts`, `lib/domain/contexte-anam.ts` : lire le portrait actuel à note 5 partagé, le qualifier comme hypothèse symbolique appréciée par elle ; ne pas le transformer en souvenir factuel.
- [x] `render/carnet/ThemeCarnet.tsx`, `render/surimpression.tsx`, `app/layout.tsx` : supprimer Papier, ignorer l’ancien choix enregistré.
- [x] `render/socle/FicheSocle.tsx`, `lib/domain/fiche-socle.ts`, `render/socle/LectureNumerologie.tsx` : réordonner Astrologie, supprimer manques, exposer chemin puis année, résumés IA et questionnaire ; autres chiffres et méthode repliés, aide aux nombres du nom et lien de modification existant.
- [x] `tests/` : données, frontière API, contrat JSON, concurrence, 4 contre 5 étoiles, retrait, droits, invalidation, RLS, export, ordre des vues ; fixtures synthétiques et captures à 390/768/1440.
- [x] Release preparation: production migration0099 and linked schema aligned; lint, TypeScript, build, functional and SQL checks completed.
- Release execution follows this commit: merge main, push, then verify the exact Vercel commit and production alias. Deployment evidence is reported with the delivery.

**Acceptance Criteria:**
- Étant donné un ancien choix Papier, quand l’app démarre, alors Nuit s’affiche et aucun bouton Papier n’est proposé.
- Étant donné Astrologie, quand elle s’affiche, alors les trois repères précèdent la carte et le bloc autonome des manques est absent.
- Étant donné Numérologie, quand elle s’affiche, alors chemin de vie précède année personnelle, deux lectures IA sont accessibles et les autres chiffres sont initialement repliés.
- Étant donné une note 4, quand la conversation démarre, alors aucun portrait n’est transmis ; à 5 avec partage explicite, seul le portrait courant du serveur est transmis.
- Étant donné une suppression de compte/export, quand l’opération aboutit, alors les nouvelles données sont respectivement supprimées/incluses.

## Spec Change Log

## Design Notes
Prompts : guidance douce de l’année personnelle, reliée au chemin de vie et à une perspective durable ; actions explorables sans prédiction. Portrait : hypothèses nuancées, forces possibles et points de vigilance observables, aucun « factuellement tu es » ni diagnostic. Maximum environ 350 mots pour les deux lectures. Mention IA visible. La note ne vaut jamais validation scientifique. Le partage a un contrôle propre, avec retrait aussi simple que l’activation (CNIL consentement). La première génération est un clic délibéré ; les visites suivantes lisent le cache. Contexte : le portrait seulement, pas la guidance de l’année.

## Verification
`npm run lint`, tests ciblés Vitest + tests RLS sur Supabase local, `npm run schema:check:linked`, `npm run build`, captures Chromium/WebKit. Déploiement de la migration avant les routes qui la consomment ; aucune modification des données personnelles réelles pour les tests.


## Review Findings and Resolution

- PATCH whose response is lost can already have committed: clear the uncertain client state, explain that confirmation failed, and offer GET so withdrawal remains accessible. Covered for network failure and a failed read after a committed write.
- Reuse the existing prediction guard and reject sensitive identity attributions in generated numerology; test concrete reviewer counterexamples.
- Bound metering so a delayed accounting write cannot discard a paid reading; keep its idempotence key and safe diagnostic.
- The complete suite exposed older UI guard mismatches: align header assertions with the existing Carnet design, restore token focus/targets, point the guide at the current seed, and use a finite animation frame sequence for introductory text.
- KEEP: calculated numbers only sent to AI, protected finalization, retained daily cap after identity changes, explicit sharing at 5, night accessibility settings, mobile daily-sky toggle and launch animation.

## Suggested Review Order

**Entry and privacy**

- Authentication, origin checks and small mutation contract.
  [route.ts:13](../../app/api/numerologie/route.ts#L13)
- Private storage, bounded reservation and consent/source invalidation.
  [0099_lectures_numerologie.sql:1](../../supabase/migrations/0099_lectures_numerologie.sql#L1)
- Number-only prompts and validated symbolic responses.
  [lecture-numerologie.ts:17](../../lib/domain/lecture-numerologie.ts#L17)

**Experience and context**

- Two readings, ratings and explicit reversible sharing.
  [LectureNumerologie.tsx:10](../../render/socle/LectureNumerologie.tsx#L10)
- Two primary numbers and collapsed details.
  [FicheSocle.tsx:71](../../render/socle/FicheSocle.tsx#L71)
- Include only a current portrait explicitly shared at 5.
  [lire-contexte-anam.ts:134](../../lib/data/lire-contexte-anam.ts#L134)

**Evidence**

- Real local database isolation, invalidation, export and deletion.
  [lecture-numerologie-sql.test.ts:1](../../tests/lecture-numerologie-sql.test.ts#L1)
- Response-loss recovery, rating boundaries and withdrawal.
  [lecture-numerologie.test.tsx:1](../../tests/rendu/lecture-numerologie.test.tsx#L1)
- Chromium/WebKit at three sizes with synthetic API state.
  [capture-numerologie.mjs:1](../../tests/visual-carnet/capture-numerologie.mjs#L1)


## Final Validation

- Complete suite:6525 passed; one local Supabase proxy response failed transiently. The affected RPC suite passed4/4 on immediate isolated replay without code changes.
- Lint, TypeScript, production build and linked schema check pass; remote migrations aligned through0099.
- Chromium/WebKit:390/768/1440, six journeys, no browser error/overflow;5-star share/withdraw and lower rating tested.
- Actual provider completion passes final validation with synthetic numbers and the production-selected model.
- Graft structure refreshed; opencode.json is intentionally excluded.
