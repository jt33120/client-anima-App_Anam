---
id: SPEC-parcours-anam
companions: [contrat-suivi.md]
sources: []
---
# Mon parcours avec Anam

## Why
Anam peut proposer des pratiques mais ne dispose pas encore d’un suivi longitudinal visible. L’utilisatrice doit retrouver ce qui compte, le cap du moment et le prochain pas ; Anam pilote une progression flexible liée à l’arbre.

## Capabilities
- **CAP-1**
  - **intent:** L’utilisatrice conserve et corrige ses repères pour contextualiser les échanges.
  - **success:** Les trois sections persistent sous son compte, sont relues par Anam et restent corrigeables sans écrasement concurrent.
- **CAP-2**
  - **intent:** Anam ajuste un cap et quelques prochains pas selon les échanges.
  - **success:** Un appel natif validé persiste un cap, une synthèse et une à trois étapes visibles, sans modifier les repères personnels.
- **CAP-3**
  - **intent:** Anam reconnaît une étape franchie et déclenche le prochain palier de l’arbre.
  - **success:** Une source utilisateur possédée, hors détresse, produit au plus un passage et un incrément borné, retrouvé après rechargement.
- **CAP-4**
  - **intent:** L’utilisatrice consulte son parcours, choisit une pratique et suspend le suivi librement.
  - **success:** Accès directs, pause/reprise et retour vers un brouillon neutre fonctionnent sur mobile et ordinateur.

## Constraints
- Contrat de données, autorité, concurrence et compatibilité arbre dans [contrat-suivi.md](contrat-suivi.md).
- Garde consentement, majorité et sécurité au point SQL ; pas de mutation agent en pause ou en détresse/72h.
- Toute annonce de succès suit l’enregistrement réel ; aucune progression issue du temps, d’une note de questionnaire ou d’une visite.
- Documents personnels, synthèse générée et intentions de branche préexistantes gardent leurs auteurs distincts.
- Export et effacement couvrent toutes les nouvelles données ; aucune donnée personnelle en URL ou stockage navigateur durable.
- Reçus retrouvés avant réinterprétation du tour, identité du compte montée vérifiée et conflits résolus par comparaison explicite ; une panne de lecture ne devient jamais un état vide.

## Non-goals
- Traitement clinique, score de santé, calendrier imposé, notifications ou pièces jointes.
- Création automatique de branches ou déclaration automatique de rayonnement.

## Success signal
Une utilisatrice pose un cap avec Anam, retrouve trois pas maximum, décrit un passage vécu et voit l’étape conservée ainsi que la prochaine illustration de son arbre. Une reprise du même tour ne change rien une seconde fois ; une pause bloque les outils de suivi.

## Assumptions
- Mon parcours est une halte dédiée dans l’expérience existante ; les notes d’exercice restent locales.
