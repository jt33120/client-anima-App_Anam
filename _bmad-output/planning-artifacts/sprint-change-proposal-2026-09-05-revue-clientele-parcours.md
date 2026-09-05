---
project: Anima
artifact: Sprint Change Proposal
date: 2026-09-05
status: draft-for-approval
mode: batch
scope: major-program
conditional_extension_scope: sensitive-major
baseline_branch: main
baseline_commit: bc1b75537783229f68a8022fd6740121957ef549
implementation_authorized: false
trigger: Revue chronologique de l'application Anam avec la cliente
---

# Sprint Change Proposal — revue clientèle du parcours Anam

## 0. Décision exécutive

Le bon chemin est un **programme correctif multi-lots dans le backlog existant**, sans rollback global et sans redéfinition du MVP. Le socle fonctionnel est solide ; les écarts portent surtout sur la première impression, la hiérarchie éditoriale, la direction visuelle et la manière de présenter des données déjà calculées. Leur empreinte transverse — plusieurs écrans, stockage durable, correction protégée de données et recette multi-appareils — interdit cependant de les présenter honnêtement comme une seule correction modérée. Deux demandes seulement ouvrent une capacité produit plus profonde : la personnalisation psychologique par la mémoire d'Anam et, si elle était maintenue, la personnalisation du mantra.

Le plan retient donc :

1. un contrat produit et visuel avant toute refonte globale ;
2. des correctifs rapides sur le portail et l'accueil ;
3. une amélioration du ciel du jour et des trois univers sans refaire les calculs existants ;
4. une évolution de la scène Anam et de « Mon arbre » ;
5. une validation complète du parcours réel avant mise en production.

Le **correctif cœur** est classé **programme majeur**, à livrer et accepter par lots plutôt qu'en un sprint indivisible. Ce classement décrit l'effort et le risque de coordination, pas une remise à plat du produit. RC-G3, la réflexion Ennéagramme nourrie par la mémoire, est une **extension sensible séparée** : elle reste planifiée en P2, n'entre pas dans la recette du correctif cœur et exige son propre feu vert données/sécurité.

> Aucun code n'est inclus dans ce document. Le dépôt a été inspecté à `main@bc1b755`; le fichier non suivi `opencode.json` n'a pas été touché.

## 1. Déclencheur, méthode et niveau de preuve

### 1.1 Déclencheur

La cliente a parcouru l'application dans son ordre naturel. La transcription Notion a ensuite :

- dupliqué certaines demandes ;
- altéré certains libellés ;
- mélangé le portail animé, le seuil d'entrée et la région de conversation Anam ;
- décrit comme absentes des fonctions déjà livrées en partie ;
- transformé des moyens de production (« clé Gemini », « prompt Claude Design », « Lia ») en besoins utilisateurs ;
- introduit des contradictions de données et de confidentialité.

### 1.2 Sources prises en compte

- verbatim joint de la revue cliente ;
- PRD, Architecture, DESIGN, EXPERIENCE et backlog BMAD existants ;
- état du code à `main@bc1b755` ;
- dernier plan de retours terrain ;
- références visuelles déjà présentes dans `images/` ;
- anciennes captures QA du 15 août, utilisées uniquement comme historique ;
- contraintes actuelles de transparence IA et de focus clavier mobile.

### 1.3 Limite de vérification visuelle

Le rendu live n'a pas été lancé : Docker et Supabase local étaient arrêtés, aucun serveur local n'écoutait et `.env.local` désignait le Supabase distant. Démarrer le parcours dans ces conditions aurait exposé à une utilisation involontaire de données réelles. Aucune production n'a été ouverte ni modifiée.

Les captures QA historiques confirment l'ancienne direction sombre, un petit arbre et une scène Anam vide, mais elles **ne prouvent pas le rendu actuel**, plusieurs corrections ayant été livrées depuis. La validation visuelle actuelle est donc un jalon obligatoire du Lot 0 et du Lot 6.

### 1.4 Cartographie des surfaces citées pendant la revue

| Surface | Quand elle apparaît | Contenu concerné | Ce qu'elle n'est pas |
|---|---|---|---|
| **Portail de lancement** | Au chargement à froid du document | Arbre lunaire, « Bienvenue », lotus | Ni le seuil, ni une page de navigation, ni un vrai temps de chargement mesuré. |
| **Seuil de première utilisation** | Une fois par compte tant qu'il n'est pas franchi | Avatar Anam, tagline et action « commencer » | Pas le portail arbre ; pas concerné par « Anam → welcome » sans nouvelle décision. |
| **Région Aujourd'hui** | Foyer quotidien de la scène | Ciel du jour, mantra, trois univers | Pas une route indépendante ; son retour ne doit pas rejouer le portail. |
| **Haltes des univers** | Après ouverture d'Astrologie, Numérologie ou Psychologie | Contenus détaillés, méthode, résultats | Pas des régions de la scène ; elles gardent leurs retours et états d'attente utiles. |
| **Région Anam** | Destination conversationnelle | Phrase d'accueil, fil, composeur, fond étoilé/lotus | Pas le seuil de marque ; sa phrase exacte ne remplace pas « Bienvenue » sur le portail. |
| **Région Mon évolution** | Destination de l'arbre | Tronc, branches, graine et explication | La destination change de nom, mais l'objet reste « ton arbre ». |

## 2. Histoire nettoyée du parcours client

### 2.1 Portail de réception

À l'ouverture froide de l'application, la personne voit une seule fois un portail plein écran. L'arbre lunaire en est le sujet principal : sa couronne domine ses racines, il occupe presque tout le cadre utile, ses formes sont organiques, arrondies et lumineuses, et ses racines restent basses sans pousser les autres éléments hors écran. Le texte visible est **« Bienvenue »**. Il n'y a ni chronomètre, ni pourcentage, ni phrase qui matérialise l'attente. La fleur et sa feuille de lotus sont plus présentes.

Le portail ne réapparaît jamais lors d'une navigation interne ou d'un retour vers Aujourd'hui. Face aux deux demandes incompatibles du verbatim, ce draft **propose** une fois par chargement de document / lancement à froid, y compris après un vrai rechargement, plutôt qu'une seule fois dans toute la vie de l'installation. Ce n'est pas une correction factuelle de Notion : c'est un arbitrage produit, clairement soumis à l'approbation du §15.

Le portail reste distinct du **seuil d'entrée** : le seuil est l'accueil de première utilisation déjà mémorisé par le compte ; le portail est un voile de lancement. Ni l'un ni l'autre ne doit couvrir `/aide`.

### 2.2 Aujourd'hui

L'accueil se lit à la première personne :

- « Mon parcours du jour » ;
- « Mon mantra du jour » ;
- « Mon monde intérieur » ;
- « Mes univers ».

La phrase « Ils ne changent pas tous les jours. Ils restent ici, à leur place. » disparaît. Les cartes deviennent plus lumineuses, plus calmes et plus lisibles, sans perdre le ciel nocturne qui donne son identité au monde.

### 2.3 Ciel du jour

Le ciel du jour tutoie et parle de cette personne à partir de son thème natal calculé et du ciel du jour. Il peut utiliser des caractéristiques dérivées du signe solaire, de la Lune et de l'ascendant lorsque ces valeurs sont fiables. Il n'utilise jamais le journal, les branches ni les messages confiés à Anam. Il ne prédit rien et ne donne aucun conseil prescriptif.

Les date, heure et lieu de naissance servent aux calculs. Ils ne sont pas transmis tels quels au modèle de rédaction : seule une signature astrologique minimisée et dérivée peut sortir. Si l'heure manque, le texte n'invente ni ascendant, ni maison, ni position lunaire incertaine.

### 2.4 Astrologie

La page s'ouvre par un titre « Astrologie » centré, puis par le ciel du jour. Le surtitre réel « Projection de naissance » disparaît. Le titre déjà existant **« Ton ciel de naissance »** reste, accompagné d'une seule phrase utile expliquant que la carte est calculée depuis les données de naissance disponibles.

Le diagramme natal devient plus évocateur sans perdre sa précision : étoiles, Lune et planètes structurent le regard, tandis qu'une version textuelle équivalente reste disponible. En bas, un résumé expose Soleil, Ascendant et Lune. Ces résultats ne sont jamais éditables directement : une action permet de corriger les données de naissance autorisées, puis le thème est recalculé.

La phrase actuelle « Le texte du jour, lui, est écrit par un modèle » est retirée de l'introduction. Si la prose reste générée, sa provenance est conservée sous une forme courte, claire et accessible au niveau du texte concerné ; elle n'est pas supprimée silencieusement.

### 2.5 Numérologie

La page porte un titre centré et n'ajoute pas de sous-titre technique. Les valeurs calculées ne changent pas : elles deviennent le point d'entrée d'une lecture symbolique. Chaque nombre apparaît une seule fois dans la vue normale avec son intitulé, sa valeur, son archétype et son explication.

La méthode reste consultable dans un accordéon accessible afin que le calcul soit vérifiable. Elle peut montrer la formule nécessaire à la preuve, mais ne recrée pas un second tableau récapitulatif. Le ton actuel, personnalisé et factuel, est conservé.

### 2.6 Psychologie et Ennéagramme

Le sous-titre « Des outils différents… » disparaît. Les cartes et boutons gagnent en contraste, en douceur et en lisibilité.

Un résultat d'Ennéagramme ne s'arrête plus à « Type N ». Il comporte trois couches visuellement distinctes :

1. un nom court validé pour chacun des neuf types ;
2. une définition générale provenant du corpus éditorial d'Anima ;
3. lorsqu'il existe une base légitime et consentie, une réflexion personnalisée d'Anam, explicitement présentée comme une hypothèse et non comme une identité ou un diagnostic.

Sans consentement ou matière suffisante, la troisième couche est absente ; le produit ne la fabrique pas.

### 2.7 Anam

La région Anam reste un journal intime interactif : le fil demeure monté, les échanges persistent selon les règles existantes et la mémoire réutilisée reste contrôlable par la personne.

La phrase d'accueil fournie par Julian est conservée **exactement**, sans correction silencieuse :

> Confie ici ce que tu portes en toi. Un espace pour te comprendre, évoluer, te dépasser et révéler la personne que tu es appelée à devenir.

Elle est une introduction de la région / de son état d'accueil, et non un faux message quotidien ajouté au journal. Les points du fond deviennent de vraies étoiles stylisées et un lotus de contour très discret structure l'arrière-plan sans concurrencer le texte.

Après un geste explicite vers Anam, le composeur reçoit le focus et le clavier s'ouvre sur les navigateurs qui l'autorisent. Le produit ne promet pas une ouverture forcée sur toutes les plateformes et ne vole pas le focus aux technologies d'assistance.

### 2.8 Mon évolution

La destination « Mon arbre » devient **« Mon évolution »**, tandis que l'arbre reste sa métaphore centrale. L'explication complète ne disparaît plus après la première branche : elle reste atteignable depuis tous les états.

Une page « Comprendre mon évolution » décrit le tronc, la naissance d'une branche, sa feuillaison et son rayonnement. Elle peut montrer un arbre illustratif à différents stades, mais ne promet jamais un « résultat final » individuel. Aucun fruit, score, niveau, pourcentage, série ou barre de progression n'est introduit. La graine fait l'objet d'une nouvelle validation visuelle plutôt que d'être considérée comme absente.

## 3. Corrections apportées au compte rendu Notion

