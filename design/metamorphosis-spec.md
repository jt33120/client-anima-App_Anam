# De la graine à la lumière — 7 septembre 2026

## Direction

Une série de huit planches fixes montre un seul organisme : graine, ouverture de la coque,
première racine, pousse, jeune arbre, arbre déployé, canopée et illumination. La matière est
botanique et dimensionnelle : écorce nacrée bleu-lilas, feuillage céleste pastel, racines
puissantes et naturellement hiérarchisées. Chaque planche garde le cadrage frontal, le collet
à 50 % horizontal et 74 % vertical, la lumière et les fourches principales du même arbre.
Les étapes intermédiaires font comprendre la continuité ; aucun saut d'une graine à un tronc adulte.
Les images viennent de l'outil imagegen intégré ; prompts, variantes retenues et optimisation
sont documentés. Fond nocturne peint cohérent sur toute la série, sans damier de transparence ni silhouette
détourée approximativement. Aucune illustration improvisée en SVG.

## Découverte

L'écran vide propose directement « Voir la graine éclore », au voisinage de la graine.
Cette action ouvre la première germination, avec précédent/suivant et accès manuel à chaque
planche. La galerie reste disponible depuis l'explication de l'évolution, y compris avec
plusieurs branches et dans la vue liste. Le contrôle ne doit pas demander de lire un long texte
pour découvrir l'arbre. L'image domine ; le nom du stade et une phrase courte l'accompagnent.
Pas d'autoplay, de chronomètre ni de défilement animé obligatoire.

## Vérité des données

La série est une contemplation du langage de l'arbre, indiquée comme illustration. Elle ne
représente pas un score ou une prédiction du parcours. La projection réelle ne contient que des
états par branche, pas de stade global : aucune moyenne, nombre de branches ou état maximal
ne choisit un stade personnel fictif. Les branches réelles, leur dessin adressable, leurs fiches,
leur liste et les règles de rayonnement déclaré restent accessibles. L'état vide et son chemin
vers le tronc incomplet conservent leurs informations et leurs conditions.

## Interaction, livraison

Cibles de 44 px minimum, boutons nommés, stage actif explicite, clavier, fermeture Échap et retour
au déclencheur. Le dialogue couvre la navigation. Images dimensionnées, chargement adjacent
borné et repli lisible si une image ne charge pas. Les 8 planches ne sont pas toutes préchargées
au démarrage de l'app. Aucun calcul de croissance ni boucle de rendu permanente pour la galerie.

Deux boucles visuelles à 390/768/1440, passage WebKit, graine/branches/liste/erreur/tronc incomplet,
8 stades et accès direct. Tests utiles de navigation/accessibilité et absence de mutation.
Build/lint, branche codex/carnet-celeste-ui, publication Vercel normale puis SHA/alias vérifiés.
Retour conservé : 54c2e15fc6d03cf9a854e67b838f7f414746b6ac,
dpl_4jMXMiU5AFVbSXfMaSUM1kqURGPK.
