---
title: Pratiques guidées recommandées par Anam
type: feature
created: 2026-09-08
status: done
baseline_commit: 6efbd1a856432dea0db4294618c805030890617d
review_loop_iteration: 1
context: []
---

<frozen-after-approval reason="Carte blanche explicite du 8 septembre 2026">

## Intent

**Problem:** Anam peut parler d’introspection mais ne peut pas encore proposer une activité exécutable dans l’app. Les questionnaires existants restent séparés de la conversation.

**Approach:** Un univers Pratiques expose huit exercices courts et les repères psychologiques existants. Anam dispose d’une fonction native de recommandation, dont les arguments sont validés avant affichage d’une carte. La personne lance, arrête et reprend la conversation librement.

## Boundaries & Constraints

**Always:** Français direct, tokens existants, sources visibles, étapes originales, durées indicatives, gestes accessibles au clavier et sur mobile. Conserver authentification, onboarding, consentement, verrou, sécurité conversationnelle et métrage. Les notes restent dans l’état local du composant. Le retour au chat prépare seulement un brouillon. Séparer proposition et exécution ; une proposition n’est ni un résultat ni une complétion.

**Ask First:** Toute extension vers un suivi autonome ou la progression de l’arbre, explicitement réservée au prochain échange.

**Never:** Écrire un niveau d’arbre, importer sans examen des quiz tiers, inventer des scores cliniques, prescrire un traitement, envoyer une réflexion silencieusement, exécuter une URL fournie par le modèle. Ne pas toucher au fichier préexistant opencode.json.

## I/O & Edge-Case Matrix

| Situation | Entrée | Comportement |
|---|---|---|
| Proposition | Appel natif connu et ID du catalogue | Une carte vers la destination serveur |
| Arguments invalides | ID inconnu, charge malformée, plusieurs appels | Ignorer l’invalide ; au plus une carte valide |
| Détresse / sécurité | Niveau élevé ou limites levées | Aucun outil proposé, aides existantes prioritaires |
| Flux interrompu | Appel incomplet ou absence de fin | Aucun succès d’outil inventé ; erreur existante conservée |
| Rechargement | Proposition canonique du journal | Carte restaurée depuis catalogue ; texte utilisateur jamais interprété |
| Exercice | Pause, retour, arrêt, fin manuelle | Aucun résultat déduit du minuteur ni écriture distante |
| Retour au chat | Identifiant interne valide | Région Anam et brouillon modifiable ; aucun envoi |
| Accès interdit | Session absente, onboarding incomplet | Gardes existantes et retour cohérent |

</frozen-after-approval>

## Code Map

- `lib/domain/pratiques.ts` : contenu canonique, IDs, sources et destinations fermées.
- `lib/ai/{port.ts,adapters/mistral.ts,outils-pratiques.ts}` : appel natif et validation.
- `app/api/anam/message/route.ts` : garde, événement NDJSON et conservation dans journal existant.
- `app/pratiques/`, `render/pratiques/` : catalogue privé et lecteur guidé sans persistance.
- `lib/domain/univers-moi.ts`, projections accueil : nouvelle porte Pratiques.
- `render/conversation/`, `app/page.tsx`, `render/scene-dom.tsx` : transport, carte, relecture, brouillon.

## Tasks & Acceptance

**Execution:**
- [x] `lib/domain/pratiques.ts` : écrire les huit fiches, sources, psychologie existante et helper canonique.
- [x] `lib/ai/` et route : transmettre les outils à Mistral, reconstruire les fragments, borner et valider sans changer le métrage.
- [x] `app/pratiques/`, `render/pratiques/` : catalogue, navigation, lecteur, minuteur et état final.
- [x] `render/conversation/` : carte passive, relecture fiable, protection des tours utilisateurs et rejeu sans doublon.
- [x] `app/page.tsx`, `render/scene-dom.tsx` : retour depuis exercice et message à relire avant envoi.
- [x] `tests/` : preuves comportementales des frontières sensibles et du parcours.

**Acceptance Criteria:**
- Étant donné un compte autorisé, quand il ouvre Pratiques depuis l’accueil ou Moi, alors huit exercices et les repères existants sont accessibles.
- Étant donné une recommandation valide, quand le flux finit et que le fil est relu, alors la même destination interne reste disponible.
- Étant donné un exercice, quand la personne le quitte puis retourne vers Anam, alors seules les informations qu’elle envoie explicitement deviennent conversation.
- Étant donné une largeur de 390, 768 ou 1440 pixels, quand catalogue, lecteur et carte sont rendus, alors le texte et les commandes restent utilisables sans débordement.

## Spec Change Log

- Revue 1 : une recopie du suffixe textuel pouvait créer une carte sans outil. Signature serveur et métadonnée vérifiée remplacent l’autorité du texte ; conserver destinations fermées et absence de migration.
- Revue 1 : conserver pratiqueId dans la projection quotidienne et l’origine Anam vers les questionnaires. Masquer l’annotation technique dans les échanges sources et les exports lisibles.
- Complément de portée : les cinq axes Big Five déjà enregistrés rejoignent le contexte conversationnel, avec absence et lecture indisponible distinctes, sans scores bruts ni nouvelle inférence.

## Design Notes

Direction existante Nuit galactique / Soft Balance : pages calmes, titres Fraunces, texte Inter, liens et boutons explicites, aucune jauge de progression personnelle. Les étapes concernent uniquement l’exercice ouvert. Le catalogue est transmis au rendu par les pages pour conserver AD7. La proposition persistée ajoute une ligne lisible et une signature HMAC liée au compte, au tour et à l’identifiant canonique. Seule la vérification serveur expose pratiqueId. L’annotation reste invisible dans le fil, l’échange source et l’export lisible. Une rotation de la clé serveur invalide les anciennes cartes, dont le texte reste lisible. Aucun nouveau secret, aucune table supplémentaire.

## Verification

Tests ciblés Vitest transport, outils, composants et architecture ; `npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check`, contrôle Graft. Parcours et captures 390/768/1440 avec serveur local et données de test isolées ; aucune écriture de test en production.

## Ordre de revue suggéré

**Contenu et recommandations**

- Catalogue fermé : huit exercices originaux, sources et destinations internes.
  [pratiques.ts:1](../../lib/domain/pratiques.ts#L1)
- Validation de l’appel natif et limites de la recommandation conversationnelle.
  [outils-pratiques.ts:1](../../lib/ai/outils-pratiques.ts#L1)
- Signature serveur : seul un outil exécuté peut restaurer une carte.
  [recommandation-pratique.ts:1](../../lib/data/recommandation-pratique.ts#L1)

**Expérience et vérification**

- Étapes, minuteur facultatif et note privée sans envoi automatique.
  [LecteurPratique.tsx:1](../../render/pratiques/LecteurPratique.tsx#L1)
- Projection de la carte depuis les métadonnées vérifiées du serveur.
  [pratiques.ts:1](../../render/conversation/pratiques.ts#L1)
- Preuves des parcours et limites concrètes de cette livraison locale.
  [verification-pratiques-anam.md:1](verification-pratiques-anam.md#L1)