| Formulation Notion | Correction retenue | Motif |
|---|---|---|
| « anam » → « welcome » | Recommandation soumise à validation : « Anam » → **« Bienvenue »** sur le portail | Application intégralement francophone ; `welcome` reste la demande source et peut être conservé comme choix de marque explicite. |
| « supprimer le chronomètre » | Identifier l'élément sur le SHA vu par la cliente ; à HEAD, l'hypothèse est **« Le temps que tout se pose. »** | Aucun chronomètre, pourcentage ou barre n'existe sur `bc1b755`, mais le build client n'est pas encore identifié. |
| « au lancement » / « au tout premier lancement » | Proposition soumise à validation : une fois par lancement à froid / document, jamais entre les régions ou haltes | Les deux formulations se contredisent ; le draft choisit le comportement le plus proche du besoin principal et le rend testable. |
| « La mantra » / « Ma mantra » | **« Mon mantra du jour »** | « Mantra » est masculin. |
| « astrology » | **« astrologie »** | Cohérence linguistique française. |
| « Projection natale » | Le texte réel est **« Projection de naissance »** et sera supprimé | « Ton ciel de naissance » existe déjà comme titre principal. |
| « constantes éditables : signe, ascendant, Lune » | Résultats consultables ; **données de naissance** corrigeables, puis recalcul | Un résultat calculé ne s'édite pas à la main. |
| « remplacer les nombres calculés par des nombres symboliques » | Conserver le calcul ; enrichir sa **présentation symbolique** | Symbolique et calcul ne sont pas deux valeurs différentes. |
| « pop-ups/toggles » | Accordéons ou feuilles accessibles, utilisés seulement quand ils réduisent réellement le bruit | Une pop-up n'est pas une exigence utilisateur et ajoute du coût d'accessibilité. |
| Horoscope selon naissance, sans données Anam | Conserver la personnalisation astrologique actuelle, fondée sur des données dérivées et sans journal | Le produit fait déjà mieux qu'un simple horoscope par signe solaire. |
| Mantra alimenté par Anam | **Non retenu dans le correctif** ; le mantra reste quotidien, gratuit, non interactif et indépendant du journal | Le PRD sépare le socle quotidien de la relation. Une personnalisation serait un nouvel « ancrage » ou un contenu Anam distinct. |
| Texte Ennéagramme personnalisé | Autorisé seulement comme troisième couche consentie, distincte de la définition générale | Évite qu'une hypothèse soit présentée comme un diagnostic ou comme le corpus d'Anima. |
| « supprimer le texte écrit par un modèle » | Retirer le jargon de l'introduction, conserver une provenance IA courte si le texte est généré | Transparence et attribution ne doivent pas disparaître avec une phrase jugée maladroite. |
| « clavier automatique sans clic » | Ouverture après le geste menant vers Anam, avec repli en un tap | Les OS mobiles peuvent refuser le clavier hors activation utilisateur. |
| Gemini, Claude Design, Lia | Moyens de conception hors runtime, pas stories utilisateur | Les assets finaux sont statiques, optimisés, versionnés ; aucune clé dans le navigateur. |
| « résultat final de l'arbre » | Illustration des états possibles, sans promesse de résultat personnel | L'évolution est ouverte, qualitative et non gamifiée. |

## 4. État réel et delta à livrer

| Sujet | État à `bc1b755` | Statut du retour | Delta exact |
|---|---|---|---|
| Portail | Arbre lunaire, « Anam », phrase d'attente, lotus 28 px ; hauteur plafonnée à `min(58vh, 29rem)` | Partiel | Recomposer le responsive, changer le libellé, retirer l'attente, agrandir le lotus, verrouiller la fréquence. |
| Chronomètre | Aucun chronomètre, anneau, pourcentage ou barre à HEAD | Non retrouvé, build client à identifier | Après RC-A0, retirer l'élément réellement observé ; sur HEAD, la phrase temporelle est l'hypothèse principale. |
| Accueil | Tous les anciens libellés sont encore présents | À faire | Quatre renommages et suppression d'une phrase. |
| Horoscope | Déjà au tutoiement, 2–3 phrases, calcul natal + ciel du jour, sans journal ; repli corpus | Largement livré | Améliorer la précision éditoriale, la stabilité quotidienne et le banc de validation. |
| Mantra | Corpus quotidien pur, non personnalisé | Conforme au PRD | Renommer seulement ; ne pas brancher la mémoire. |
| Astrologie | « Ton ciel de naissance » existe ; « Projection de naissance » et la phrase modèle restent ; diagramme exact mais abstrait ; seule l'heure possède déjà un flux de correction direct | Partiel | Nettoyer la hiérarchie, ajouter le résumé Soleil/Ascendant/Lune, refaire le diagramme et créer un flux protégé pour date/lieu. |
| Numérologie | Lectures symboliques et accordéons déjà livrés ; une grille de six valeurs subsiste | Partiel / note périmée | Unifier valeur + sens et supprimer le récapitulatif redondant, sans changer le calcul. |
| Psychologie | Trois modules ; introduction encore visible ; boutons sur tokens globaux | Partiel | Retirer l'introduction et corriger le système visuel, pas un violet local isolé. |
| Ennéagramme | « Type N » + origine + texte de corpus ; pas de nom ni de définition séparée | Nouveau | Créer lexique, définition générale et réflexion Anam optionnelle. |
| Fond Anam | 80 points circulaires animés communs à la scène ; pas de lotus filigrane | À faire | Remplacer la forme dans la région Anam et ajouter une couche lotus sobre. |
| Focus Anam | Le changement de région focalise le titre ; le champ n'a pas d'autofocus | À faire avec contrainte | Focus contextuel après geste, sans régression lecteur d'écran. |
| Mémoire Anam | Conversation persistée et fil maintenu | Déjà livré, à protéger | Test de non-régression et frontières de réutilisation. |
| Mon arbre | Nom centralisé ; trois paragraphes explicatifs dans l'état vide ; graine SVG déjà animée | Partiel | Renommage transversal, explication toujours accessible, page dédiée et nouvelle validation de la graine. |
| Design | Soft Balance tokenisé, nuit navy native, cartes sombres ; références claires/pastel dans le dépôt | Changement de doctrine | Construire un contrat hybride et le valider avant déploiement global. |
| Pictogrammes | Trois SVG abstraits simples | À refaire | Une famille cohérente, statique, accessible et validée à petite taille. |
| Documentation | PRD/NFR disent encore « aucun modèle pour l'horoscope » ; Architecture garde des termes anciens comme `fruit` | Dette bloquante | Réconcilier calcul déterministe, prose générée, `rayonnement` et provenance. |

## 5. Contrat de données et de personnalisation

| Surface | Données permises | Données interdites | Comportement sans donnée fiable |
|---|---|---|---|
| Ciel du jour | Thème natal calculé, date civile, éphémérides du jour et signature dérivée minimisée ; le signe solaire sous forme d'énumération n'est ajouté que si la baseline RC-D0 le justifie et RC-A2 l'approuve | Journal, messages, branches, prénom, identifiant et valeurs brutes de date/heure/lieu dans l'appel de rédaction | Corpus relu ; aucune invention d'ascendant, de maison ou de Lune incertaine. |
| Mantra du jour | Créneau du corpus et calendrier | Toute mémoire personnelle, tout extrait ou fait Anam | Mantra générique relu ou absence honnête selon le contrat de corpus. |
| Définition Ennéagramme | Type retenu et corpus éditorial validé | Journal et inférences personnelles | Définition générale disponible. |
| Réflexion Ennéagramme par Anam | Type + faits consentis strictement nécessaires, provenance et version connues | Verbatim brut non nécessaire, données de détresse, contenu supprimé ou hors consentement | Bloc personnalisé omis, sans pénaliser l'accès au résultat général. |
| Conversation Anam | Journal et mémoire selon le consentement existant | Réutilisation silencieuse dans le socle quotidien | Dégradation actuelle conservée ; fil et contrôle des données accessibles. |

Règles transverses :

- aucune donnée de conversation ne traverse la frontière du socle quotidien ;
- toute personnalisation affiche sa nature et sa source de manière compréhensible ;
- suppression, export et révocation s'appliquent également aux nouveaux dérivés ;
- les contenus liés à la détresse restent exclus des synthèses, interprétations et usages de personnalisation ;
- aucune story UI ne peut élargir une frontière de données sans story produit/architecture dédiée.

## 6. Hypothèse visuelle à valider

La synthèse recommandée, mais non encore approuvée, est **« nuit douce + papier lumineux »** :

- le ciel navy, la Lune et la profondeur nocturne restent la scène identitaire ;
- les contenus structurés prennent la forme de cartes ivoire ou blanc cassé, avec texte sombre ;
- les pastels pêche, sauge, bleu brume et rose servent aux surfaces secondaires, traits et illustrations, jamais à du texte faiblement contrasté ;
- les trois pictogrammes partagent le même poids de trait, la même boîte optique et la même densité ;
- étoiles, planètes, lotus et arbre restent décoratifs quand ils n'apportent aucune information ;
- tout mouvement a une version fixe sous `prefers-reduced-motion` ;
- tout texte sur image repose sur un voile ou une carte suffisamment opaque ;
- le mode clair/pastel n'affaiblit jamais le contraste WCAG AA.

RC-A3 doit néanmoins présenter deux variantes de rang égal :

- **Variante A, claire assumée** : fond principal ivoire/blanc cassé, cartes blanches, ciel et navy en accents localisés ; elle répond littéralement au retour « tons actuels trop foncés » ;
- **Variante B, hybride recommandée** : scène navy maintenue, grandes surfaces papier lumineuses et pastels plus présents ; elle conserve davantage l'identité nocturne existante.

La cliente choisit l'une des deux ou une combinaison explicitement documentée. Tant que ce choix n'est pas signé, aucune « refonte globale » ne descend dans le code.

Références disponibles à trier pendant le Lot 0 :

- `images/ChatGPT Image Jul 14, 2026 at 09_14_26 AM.png` : cartes aquarellées claires, palette ivoire/pêche/sauge/bleu ;
- `images/F941B44B-*.png` : cartes claires, lotus, lunes et typographie douce ;
- `images/Gemini_Generated_Image_*.png` : variations de personnage ;
- `images/anam-gemini/` : références nocturnes du personnage et des signes.

Une référence contenant un fruit ou une progression chiffrée ne fait pas foi pour l'arbre. On n'en conserve que la matière, la lumière et le langage graphique.

## 7. Plan de livraison en lots, epics et stories

Le programme contient **7 lots, 10 epics et 35 stories** : 33 stories P0/P1 forment le correctif cœur ; RC-D3 et RC-G3 sont deux découvertes/extensions P2 indépendantes de sa recette.

### Convention de priorité et d'effort

- **P0** : nécessaire avant la recette cliente ou pour éviter une incohérence produit/données.
- **P1** : attendu dans cette correction de parcours.
- **P2** : amélioration différable sans rendre le parcours incohérent.
- Effort relatif : **XS, S, M, L**. Ces tailles sont des **pré-estimations provisoires fondées sur `bc1b755`**, pas des estimations calendaires ; RC-A0 impose leur révision avant engagement et la vélocité d'équipe n'est pas fournie.

---

## Lot 0 — Figer la cible et éviter le travail jetable

**But :** transformer les retours visuels et éditoriaux en un contrat unique avant que plusieurs écrans soient modifiés en parallèle.

**Gate de sortie :** artboards de référence approuvés, matrice de données approuvée et SHA du build client identifié ; si ce SHA est introuvable, indisponibilité documentée, build reproductible de substitution nommé et tous les constats concernés marqués « non confirmés ».

### Epic RC-A — Contrat produit, documentaire et visuel

#### Story RC-A0 — Établir la parité entre build inspecté et build testé

**Priorité / effort :** P0 / S

En tant qu'équipe, je veux connaître exactement la version montrée à la cliente afin de ne pas planifier une seconde fois un correctif déjà livré.

Critères d'acceptation :

- Le SHA exact du build vu par la cliente est retrouvé. S'il est techniquement introuvable, cette indisponibilité est consignée, chaque constat visuel reste marqué « non confirmé », et le plus proche build reproductible est nommé sans le faire passer pour l'original.
- Le mécanisme qui expose le SHA du build courant est vérifié sur le build reproductible ; RC-J5 consignera le SHA effectif du futur build de recette.
- Les écarts entre le build client, le build reproductible et `bc1b755` sont listés **avant** toute qualification définitive, estimation définitive, maquette ou conclusion « déjà corrigé ».
- Toutes les tailles de ce draft sont requalifiées à la sortie de RC-A0 à partir du delta réel ; les changements sont historisés au lieu d'être absorbés silencieusement.
- Un environnement de test local ou de preview avec données fictives est préparé sans connexion au Supabase de production.
- Les captures de référence actuelles remplacent clairement les captures historiques du 15 août.

