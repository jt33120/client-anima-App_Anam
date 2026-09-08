---
id: SPEC-pratiques-anam
companions:
  - recherche-et-sources.md
  - ../../implementation-artifacts/spec-pratiques-anam.md
sources: []
---
# Pratiques guidées avec Anam

## Why
Donner à la compagne conversationnelle une façon concrète de proposer un exercice utile au moment de l’échange, avec un accès libre aux mêmes activités dans l’app.

## Capabilities
- **CAP-1** — **intent:** découvrir un premier catalogue de pratiques et les questionnaires existants. **success:** huit exercices consultables depuis Pratiques, sources visibles et accès aux questionnaires existants ; leurs repères disponibles sont lisibles par Anam.
- **CAP-2** — **intent:** pratiquer à son rythme. **success:** étapes, retour, pause facultative, arrêt libre et fin explicite fonctionnent sans stocker de brouillon.
- **CAP-3** — **intent:** recevoir une proposition adaptée d’Anam. **success:** un appel natif validé donne une carte interne authentifiée à la relecture du fil ; arguments invalides, texte recopié et détresse ne déclenchent rien.
- **CAP-4** — **intent:** reparler d’un exercice avec Anam. **success:** le retour prépare un message modifiable sans l’envoyer et sans affirmer une réussite.

## Constraints
- Authentification, consentement, verrou privé, garde egress et métrage existants conservés ; pas de migration SQL ni de changement du modèle.
- Sources primaires, textes français originaux, aucune promesse clinique, score thérapeutique ou reprise automatique de questionnaire tiers.
- Catalogue fermé, une proposition maximum par tour, aucune URL ni consigne générée exécutée. Le rendu reçoit des projections serveur.
- Une signature serveur liée au compte et au tour atteste les recommandations conservées ; elle reste invisible dans le fil et les exports lisibles.
- La note de pratique reste éphémère ; aucun partage silencieux, aucune conservation locale persistante.

## Non-goals
- Plan de suivi, documents de contexte, progression de l’arbre pilotée par Anam, outils de mutation, audio, questionnaires cliniques et historique de complétion.

## Success signal
Une personne reçoit une carte de pratique dans le chat, l’ouvre, suit ou arrête l’activité puis retrouve Anam avec un brouillon modifiable. Le même exercice reste accessible directement.

## Assumptions
- Durées indicatives et pratiques textuelles suffisent pour ce premier essai. Les questionnaires existants gardent leurs résultats et droits d’accès actuels.
