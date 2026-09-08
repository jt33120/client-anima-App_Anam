# Mon parcours : revue visuelle

[Capture mobile finale, 390 pixels](parcours-dense-390.png).
Cette copie stable montre uniquement un compte et des textes synthétiques. Les captures
768 et 1440 pixels restent dans les résultats navigateur ; une seule image est versionnée
pour limiter le poids des preuves.

## Première passe

Chromium, 390 / 768 / 1440 pixels, compte synthétique dans Supabase local. Les captures de
`e2e/parcours.spec.ts` montrent les états vide et chargé avec textes longs, deux étapes à venir,
trois repères et deux événements. Aucune erreur navigateur ni débordement horizontal.

Le cap est immédiatement identifiable ; les étapes, les mots de l’utilisatrice et les
propositions d’Anam occupent des sections distinctes. Les textes restent complets sur mobile
et la colonne de lecture demeure contenue sur ordinateur. Les titres et les surfaces
reprennent les tokens nocturnes existants.

Correction après revue : une erreur de pause apparaissait sous le formulaire, trop loin
du bouton situé en tête. Les confirmations, refus et reprises après conflit se placent
maintenant dans la section de l’action. Après sauvegarde des repères, le focus revient à
leur titre pour conserver la place de lecture au clavier.

## Deuxième passe

Les trois parcours navigateur passent. Les états vide et chargé sont recapturés aux trois
largeurs ; le formulaire et le refus d’écriture temporaire sont également inspectés.
Les refus sont lisibles au contact du bouton concerné. Les champs et leurs commandes
d’effacement restent séparés, sans texte masqué ni débordement. Une nouvelle tentative
réussit après la panne simulée. La garde anonyme, la persistance après rechargement,
la pause/reprise et le retour vers un brouillon modifiable sont vérifiés.

La carte du chat est vérifiée avec un transport explicitement simulé ; les écritures de
parcours du scénario principal utilisent les RPC réelles et leurs échanges sources locaux.
La carte et son accès restent visibles à 390 / 768 / 1440 pixels, au-dessus du composeur.
L’introduction existante apparaît pendant sa frappe animée dans ces captures.

Preuves locales dans `test-results/parcours-Mon-parcours-gard-ff3d7-tapes-et-un-brouillon-privé-bureau/`
(`parcours-vide`, `parcours-dense`, `parcours-formulaire`, `parcours-erreur-action`) et
`test-results/parcours-Mon-parcours-une--1a351-hat-donne-accès-au-parcours-bureau/`
(`carte-parcours-transport-simule`), chaque série aux trois largeurs.

Validation complémentaire : 51 tests de rendu, architecture et inventaires de navigation ;
TypeScript et ESLint ciblé ; les trois parcours Pratiques existants passent aussi.
Les états de lecture indisponible et de chargement sont couverts dans les composants ;
les captures d’erreur de cette revue représentent une écriture temporairement refusée.
Les journaux contiennent l’avertissement existant du texte du jour (`SDKError`), sans erreur
JavaScript navigateur dans le parcours principal.

## Corrections après revue indépendante

Le formulaire compare maintenant chaque texte différent après une actualisation concurrente :
version enregistrée au-dessus, brouillon dans le champ, puis choix explicite de la version
à garder. L’enregistrement reste désactivé tant qu’une différence n’a pas été résolue.
Le scénario réel à deux onglets conserve à la fois la modification du premier onglet et la
ressource ajoutée dans le second, après choix. Captures inspectées à 390 / 768 / 1440 pixels
dans `test-results/parcours-Mon-parcours-comp-3e4ea-nglets-avant-de-sauvegarder-bureau/`.
Le même scénario vérifie un cap valide de 160 caractères sans espaces : il revient à la ligne
sans débordement, dans le cap comme dans l’historique.

Chaque requête de lecture et d’écriture transporte aussi l’identité du compte qui a ouvert
la page, comme précondition. Un changement de session suspend les commandes et demande
un rechargement complet : aucun brouillon n’est réutilisé pour le nouveau compte.
Cette frontière est couverte par le test de rendu et les tests de l’API.

Validation après ces corrections : 16 tests ciblés (rendu, cibles tactiles et libellés des
parcours navigateur), TypeScript et lint ciblé. Le cas navigateur de concurrence passe
avec l’authentification et les écritures locales réelles, puis son compte synthétique est effacé.

## Vérification finale sur la source livrée

Les sept cas `e2e/parcours.spec.ts` et `e2e/pratiques.spec.ts` passent ensemble sur Chromium
(43 secondes), après les corrections d’identité de compte et de reprise des outils.
Cette passe recrée toutes les séries de captures citées plus haut. La capture mobile dense
copiée en tête de ce document pèse environ 592 ko ; les deux autres formats dépassent 500 ko
chacun et restent dans `test-results/`. Le serveur de test est arrêté à l’issue de la suite.
