# Croissance personnelle — livraison du 7 septembre 2026

L'arbre principal change désormais d'illustration avec les branches réelles et leur feuillaison.
La série comporte 32 états : les quatre premiers fichiers sont conservés à l'octet près ;
12 nouveaux états développent le jeune arbre, huit sa canopée et huit son illumination.
Le tronc devient clair et vivant avant l'apparition de sa lumière intérieure.

Le choix d'image est un paramètre de rendu calculé depuis les branches réconciliées, sans score
affiché ni écriture supplémentaire. L'addition évite qu'une nouvelle branche fasse rétrécir
l'arbre. L'illumination attend une charpente mature et des branches réellement rayonnantes.
La projection est rafraîchie lors de l'entrée dans Mon évolution.

Contrat : [direction](../../living-growth-spec.md), [données et règle de rendu](../../living-growth-data.md).
Création : outil imagegen intégré, [prompts exacts](../../living-growth-prompts.md) et
[32 fichiers, sources et empreintes](../../living-growth-assets.json).
Poids source total : 7 686 450 octets ; l'optimiseur Next et le chargement de l'image courante
avec sa seule voisine évitent de charger toute la série à l'ouverture.

## Vérification visuelle

La première boucle a examiné les états 0, 4, 8, 15, 23 et 31 à 390, 768 et 1440 px.
Elle a révélé une légende traversant la graine. La légende rejoint maintenant l'introduction.
Les points de branches ont été relevés sur les nouvelles planches. Les cibles proches se regroupent
en un bouton de 44 px, puis chaque nom ouvre sa fiche complète. Un glisser sur ce bouton déplace
l'arbre sans ouvrir le groupe ; les panneaux sont masqués pendant la consultation d'une fiche.

La seconde boucle vérifie 32 états personnels à 390 px et six états aux deux autres largeurs :
44 cas, sans débordement, cibles superposées, cibles trop petites ou erreur navigateur.
Elle vérifie aussi le changement de projection sur la même page, les groupes et la conservation
de la croissance pendant le zoom. [Résultats Chromium](chromium-final.json).

La galerie parcourt les 32 images au format mobile et les états clés aux autres formats, ainsi
que Papier, contraste, branches, liste, tronc à compléter et indisponibilité. Focus restauré,
contenu personnel inchangé après fermeture. [Résultats galerie](gallery-final.json).

WebKit vérifie les 32 stades sur la même page, les 32 options de la galerie, Entrée/Échap,
les groupes, les fiches, le glisser, le centrage et l'image indisponible suivie d'un réessai.
Aucune erreur JavaScript ; les deux lectures de plan sont interceptées localement, sans mutation.
[Résultats WebKit](webkit-final.json).

Les captures précèdent uniquement le dernier garde conditionnel qui retire un bouton de tronc
devenu inutile dans un groupe déjà ouvert après l'ajout de l'heure de naissance. Ce scénario
est couvert par la régression de `tronc-incomplet.test.tsx`. Les styles et illustrations sont identiques.

Captures : [graine](seed-390.webp), [croissance](growth-08-390.webp),
[jeune arbre](young-tree-390.webp), [canopée](canopy-390.webp),
[illumination mobile](illumination-390.webp), [tablette](illumination-768.webp),
[bureau](illumination-1440.webp), [branches proches](branches-group-390.webp),
[galerie Papier](paper-gallery-390.webp).

## Validation et limites

619 tests de rendu, 123 gardes pures, lint et build Next passent. Les tests protègent notamment
les quatre empreintes originales, la monotonie du choix de planche, les données invalides,
la barrière d'illumination, le rafraîchissement, la disparition du bouton de tronc devenu inutile,
les liens et gestes des branches et l'absence de note dans les alternatives des images.
Le graphe Graft est reconstruit.

Les contrôles fonctionnels utilisent des projections synthétiques et bloquent les API : ils
n'écrivent dans aucun compte. Le harnais adapte Next Image. La livraison vérifie séparément
le SHA/alias Vercel, les 32 assets publics, l'optimiseur Next et l'entrée anonyme du site.
Les tests de base de données ne sont pas exécutés contre les données personnelles.

Commandes reproductibles, après lancement du harnais Vite décrit dans `tests/visual-carnet/README.md` :

```sh
node tests/visual-carnet/capture-croissance.mjs /tmp/anima-growth-review
node tests/visual-carnet/capture-croissance-webkit.mjs --full
node tests/visual-carnet/capture-metamorphose.mjs /tmp/anima-gallery-review chromium
```

## Retour arrière

Branche : `codex/carnet-celeste-ui`. Version précédente vérifiée avant livraison :
`7174b35686b583435f593132a8c03f04623429a1`, déploiement `dpl_5xjwHgUfsX81gvhx5kJ3JN3peJ4u`,
URL immuable `https://anima-fig4zuekw-julian-talous-projects.vercel.app`.
La restauration de ce déploiement remet la version précédente. Aucune migration ni modification
du backend n'accompagne cette livraison.
