# Validation — arbre de vie céleste

## Version et destination

Refonte front sur `codex/carnet-celeste-ui`, destinée à la production
https://anima-app-swart.vercel.app. La référence de retour est conservée ci-dessous.

L’arbre adopte une silhouette botanique ample, un bois nacré, des feuilles pastel et une graine
réaliste. L’aura suit exclusivement le rayonnement déclaré de chaque branche ; une feuillaison
maximale reste distincte. L’exploration pédagogique propose quatre illustrations manuelles avec
le même moteur, explicitement séparées des données personnelles. Le zoom, la liste et les fiches
conservent leurs actions. La portée reste front, assets, tests et documentation ; aucun changement
des API, des données, des migrations ou des règles de progression.

Références : [direction visuelle](../../tree-of-life-spec.md),
[SPEC et mapping métier](../../../_bmad-output/specs/spec-arbre-celeste/SPEC.md).

## Contrôles obtenus

| Contrôle | Résultat |
| --- | --- |
| Tests de rendu | 607 réussis, 50 fichiers |
| Tests purs ciblés | 146 réussis, 8 fichiers, dont contrastes, géométrie, QA et version skew |
| ESLint | Réussi |
| Build de production local | Réussi |

Les deux suites de graine ont également été exécutées séparément : 21 tests réussis. Elles
conservent les gardes sur l’état réel, l’absence de double graine DOM/canevas, le repère partagé,
la décoration sans focus, les dimensions de l’image, le mouvement borné et le mouvement réduit.

Commandes depuis la racine du dépôt :

```sh
npx vitest run --project rendu
npx vitest run tests/arbre-lunaire.test.ts tests/geometrie-arbre.test.ts tests/arbre-rendu.test.ts tests/arbre-sans-fruit.test.ts tests/qa-visuelle-19-aout.test.ts tests/carnet-contraste.test.ts tests/vue-arbre.test.ts tests/version-skew.test.ts
npx vitest run --project rendu tests/rendu/graine-attente.test.tsx tests/rendu/graine-integree.test.tsx
npm run lint
npm run build
```

Le build exécute le prébuild existant. Ces contrôles locaux ne constituent pas une preuve de
concordance du schéma distant ; aucune migration ni neutralisation du contrôle de promotion
n’a été réalisée pour cette refonte.

## Revue indépendante

Trois défauts P2 ont été identifiés puis corrigés : contraste du survol des commandes de zoom
en Papier, fond du jardin trop clair derrière son encre nocturne et graine de l’aperçu décalée
du sol réel. Le jardin utilise désormais ses propres couleurs, les modes de contraste suppriment
dégradés et texture, et l’aperçu aligne la graine à 70,60 % comme le moteur.

Le calcul conservateur cumulant les deux radiaux à leur intensité maximale et une texture
entièrement blanche à 15 % donne **7,20:1** pour l’encre du jardin. Le survol du zoom atteint
**10,95:1**. Ces mesures valident ces compositions précises, sans prétendre auditer tous les
pixels de l’application. Aucun autre blocage n’a été relevé dans le diff examiné.

La revue a également vérifié l’aura déclarée et sa clé de cache, le tronc incomplet, la
charpente des branches réelles, l’équivalence des actions, le filtrage des gestes sur le zoom
et le nettoyage du fondu lors d’un mouvement réduit, d’une région inactive ou d’un onglet caché.

## Captures et interactions

**75 scénarios Chromium validés**, à 390, 768 et 1440 px : zéro erreur navigateur,
zéro débordement horizontal, empreintes des sources stables. Les 15 retours de focus,
12 illustrations (navigation couverte et texte complet après défilement), trois zooms et trois
glissements depuis une branche passent. [Résultats Chromium](chromium-results.json).

**WebKit à 390 px** valide la graine, le feuillage, les quatre illustrations, leur défilement,
le zoom et la fermeture. Un vrai tap ouvre la fiche ; un glissement déplace l’arbre sans ouvrir
la fiche et cesse au relâchement. [Rendu WebKit](webkit-results.json), [gestes WebKit](webkit-gestures.json).
Ces essais utilisent les moteurs de navigateur, sans prétendre remplacer un iPhone physique.