Dépendances : aucune. **Première story obligatoire du Lot 0.**

#### Story RC-A1 — Réconcilier les documents qui font foi

**Priorité / effort :** P0 / L

En tant qu'équipe produit, je veux un contrat cohérent entre PRD, Architecture, UX et backlog afin qu'une revue future ne rétablisse pas les anciennes décisions.

Critères d'acceptation :

- Le PRD distingue explicitement le **calcul astrologique déterministe** de la **mise en mots éventuellement générée**.
- « Impersonnel » dans le rythme quotidien signifie « indépendant du journal et de la relation Anam », sans interdire une lecture fondée sur le thème natal.
- Le mantra reste conforme à FR-080 : court, gratuit, non interactif et séparé de l'ancrage.
- L'Architecture remplace toute sémantique fonctionnelle résiduelle de `fruit` par `rayonnement` et conserve l'interdiction d'objet-récompense.
- EXPERIENCE autorise un portail de lancement borné et décrit sa fréquence ; l'ancienne règle « aucun écran de démarrage animé » est amendée, pas laissée en contradiction.
- Le contrat de voix enregistre explicitement la phrase d'accueil imposée par Julian comme exception approuvée, son placement dans l'état sans tour utilisateur de la région Anam et sa coexistence avec l'ouverture dynamique ; elle ne peut pas être réécrite silencieusement pendant une revue éditoriale.
- Le contrat de transparence tranche séparément le marquage technique et la provenance visible de la prose astrologique, avec emplacement et copie exacts.
- DESIGN enregistre le **besoin d'exploration** « nuit douce + papier lumineux », sans figer de tokens avant RC-A3.
- Les décisions devenues obsolètes dans le plan du 2 septembre sont marquées comme supplantées, sans effacer leur historique.

Dépendances : RC-A0. Bloque toutes les stories qui changent une doctrine globale.

#### Story RC-A2 — Geler la matrice de personnalisation

**Priorité / effort :** P0 / M

En tant qu'utilisatrice, je veux savoir quelles parties de mon expérience utilisent mes données afin que la personnalisation reste compréhensible et consentie.

Critères d'acceptation :

- La matrice du §5 est reprise dans le contrat produit et l'architecture.
- Le verdict de RC-D0 décide si le signe solaire dérivé rejoint la signature ; aucun champ n'est ajouté « au cas où ».
- Un test de frontière peut prouver qu'aucun message, branche, fait libre, prénom ou identifiant ne nourrit le ciel du jour.
- La prose astrologique reçoit seulement des traits dérivés minimisés ; les entrées brutes de naissance restent dans le calcul interne.
- Les caches sont classés en deux familles : dérivés propres au profil, invalidables lors d'une correction, et contenus partagés indexés par le tuple canonique `{jour civil, condensat de signature, version éditoriale}`, jamais supprimés pour une seule personne.
- La personnalisation Ennéagramme possède une finalité, une base de consentement, un repli et des règles d'export/effacement avant son implémentation.
- La personnalisation du mantra est explicitement hors périmètre ; tout besoin similaire est nommé « ancrage » ou réflexion Anam et repasse par une décision produit.
- Le responsable Product, le responsable données/sécurité et le responsable Architecture signent la matrice et le flux de correction date/heure/lieu ; cette approbation est le livrable de gate consommé par RC-E4.

Dépendances : RC-A0, RC-A1, RC-D0.

#### Story RC-A3 — Explorer, valider puis documenter la cible visuelle

**Priorité / effort :** P0 / L

En tant que cliente, je veux voir la direction avant sa généralisation afin de valider l'atmosphère, la lisibilité et la cohérence.

Critères d'acceptation :

- Une cartographie annotée distingue sans ambiguïté **portail de lancement**, **seuil de première utilisation**, **région Aujourd'hui**, **haltes Astrologie/Numérologie/Psychologie**, **région Anam** et **région Mon évolution**.
- Huit vues de référence sont produites : portail, seuil, Aujourd'hui, Astrologie, Numérologie, Psychologie/Ennéagramme, Anam et Mon évolution. Les quatre vues les plus structurantes existent au minimum en 390×844 et 1440×900 ; les autres ont un wireframe responsive annoté.
- La vue Mon évolution montre l'état graine et un exemple développé ; la vue Numérologie montre ses six unités symboliques et leurs disclosures.
- Les variantes A « claire assumée » et B « hybride nocturne » du §6 sont présentées avec la même fidélité, afin que la préférence actuelle de l'équipe ne biaise pas la validation cliente.
- Une planche composants montre carte claire, bouton primaire/secondaire, accordéon, pictogramme, focus et états sombre/clair.
- Le contraste est mesuré, pas jugé à l'œil ; les pastels décoratifs qui échouent sur ivoire ne portent pas de texte.
- Les templates réellement retenus sont nommés et versionnés ; les autres sont déclarés inspiration secondaire.
- Après validation cliente, DESIGN et EXPERIENCE encodent les tokens, compositions et règles approuvés ; aucune documentation visuelle n'est figée avant ce verdict.
- La cliente valide la composition avant la déclinaison des Lots 1 à 5.

Dépendances : RC-A0, RC-A1. Bloque directement RC-B3, RC-C2 et RC-H2, puis par transitivité l'ensemble des refontes de pages qui consomment cette fondation.

---

## Lot 1 — Première impression et accueil

**But :** corriger le début du parcours et livrer rapidement les mots approuvés par la cliente.

**Gate de sortie :** aucun portail lors d'une navigation interne, copies exactes, portail lisible sur écran court, accueil cohérent avec la cible visuelle.

### Epic RC-B — Portail de réception

#### Story RC-B1 — Ne montrer le portail qu'au lancement à froid

**Priorité / effort :** P0 / M

En tant qu'utilisatrice qui navigue dans Anam, je veux que le portail marque l'entrée dans l'application sans interrompre mes déplacements internes.

Critères d'acceptation :

- Sur un chargement neuf du document racine ou dans un nouvel onglet, le portail apparaît exactement une fois puis disparaît dans sa durée bornée.
- Les passages Aujourd'hui → Anam → Mon évolution → Aujourd'hui ne le remontent jamais.
- Un aller-retour vers une halte Astrologie, Numérologie, Psychologie, Réglages ou autre route interne ne le remonte jamais.
- Un rechargement navigateur complet crée un nouveau document et rejoue le portail exactement une fois ; un `router.refresh`, un retour historique ou une navigation cliente ne le rejoue pas.
- Une duplication d'onglet ou une ouverture directe de `/` crée un nouveau document éligible et le montre une fois ; une restauration BFCache du même document ne le rejoue pas.
- Un lien profond vers une halte ne montre pas le portail avant son contenu. Dans ce même document, une navigation ultérieure vers `/` n'affiche pas rétroactivement le portail : seul un nouveau document ouvert à froid directement sur `/` est éligible.
- `/aide` et les ressources de sécurité ne sont jamais recouverts par le portail.
- Les squelettes nécessaires aux vraies navigations restent présents : seul le portail de marque est concerné.

Dépendances : RC-A0, RC-A1.

#### Story RC-B2 — Recomposer l'arbre comme image dominante

**Priorité / effort :** P1 / M

En tant que nouvelle arrivante, je veux être accueillie par un arbre ample et vivant afin d'entrer immédiatement dans l'imaginaire d'Anam.

Critères d'acceptation :

- La couronne est plus grande que l'éventail des racines sur l'artboard versionné ; sa boîte visible et celle des racines restent dans une tolérance de quatre pixels lors de la comparaison aux tailles cibles.
- L'arbre utilise la boîte d'encombrement approuvée sans recouvrir le mot du portail ni le lotus et sans être rogné.
- Les racines restent dans le tiers inférieur ; l'arrondi, la matière et la luminosité correspondent à l'asset/artboard approuvé plutôt qu'à une appréciation non mesurable en recette.
- Les compositions 390×664, 390×844, 768×1024, 1440×900 et paysage sont validées séparément.
- Sur écran court, le layout se recompose plutôt que de seulement réduire l'arbre en portrait.
- Sous réduction de mouvement, l'arbre final reste visible et le portail part sans animation prolongée.

Dépendances : RC-A3, RC-B3.

#### Story RC-B3 — Corriger la copie et le lotus du portail

**Priorité / effort :** P0 / S

En tant qu'utilisatrice, je veux un accueil immédiat et non technique afin de ne pas attendre devant un faux indicateur de chargement.

Critères d'acceptation :

- Le seul mot principal est **« Bienvenue »**, avec la casse validée par le système typographique.
- RC-A0 identifie l'élément temporel vu par la cliente ; si le build correspond à HEAD, « Le temps que tout se pose. » n'est plus affiché.
- Aucun chronomètre, pourcentage, barre ou promesse temporelle n'apparaît.
- À HEAD, le lotus est un SVG unique sans « feuille » autonome : l'artboard décide explicitement si le lotus complet est agrandi ou si une feuille devient un nouvel asset ; les deux éléments demandés restent ensuite entièrement visibles.
- Le lecteur d'écran entend une annonce brève de l'ouverture sans entendre le décor ni une minuterie.

Dépendances : RC-A0, RC-A3. RC-B2 consomme ensuite cette composition.

### Epic RC-C — Aujourd'hui et Mes univers

#### Story RC-C1 — Appliquer le dictionnaire de libellés exact

**Priorité / effort :** P0 / XS

En tant qu'utilisatrice, je veux que l'accueil s'adresse à moi avec les mots validés pendant la revue.

Critères d'acceptation :

- « Ce que le jour propose » devient exactement **« Mon parcours du jour »**.
- « Le mantra du jour » devient exactement **« Mon mantra du jour »**.
- « Ce qui te compose » devient exactement **« Mon monde intérieur »**.
- « Tes univers » devient exactement **« Mes univers »**.
- La phrase « Ils ne changent pas tous les jours. Ils restent ici, à leur place. » est retirée sans laisser d'espace vide artificiel.
- Aucun « La mantra », « Ma mantra », « astrology » ou ancien libellé n'est rendu, annoncé ou utilisé comme attente positive de parcours ; ces chaînes restent autorisées dans les assertions négatives et l'historique documentaire qui prouvent leur absence.

Dépendances : RC-A1.

#### Story RC-C2 — Fonder le langage papier lumineux et ses composants

**Priorité / effort :** P1 / M

En tant qu'équipe produit, nous voulons une fondation claire et douce afin que chaque page applique la même décision visuelle sans dupliquer ses styles.

Critères d'acceptation :

- Les tokens approuvés de surface, texte, bordure, rayon, ombre, espace, focus et mouvement sont centralisés, nommés sémantiquement et couverts dans les modes retenus par RC-A3.
- Carte claire, bouton primaire/secondaire, accordéon/disclosure, conteneur d'illustration et états de contenu forment des composants de référence sans valeur locale improvisée.
- Les textes courants et actions atteignent WCAG AA dans le mode nocturne natif et le réglage existant de contraste renforcé/imagerie atténuée ; si RC-A3 retient un vrai mode clair, celui-ci rejoint également le contrat.
- L'ivoire/blanc cassé cohabite avec le ciel nocturne sans créer un collage de deux produits, et la variante claire possède un fond propre si elle est retenue.
- Les états focus, hover, active, pending, panne, vide et indisponible sont documentés et démontrés sur la planche composants.
- Cette story livre la fondation seulement : l'application et l'acceptation par surface appartiennent à RC-E, RC-F, RC-G et RC-I.

Dépendances : RC-A3.

#### Story RC-C3 — Créer une famille de pictogrammes des trois univers

**Priorité / effort :** P1 / M

En tant qu'utilisatrice, je veux distinguer instantanément Astrologie, Numérologie et Psychologie dans une même famille visuelle.

Critères d'acceptation :

