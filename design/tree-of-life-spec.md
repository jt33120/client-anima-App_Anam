# Arbre de vie céleste — direction et critères de réalisation

## Intention

Créer un arbre vivant, naturel et magique dans la nuit bleu ciel-violet d’Anima. La graine,
les racines, le bois et le feuillage forment un même organisme, sensible et crédible. Les
touches pastel et la lumière révèlent la matière ; elles accompagnent les données du parcours.
Cette itération porte sur le front et conserve les thèmes Nuit, Papier et contraste renforcé.

## Composition

- Silhouette organique asymétrique, tronc légèrement sinueux, racines ancrées, rameaux effilés
  et raccordés. Chaque branche métier possède un point reconnaissable dans cette structure.
- Bois brun violacé avec arêtes éclairées, stries sobres et ombres douces ; feuilles à nervure
  discrète, orientations et tailles variées, devant et derrière les rameaux.
- Feuillage sauge, bleu brume et lavande ; quelques pointes rose nacré ou abricot. Les touches
  chaudes restent locales. Les ombres conservent assez de profondeur pour lire les volumes.
- Une graine visible et ancrée initie le dessin. Les racines et le développement du bois
  partagent sa position ; la pousse ne semble pas flotter au-dessus d’un arbre adulte caché.
- La canopée mature reste aérée : les amas de feuilles laissent lire les fourches et les points
  d’interaction. Un halo diffus accompagne uniquement les branches réellement rayonnantes.
- Le ciel et ses étoiles prolongent l’ambiance existante. Ils n’ajoutent pas de points semblables
  aux accroches interactives ni de texte sur une zone dont le contraste varie fortement.

Le cadrage privilégie une canopée ample sur environ 55–60 % de la hauteur, un tronc central
plus discret autour de 20 % et des racines sur le quart inférieur. Ces repères de composition
admettent les raccords et chevauchements ; ils ne décrivent aucun niveau de progression.
La direction finale emploie surtout une matière nacrée gris-bleu et lilas pastel, avec quelques
nuances roses. Une graine réaliste nacrée à fond transparent et des poussières statiques peuvent
enrichir le rendu procédural ; ces assets restent décoratifs et ne portent aucune donnée.

## Progression fidèle

Le [mapping métier](../_bmad-output/specs/spec-arbre-celeste/mapping-stades.md) fait autorité.
« Graine », « pousse » et « canopée » sont des descriptions botaniques de la représentation,
sans niveau numéroté, barre de progression ou nouveau statut enregistré. Une branche peut
passer directement de naissance à rayonnement. La vue restitue cet état et n’invente pas une
succession d’étapes vécues. Une nouvelle branche ne doit pas faire régresser celles déjà présentes.

La matière peut apparaître par une transition brève lorsque les données changent. Elle ne
grandit pas avec le temps passé à regarder l’écran et ne rejoue pas toute une vie à chaque visite.
L’état final est immédiatement accessible lorsque le mouvement réduit est demandé.

## Comprendre les métamorphoses

L’entrée « Mon évolution » et l’explication « Comprendre l’évolution » présentent quatre
illustrations choisies manuellement : graine, pousse, feuillaison et rayonnement. Elles utilisent
le même moteur avec des exemples fictifs clairement séparés de l’arbre personnel. Aucune
illustration n’ajoute de branche ni ne déclenche de transition réseau ou persistée.

Présenter des possibilités du parcours, sans étapes numérotées à compléter ni obligation de
passer par chaque intermédiaire. La pleine lumière demeure un geste de la personne et peut
arriver directement. Le changement d’illustration est manuel, avec libellé accessible et cibles
de 44 px ; les règles existantes de focus et de fermeture de la modale sont conservées.

## Interaction et accessibilité

Les points d’interaction suivent exactement la transformation du bois pendant le cadrage,
le zoom et le redimensionnement. Leur hitbox atteint 44 × 44 px à l’écran, même lorsqu’une
feuille ou une fleur est plus petite. Un bouton masqué par un autre doit rester accessible
par la liste équivalente ; vérifier aussi les collisions dans la vue arbre dense.

La sélection et le focus se distinguent par forme/contour autant que par couleur. Les textes
et commandes respectent les contrastes existants ; l’arbre décoratif ne remplace aucun libellé.
La liste conserve les mêmes branches, fiches, dates disponibles et actions. Le lecteur d’écran
n’annonce pas les feuilles et particules décoratives. Les annonces existantes restent sobres.

Conserver fermeture Échap, restauration du focus, changement arbre/liste, gestes suspendus
et lien exact vers la conversation. Le tronc incomplet demeure accessible, y compris à l’état
graine. L’indisponibilité ne devient jamais une graine vide ou un arbre fané.

## Performance

Conserver une géométrie et des variations déterministes. Mettre en cache les couches et sprites
réutilisables ; une mise à jour identique ne reconstruit pas la forêt de feuilles. Borner la
résolution des canevas et la densité de détail : ne pas multiplier arbitrairement la grande
surface logique par le DPR du téléphone.

Aucune boucle permanente de peinture ou génération pour un arbre immobile. Une éventuelle
animation d’entrée est finie, s’arrête en vue masquée et respecte le mouvement réduit. Les
redimensionnements sont regroupés ; écouter, nettoyer et libérer les ressources à la fermeture.
Le clic, le zoom et la saisie Anam doivent rester réactifs pendant et après l’affichage de l’arbre.

## Preuves attendues

Captures reproductibles à 390, 768 et 1440 px : graine, première branche, feuillaison partielle,
canopée dense sans rayonnement, rayonnement et composition mixte. Ajouter Nuit, Papier,
contraste renforcé, mouvement réduit, liste et fiche ouverte aux cas pertinents. Les jeux de
démonstration sont fictifs et clairement réservés à la validation.

Comparer la silhouette et les accroches à chaque taille, relever débordements et dimensions des
cibles, contrôler le retour de focus et l’équivalence de la liste. Vérifier par instrumentation
qu’une période immobile ne déclenche pas de nouveaux dessins, puis que seul un changement réel
invalide les caches nécessaires. La preuve visuelle et le diff front accompagnent le SHA publié.
