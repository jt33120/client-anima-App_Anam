# Croissance personnelle — correction du 7 septembre 2026

Le retour utilisateur remplace le contrat de galerie seule de `metamorphosis-spec.md`.
L'arbre principal doit grandir avec les avancées réelles du parcours. Le prototype historique
avait un paramètre de dessin 0–100 ; il ne fournissait pas cent fichiers image. La nouvelle
direction conserve une croissance fine et choisit ses visuels dans une série plus détaillée.

**Contrainte confirmée pendant le travail : conserver exactement les quatre premières images
actuelles (`01-graine.webp` à `04-pousse.webp`), sans retouche, recadrage ou réencodage.**
La nouvelle génération commence uniquement après la première pousse.

## Direction avant implémentation

Botanique chaleureuse et céleste : écorce vivante ivoire, beige rosé et lilas, feuillage bleu ciel,
menthe très pâle et lavande, racines liées naturellement au même tronc, sève claire et douce.
Le tronc doit sembler sain et souple. Écarter les fissures noires, l'effet osseux, les tentacules,
la foudre bleue et les couronnes ternes. La lumière finale monte progressivement dans un arbre
déjà vivant ; l'illumination ne sert pas à réparer un stade sombre.

La série vise 32 états : éclosion et enracinement, nombreux intermédiaires entre pousse et jeune
arbre, ramification et feuillaison, puis huit nuances d'illumination. Le cadrage et les branches
maîtresses restent constants. Les états sont des illustrations originales, pas des duplications
avec un filtre de couleur. L'exploration secondaire permet de parcourir la même série.

## Intégration

Le dessin personnel découle uniquement des branches projetées déjà disponibles (naissance,
intensité de feuillaison, rayonnement déclaré). Pas de compteur de connexions, minuterie,
progression aléatoire ou stockage local de maturité. Le choix de planche est un paramètre de
rendu, pas une note affichée ou un nouveau diagnostic. Pas de nouvelle écriture backend.
Une nouvelle branche ne doit pas faire rétrécir l'arbre par dilution d'une moyenne.

Conserver sélection et fiche de chaque branche, tronc incomplet, renvoi à la conversation,
vue liste, caméra, états indisponibles et réconciliation des données. Les repères interactifs
doivent être placés en cohérence avec le nouvel arbre, sans points flottant dans le ciel vide.

## Livraison

Vérifier une progression réelle de props, pas seulement le curseur d'exploration. Tests de
monotonie et de plafonnement, chargement/réessai, accessibilité et lecture des branches.
Deux boucles visuelles à 390/768/1440, puis WebKit. Livraison sur la branche existante et Vercel
avec le commit `7174b35686b583435f593132a8c03f04623429a1` comme retour arrière.