- Les trois pictogrammes ont la même boîte optique, le même poids de trait, la même complexité et une palette pastel cohérente.
- Chaque pictogramme reste reconnaissable à 24 px, 32 px et en monochrome.
- Le nom textuel de l'univers reste présent ; l'icône seule ne porte jamais le sens.
- Le moyen de conception reste libre, mais toute génération se déroule hors runtime, sans donnée utilisatrice et sans clé côté navigateur.
- Les fichiers finaux sont optimisés, versionnés et accompagnés d'une licence/provenance interne.
- Aucun fruit, score, étoile de notation ou symbole de récompense n'est introduit.

Dépendances : RC-C2.

#### Story RC-C4 — Appliquer la cible à Aujourd'hui et Mes univers

**Priorité / effort :** P1 / M

En tant qu'utilisatrice, je veux un accueil plus clair et plus doux afin de distinguer immédiatement mon quotidien de mes univers durables.

Critères d'acceptation :

- Ciel du jour, mantra et portes des trois univers appliquent les composants et tokens de RC-C2, sans variante locale ni ancien style sombre résiduel non approuvé.
- La hiérarchie « Mon parcours du jour » → ciel → mantra → « Mon monde intérieur » → « Mes univers » reste lisible sur mobile et desktop sans badge, score ni saturation agressive.
- Les pictogrammes livrés par RC-C3 sont alignés dans leur boîte optique, accompagnés de leur nom et ne déplacent pas les actions lors du chargement.
- Le retrait de la phrase sous « Mes univers » entraîne une recomposition volontaire des espacements ; aucun trou ou ligne fantôme ne subsiste.
- Les états vide, pending, repli, erreur, focus, hover et active utilisent les composants communs et conservent toutes les actions.
- Les modes sélectionnés en RC-A3 et les viewports de RC-J2 sont acceptés sans rognage, chevauchement ni perte de contraste.

Dépendances : RC-C1, RC-C2, RC-C3.

---

## Lot 2 — Ciel du jour et Astrologie

**But :** rendre l'astrologie plus précise et plus humaine tout en gardant le calcul fiable, la minimisation des données et l'absence de prédiction.

**Gate de sortie :** le texte cite des faits calculés vérifiables, les données de conversation sont structurellement exclues, le thème natal est compréhensible sans devenir éditable à la main.

### Epic RC-D — Un ciel du jour précis et sûr

#### Story RC-D0 — Mesurer la qualité du ciel du jour avant de changer son contrat

**Priorité / effort :** P0 / M

En tant qu'équipe produit, nous voulons une baseline reproductible du comportement actuel afin de ne corriger que les écarts démontrés et de décider la signature de données sur preuve.

Critères d'acceptation :

- Le comportement de `bc1b755` est exécuté sans modification de contrat sur un socle déterministe de vingt-quatre fixtures couvrant les douze signes, chacun avec et sans heure.
- Quatre fixtures supplémentaires couvrent au minimum deux jours sans configuration dominante et deux changements de signe, soit vingt-huit cas ou plus ; des paires contrôlées incluent même date avec heures/lieux donnant des thèmes distincts et même thème sur deux jours distincts.
- Pour chaque cas, le rapport conserve le tuple canonique `{jour civil, signature dérivée actuelle, version éditoriale}`, les faits calculés attendus, la nature prose acceptée ou repli corpus et les notes de grille, sans donnée de naissance brute ni identifiant.
- La grille notée sur deux mesure ancrage factuel, spécificité et naturel. Elle distingue les proses générées acceptées des replis corpus, dont la répétition éventuelle n'est pas qualifiée comme défaut de personnalisation.
- Le rapport chiffre les textes génériques, traits absents inventés, prédictions, erreurs de tutoiement et incompatibilités entre texte et signature ; il ne transforme pas une préférence stylistique isolée en défaut.
- Le rapport conclut explicitement si la signature actuelle suffit. L'ajout du signe solaire sous forme d'énumération n'est recommandé que si un échec mesuré ne peut pas être corrigé avec les traits déjà disponibles.
- Aucun code, schéma, prompt de production ni frontière de données n'est modifié dans cette story ; le verdict devient une entrée signée de RC-A2.

Dépendances : RC-A0, RC-A1.

#### Story RC-D1 — Définir et éprouver la qualité éditoriale de l'horoscope

**Priorité / effort :** P0 / M

En tant qu'utilisatrice, je veux reconnaître mon ciel dans le texte du jour afin qu'il ne ressemble pas à une phrase générique applicable à tout le monde.

Critères d'acceptation :

- La story consomme le rapport RC-D0 ; un axe déjà au seuil reste « validé » et n'ouvre aucun correctif cosmétique.
- Le texte tutoie, reste au présent et tient en deux ou trois phrases.
- Si et seulement si RC-D0 l'a justifié et RC-A2 l'a autorisé, la signature minimisée gagne le **signe solaire dérivé sous forme d'énumération** ; elle ne gagne ni date, ni heure, ni lieu, ni longitude natale brute.
- Il s'appuie sur au moins un fait réellement calculé et fiable pour ce jour : signe solaire dérivé, relation de la Lune au Soleil natal, transit vers Soleil/Lune/Ascendant ou changement de signe pertinent.
- Il ne prétend pas utiliser le lieu ou l'heure lorsque leur seule contribution est déjà contenue dans le thème calculé ; il ne récite pas de donnée personnelle brute.
- Il ne contient ni prédiction, ni date future, ni injonction, ni promesse d'état psychologique.
- Les vingt-huit fixtures ou plus de RC-D0 sont rejouées sans en modifier les attentes après observation du résultat.
- Pour les proses générées acceptées, une divergence factuelle n'est permise que lorsque le tuple canonique `{jour civil, signature autorisée, version éditoriale}` diverge ; les replis corpus sont contrôlés séparément pour sûreté et disponibilité et peuvent légitimement être identiques.
- Cent pour cent des proses générées acceptées du panel citent au moins un trait présent dans leur signature et zéro trait absent ; l'échange de deux textes entre fixtures astrologiquement incompatibles doit être rejeté par la grille factuelle.
- Une grille éditoriale notée sur deux évalue ancrage factuel, spécificité et naturel ; chaque texte obtient au moins un sur chaque axe et le panel une moyenne d'au moins 1,5 sur deux.

Dépendances : RC-D0, RC-A2.

#### Story RC-D2 — Garantir la stabilité, le repli et la provenance du texte

**Priorité / effort :** P0 / L

En tant qu'utilisatrice, je veux retrouver un texte stable et honnête pendant la journée même si le service de rédaction varie ou tombe en panne.

Critères d'acceptation :

- Un cache durable partagé utilise exactement le tuple canonique `{jour civil décidé par le domaine, condensat de la signature minimisée, version de contrat éditorial couvrant consigne/modèle/corpus}` ; il ne contient aucun identifiant d'utilisatrice.
- Une insertion atomique « premier texte accepté faisant foi » garantit qu'à clé identique deux instances concurrentes servent le même texte.
- Le premier contenu effectivement servi pour la clé, texte accepté ou repli corpus, est figé pour le jour ; une génération tardive ne remplace pas silencieusement un repli déjà présenté.
- La durée de conservation est explicitement fixée à quarante-huit heures après la fin du jour concerné, puis le texte est supprimé ; elle couvre les relectures et retries sans créer d'archive personnelle.
- Une nouvelle version éditoriale s'applique au prochain jour civil ; l'invalidation d'urgence est documentée séparément et auditée.
- À jour civil, signature et version identiques, le texte accepté reste identique pendant toute la journée, y compris entre instances serveur.
- Une panne, un délai, une absence de consentement ou un texte refusé revient au corpus relu sans bloquer l'accueil.
- Le calcul du ciel ne dépend jamais de la disponibilité du modèle de rédaction.
- La copie « Le texte du jour, lui, est écrit par un modèle » disparaît de l'introduction.
- Le contrat sépare trois décisions : retrait de cette phrase précise, marquage technique de provenance, et emplacement/copie d'une information visible. Ce draft recommande une provenance courte au niveau du texte, à approuver en RC-A1.
- Si une prose générée est affichée, la provenance visible approuvée l'accompagne ; si seul le corpus est affiché, aucune mention mensongère de génération n'apparaît.
- La métrique d'exploitation ne journalise aucun texte, aucune date de naissance et aucun identifiant lisible.

Dépendances : RC-A2, RC-D1.

#### Story RC-D3 — Cadrer le besoin de personnalisation derrière « mantra »

**Priorité / effort :** P2 / M — discovery produit, sans implémentation dans le correctif cœur

En tant qu'équipe produit, je veux traiter explicitement la demande d'un texte nourri par les confidences afin de ne ni l'oublier, ni dénaturer silencieusement le mantra quotidien.

Critères d'acceptation :

- Trois options sont comparées : mantra quotidien inchangé, nouvel ancrage personnel, ou courte réflexion d'Anam dans la conversation.
- Chaque option précise valeur, fréquence, interactivité, caractère gratuit/premium, données nécessaires, consentement, exclusions de détresse, coût, repli et règles d'effacement.
- Le nom « mantra » n'est pas utilisé pour un exercice interactif ou un contenu dérivé du journal tant que FR-080 n'est pas explicitement amendée.
- Une décision produit signée retient une option ou clôt la demande ; aucune donnée de journal n'est branchée pendant cette story.
- Si une nouvelle capacité est retenue, elle reçoit son propre epic d'implémentation et sa propre revue sécurité, hors du correctif cœur.

Dépendances : RC-A1, RC-A2. Ne bloque aucun Lot 1 à 6.

### Epic RC-E — Une page Astrologie claire et évocatrice

#### Story RC-E1 — Nettoyer la hiérarchie de la page

**Priorité / effort :** P1 / S

En tant qu'utilisatrice, je veux comprendre immédiatement ce que je regarde sans traverser des surtitres techniques.

Critères d'acceptation :

- Le H1 **« Astrologie »** est centré selon le contrat responsive.
- RC-A0 fournit la liste de tous les surtitres, introductions et légendes visibles sur le build client ; chacun reçoit un verdict explicite « conserver / supprimer / remplacer » dans le handoff, afin que « sous-titres inutiles » ne soit pas réduit à un seul cas.
- « Projection de naissance » est retiré.
- Le H2 **« Ton ciel de naissance »** est conservé.
- Une seule phrase courte explique que le ciel est calculé depuis la date, le lieu et l'heure lorsqu'elle est connue.
- Le ciel du jour précède le détail natal ; les positions et la méthode restent secondaires et accessibles.
- L'ordre des titres est valide pour lecteur d'écran et ne saute aucun niveau.

Dépendances : RC-A1, RC-C2. La préparation éditoriale peut avancer avant RC-C2, mais pas l'acceptation de la page.

#### Story RC-E2 — Afficher Soleil, Ascendant et Lune comme repères

**Priorité / effort :** P1 / M

En tant qu'utilisatrice, je veux retrouver mes trois repères principaux sans devoir lire toutes les positions.

Critères d'acceptation :

- Un bloc en bas de la lecture principale affiche « Soleil », « Ascendant » et « Lune » avec leur signe lorsqu'il est calculable ; sinon, il affiche un état d'indisponibilité explicite plutôt qu'une valeur inventée.
- Un ascendant indisponible est expliqué sans tiret vide, erreur ni profil « incomplet ».
- La Lune n'est signalée comme incertaine **que si le moteur retourne réellement une ambiguïté** ; si le signe n'est pas exposable, le bloc dit « indéterminée sans heure » sans lui attribuer de signe, tandis qu'une Lune encore déterminable est affichée sans avertissement générique.
- Les valeurs dérivées n'offrent aucun champ de saisie directe.

Dépendances : RC-A1, RC-C2.

#### Story RC-E3 — Reconcevoir la carte du ciel

**Priorité / effort :** P1 / L

En tant qu'utilisatrice, je veux une carte du ciel à la fois exacte et sensible afin d'en comprendre les repères sans voir un compas purement technique.

Critères d'acceptation :

