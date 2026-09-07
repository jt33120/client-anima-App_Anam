# Métamorphose botanique — 7 septembre 2026

## Résultat

Huit planches fixes suivent la même graine nacrée : ouverture, racines, pousse, jeune arbre,
déploiement, canopée et illumination. « Voir la graine éclore » ouvre directement la deuxième
planche, près de la graine réelle. La galerie reste disponible depuis « Comprendre mon évolution »
dans les états avec branches, la liste et l'état indisponible. Les explications personnelles
restent dans « Ce que raconte mon arbre ».

La galerie ne reçoit ni projection personnelle ni action métier. Aucun stade global n'est
inventé à partir des branches. Il n'y a ni lecture API, ni écriture, ni autoplay.

Direction : [spécification](../../metamorphosis-spec.md).
Création : outil imagegen intégré, [prompts exacts et variantes](../../metamorphosis-prompts.md),
[sources, dimensions et empreintes](../../metamorphosis-assets.json).
Les huit WebP font 1 404 622 octets au total, sans redimensionnement ni recadrage.

## Deux boucles visuelles

La première boucle a confirmé l'accès direct et le retour du focus à 390, 768 et 1440 px.
Elle a montré qu'une seconde rangée de repères prenait trop de place sur mobile. La version
finale aligne les huit repères dès 384 px et agrandit la planche de 39 à 44 dvh. Les commandes
restent tactiles, d'au moins 44 px. Le chargement de l'image et la fin de son décodage sont
attendus avant chaque capture.

La seconde boucle parcourt les huit planches aux trois largeurs, puis Papier, contraste renforcé,
branches, liste, graine avec tronc incomplet et indisponibilité : 18 contextes supplémentaires.
Aucun débordement horizontal, erreur navigateur ou appel API ; retour du focus et texte personnel
inchangé après fermeture. La navigation inférieure est couverte par le dialogue.

WebKit mobile a révélé une perte de focus lorsque Précédente/Suivante devenait désactivée à la
première ou dernière image. Le focus est maintenant transmis au repère actif si cette commande
le portait. Les numéros visibles des repères sont aussi inclus dans leur nom accessible.
Une seconde passe confirme les huit stades, les deux bornes, Entrée/Espace, le piège de focus,
Échap, fermeture et récupération après une image volontairement bloquée.

Preuves : [première boucle Chromium](chromium-first.json), [seconde boucle Chromium](chromium-second.json),
[WebKit, réseau et revue](webkit-and-network.json), [22 scénarios du harnais arbre](tree-harness.json).
La seconde boucle Chromium précède uniquement le correctif de focus aux bornes ; la passe WebKit
et les tests de régression portent sur ce correctif final. Les styles et images sont identiques.

Captures : [accès depuis la graine](seed-cta-390.webp), [éclosion mobile](eclosion-390.webp),
[illumination mobile](illumination-390.webp), [tablette](illumination-768.webp),
[bureau](illumination-1440.webp), [Papier](papier-canopee-390.webp).

## Reproduction et limites

Depuis la racine, lancer le harnais hors ligne :

```sh
node node_modules/vite/bin/vite.js --config tests/visual-carnet/vite.config.mjs
node tests/visual-carnet/capture-metamorphose.mjs /tmp/anima-metamorphose-review full
```

Les composants React et CSS sont réels ; les données sont synthétiques et `/api/**` est
intercepté. Le harnais utilise un adaptateur pour Next Image. Il ne valide donc ni la session
personnelle, ni les données distantes, ni l'optimiseur Next en production. La vérification de
livraison contrôle séparément l'alias Vercel, son SHA, les huit assets publics et une image
optimisée, puis l'entrée anonyme dans Chromium et WebKit.

Avant publication : TypeScript et lint passent ; 620 tests de rendu (51 fichiers), 110 gardes
visuelles/contraste/arbre (4 fichiers) et le build Next passent. Le graphe Graft est reconstruit.
Les tests de base de données ne sont pas exécutés contre l'environnement personnel.

## Retour arrière

Branche de livraison : `codex/carnet-celeste-ui`. Le dépôt lié au projet Vercel `anima-app` est
`jt33120/client-anima-App_Anam`. La branche principale reste `main` ; la publication de cette
branche est explicite et vient d'une archive Git propre.

Version précédente, vérifiée sur l'alias public avant publication :

- Commit : `54c2e15fc6d03cf9a854e67b838f7f414746b6ac`.
- Déploiement : `dpl_4jMXMiU5AFVbSXfMaSUM1kqURGPK`.
- URL immuable : `https://anima-3g7b7pmu4-julian-talous-projects.vercel.app`.

Le retour se fait par restauration de ce déploiement Vercel ; aucune migration ni modification
du schéma n'accompagne cette livraison.
