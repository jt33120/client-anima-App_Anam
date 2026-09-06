---
title: 'Autoriser temporairement le modèle faible en test privé'
type: 'chore'
created: '2026-09-06'
status: 'done'
review_loop_iteration: 1
baseline_commit: '63953a1578ec7b2712365e2085d8cdfb61218430'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/2-2-fil-conversation-streaming-tiering.md'
  - '{project-root}/_bmad-output/implementation-artifacts/PORTES-AVANT-PUBLICATION.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le compte Mistral de test refuse `mistral-large-2512` avec un HTTP 403, ce qui empêche la détection de sécurité puis toute réponse d'Anam, alors que Julian est encore le seul testeur attendu.

**Approach:** Ajouter un drapeau serveur temporaire qui conserve les tiers logiques mais résout les appels de la conversation privée vers `ministral-14b-2512`, le modèle faible le plus capable confirmé accessible avec la clé de test. Interdire automatiquement ce mode dès que l'indexation publique est ouverte et l'inscrire comme porte bloquante avant publication.

## Boundaries & Constraints

**Always:** Le mode normal continue d'utiliser `mistral-small-2603`/`mistral-large-2512` ; le contournement reste explicite, serveur, mesurable et réversible ; le modèle réellement appelé demeure enregistré dans le métrage ; `ANIMA_INDEXABLE=oui` et le mode faible ne peuvent jamais coexister.

**Ask First:** Changer l'identifiant du modèle de remplacement, élargir ce contournement à une publication publique ou modifier le protocole de sécurité.

**Never:** Modifier `tierPour`, abaisser le verdict de sécurité, envoyer des données directement depuis le navigateur, masquer le contournement sous un nom ambigu ou prétendre que le modèle faible équivaut au modèle fort.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Mode normal | Drapeau absent | Le tier fort appelle `mistral-large-2512` | Comportement actuel conservé |
| Test privé | `ANIMA_MODELE_FAIBLE_TEST=oui`, site non indexable | Le tier fort appelle `ministral-14b-2512` | Avertissement serveur explicite |
| Publication incompatible | Mode faible et `ANIMA_INDEXABLE=oui` | Aucun appel IA faible n'est émis | Échec dur avec consigne de désactivation |
| Tier léger normal | Drapeau absent | `mistral-small-2603` reste inchangé | N/A |
| Tier léger privé | Drapeau présent et compte autorisé | `ministral-14b-2512` remplace aussi Small, indisponible sur la clé de test | Tier logique `leger` inchangé |

</frozen-after-approval>

## Code Map

- `lib/ai/modele-faible-test.ts` — valide le drapeau, l'identifiant du testeur et l'autorisation du compte.
- `lib/ai/fabrique.ts` — injecte l'autorisation dans une seule instance IA, sans toucher aux tâches automatiques.
- `lib/ai/politique-tier.ts` — conserve le tier logique et résout le modèle physique demandé.
- `lib/ai/adapters/mistral.ts` — applique l'option par instance et journalise une fois le modèle réellement appelé.
- `app/api/anam/message/route.ts` — refuse le mode privé aux comptes non autorisés avant tout egress.
- `lib/domain/environnement.ts` — maintient robots et `X-Robots-Tag` fermés pendant le mode faible.
- `tests/modele-faible-test.test.ts` et tests IA existants — verrouillent autorisation, isolation et modèle transmis.
- `tests/porte-indexation.test.ts` — prouve que le drapeau empêche l'ouverture aux moteurs.
- `.env.example` — documente le drapeau sans l'activer par défaut.
- `_bmad-output/implementation-artifacts/PORTES-AVANT-PUBLICATION.md` — porte humaine avant la première vraie utilisatrice.

## Tasks & Acceptance

**Execution:**
- [x] `lib/ai/modele-faible-test.ts` et `app/api/anam/message/route.ts` — n'autoriser le contournement que pour l'UUID serveur de Julian et refuser tout autre compte avant egress.
- [x] `lib/ai/fabrique.ts`, `lib/ai/adapters/mistral.ts` et `lib/ai/politique-tier.ts` — porter l'autorisation par instance afin que l'ordonnanceur, l'horoscope et les autres fabriques restent sur leur modèle normal.
- [x] `lib/domain/environnement.ts` et `tests/porte-indexation.test.ts` — garder l'exploration et l'indexation fermées tant que le mode faible est déclaré.
- [x] `tests/modele-faible-test.test.ts`, `tests/politique-tier.test.ts` et `tests/reprise-flux-modele.test.ts` — couvrir config invalide, compte refusé, isolation d'environnement, modèles SDK normal/privé et métadonnées `tier/modèle` en complétion comme en flux.
- [x] `.env.example` et `PORTES-AVANT-PUBLICATION.md` — documenter les deux variables, mettre à jour la date de revue et nommer la désactivation obligatoire.
- [x] Vercel Production — poser `ANIMA_MODELE_FAIBLE_TEST=oui`, redéployer et vérifier le modèle réel en complétion et streaming.