- Le handoff approuvé met en scène étoiles, Lune et planètes sans modifier les positions calculées.
- Les corps, signes, maisons, angles et relations indispensables restent distinguables sans reposer sur la couleur seule.
- Le diagramme reste utilisable à 320 px de large, à 200 % de zoom et en mode paysage.
- Un équivalent textuel complet permet d'accéder aux mêmes faits au clavier et au lecteur d'écran.
- Les animations sont décoratives, lentes, bornées et neutralisées sous réduction de mouvement.
- La carte ne suggère aucune prédiction, score ou intensité psychologique.

Dépendances : RC-A3, RC-C2. Peut avancer en parallèle de RC-E2.

#### Story RC-E4 — Corriger les données de naissance sans éditer les signes

**Priorité / effort :** P1 / L

En tant qu'utilisatrice, je veux corriger une donnée de naissance erronée afin que mes calculs soient justes sans pouvoir fabriquer directement un signe ou un ascendant.

Critères d'acceptation :

- Une action unique **« Gérer mes données de naissance »** depuis RC-E2 ouvre ce flux, et le retour ramène à la page Astrologie avec les valeurs recalculées sans dupliquer le thème.
- La correction directe de l'heure déjà permise reste disponible ; la date et le lieu passent par un flux serveur protégé distinct, jamais par une écriture cliente libre.
- Avant toute modification de date, l'éligibilité d'âge et la politique applicable aux personnes mineures sont réévaluées ; une correction interdite échoue sans écriture partielle.
- Le lieu est revalidé et résolu selon la même convention que lors de l'entrée initiale ; aucune coordonnée arbitraire n'est acceptée depuis le navigateur.
- Avant confirmation, l'interface annonce quels dérivés seront recalculés et les conséquences prévues par la matrice signée de RC-A2.
- Après succès, les dérivés propres au profil sont invalidés et recalculés atomiquement. Le cache de texte partagé de RC-D2 n'est pas supprimé pour cette personne : la nouvelle signature produit un nouveau tuple, l'ancien devient inaccessible depuis son profil et expire selon son TTL sans affecter d'autres personnes.
- La politique de régénération d'un éventuel tronc dérivé est explicitement décidée dans RC-A2, pas supposée pendant l'implémentation.
- Le journal, les messages et les branches non dérivées des données de naissance ne sont ni modifiés ni effacés par ce flux.
- Un journal d'audit minimal conserve l'événement, le statut et la version du contrat sans enregistrer les anciennes ou nouvelles valeurs de naissance en clair.
- Une erreur laisse l'ancien profil et tous ses dérivés cohérents ; aucun mélange avant/après n'est visible.
- Soleil, Ascendant et Lune restent des résultats en lecture seule. La recette prouve qu'aucune requête ne permet de les substituer directement.

Dépendances : RC-A2, RC-C2, RC-D2, RC-E2. La signature Product + données/sécurité + Architecture de RC-A2 constitue l'autorisation formelle ; aucune gate externe implicite ne subsiste.

---

## Lot 3 — Numérologie, Psychologie et Ennéagramme

**But :** rendre les univers lisibles et interprétables sans perdre la méthode ni mélanger corpus général et personnalisation.

**Gate de sortie :** aucune redondance dans la vue normale et chaque type possède une définition éditoriale. RC-G3 n'entre dans cette gate que si une décision séparée l'autorise ; son bloc reste alors optionnel, consentant et sourcé.

### Epic RC-F — Numérologie symbolique et vérifiable

#### Story RC-F1 — Unifier chaque nombre et son sens

**Priorité / effort :** P1 / M

En tant qu'utilisatrice, je veux lire chaque nombre avec sa signification afin de ne pas devoir faire le lien entre une grille et un texte éloigné.

Critères d'acceptation :

- Le H1 **« Numérologie »** est centré et le surtitre technique « Calcul déterministe » disparaît.
- RC-A0 identifie par capture le bloc inférieur vu par la cliente et distingue la grille de valeurs, la lecture symbolique et la méthode ; aucune suppression n'est décidée d'après un nom ambigu.
- Chacun des six nombres apparaît dans une unité de lecture dont l'en-tête est l'emplacement canonique **unique** de l'intitulé et de la valeur, par exemple « Chemin de vie · 7 » ; le corps explique le sens sans répéter cet intitulé ni cette valeur.
- Le calcul actuel et ses conventions ne changent pas.
- Dans la vue normale, une paire comme « Chemin de vie · 7 » n'est présentée qu'une fois ; la méthode repliée peut rappeler le résultat uniquement au terme de sa formule lorsque l'utilisatrice l'ouvre.
- Le ton factuel et personnalisé du corpus actuel est conservé.
- Un texte absent est signalé honnêtement sans carte vide ou contenu inventé.

Dépendances : RC-A1, RC-C2.

#### Story RC-F2 — Garder une méthode accessible sans récapitulatif doublon

**Priorité / effort :** P1 / S

En tant qu'utilisatrice qui souhaite vérifier, je veux ouvrir la méthode sans que la page ressemble à un relevé de calcul.

Critères d'acceptation :

- Une seule section repliable « La méthode de calcul » regroupe données utilisées, convention et formule.
- Chaque unité de nombre possède son propre disclosure accessible : le résumé expose intitulé, valeur et mot symbolique ; l'ouverture révèle l'explication longue. Ce disclosure est distinct de celui de la méthode.
- La grille récapitulative inférieure est retirée si les six valeurs sont déjà portées par les unités de lecture.
- Une formule ouverte peut aboutir à la valeur pour prouver le calcul, mais ne recrée pas une seconde carte de résultat.
- L'accordéon est utilisable au clavier, expose son état et conserve un ordre de lecture logique.
- Aucun nouveau dialogue modal n'est ajouté pour un contenu qui tient dans la page.

Dépendances : RC-C2, RC-F1.

### Epic RC-G — Psychologie douce et Ennéagramme intelligible

#### Story RC-G1 — Alléger le hub Psychologie et ses actions

**Priorité / effort :** P1 / S

En tant qu'utilisatrice, je veux choisir un outil sans préambule ni bouton agressif.

Critères d'acceptation :

- Le texte commençant par « Des outils différents, séparés clairement… » est retiré du haut de page.
- Ennéagramme, Big Five et Human Design restent distingués par leur nom, leur état et une phrase utile si nécessaire.
- Les boutons adoptent les tokens validés dans RC-A3 ; aucune correction violette isolée n'est codée localement.
- Libellé, contraste, cible tactile, focus et état pending restent lisibles dans le mode nocturne natif, le réglage de contraste renforcé/imagerie atténuée et, seulement si RC-A3 la retient, la variante claire.
- Retirer l'introduction ne retire pas les limites méthodologiques nécessaires au résultat lui-même.

Dépendances : RC-C2.

#### Story RC-G2 — Écrire les neuf noms et définitions de types

**Priorité / effort :** P1 / M

En tant qu'utilisatrice, je veux comprendre le type retenu sans connaître les numéros de l'Ennéagramme.

Critères d'acceptation :

- Un lexique de neuf intitulés courts est rédigé et validé par la responsable éditoriale ; aucun nom provisoire inventé par l'interface n'est livré.
- Chaque type possède une définition générale de longueur comparable, issue du corpus d'Anima et distincte de tout commentaire personnel.
- Le résultat affiche le nom en titre et le numéro comme repère secondaire, par exemple « [Nom] · Type 1 », et non « Type 1 » seul.
- La définition décrit tendances, forces et points de vigilance sans diagnostic, déterminisme ou hiérarchie.
- Les contenus accessibles avant le test expliquent la méthode sans dévoiler ou orienter le résultat.
- La provenance du corpus est explicite et aucun texte n'est faussement attribué à Anima.

Dépendances : RC-A1, RC-C2. La rédaction peut avancer après RC-A1 ; l'affichage final requiert la fondation visuelle et la validation éditoriale.

#### Story RC-G3 — Ajouter une réflexion personnalisée d'Anam, séparée et consentie

**Priorité / effort :** P2 / L — extension sensible, hors chemin critique du correctif cœur

En tant qu'utilisatrice consentante, je veux relier le résultat à ce que j'ai confié à Anam sans qu'une hypothèse devienne une étiquette définitive.

Critères d'acceptation :

- Le bloc porte un titre de nature explicite, distinct de la définition générale, et indique qu'il s'agit d'une hypothèse d'Anam.
- Seuls les faits consentis et nécessaires peuvent alimenter la réflexion ; les verbatims bruts et épisodes de détresse en sont exclus.
- La personne peut voir la provenance utile, corriger/supprimer les faits sources et obtenir l'effacement du dérivé.
- Le bloc n'existe pas sans consentement valide, sans type retenu ou sans matière suffisante ; la définition générale reste complète.
- La prose ne diagnostique pas, ne prédit pas, ne cite pas Anima sans extrait de corpus et ne reprend pas de confidence mot pour mot.
- Les coûts, délais, quotas et replis sont spécifiés ; une panne de personnalisation ne bloque jamais le résultat.

Dépendances : RC-A2, RC-G2 et **seconde décision** Product + données/sécurité + Architecture dédiée à cette extension. L'approbation du présent programme correctif ne l'autorise pas ; elle ne bloque aucune story du Lot 6.

---

## Lot 4 — La région Anam

**But :** rendre la conversation immédiatement accueillante, visuellement singulière et prête à écrire, tout en protégeant le journal existant.

**Gate de sortie :** phrase exacte au bon endroit, fond validé sans perte de lisibilité, focus progressif testé, aucune perte ou contamination de mémoire.

### Epic RC-H — Un journal intime interactif prêt à recevoir

#### Story RC-H1 — Poser la phrase d'accueil exacte sans créer un faux message

**Priorité / effort :** P0 / S

En tant que personne qui découvre Anam, je veux comprendre immédiatement ce que je peux y confier.

Critères d'acceptation :

- La copie affichée est exactement : **« Confie ici ce que tu portes en toi. Un espace pour te comprendre, évoluer, te dépasser et révéler la personne que tu es appelée à devenir. »**
- Elle n'est pas enregistrée comme un tour d'Anam, ne reçoit ni horodatage ni statut de message et ne pollue pas le journal.
- Elle remplace toute autre tagline statique de découverte et suit la table d'états ci-dessous ; le prédicat « aucun tour de l'utilisatrice » remplace la notion non testable de « premier accès ».

  | État du journal | Ouverture dynamique due | Rendu attendu |
  |---|---|---|
  | Aucun tour utilisateur | Oui | Introduction statique exacte, puis une seule question dynamique comme premier échange. |
  | Aucun tour utilisateur | Non | Introduction statique exacte, puis composeur ; aucun faux message n'est créé. |
  | Au moins un tour utilisateur | Oui | Pas d'introduction statique ; ouverture dynamique puis fil existant selon l'ordre contractuel. |
  | Au moins un tour utilisateur | Non | Pas d'introduction statique ; fil et composeur existants. |
  | Retour dans le même document/session | Quelconque | Aucun rejeu de l'introduction ni duplication d'ouverture déjà servie. |

- La question dynamique, lorsqu'elle existe, ne paraphrase pas la phrase statique et reste le seul premier tour d'Anam.
- Le texte reste lisible à 200 % de zoom et n'est pas tronqué par le clavier mobile.

Dépendances : RC-A1. La phrase est une décision explicite de Julian et ne doit pas être réécrite pendant l'implémentation.

#### Story RC-H2 — Refaire le fond Anam avec étoiles et lotus de contour

**Priorité / effort :** P1 / M

En tant qu'utilisatrice, je veux un espace intime et vivant qui reste assez calme pour lire et écrire longtemps.

Critères d'acceptation :

