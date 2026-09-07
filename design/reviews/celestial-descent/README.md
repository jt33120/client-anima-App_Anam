# Lumière du ciel — 7 septembre 2026

Trois nouvelles illustrations prolongent la série, désormais composée de 35 états :
**Descente céleste**, **Lumière incarnée**, **Ciel et racines**. Le faisceau nacré descend
vers la cime, se diffuse dans le bois puis atteint tout le réseau des racines. Les 32
planches précédentes, leurs textes et leurs fichiers sont conservés intégralement.

Création avec l’outil imagegen intégré ; [prompts et sources exacts](../../celestial-descent-prompts.md),
[fichiers et empreintes](../../living-growth-assets.json). Les trois nouveaux WebP sont
optimisés à qualité88 effort6, sans redimensionnement ni recadrage : 1 042 414 octets.

Le premier passage compare les planches 32 et 33 à 390/768/1440 : le faisceau se lit
au-dessus de la couronne, le cadrage reste cohérent et les repères gardent leur place.
La lumière de la cime laisse encore le tronc et les racines proches de l’état précédent ;
les planches 34 puis 35 rendent la descente perceptible dans ces deux zones. La dernière
accentue l’atmosphère rose-lilas et les racines tout en conservant le grain du bois.
Aucun changement de mise en page n’a été nécessaire lors de cette extension.

Le second passage vérifie les 35 états personnels à 390 px et neuf états à 768/1440,
dont les quatre derniers consécutifs : **53 cas et quatre contrôles d’interaction passent**,
sans débordement, superposition ou cible trop petite. Les trois derniers dessins ont
été regardés dans leur cadre réel ; l’illumination finale a été inspectée aux trois largeurs.
La galerie parcourt les 35 options, les deux extrémités, les thèmes et six contextes mobiles.
WebKit parcourt également les 35 états réels et les 35 options ; focus, zoom, groupes,
échec de chargement et réessai passent. Les lectures API sont interceptées localement.

Résultats : [premier passage](first.json), [Chromium](chromium.json),
[galerie](gallery.json), [WebKit](webkit.json).
Captures : [33](33-390.webp), [34](34-390.webp), [35 mobile](35-390.webp),
[35 tablette](35-768.webp), [35 bureau](35-1440.webp), [galerie](35-gallery-390.webp).

**620 tests de rendu, 57 gardes pures, lint et build passent.** Les nouveaux tests figent
les 32 objets et dessins précédents et vérifient la progression 31→32→33→34, avec son plafond.
La règle de croissance garde les huit nuances existantes ; neuf, dix et onze branches
rayonnantes ouvrent les trois nouvelles nuances lorsque la structure a atteint l’indice23.
Le code de création, de chargement et de rayonnement versionné ne limite pas le nombre
total de branches à huit ou dix. Aucun backend, schéma ou état de compte n’est modifié.
Voir [la règle de rendu](../../living-growth-data.md).

La vérification fonctionnelle utilise des données synthétiques ; elle ne prétend pas
avoir fait progresser un compte de production. La publication vérifie séparément l’alias
Vercel et son SHA, les 35 images publiques, l’optimiseur Next et l’entrée anonyme mobile.

Retour arrière : version précédente `765f3799ff826a80125f0d42ef62ab113b5f3a8c`,
déploiement `dpl_fQY1tAPQEfL7wzeVc9zBzkcNCPKu`, URL immuable
`https://anima-odvsiuzu5-julian-talous-projects.vercel.app`.