Le clic de branche absorbé par la capture du canevas a été corrigé : le pointeur reste capturé
par son bouton cible et les événements de glissement remontent au canevas. La capture est
relâchée sur la même cible. Les 39 tests ciblés de gestes, mesure et tronc passent après ce correctif.
La modale couvre désormais la navigation persistante.

Limite dense mesurée : à 390 px avec 24 branches, les zones tactiles de 44 px se recouvrent ;
huit centres sont directement touchables au cadrage initial. Zoom, clavier et vue liste donnent
accès à toutes les branches. Aucun bouton n’a été réduit sous le plancher tactile pour les espacer.

| Avant | Graine | Branches | Canopée |
| --- | --- | --- | --- |
| [Avant mobile](avant-mobile.webp) | [Graine nacrée](graine-mobile.webp) | [États mixtes](branches-mobile.webp) | [Canopée mobile](canopy-mobile.webp) |

[Illumination mobile](illumination-mobile.webp) · [Feuillage bureau](feuillage-bureau.webp) ·
[Illumination bureau](illumination-bureau.webp) · [Fiche sous WebKit](fiche-webkit.webp).

[Création de la graine : asset, mode et prompt](../../tree-asset-provenance.md).

Le harnais monte les composants réels avec des projections fictives ; il couvre graine,
naissance, feuillaison partielle et maximale, rayonnement, mélange, densité, indisponibilité,
tronc réservé, liste, fiche, zoom, illustrations, Papier et contraste. Les appels API sont
interceptés et aucune donnée personnelle n’est nécessaire.

```sh
node node_modules/vite/bin/vite.js --config tests/visual-carnet/vite.config.mjs
```

Puis, dans un autre terminal :

```sh
node tests/visual-carnet/capture-tree.mjs design/reviews/tree-of-life/chromium full
```

Les empreintes des sources enregistrées par le script permettent de repérer une modification
concurrente du rendu. Ce harnais adapte les composants Next de navigation et d’image : il ne
vérifie pas l’authentification de production, le chargement des données distantes ou leur persistance.

## Performance mesurée

Source : [mesures de performance](performance.json). Les valeurs suivantes correspondent à
une peinture initiale complète, après vidage des commandes graphiques, dans Chromium avec
un ralentissement CPU simulé de 4×. Elles sont arrondies à la milliseconde.

| Scénario | Peinture initiale complète |
| --- | ---: |
| 13 branches feuillues | 608 ms |
| 13 branches rayonnantes | 801 ms |
| 40 branches feuillues | 778 ms |
| Aperçu du portail, résolution réduite | 411 ms |

Une mise à jour identique ou équivalente produit **zéro appel de dessin au canevas** ; une
observation immobile de 300 ms en produit également zéro. Le jardin utilise un bitmap borné
de 986 × 1753 px et le portail 493 × 877 px. Le fondu éventuel compose le résultat déjà peint
et ne reconstruit pas l’arbre à chaque image.

Le coût initial de plusieurs centaines de millisecondes reste perceptible sur ce profil simulé.
Ces mesures ne prouvent ni une cadence garantie ni une fluidité sur un appareil physique ; elles
montrent un travail ponctuel et un cache inactif au repos. Les limites du moteur graphique,
de la mémoire et du clavier d’un téléphone réel n’ont pas été mesurées par ce protocole.

## Référence de retour

La référence précédente fournie par le pilote est conservée avant toute nouvelle publication :

- SHA : `7c8c2d21255f04d8e3e75b97637d36b146ebd58c`.
- Production READY : `dpl_7wkZgRtjNVkgC4tNiWjfNSSj7YE8`.
- URL immuable : https://anima-dqjkwlre9-julian-talous-projects.vercel.app.
- Alias public : https://anima-app-swart.vercel.app.

```sh
vercel rollback dpl_7wkZgRtjNVkgC4tNiWjfNSSj7YE8 --yes
```

La publication reconstruit normalement le commit poussé avec `vercel deploy
--prod`, depuis une source propre excluant le fichier préexistant `opencode.json`, sans modifier
les contrôles de promotion. Vérifier le SHA, l’ID READY et l’alias dans les métadonnées Vercel après publication.
Aucune migration ne conditionne le retour à cette référence.