**Acceptance Criteria:**
- Given la phase de test privée, when Julian écrit à Anam, then la détection et la réponse utilisent le modèle Small disponible sans changer les décisions de sécurité.
- Given une tentative d'ouverture indexable, when le drapeau temporaire est encore actif, then l'application refuse le modèle faible et indique le bloqueur d'exploitation.

## Spec Change Log

- **Revue 1 — mode global insuffisamment privé.** La première dérivation aurait envoyé Small pour tous les comptes et les tâches automatiques, tandis que `ANIMA_INDEXABLE=oui` ouvrait robots et en-têtes avant le premier appel IA. Le plan impose désormais une autorisation par UUID injectée uniquement dans la fabrique du tour authentifié, laisse les autres consommateurs sur Large, maintient l'indexation fermée et exige des tests au niveau SDK. **KEEP :** tier logique inchangé, identifiants datés, modèle physique mesuré, drapeau réversible et porte publique exécutable.
- **Contrôle fournisseur — modèle disponible.** `mistral-small-2603` est listé mais répond systématiquement `429` avec la clé de test ; `ministral-14b-2512` a répondu au contrôle réel. L'autorisation privée remplace donc les modèles physiques des deux tiers pendant ce test, sans changer leur classification logique. Le remplacement reste daté, faible, temporaire et mesuré.

## Design Notes

Le contournement porte sur le modèle physique, pas sur le tier métier : les appels sensibles restent classés `fort` afin de ne pas dissoudre la politique d'origine. L'autorisation voyage dans l'instance créée pour le tour de Julian ; elle n'est jamais relue globalement par l'ordonnanceur. Le couple avec `ANIMA_INDEXABLE` ferme aussi les surfaces d'indexation avant le premier appel IA.

## Verification

**Commands:**
- `npm test -- tests/modele-faible-test.test.ts tests/politique-tier.test.ts tests/adaptateur-mistral.test.ts tests/fabrique.test.ts tests/reprise-flux-modele.test.ts tests/porte-indexation.test.ts` — autorisation, modèle physique, isolation et publication verts.
- `npm run lint` et `npx tsc --noEmit` — lint et typage verts.
- Contrôle fournisseur réel — `ministral-14b-2512` répond en complétion et streaming ; `mistral-small-2603` reste limité par un `429` sur la clé de test.
- Vercel Production — les deux variables privées sont posées ; le redéploiement applique le modèle vérifié.

## Suggested Review Order

**Porte privée de la conversation**

- Authentifie, autorise l’unique compte et refuse avant toute lecture ou sortie IA.
  [`route.ts:127`](../../app/api/anam/message/route.ts#L127)

- Valide strictement drapeau, non-indexation et UUID serveur sans exposer l’identité.
  [`modele-faible-test.ts:19`](../../lib/ai/modele-faible-test.ts#L19)

**Résolution et traçabilité du modèle**

- Préserve les tiers logiques et remplace uniquement le modèle physique autorisé.
  [`politique-tier.ts:71`](../../lib/ai/politique-tier.ts#L71)

- Injecte l’autorisation par instance et journalise le repli une seule fois.
  [`mistral.ts:87`](../../lib/ai/adapters/mistral.ts#L87)

- Maintient le modèle réel dans le métrage même si le flux s’interrompt.
  [`route.ts:603`](../../app/api/anam/message/route.ts#L603)

**Fermeture avant publication**

- Toute valeur de test non vide empêche l’ouverture aux moteurs.
  [`environnement.ts:76`](../../lib/domain/environnement.ts#L76)

- Rend la suppression du contournement explicite avant la première utilisatrice.
  [`PORTES-AVANT-PUBLICATION.md:24`](PORTES-AVANT-PUBLICATION.md#L24)

**Preuves**

- Verrouille ordre d’autorisation, compte unique et configuration invalide.
  [`modele-faible-test.test.ts:8`](../../tests/modele-faible-test.test.ts#L8)

- Vérifie modèles SDK normal/privé en complétion et streaming.
  [`reprise-flux-modele.test.ts:130`](../../tests/reprise-flux-modele.test.ts#L130)

- Prouve la fermeture de robots et de l’en-tête d’indexation.
  [`porte-indexation.test.ts:46`](../../tests/porte-indexation.test.ts#L46)