- Dans la région Anam, les petits ronds deviennent des formes d'étoiles reconnaissables ; sur les viewports de référence, le rendu respecte l'artboard versionné avec au plus 0,5 % de pixels différents hors masques dynamiques explicitement versionnés.
- Un lotus en contour, de très faible contraste, structure le fond sans passer sous les lignes de texte non protégées.
- Le lotus précédemment retiré n'est réintroduit qu'après validation de l'artboard client.
- Le fond ne contient pas d'arbre concurrent, de notation en étoiles, de particules interactives ni de mouvement distrayant.
- Le voile de lecture maintient WCAG AA sur le fil, le composeur, la mention IA et la porte Aide.
- La couche d'étoiles globale et le rendu des autres régions restent inchangés ; Anam n'empile pas un second système de particules animé actif sur le premier.
- Sur l'appareil et le navigateur de référence enregistrés par RC-A0, une capture de soixante secondes ne perd pas plus de 5 % de FPS médian et n'augmente ni le temps cumulé de tâches longues ni le pic de tas JavaScript de plus de 10 % face à la baseline.
- Sous réduction de mouvement, la scène reste fixe et conserve la même information.

Dépendances : RC-A3.

#### Story RC-H3 — Focaliser le composeur sans voler le focus

**Priorité / effort :** P1 / M

En tant qu'utilisatrice qui choisit Anam, je veux pouvoir écrire tout de suite sans un tap supplémentaire lorsque mon appareil le permet.

Critères d'acceptation :

- Après clic ou tap explicite sur la destination Anam, le composeur disponible reçoit le focus dans le même geste ; les versions exactes testées des dernières versions stables d'iOS Safari/PWA et de Chrome Android sont consignées dans la preuve.
- Si l'OS refuse d'ouvrir le clavier, le focus observé, la cause/famille de plateforme et le repli sont tracés ; le champ reste entièrement visible, annoncé et atteignable par un seul tap supplémentaire.
- Après navigation clavier, lecteur d'écran, balayage, lien profond ou retour historique, le H1 de la région reçoit le focus d'annonce et aucun clavier logiciel n'est déclenché.
- Une navigation au pointeur qui arrive alors que le composeur est indisponible utilise également le H1 ; elle ne met jamais le focus sur un contrôle absent ou désactivé.
- Aucun autofocus ne se déclenche quand le composeur est bloqué, pendant un dialogue, pendant un chargement ou après chaque rendu.
- Le clavier ouvert ne masque ni le dernier tour ni le bouton d'envoi, en portrait comme en paysage.

Dépendances : RC-A0. Aucune dépendance visuelle ; validation appareil obligatoire sur l'environnement qualifié.

#### Story RC-H4 — Prouver la continuité et les frontières du journal

**Priorité / effort :** P0 / M

En tant qu'utilisatrice, je veux que la refonte de la région conserve mon fil et la continuité de la mémoire que j'ai consentie.

Critères d'acceptation :

- Le fil reste monté lors des changements de région et retrouve le même ordre, le même brouillon et le même point de lecture au retour.
- Les échanges persistés restent disponibles après rechargement selon les règles existantes.
- Un scénario positif prouve qu'un fait consenti, retenu lors d'une conversation, peut enrichir une conversation Anam ultérieure de la manière déjà prévue ; la refonte ne réduit pas Anam à un chat sans mémoire.
- Cette story ne requalifie pas les frontières ciel/mantra, les droits de données ou les futurs dérivés psychologiques : RC-A2 et RC-J5 en restent les preuves transversales, et RC-G3 possède sa propre recette si elle est un jour autorisée.

Dépendances : RC-A2, RC-H1, RC-H2, RC-H3.

---

## Lot 5 — Mon évolution

**But :** renommer la destination sans perdre la métaphore de l'arbre et expliquer une progression qualitative, ouverte et non gamifiée.

**Gate de sortie :** nouveau nom partout, explication toujours accessible, graine et étapes visuellement validées, aucune promesse d'arbre final.

### Epic RC-I — Comprendre son évolution à travers l'arbre

#### Story RC-I1 — Renommer la destination, pas la métaphore

**Priorité / effort :** P1 / M

En tant qu'utilisatrice, je veux ouvrir « Mon évolution » afin que le nom de la destination exprime son rôle plutôt que son seul objet visuel.

Critères d'acceptation :

- La navigation directe, le H1 de région, le guide, les retours depuis les haltes, les annonces accessibles et les parcours automatisés disent **« Mon évolution »**.
- L'identifiant interne, l'état de scène et les liens persistés restent stables ; aucun historique n'est cassé par un renommage technique inutile.
- Les explications continuent de nommer **« ton arbre »** lorsqu'elles parlent de la métaphore.
- « Mon arbre » ne subsiste comme nom de destination nulle part ; ses occurrences historiques dans des décisions archivées ne sont pas réécrites.
- La barre basse et le rail restent lisibles aux largeurs existantes malgré le libellé plus long.

Dépendances : RC-A1.

#### Story RC-I2 — Expliquer Mon évolution dans tous les états et valider la graine

**Priorité / effort :** P1 / L

En tant qu'utilisatrice, je veux retrouver le sens de mon évolution même après l'apparition de branches.

Critères d'acceptation :

- Les trois paragraphes existants restent présents dans l'état vide.
- Un accès permanent **« Comprendre mon évolution »** existe avec zéro, une ou plusieurs branches, en vue arbre comme en vue liste.
- La page ouverte présente au minimum : graine/tronc, naissance d'une branche, feuillaison et rayonnement.
- Chaque étape décrit son déclencheur réel : le rayonnement vient d'une déclaration de l'utilisatrice et n'est jamais inféré.
- Une illustration d'arbre développé est explicitement légendée comme exemple de langage visuel, jamais comme résultat garanti.
- L'ouverture ne masque pas l'arbre de manière irréversible et le retour restitue cadrage, zoom et sélection.
- Le texte explique le tronc, l'origine consentie des branches, la feuillaison et le rayonnement sans compteur ni injonction.
- La phrase commerciale éventuelle sur les branches reste conforme à la règle d'une seule sollicitation et n'envahit pas la page explicative.
- Aucun fruit, trophée, niveau, pourcentage, série, score, barre ou date d'achèvement n'apparaît.
- La graine existante est comparée au handoff ; sa silhouette, sa lumière, son échelle et sa respiration sont ajustées seulement après validation visuelle.
- L'état fixe sous réduction de mouvement porte la même information que l'état animé.

Dépendances : RC-A3, RC-C2, RC-I1.

---

## Lot 6 — Recette transversale et mise en production

**But :** vérifier le parcours dans l'ordre réel, sur le bon build, avec les données et contraintes de plateforme qui ont généré les ambiguïtés initiales.

**Gate de sortie :** toutes les stories P0/P1 acceptées, captures actuelles signées, zéro violation de données ou accessibilité bloquante.

### Epic RC-J — Qualité de bout en bout

#### Story RC-J1 — Verrouiller le dictionnaire éditorial

**Priorité / effort :** P0 / S

En tant qu'équipe, je veux une source unique des mots validés afin qu'une ancienne copie ne revienne pas sur une surface secondaire.

Critères d'acceptation :

- Un inventaire teste les chaînes exactes validées et l'absence des anciens libellés dans l'interface active.
- « Mon mantra du jour » est la seule variante grammaticale admise.
- « Ton ciel de naissance » n'est pas dupliqué avec « Projection de naissance ».
- « Mon évolution » est le nom de destination ; « ton arbre » reste le nom de la métaphore.
- La phrase d'accueil d'Anam est comparée caractère par caractère à la décision de Julian.
- Les copies de repli, annonces accessibles et états d'erreur sont inclus, pas seulement les H1 visibles.

Dépendances : RC-B3, RC-C1, RC-C4, RC-D2, RC-E1, RC-E2, RC-E4, RC-F1, RC-F2, RC-G1, RC-G2, RC-H1, RC-I1, RC-I2.

#### Story RC-J2 — Recette visuelle et responsive

**Priorité / effort :** P0 / L

En tant que cliente, je veux approuver le parcours sur les appareils réels afin que la refonte soit jugée sur le rendu livré et non sur une intention.

Critères d'acceptation :

- Captures obligatoires : 390×664, 390×844, 768×1024 et 1440×900, plus paysage mobile et clavier ouvert.
- Chaque écran affecté est vérifié dans les modes effectivement retenus en RC-A3 : le mode nocturne natif et le réglage existant de contraste renforcé/imagerie atténuée sont obligatoires ; un vrai mode clair ne rejoint la matrice que si la variante A est retenue et contractualisée.
- L'arbre du portail, le compas natal, le lotus de fond et la graine possèdent chacun une capture de référence approuvée.
- Les comparaisons visuelles tolèrent au plus 0,5 % de pixels différents hors masques dynamiques versionnés ; toute exception est annotée et approuvée, pas simplement ignorée.
- Le ciel du jour, ses états prose/repli/provenance, les trois repères astrologiques, les six unités numérologiques, les neuf types et les états vide/existant d'Anam et Mon évolution sont tous capturés au moins une fois.
- Les versions exactes des appareils et navigateurs, le SHA et le jeu de données fictif sont joints aux preuves.

Dépendances : RC-A0, RC-A3, RC-B2, RC-B3, RC-C2 à RC-C4, RC-D1, RC-D2, RC-E1 à RC-E4, RC-F1, RC-F2, RC-G1, RC-G2, RC-H1 à RC-H3 et RC-I1 à RC-I2.

#### Story RC-J3 — Recette d'accessibilité et des modalités d'entrée

**Priorité / effort :** P0 / M

En tant qu'utilisatrice, je veux parcourir chaque correction avec mon mode d'entrée et mes réglages afin qu'une amélioration visuelle ne retire ni information ni action.

Critères d'acceptation :

- Le zoom 200 % et la redistribution à 400 % ne tronquent aucun contenu, contrôle, dialogue ou texte de provenance sur chaque surface affectée.
- Un parcours clavier seul et un parcours avec lecteur d'écran vérifient ordre de lecture, titres, régions, libellés, états d'accordéon, erreurs et annonces asynchrones.
- Les ratios de texte, contrôles, focus et éléments graphiques porteurs de sens atteignent WCAG AA dans chaque mode retenu ; aucun pastel seul ne porte un état.
- Toutes les cibles tactiles, dont les pictogrammes, disclosures et l'accès « Comprendre mon évolution », respectent le contrat de taille et d'espacement.
- La politique de focus de RC-H3 est vérifiée séparément par pointeur/tap, clavier, lecteur d'écran, balayage, lien profond et retour historique sur les versions mobiles consignées.
- Clavier logiciel ouvert, le composeur, le dernier message, l'envoi et les erreurs restent visibles en portrait et paysage ; le repli en un tap est démontré lorsque l'OS refuse l'ouverture automatique.
- Le portail n'enferme pas le focus, n'annonce pas son décor et ne recouvre jamais `/aide` ou ses ressources de sécurité.
- Chaque anomalie possède une preuve reproductible distincte de la comparaison pixel de RC-J2.

Dépendances : RC-A0, RC-B1 à RC-B3, RC-C2 à RC-C4, RC-D2, RC-E1 à RC-E4, RC-F1, RC-F2, RC-G1, RC-G2, RC-H1 à RC-H3 et RC-I1 à RC-I2.

#### Story RC-J4 — Recette de performance et de mouvement

**Priorité / effort :** P0 / M

En tant qu'utilisatrice mobile, je veux conserver une scène fluide et calme afin que les nouveaux visuels n'alourdissent pas l'application ni ne m'imposent du mouvement.

Critères d'acceptation :

- RC-A0 fixe un téléphone, un OS, un navigateur, une durée de trace de soixante secondes et la baseline avant/après sur le même jeu de données fictif.
- Sur ce protocole, le FPS médian ne baisse pas de plus de 5 % et le temps cumulé de tâches longues comme le pic de tas JavaScript n'augmentent pas de plus de 10 % ; toute régression supérieure bloque ou reçoit une dérogation cliente documentée.
- Les mesures isolent au minimum portail, carte du ciel, région Anam et Mon évolution afin qu'une moyenne globale ne masque pas une scène fautive.
- Le portail ne reste pas monté après sa sortie et aucune ressource d'animation ne renaît lors d'une navigation interne.
- Sous réduction de mouvement, arbre, carte du ciel, étoiles/lotus et graine conservent le même sens dans un état fixe ; aucun délai artificiel n'empêche l'accès au contenu.
- Les animations actives restantes sont bornées ou composées sans boucle CPU permanente injustifiée ; les doubles couches de particules sont interdites.
- Le cache durable et les fallbacks du ciel du jour ne dégradent pas les budgets d'accueil ; latence et erreurs sont mesurées sans journaliser de contenu personnel.

