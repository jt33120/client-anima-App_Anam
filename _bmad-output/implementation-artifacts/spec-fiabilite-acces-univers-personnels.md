---
title: 'Fiabiliser l’accès et rendre les univers personnels concrets'
type: 'feature'
created: '2026-08-26'
status: 'in-progress'
baseline_commit: '60d88da3c23de21d17c3930cc213a51fe4c33caf'
review_loop_iteration: 1
context:
  - '{project-root}/design/design-spec.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-Anima-2026-07-21/EXPERIENCE.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-Anima-2026-07-22/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/epics.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Après déploiement, un ancien onglet peut afficher l’erreur serveur anglaise ; Anam rejoue une ouverture impossible car la base de production a six migrations de retard. L’entrée protège mal une session sensible. L’Ennéagramme demande de choisir un type inconnu ; la Numérologie ne montre pas ses calculs. Socle et Astrologie restent sous la qualité de « Moi ».

**Approach:** Rétablir l’intégrité base/code et borner les reprises, puis livrer un seuil WebAuthn vérifiable, un Ennéagramme concret, une Numérologie traçable, un Socle synthétique et un ciel natal exact. Revoir, intégrer à `main`, pousser et vérifier le SHA Vercel.

## Boundaries & Constraints

**Always:** Déployer les migrations compatibles avant le code et bloquer la promotion si les schémas divergent. Gérer le version skew et fournir des frontières françaises. « Me reconnecter » vise un compte existant ; email en secours, passkey derrière flag, verrou récent vérifié côté serveur. L’Ennéagramme reste une piste non clinique sans score ; « Je ne sais pas » est manquant. La Numérologie distingue calcul exact selon la méthode et symbolique. Respecter corpus Anima, tokens, AA, mouvement réduit et logs sûrs.

**Ask First:** Facteur non vérifiable côté serveur, RP ID instable, migration incompatible avec le code actif, nouvelle source ou prestataire.

**Never:** Stocker la clé fournie ou envoyer des données réelles à OpenRouter ; utiliser un LLM pour ces calculs ; prétendre qu’un PIN navigateur sécurise ; boucler automatiquement ; signer une erreur « Anam » ; faire choisir « le type N » ; scorer l’inconnu ; inventer fait ou interprétation ; merger avec un check rouge.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Ancien onglet | Client du déploiement N, serveur N+1 | Une seule navigation dure vers N+1 | Jamais le fallback anglais |
| Schéma en retard | Production à `0080`, code exige `0081–0086` | Promotion bloquée avant Vercel | Dry-run et écart lisible, aucun secret |
| Ouverture en panne | Auth valide, greeting indisponible | Cause utile ; composeur disponible si fil sûr | Backoff borné, état stable, aucun doublon |
| Réponse incertaine | « Je ne sais pas » ou égalité persistante | Question parcourue ; résultat honnêtement indéterminé | Aucune boucle ni type forcé |
| Numérologie partielle | Nom absent ou corpus vide | Valeurs calculables et traces ; une note éditoriale globale | Réparation précise, aucune lecture inventée |

</frozen-after-approval>

## Code Map

- `next.config.ts`, `app/*error.tsx`, Supabase/proxy/migrations — version, garde et livraison.
- `app/_ouverture/*`, `render/conversation/*`, `app/(auth)/entrer/*` — ouverture et reconnexion.
- `app/enneagramme/*`, `lib/domain/enneagramme*`, dépôt SQL — questionnaire et incertitude.
- `lib/astro/*`, `render/socle/*`, `render/astrologie/*` — traces et projections.

## Tasks & Acceptance

**Execution:**
- [ ] Story 14.5 — synchroniser `0081–0086`, vérifier expand/app/contract, typer et borner l’ouverture.
- [ ] Story 14.6 — porte de migration, protection anti-skew, frontières françaises et pannes d’onboarding affichables.
- [ ] Epic 15 — reconnexion explicite, enrôlement/révocation WebAuthn, garde serveur et récupération email.
- [ ] Story 13.8 — expliquer les neuf repères, items situationnels, quatre glyphes SVG libellés + « Je ne sais pas », précision finie puis indétermination possible.
- [ ] Story 13.9 — traces numérologiques, calcul dépliable et séparation méthode/lecture d’Anima.
- [ ] Stories 13.6–13.7 — Socle résumé dans la grammaire de « Moi » et carte natale SVG exacte avec équivalent textuel.
- [ ] Livraison — tests 390/768/1440, revue, commit/merge/push, DB avant app, smoke authentifié et SHA Vercel = `origin/main`.

**Acceptance Criteria:**
- Given un schéma ancien, when une promotion démarre, then elle échoue avant Vercel ; aligné, Anam crée ou relit une ouverture unique.
- Given un onglet N après promotion N+1, when il navigue, then il rejoint N+1 après au plus un rechargement automatique, sans écran anglais.
- Given une panne persistante, when l’attente bornée expire, then aucun appel automatique ne continue et la cause propose l’action juste.
- Given une inconnue ou égalité, when le test finit, then aucun type arbitraire n’est persisté ; l’utilisatrice peut suspendre.
- Given une fiche, when « Voir le calcul » s’ouvre, then réductions, source et année sont vérifiables sans IA.
- Given retour avec facteur refusé, when « Me reconnecter » est utilisé, then l’email restaure l’accès sans contourner le verrou.
- Given Socle/Ciel partiels, when ils s’affichent, then synthèse et détails restent accessibles et dessin/texte concordent.

## Spec Change Log

- 2026-08-26 — `[E]` : ajout dérive Supabase/version skew, refonte Ennéagramme, Numérologie traçable et refus OpenRouter en production.

## Design Notes

Réutiliser les glyphes SVG natifs : quatre silhouettes devant un miroir lunaire, plus une brume pour l’inconnu, toujours libellées. Le « wow » vient des surfaces nocturnes et données exactes, jamais d’animation cyclique.

## Verification

**Commands:** `npm run test:unit`, tests SQL/RLS et dérive distante, `npm run quality`, `npm run test:e2e`, `git diff --check`.

**Manual checks:** Reprise après déploiement, passkey refusée, Anam avec/sans RPC, Ennéagramme clavier/lecteur d’écran/reload, Numérologie partielle, smoke production 390/768/1440 et mouvement réduit.
