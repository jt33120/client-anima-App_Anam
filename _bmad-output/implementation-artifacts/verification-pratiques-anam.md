# Vérification de Pratiques avec Anam

8 septembre 2026. Livraison locale ; aucune promotion ni migration distante.

## Résultat vérifié

Huit exercices français originaux, avec étapes, sources, durée indicative, minuteur facultatif et arrêt libre. Deux questionnaires internes existants sont accessibles depuis le catalogue et les cartes du chat. Le retour depuis une pratique ouvre Anam avec un brouillon modifiable, sans envoyer la note personnelle.

Anam lit aussi les cinq axes Big Five enregistrés sous le JWT du compte ; absence et lecture indisponible restent distinctes, sans réponses brutes ni résultat inventé.

Le modèle dispose d’un appel natif `proposer_pratique`. Le serveur valide l’identifiant, limite à une carte et refuse les outils sous détresse, épisode ouvert ou clôture. Le client attend la fin réussie du flux avant d’afficher la carte.

Les propositions du journal portent une signature liée au compte et au tour. Une imitation textuelle n’a aucune autorité. La projection quotidienne conserve la métadonnée vérifiée ; l’échange source et l’export lisible cachent l’annotation, tandis que l’export JSON conserve les données exactes.

## Preuves

- Suite complète Vitest : 407 fichiers, 6 620 tests passent après correction des conventions de copie, identité et minuterie. Les dernières corrections de projection, export et contexte Big Five sont couvertes par 85 tests ciblés supplémentaires exécutés ensemble (certaines suites recouvrent la passe complète).
- Playwright : trois scénarios passent sur Supabase local, authentification réelle. Catalogue et lecteur, retour sans envoi, refus des sessions absentes, chat vers questionnaire.
- Captures réelles regardées en 390, 768 et 1440 pixels : catalogue, lecteur et carte dans le chat. Aucun débordement horizontal. Les commandes restent lisibles ; le minuteur ne fait pas avancer les étapes. Deux passes de captures effectuées après les ajustements.
- Appel fournisseur synthétique : `ministral-14b-2512` appelle réellement `proposer_pratique` pour `respiration-douce`, 785 tokens entrants / 19 sortants, un seul appel de streaming. Aucune donnée personnelle ni écriture de base pour cette sonde.
- Compilation de production réussie, routes `/pratiques` et `/pratiques/[id]` présentes. Lint, TypeScript et `git diff --check` vérifiés. Graph Graft reconstruit et cohérent.

Les captures sont dans `test-results/pratiques-*/`. Le test du chat simule seulement la réponse NDJSON pour vérifier son rendu et sa navigation ; la preuve d’appel natif fournisseur est distincte.

## Limites concrètes

- Aucun plan longitudinal, document de suivi, niveau d’arbre automatique ni historique de complétion ; ces sujets appartiennent à l’étape suivante.
- Pas d’import automatique de questionnaire externe. Big Five et Ennéagramme utilisent les questionnaires internes existants, dont aucune validation psychométrique n’est revendiquée. La filière IPIP est documentée dans la recherche.
- Les notes d’exercice ne sont ni sauvegardées ni transmises. Le retour au chat prépare uniquement le nom de la pratique, sans déclarer qu’elle a été terminée.
- Une rotation de `SUPABASE_SECRET_KEY` invalide les anciennes signatures : leur proposition reste lisible en texte, mais sa carte n’est plus restaurée. Aucune nouvelle variable d’environnement n’est requise.
- Le modèle `mistral-small-2603` configuré localement retourne HTTP 429 avec la clé actuelle. La sonde native réussit avec le modèle privé indiqué ci-dessus ; aucun réglage fournisseur n’a été modifié.

La première passe de la suite complète a aussi rencontré une réponse Supabase locale transitoire invalide dans le test de remboursement ; la seconde passe complète est verte sans modification de cette fonctionnalité.