Dépendances : RC-A0, RC-B1, RC-B2, RC-C2, RC-C4, RC-D2, RC-E3, RC-H2, RC-H3, RC-I2.

#### Story RC-J5 — Rejouer le parcours client et les frontières de données

**Priorité / effort :** P0 / L

En tant que Product Owner, je veux rejouer exactement la visite cliente afin de signer le lot sur des comportements observables.

Critères d'acceptation :

- Pour un compte neuf, le scénario suit explicitement : **portail → seuil → Aujourd'hui → ciel du jour → Astrologie → Numérologie → Psychologie/Ennéagramme → Anam → Mon évolution → retour Aujourd'hui**.
- Pour un compte revenu, le scénario suit **portail → Aujourd'hui** sans seuil ; un lien profond, un rechargement complet, un retour historique et une navigation cliente possèdent chacun leur cas distinct.
- Le cas lien profond confirme qu'une halte s'affiche sans portail et qu'une navigation ultérieure vers `/` dans le même document ne le déclenche pas ; un nouveau document ouvert à froid sur `/` reste un cas éligible distinct.
- Le portail n'apparaît qu'au lancement défini et jamais au milieu du scénario.
- Le parcours protégé complet est joué avec consentement valide, avec heure puis sans heure, journal vide puis journal existant.
- Le cas sans consentement ou après révocation est un **scénario négatif séparé** : il vérifie la redirection/barrière attendue et ne tente pas de traverser les surfaces protégées comme si elles étaient accessibles.
- Un test négatif prouve que le journal ne traverse jamais vers le ciel ou le mantra.
- Si RC-G3 est livrée ultérieurement, son lot possède un test négatif prouvant qu'une réflexion Ennéagramme n'utilise ni donnée supprimée ni épisode de détresse ; ce test ne bloque pas la recette du correctif cœur avant RC-G3.
- Les fallbacks réseau/modèle gardent l'accueil, le résultat et `/aide` utilisables.
- Le rapport final porte le SHA, l'environnement, les appareils, les captures et les écarts résiduels acceptés.

Dépendances : RC-J1 à RC-J4 et toutes les stories cœur des Lots 0 à 5 : RC-A0 à RC-A3, RC-B1 à RC-B3, RC-C1 à RC-C4, RC-D0 à RC-D2, RC-E1 à RC-E4, RC-F1 à RC-F2, RC-G1 à RC-G2, RC-H1 à RC-H4 et RC-I1 à RC-I2. RC-J5 ne dépend jamais de lui-même ; RC-D3 et RC-G3 sont des extensions P2 explicitement exclues de cette gate.

## 8. Ordonnancement recommandé

| Chaîne bloquante | Travail débloqué |
|---|---|
| RC-A0 → RC-A1 → RC-D0 → RC-A2 | Le build client et la baseline horoscope sont qualifiés avant la matrice de données définitive. |
| RC-A1 → RC-A3 | La doctrine factuelle est réconciliée avant les deux explorations visuelles. |
| RC-A1 → RC-B1/RC-C1/RC-E1/RC-F1/RC-G2/RC-H1/RC-I1 | Inventaires et copies peuvent être préparés sans attendre toute la conception visuelle. |
| RC-A2 → RC-D1 → RC-D2 | La correction éditoriale précède le contrat de stabilité et de cache qui la sert. |
| RC-A2 + RC-H1/RC-H2/RC-H3 → RC-H4 | La continuité de la mémoire se prouve sur la région refondue et sur la frontière approuvée. |
| RC-A2 → RC-D3/RC-G3 si elles reçoivent ensuite leur propre autorisation | Les extensions sensibles n'avancent pas avec la seule approbation du correctif cœur. |
| RC-A3 → RC-B3 → RC-B2 | La copie/structure du portail précède sa composition finale. |
| RC-A3 → RC-C2 → pages structurées ; RC-A3 → RC-H2 | Les surfaces partagées consomment la fondation commune, tandis que la conversation garde son traitement propre. |
| RC-E2 + RC-A2 + RC-D2 → RC-E4 | Le point d'entrée, les catégories de cache et le flux de correction restent séparés mais cohérents. |
| Stories éditoriales → RC-J1 ; visuelles → RC-J2 ; accessibilité/entrée → RC-J3 ; performance/mouvement → RC-J4 | Les quatre gates de preuve sont préparées au fil de l'implémentation. |
| Toutes les stories cœur des Lots 0 à 5 + RC-J1 à RC-J4 → RC-J5 | La recette chronologique signe le correctif sans attendre RC-D3 ou RC-G3. |

Ordre de livraison conseillé :

1. **RC-A0 d'abord**, puis RC-A1 ; RC-D0 précède RC-A2, tandis que RC-A3 et les préparations de copie RC-C1, RC-H1 et RC-I1 peuvent avancer en parallèle après RC-A1 ; aucun rendu visuel ni flux de données n'est figé avant son gate ;
2. **Lot 0** achevé avec matrice de données, décisions et huit vues annotées, puis Lot 1 pour le portail et l'accueil visuel ;
3. **Lots 2 et 3 en parallèle** après leurs gates de données/design ;
4. **Lots 4 et 5 en parallèle** une fois les composants visuels stables ;
5. **Lot 6** comme recette finale, sans attendre pour autant la fin pour écrire les tests de chaque story.

Ces chaînes expriment des **prérequis**, pas un chemin critique calendaire : aucune durée ni capacité d'équipe fiable ne permet d'en calculer un à ce stade.

## 9. Impact sur les artefacts existants

### 9.1 PRD

| Section | Avant | Proposition |
|---|---|---|
| FR-033 | « Le socle calculé peut se manifester quotidiennement. Impersonnel… » | Préciser que le quotidien est **indépendant du journal et des branches** ; le ciel peut rester personnalisé par le thème natal calculé. |
| FR-047 | « Le socle est calculé, jamais généré par un modèle de langage. » | « Les faits du socle sont calculés. Une mise en mots peut être générée à partir d'une signature dérivée minimisée, avec provenance, contrôle et repli corpus. » |
| FR-054/086 | Corpus d'Anima et séparation Anam/Anima | Ajouter la séparation visuelle entre définition générale éditoriale et réflexion personnalisée d'Anam. |
| FR-080 | Mantra distinct de l'ancrage | **Inchangé** ; ajouter que le mantra du jour ne consomme pas la mémoire conversationnelle. |
| FR-028/031 | Rayonnement, aucun fruit ni score | **Inchangé** ; étendre explicitement ces interdits à la page « Comprendre mon évolution ». |
| Nouveau besoin | Aucun contrat de portail | Ajouter sa portée, sa fréquence, sa durée bornée, son comportement reduced-motion et l'exemption `/aide`. |

### 9.2 Architecture

- Séparer formellement calcul du ciel, projection minimisée, rédaction, validation, cache durable et repli.
- Documenter qu'un texte du jour reste stable pendant son jour civil, y compris entre instances.
- Faire de l'absence de journal dans la signature astrologique une propriété structurelle testée.
- Documenter le flux protégé de correction date/heure/lieu, la réévaluation d'âge, la transaction de recalcul, l'invalidation des dérivés propres au profil et l'expiration séparée des contenus partagés.
- Spécifier la personnalisation Ennéagramme comme une nouvelle dérivation art. 9 : provenance, consentement, exclusion détresse, export, effacement et invalidation.
- Remplacer les références résiduelles à `fruit` par `rayonnement` dans les règles fonctionnelles et schémas documentaires.
- Définir le cycle de vie du portail au niveau document/session plutôt qu'au niveau de la route Aujourd'hui.
- Garder `/aide` statique, direct et exempt de tout portail de marque.

### 9.3 UX / DESIGN

- Supplanter la phrase « aucun écran de démarrage animé » par le contrat borné du portail.
- Ajouter un amendement daté pour « Bienvenue », les quatre libellés de l'accueil et « Mon évolution ».
- Après le choix signé de RC-A3 seulement, remplacer la doctrine actuelle par la variante A claire, la variante B hybride ou la combinaison exacte approuvée ; aucune préférence de ce draft n'est encodée comme verdict client et le mode contraste reste intact.
- Décrire les huit vues de référence, leurs déclinaisons responsive prioritaires et la famille des pictogrammes.
- Ajouter le focus contextuel du composeur comme amélioration progressive, jamais comme garantie universelle.
- Décrire la page « Comprendre mon évolution » et l'absence d'arbre final promis.

### 9.4 Epics, stories et plans antérieurs

- Ne pas renuméroter les epics historiques avant approbation de cette proposition.
- Importer les stories `RC-*` comme lot de correction transverse, ou les rattacher aux Epics 1, 5, 7 et 11 en conservant leurs identifiants `RC-*` dans la traçabilité.
- Marquer comme supplantée la décision D7 du plan du 2 septembre qui protégeait « Ce que le jour propose ».
- Marquer comme réouverte la décision qui avait retiré le lotus du fond Anam ; aucune réintroduction sans artboard approuvé.
- Clore comme déjà livrées les anciennes demandes sur la mise en tête de l'horoscope, les plis numérologiques et le nouvel arbre lunaire ; ne garder que leur delta actuel.
- Résoudre la dette éditoriale `ENN-1` par RC-G2 ; ne pas absorber silencieusement les autres dettes Ennéagramme sans lien.

### 9.5 Tests, documentation et exploitation

- Mettre à jour les tests unitaires, rendu, accessibilité et e2e qui figent les anciens noms.
- Ajouter une preuve de non-contamination entre journal et socle quotidien.
- Ajouter un rapport de captures actuel, identifié par SHA et appareil.
- Mettre à jour les guides de production d'assets et supprimer tout ancien prompt qui demanderait fruit, score ou ancienne palette.
- Ajouter une note d'exploitation sur le repli horoscope, sans journaliser de contenu personnel.

## 10. Éléments explicitement hors périmètre

- aucun changement du calcul astrologique ou numérologique sans défaut de calcul démontré ;
- aucune édition directe du signe solaire, de l'ascendant ou du signe lunaire ;
- aucune connexion runtime à Gemini, Claude Design ou Lia ;
- aucune clé tierce dans le navigateur ou dans un asset livré ;
- aucune personnalisation du mantra par le journal dans ce correctif ;
- aucune garantie mensongère d'ouverture du clavier mobile hors geste utilisateur ;
- aucune suppression de la transparence IA si une prose est réellement générée ;
- aucune suppression des squelettes de navigation nécessaires ;
- aucun fruit, arbre final garanti, score, jauge, série, niveau, compteur ou récompense ;
- aucune modification de `/aide`, de ses ressources ou de leur accessibilité permanente ;
- aucun accès production ni migration de données dans la phase de planification.

## 11. Risques et parades

| Risque | Niveau | Parade |
|---|---:|---|
| Refaire des écrans déjà corrigés sur un build plus récent que celui vu par la cliente | Haut | RC-A0 avant estimation et captures SHA-datées. |
| Refonte pastel qui casse le contraste ou l'identité nocturne | Haut | Artboards + tokens + mesures AA avant déclinaison. |
| Fuite du journal dans le quotidien ou la psychologie | Critique | Whitelist structurelle, consentement, tests négatifs, exclusion détresse. |
| Masquer la génération IA en retirant toute mention | Haut | Provenance courte au bon niveau et documentation alignée. |
| Portail rejoué à chaque retour vers `/` | Moyen | Cycle de vie testé par navigation complète, pas seulement par lecture du composant. |
| Arbre agrandi qui chasse texte/lotus sur écran court | Moyen | Compositions 390×664 et paysage obligatoires. |
| Clavier qui vole le focus aux lecteurs d'écran | Haut | Déclenchement uniquement après geste compatible + stratégie de focus différenciée. |
| Correction date/lieu qui contourne la garde d'âge ou mélange deux thèmes | Critique | RC-E4 : flux serveur protégé, réévaluation d'éligibilité, transaction et invalidation atomiques. |
| Type Ennéagramme présenté comme identité ou diagnostic | Haut | Trois couches, langage d'hypothèse, corpus validé, possibilité d'effacer/refaire. |
| Page évolution vécue comme une jauge déguisée | Haut | États qualitatifs, aucun endpoint final, interdits FR-031 testés. |
| Réintroduction du lotus déjà rejeté | Moyen | Variante visuelle approuvée avant implémentation et comparaison A/B. |
| Documentation à nouveau en conflit avec le code | Haut | RC-A1 livré avant les stories concernées et gardes documentaires. |

