---
title: 'Refonte Moi, Anam, Mon arbre et coûts IA'
type: 'feature'
created: '2026-08-26'
status: 'in-review'
review_loop_iteration: 1
context:
  - '_bmad-output/planning-artifacts/prds/prd-Anima-2026-07-21/prd.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-Anima-2026-07-22/ARCHITECTURE-SPINE.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-Anima-2026-07-21/DESIGN.md'
---

<frozen-after-approval reason="intent explicite du 2026-08-26 — toute réduction de périmètre doit être dite">

## Intent

**Problem:** L’application disperse le profil stable dans une bibliothèque quotidienne, répète Anam hors de sa page, cache le test d’Ennéagramme, ouvre mal les journées, mélange les rubriques du compte et montre un arbre différent du handoff validé. La lenteur perçue et l’absence de comptabilité financière par utilisatrice aggravent la perte de confiance.

**Approach:** Recomposer « Moi » en quotidien puis univers, faire d’Anam une session quotidienne qu’elle ouvre elle-même, porter l’arbre lunaire officiel et structurer le compte. Livrer un registre de coûts interne ; traiter Big Five, Human Design et voix comme des capacités séparées, vérifiables et jamais inventées.

## Boundaries & Constraints

**Always:** conserver AD-1 à AD-18, RLS et garde art. 9 ; garder le texte comme canal complet ; utiliser les tokens visuels existants ; rendre tout geste visible en une frame ; préserver clavier, focus, réduction de mouvement et vue liste de l’arbre ; préférer les calculs déterministes aux sorties LLM.

**Ask First:** achat/licence d’un moteur Human Design ; clonage ou contrat de voix ; activation audio en production sans DPA, ZDR et région UE confirmés ; modification du prix ou des quotas premium ; attribution à Anam des textes de numérologie avant leur relecture par Anima.

**Never:** copier les scores non fiables du dépôt de référence ; présenter Human Design comme un QCM ; laisser le modèle choisir une boucle de tools ou contourner l’egress art. 9 ; créer une clé Mistral par cliente ; exposer une clé fournisseur au navigateur ; faire du TTS le seul canal ; utiliser l’image PNG de l’arbre comme arbre interactif ; masquer des rubriques derrière un badge ou une jauge.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Ennéagramme absent | Aucun résultat | CTA explicite vers `/enneagramme` depuis Psychologie | Le test existant reste reprenable |
| Nouvelle journée | Dernier tour hier à Paris | Un seul « Aujourd’hui », puis une seule parole d’Anam : accueil générique ou événement portant l’accueil | Horodatage invalide : aucun tour éphémère inventé, reprise explicite |
| Même journée | Rechargement après ouverture | Pas de seconde ouverture ni de second séparateur | Idempotence persistante |
| Deux onglets | Première entrée simultanée dans Anam | Un seul bail prépare et finalise ; l’autre relit le tour persistant | Bail interrompu : reprise après expiration, sans seconde parole |
| Arbre vide | Aucune branche | Graine lunaire dans le ciel étoilé | Vue liste et fiche tronc restent accessibles |
| Plus de treize branches | Projection non bornée | Toutes restent accessibles sans limite métier implicite | Placement secondaire déterministe |
| Coût exempt du quota | Détection de détresse | Usage financier enregistré, aucun débit de quota | La sécurité continue si le métrage échoue |

</frozen-after-approval>

## Code Map

- `render/accueil/` et `lib/data/lire-bibliotheque.ts` — quotidien et portes de « Moi ».
- `app/psychologie/` — porte claire vers l’Ennéagramme et états honnêtes des futurs outils.
- `lib/domain/ouverture-seance.ts`, `lib/data/depot-fil.ts`, `render/conversation/` — jour civil, idempotence et séparateur.
- `render/scene-dom.tsx`, `render/arbre/` — ciel d’Anam et moteur lunaire.
- `render/menu/`, `app/aide/` — navigation compte et sorties distinctes.
- `lib/ai/metrage.ts`, `usage_ia`, ordonnanceur — centre de coût par utilisatrice.

## Tasks & Acceptance

**Execution:**
- [x] Remplacer la bibliothèque par le quotidien et les univers ; retirer la carte Anam.
- [x] Ajouter le hub Psychologie et le CTA Ennéagramme.
- [x] Grouper le menu et corriger les retours/aides avec feedback immédiat.
- [x] Masquer l’arbre décoratif chez Anam, ouvrir le jour civil et insérer « Aujourd’hui ».
- [x] Porter le handoff arbre lunaire, y compris l’étape graine.
- [x] Étendre le métrage financier par utilisatrice sans clé individuelle.
- [x] Documenter les epics Big Five, Human Design et voix, avec leurs portes.
- [x] Conserver le chantier « ce qu’Anam sait » dans l’Epic 9 : contexte serveur borné et mis en mots, sans boucle de tools choisie par le modèle ; la numérologie attend la relecture d’Anima.
- [x] Tester, vérifier visuellement à 390/768/1440 et lancer une revue adversariale.
- [ ] Exécuter les migrations `0081`–`0086` et les scénarios concurrents sur un PostgreSQL local ;
  Docker Desktop est installé mais son daemon n'a pas démarré pendant la vérification du 2026-08-26.

**Acceptance Criteria:**
- Depuis « Moi », Astrologie, Numérologie et Psychologie sont visibles sans ouvrir le profil ; Human Design est visible dans Psychologie.
- Un Ennéagramme absent présente un bouton nommé qui atteint le QCM existant.
- Anam n’a aucun arbre derrière son fil et initie chaque journée parisienne par une seule parole persistée. Un événement éventuel porte la salutation et garde le même identifiant de tour lorsqu’il devient interactif.
- Le profil réagit immédiatement, sépare produit/compte/droits et ne détourne jamais un retour normal vers Météo France.
- L’arbre réel et son état zéro partagent le langage lunaire du handoff.
- Chaque appel IA est attribuable financièrement à une utilisatrice sans modifier les garde-fous de quota.

## Spec Change Log

- **2026-08-26 — revue adversariale, itération 1 :** l'ouverture quotidienne est passée d'un simple
  insert idempotent à un outbox avec bail ; réservation et journal sont atomiques, les événements sont
  revalidés sous verrou, une ligne hors fenêtre ne peut plus être marquée « dite » et un rechargement
  ne réannonce plus la même parole. La Story 14.4 isole le résidu préexistant des événements réactifs
  hors ouverture quotidienne.

## Design Notes

Le premier écran de « Moi » reste calme : date, ciel et mantra. Une transition verticale mène à trois portes illustrées et scintillantes ; elles remplacent le catalogue d’objets stables. Human Design reste un module de Psychologie, conformément à la hiérarchie demandée, et n’est pas dupliqué au premier niveau. Les pages d’univers utilisent des cartes courtes, jamais un mur de texte.

## Verification

**Commands:**
- `npm test` — 4 503 tests verts ; 136 échecs et 898 ignorés, tous sur
  les suites qui joignent Supabase local (`fetch failed`, daemon Docker indisponible).
- Suites ciblées du correctif — 66/66 vertes après la contre-revue ; la sélection fonctionnelle large
  comptait 328/328 tests purs verts avant ces trois tests supplémentaires.
- `npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check` — verts après les correctifs.
- Revue visuelle — 390, 768 et 1440 px : Moi/Psychologie, menu, Anam ciel seul et arbre graine/branches.
- Revue aveugle finale — quatre constats fermés ; limite maintenue sur la syntaxe/RLS/concurrence SQL
  tant qu'une instance PostgreSQL réelle n'a pas exécuté les migrations.
