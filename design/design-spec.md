# Design spec — Anima, carnet céleste

Date : 2026-09-06. Mandat : carte blanche sur le front, expérience Vercel réversible.

## 1. Intention et décision forte

Un carnet personnel ouvert à la lumière : sensible, vivant, lisible. Le papier ivoire, une encre
aubergine et des respirations généreuses donnent aux informations la place de se lire. Un grand
titre serif ouvre chaque chapitre; une annotation manuscrite rare souligne son intention.

La demande du 6 septembre supplante les anciennes contraintes « nuit native » et « pas de thème
jour ». Papier devient l'ambiance par défaut; Nuit reste accessible. Les parcours métier et les
protections de confidentialité demeurent des invariants.

Références de matière : herbier ancien pour les marges et l'ivoire, carnet d'observation céleste
pour les repères délicats, revue littéraire pour la hiérarchie typographique. L'identité vient de
la composition et des assets déclarés, sans accumulation de panneaux identiques ni décoration
qui concurrence les mots.

## 2. Palette et typographie

| Rôle | Direction |
| --- | --- |
| Fond | Papier ivoire `#faf7f2` |
| Surface | Crème `#fffdf9` |
| Texte | Encre aubergine `#3e3346` |
| Texte secondaire | Aubergine grisée `#726377` |
| Accent / action | Aubergine `#74577c` |
| Lavande | `#ede5f4` |
| Rose | `#f7e7e2` |
| Sauge | `#e7ede3` |

Les pastels servent de surfaces; ils ne portent aucun texte sans paire de contraste mesurée.
L'accent marque l'action principale et la sélection. Les surfaces papier conservent leur propre
paire texte/fond en Papier comme en Nuit. Le mode contraste renforcé garde la priorité.

Fraunces porte les grands titres et la voix éditoriale. La fonte de texte existante sert à
l'interface et aux contenus longs. Caveat, chargée localement, signe les annotations; elle ne
porte jamais une consigne indispensable, une action, une erreur ou un texte long.

## 3. Contrat de tokens et réversibilité

Le socle historique `app/styles/tokens.ts`, `app/styles/globals.css` et leur test de parité reste
préservé. La surcouche carnet a pour source unique `design/tokens.json`; un script génère
`app/styles/carnet-tokens.css`, importé après la feuille historique. Ne jamais corriger à la main
une sortie générée. Toute valeur nouvelle entre dans les tokens de la surcouche.

Un sélecteur Papier/Nuit contrôle `data-carnet-theme`. Une règle locale de page ne doit pas
outrepasser cette préférence ni l'accessibilité. La séparation de la surcouche rend la direction
facile à retirer sans reconstituer l'ancien design.

## 4. Composition des familles d'écrans

**Accueil / Aujourd'hui.** Date et mantra forment une ouverture éditoriale. La lecture du ciel
porte un statut clair et une action explicite. Les univers apparaissent ensuite comme des pages
à explorer : sujet, description courte, destination. Le grand écran peut offrir une colonne de
repères; le téléphone conserve le même ordre de lecture dans une seule colonne.

**Anam.** Identité discrète, fil lisible et composeur ancré sans recouvrir la parole au clavier.
Le portrait existant ponctue l'introduction. Les messages conservent leur provenance et leurs
états réels; l'arbre persistant reste éteint. Aucun texte de démonstration n'est persisté ou
présenté comme une réponse réelle.

**Univers, lectures et socle.** Un en-tête de chapitre donne sujet et disponibilité. Résumé
essentiel d'abord, détails ensuite via les contrôles existants. Astrologie, Numérologie et
Psychologie gardent leurs destinations et leur structure métier. Une panne reste distincte
d'une donnée absente ou d'un refus.

**Accès, compte et aide.** Les mêmes contrôles traversent connexion, verrou, consentements,
réglages et données personnelles. Le menu conserve Aide, Explorer, Compte et Confidentialité.
Dans l'aide, « Retour à Anima » et « Sortie rapide » gardent leurs gestes distincts; la page reste
publique.

## 5. Composants et assets

Inventaire : scène globale, navigation, en-tête de chapitre, carte de lecture, porte d'univers,
boutons principal/secondaire, lien, champ et select, disclosure, feuille de profil, bandeau
d'état, squelette, bulle Anam et composeur. Les composants existants gardent leurs responsabilités.

Source d'illustration principale : aquarelle pastel existante `public/marque/header_mainpage.jpg`.
Réutiliser portraits, lotus, glyphes existants et moteur Canvas lunaire. Aucun emoji d'interface,
SVG improvisé ou famille d'icônes concurrente. Une texture éventuelle reste statique, discrète et
sous les textes; tout nouvel asset exige une provenance explicite.

## 6. Mouvement et accessibilité

Un fondu court accompagne une entrée; un changement de surface confirme l'appui. Aucun mouvement
cyclique décoratif, filtre plein écran ou flou d'arrière-plan. `prefers-reduced-motion` conserve
l'information et supprime le mouvement.

Focus visible; cibles tactiles au token d'au moins 44 px; contraste texte courant d'au moins
4,5:1; aucun état par couleur seule. Les dialogues préservent nom accessible, confinement et
retour du focus. L'ambiance Nuit et le contraste renforcé sont vérifiés avec les mêmes contenus.

## 7. Vérification et livraison

Deux boucles capture → critique → correction → recapture à 390, 768 et 1440 px couvrent accueil,
Anam, lecture/univers, formulaire d'accès et compte, sans données sensibles. Vérifier vide,
chargement, erreur et densité réelle, texte long, clavier mobile, navigation clavier, Nuit,
contraste renforcé et mouvement réduit. Attendre un état visible explicite, pas `networkidle`.

Lint, parité des tokens et tests ciblés pertinents complètent la revue visuelle. Ne revendiquer
que les surfaces inspectées. Branche dédiée déployable Vercel, référence de production initiale
archivée, URL/SHA vérifiés et geste de retour documenté dans la spec de livraison.

## 8. Limites

Front uniquement : aucun changement API, données, migrations, auth, consentements, calculs,
intégrations ou contrats réseau. Aucun résultat personnel inventé. Aucun paramétrage distant du
backend. La branche reste séparée de main pour le test.
