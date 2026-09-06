# Stories — carnet céleste

Contrat commun : [SPEC.md](SPEC.md) et [design-spec.md](../../../design/design-spec.md).

## CC-1 — Fondations visuelles et ambiance

CAP-1, CAP-3, CAP-4. Déployer le carnet ivoire/encre, les pastels, typographie et contrôles
partagés; conserver Nuit. Historique préservé, surcouche générée depuis design/tokens.json.

- Tokens générés reproductibles; parité historique inchangée.
- Focus, contrastes mesurés, cibles tactiles et mouvement réduit opérants.
- Fond, texte, papier et accents inspectés à 390 / 768 / 1440 px, Papier et Nuit.

## CC-2 — Accueil et navigation

CAP-1, CAP-2, CAP-3. Composer l'ouverture de carnet, clarifier ciel du jour et univers, restyler
navigation et profil sans changer les destinations.

- Date/mantra, lecture quotidienne et univers gardent un ordre clair aux trois largeurs.
- Navigation et dialogue de profil accessibles au clavier; focus rendu au déclencheur.
- Chargement, indisponibilité, contenu vide et texte dense restent intelligibles.

## CC-3 — Anam, univers et lectures

CAP-1, CAP-2, CAP-3. Harmoniser fil, composeur, chapitres, résumés et disclosures; préserver
messages, calculs et appels existants.

- Composeur visible au clavier mobile; aucune réponse masquée par une barre ou un décor.
- Provenance des messages et états absent/indisponible/refusé préservés.
- Lecture longue, vide, attente et erreur inspectés à 390 / 768 / 1440 px.

## CC-4 — Accès, compte et aide

CAP-1, CAP-2, CAP-3. Appliquer les fondations aux accès, consentements, réglages, données et aide;
maintenir actions et conséquences.

- Formulaires et messages restent compréhensibles, focusables et contrastés.
- Retour à Anima et Sortie rapide conservent leurs gestes distincts.
- États chargement/erreur/dense/vide vérifiés sur les composants concernés aux trois largeurs.

## CC-5 — Revue visuelle et livraison réversible

CAP-5, CAP-6. Capturer, critiquer, corriger, contrôler, déployer la branche et vérifier son identité.

- Deux tours de captures et critique à 390 / 768 / 1440 px, sans données sensibles.
- Lint et contrôles ciblés pertinents passent; limites explicites.
- Diff sans backend ni configuration distante; fichier préexistant exclu.
- URL Ready, SHA livré, baseline et commande de retour consignés dans deployment.md.

Chaque story d'interface utilise exclusivement les tokens de la source concernée, livre les
états vide/chargement/erreur/dense, vérifie les trois largeurs et conserve focus-visible.