## 12. Définition de terminé du programme

Le programme est terminé seulement si :

- le parcours client complet du §2 est rejoué sur le build destiné à la recette ;
- chaque story P0 et P1 respecte ses critères et possède une preuve automatisée ou visuelle appropriée ;
- aucun ancien libellé actif ne subsiste ;
- le portail ne se rejoue pas en navigation interne ;
- les calculs existants gardent leurs résultats et leurs états d'incertitude ;
- journal, ciel du jour et mantra respectent la matrice de données ;
- RC-G3 n'est pas requise pour terminer le correctif cœur ; si elle est autorisée dans une décision ultérieure, elle possède sa propre gate prouvant qu'elle reste facultative, consentie et effaçable ;
- la phrase d'accueil d'Anam est exacte et n'est pas persistée comme un message ;
- toutes les vues affectées passent la matrice responsive, clavier, lecteur d'écran, contraste et réduction de mouvement ;
- PRD, Architecture, UX, DESIGN, epics et tests racontent la même version du produit ;
- la cliente approuve les captures finales identifiées par SHA ;
- aucun écart critique ou haut non accepté ne reste ouvert.

## 13. Handoff

| Rôle | Responsabilité |
|---|---|
| Product Owner | Approuver ce plan, la fréquence du portail normalisée et l'ordre P0/P1 ; maintenir les décisions supplantées. |
| Product / Architecture | Livrer RC-A1/A2, fermer les frontières de données et la stabilité du ciel du jour. |
| Données / Sécurité | Cosigner la gate RC-A2 et instruire séparément toute éventuelle autorisation de RC-G3. |
| UX / Design | Livrer RC-A3, les artboards, tokens, composants, pictogrammes, compas, fond Anam et graine. |
| Éditorial Anima | Valider les neuf noms/définitions Ennéagramme et le rubric de qualité astrologique. |
| Développement | Implémenter lot par lot après leurs gates, sans élargir le périmètre de données. |
| QA / Accessibilité | Rejouer RC-J1 à RC-J5 sur navigateurs et appareils, produire les preuves SHA-datées. |
| Cliente | Valider les artboards du Lot 0 et la recette chronologique du Lot 6. |

## 14. Checklist BMAD de correction de trajectoire

| Élément | Statut | Note |
|---|---|---|
| Déclencheur et preuves | [x] | Verbatim, code, documents et historiques inspectés. |
| Impact sur les epics | [x] | Ajustement transverse, pas de rollback ni nouvel MVP. |
| Conflits PRD/Architecture/UX | [x] | FR-033/047, NFR-011, démarrage animé, palette, `fruit`/`rayonnement`. |
| Option 1 : programme correctif direct | [x] Viable | Effort majeur, risque contrôlable par lots et gates indépendants. |
| Option 2 : rollback | [N/A] | Le travail récent constitue une bonne base ; rollback global non justifié. |
| Option 3 : réduction du MVP | [N/A] | Les retours renforcent la promesse existante et ne l'invalident pas. |
| Proposition détaillée | [x] | Lots, epics, stories, critères, dépendances et gates définis. |
| Handoff | [x] | Responsabilités définies. |
| Approbation utilisateur | [!] | À obtenir sur ce draft avant implémentation. |
| Mise à jour `sprint-status.yaml` | [!] | Interdite avant approbation ; aucune modification effectuée. |

## 15. Décision proposée à l'approbation

Approuver cette proposition signifie :

- adopter **« Bienvenue »** plutôt que l'anglais « welcome » ;
- interpréter « lancement » comme **une fois par chargement à froid / document**, jamais pendant la navigation interne ;
- placer la phrase exacte de Julian dans l'état sans tour utilisateur de la région Anam, et non sur le portail ni comme nouvelle parole persistée ;
- garder le mantra indépendant du journal ;
- conserver RC-D3 comme cadrage différé de la demande de personnalisation, sans la faire disparaître du backlog ;
- conserver une provenance IA concise lorsque le ciel est formulé par un modèle ;
- rendre corrigeables les données de naissance par le flux protégé de RC-E4, jamais leurs résultats dérivés ;
- **ne pas autoriser RC-G3 par cette approbation** : une réflexion Ennéagramme personnelle exige ensuite une seconde décision formelle Product + données/sécurité + Architecture ;
- renommer la destination « Mon évolution » tout en gardant l'arbre comme métaphore ;
- répondre à la demande d'« arbre final » par un exemple d'arbre pleinement développé, clairement non contractuel, sans promettre de résultat personnel ;
- valider la refonte visuelle par artboards avant sa généralisation.

Après approbation, le premier travail à inscrire au backlog est le **Lot 0**. Cette approbation valide le plan et son intégration documentaire, **pas l'écriture de code** : l'implémentation exige une demande distincte. Le backlog et `sprint-status.yaml` restent inchangés jusque-là.

## Annexe A — Traçabilité exhaustive du verbatim

| Retour source consolidé | Story de réalisation | Story de preuve / gate | Décision appliquée |
|---|---|---|---|
| Agrandir, arrondir et illuminer l'arbre ; descendre les racines | RC-B2 | RC-A3, RC-J2 | Nouvelle composition responsive, pas simple zoom. |
| « Anam » → « welcome » | RC-B3 | RC-J1 | « Bienvenue » en français. |
| Supprimer le chronomètre / élément temporel | RC-B3 | RC-A0, RC-J1, RC-J5 | Chronomètre non retrouvé à HEAD ; identifier le build client puis retirer l'élément réellement observé. |
| Agrandir la fleur et la feuille de lotus | RC-B3 | RC-A3, RC-J2 | Dimension issue de l'artboard approuvé. |
| Portail seulement au lancement, pas entre les pages | RC-B1 | RC-J5 | Une fois par chargement à froid/document. |
| « Mon parcours du jour » | RC-C1 | RC-J1 | Copie exacte. |
| Horoscope plus précis et tutoyé | RC-D0, RC-D1 | RC-J2, RC-J5 | Mesure avant correction, pas reconstruction du calcul. |
| Horoscope selon naissance et jour, sans mémoire Anam | RC-A2, RC-D1 | RC-H4, RC-J5 | Signature dérivée minimisée, aucun journal. |
| « Mon mantra du jour » | RC-C1 | RC-J1 | Forme masculine correcte. |
| Mantra éventuellement personnalisé par Anam | RC-D3 (cadrage P2) | RC-A1, RC-A2 | Hors correctif cœur ; décider entre mantra inchangé, ancrage ou contenu Anam distinct. |
| « Mon monde intérieur » | RC-C1 | RC-J1 | Copie exacte. |
| « Mes univers » | RC-C1 | RC-J1 | Copie exacte. |
| Supprimer la phrase sous Mes univers | RC-C1 | RC-J1 | Retrait complet, espace recomposé. |
| Revoir les pictogrammes spirituels/pastels | RC-C3 | RC-A3, RC-J2 | Assets statiques, outil de génération libre hors runtime. |
| Refonte globale, cartes blanches, tons doux | RC-A3, RC-C2, RC-C4 | RC-J2 | Comparer à parité une variante claire et une variante hybride ; AA obligatoire. |
| Astrologie : centrer et nettoyer les sous-titres | RC-E1 | RC-J1, RC-J2 | Supprimer le surtitre réel « Projection de naissance ». |
| Garder « Ton ciel de naissance » + explication courte | RC-E1 | RC-J1 | Titre déjà existant, une seule phrase utile. |
| Retirer la phrase « écrit par un modèle » | RC-D2, RC-E1 | RC-A1, RC-J1 | Retrait de l'intro, provenance compacte si génération réelle. |
| Montrer Soleil, Ascendant et Lune | RC-E2 | RC-J2, RC-J3, RC-J5 | États d'absence/incertitude honnêtes. |
| Rendre les repères astrologiques modifiables | RC-E2, RC-E4 | RC-A2, RC-J3, RC-J5 | Corriger heure/date/lieu par un flux protégé, jamais le résultat dérivé. |
| Refaire le compas avec étoiles, Lune et planètes | RC-E3 | RC-A3, RC-J2 | Exactitude et équivalent textuel conservés. |
| Numérologie : titre centré et sans sous-titre | RC-F1 | RC-J1, RC-J2 | Retrait du surtitre technique. |
| Nombres symboliques et textes explicatifs | RC-F1 | RC-J2, RC-J5 | Même calcul, présentation enrichie. |
| Pop-ups / toggles | RC-F2 | RC-J2 | Accordéons accessibles privilégiés. |
| Supprimer les répétitions et le récapitulatif inférieur | RC-F1, RC-F2 | RC-J1, RC-J2, RC-J5 | Une occurrence primaire, méthode optionnelle. |
| Conserver le bon ton numérologique comme modèle | RC-D1, RC-F1 | Revue éditoriale | Ton factuel/personnel sans copier les contenus. |
| Psychologie : supprimer « Des outils différents… » | RC-G1 | RC-J1 | Retrait au hub, limites conservées au résultat. |
| Ennéagramme : mot-titre et définition générale | RC-G2 | RC-J1, RC-J2, RC-J3 | Cœur obligatoire ; nom, numéro secondaire et corpus distinct. |
| Ennéagramme : texte personnalisé selon Anam | RC-G3 (P2) | Seconde décision + recette d'extension dédiée | Besoin conservé, mais non autorisé par ce plan. |
| Boutons plus lisibles et couleurs plus douces | RC-G1, RC-C2 | RC-A3, RC-J2 | Correction au système de design. |
| Anam reste un journal interactif avec échanges conservés | RC-H4 | RC-J5 | Non-régression, pas nouveau stockage. |
| Petits points → étoiles + lotus en contour | RC-H2 | RC-A3, RC-J2 | Réintroduction soumise à artboard. |
| Lia / Claude Design pour le fond | RC-A3, RC-H2 | RC-J2 | Moyen de conception, pas dépendance runtime. |
| Phrase d'accueil fournie | RC-H1 | RC-J1, RC-J2, RC-J5 | Verbatim exact, hors journal. |
| Clavier automatique à l'arrivée sur Anam | RC-H3 | RC-J3, RC-J5 | Après geste explicite si plateforme compatible. |
| « Mon arbre » → « Mon évolution » | RC-I1 | RC-J1, RC-J5 | Destination renommée, métaphore conservée. |
| Explication complète toujours accessible | RC-I2 | RC-J2, RC-J3, RC-J5 | État vide conservé + accès permanent. |
| Améliorer la graine | RC-I2 | RC-A3, RC-J2 | Itération d'un visuel existant. |
| Page dédiée sur l'évolution et l'arbre à venir | RC-I2 | RC-J1, RC-J2 | États illustratifs, aucun résultat final promis. |

## Annexe B — Contraintes externes vérifiées

- [Commission européenne — obligations de transparence de l'article 50](https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act) : l'interaction directe avec une IA doit être annoncée clairement dès la première interaction ; le plan conserve donc la mention persistante « Anam est une IA » et une provenance cohérente pour les contenus générés.
- [Règlement (UE) 2024/1689, article 50](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A32024R1689) : les systèmes générant du texte doivent prévoir un marquage détectable dans les conditions prévues par le règlement ; la suppression d'une phrase visible ne dispense pas du contrat de provenance technique.
- [WebKit bug 195884](https://bugs.webkit.org/show_bug.cgi?id=195884) : sur iOS, un focus programmatique hors geste utilisateur ne fait pas apparaître le clavier logiciel par conception ; RC-H3 est donc formulée comme amélioration progressive après un geste vers Anam.
