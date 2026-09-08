# Design spec — Anima, carnet céleste

Date : 2026-09-06. Mandat : carte blanche sur le front, expérience Vercel réversible.

## 1. Intention et décision forte

Un carnet céleste nocturne : bleu nuit, lumière bleu ciel et violet, lotus et étoiles sur une matière aquarellée. Le manuscrit ponctue les moments calmes ; les contenus longs retrouvent une taille de lecture. L'écran mobile montre du contenu utile dès son ouverture.

La correction explicite du fondateur du 6 septembre (« mode nuit par défaut », « trop terre », captures accueil et clavier refusées) remplace la première direction papier. Nuit est aussi le rendu serveur et le repli sans stockage. Un choix Papier explicite reste respecté ; le contraste renforcé garde la priorité.

## 2. Palette et typographie

| Rôle | Nuit par défaut |
| --- | --- |
| Fond | Bleu nuit `#11182d` |
| Surface | Bleu profond `#1a2541` |
| Texte | Blanc céleste `#f0f2ff` |
| Texte secondaire | Bleu gris `#b7c7e3` |
| Accent | Bleu ciel `#add5ff` |
| Lavande | `#303255` |
| Violet | `#342e50` |
| Bleu de brume | `#203e53` |

Les dégradés nommés sont générés depuis les tokens. Les surfaces de lecture sont opaques, avec contrôle des arrêts de dégradé. L'image d'ambiance est limitée à 14 % en Nuit et 2 % en Papier ; le pire pixel blanc ou noir est couvert par un test de composition. Le lotus du petit en-tête occupe une moitié distincte du texte. Le contraste renforcé retire l'illustration et les dégradés.

Fraunces porte les titres et la citation, Inter les contenus et contrôles, Caveat les annotations rares. Sur mobile : titre autour de 30 px, citation de 19 px même pour un texte long, commandes de navigation de 12 px dans des cibles de 44 px au minimum. Aucun contenu n'est tronqué pour faire tenir la maquette.

## 3. Contrat de tokens et réversibilité

Le socle historique `app/styles/tokens.ts`, `app/styles/globals.css` et leur test de parité reste
préservé. La surcouche carnet a pour source unique `design/tokens.json`; un script génère
`app/styles/carnet-tokens.css`, importé après la feuille historique. Ne jamais corriger à la main
une sortie générée. Toute valeur nouvelle entre dans les tokens de la surcouche.

Un sélecteur Papier/Nuit contrôle `data-carnet-theme`. Une règle locale de page ne doit pas
outrepasser cette préférence ni l'accessibilité. La séparation de la surcouche rend la direction
facile à retirer sans reconstituer l'ancien design.

## 4. Composition des familles d'écrans

**Accueil / Aujourd’hui.** Date, titre bref et lotus partagent un en-tête compact. Le mantra garde une taille de lecture. La lecture du ciel
porte un statut clair et une action explicite. Les univers apparaissent ensuite comme des pages
à explorer : sujet, description courte, destination. Le grand écran peut offrir une colonne de
repères; le téléphone conserve le même ordre de lecture dans une seule colonne.

**Anam.** Identité discrète, fil lisible et composeur ancré sans recouvrir la parole au clavier.
Le portrait existant ponctue l’introduction. Entrer dans Anam annonce son titre sans ouvrir le clavier. Un seul hook, au niveau scène, suit la hauteur et le décalage de VisualViewport ; aucune seconde déduction dans le fil. Le clavier masque la navigation et réduit les réserves. Le zoom natif garde la main. Les messages conservent leur provenance et leurs
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

Source d’illustration principale : `public/marque/lotus-celeste.webp`, aquarelle céleste créée avec imagegen intégré. Prompt et provenance : `design/lotus-celeste-asset.md`.
Réutiliser portraits, lotus, glyphes existants et moteur Canvas lunaire. Aucun emoji d'interface,
SVG improvisé ou famille d'icônes concurrente. Une texture éventuelle reste statique, discrète et
sous les textes; tout nouvel asset exige une provenance explicite.

## 6. Mouvement et accessibilité

Un fondu de région de 280 ms accompagne une entrée; un changement de surface confirme l'appui. Aucun mouvement
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

## 9. Arbre de vie céleste

La refonte de l’arbre suit [la direction dédiée](tree-of-life-spec.md) : proportions botaniques, matières nacrées, canopée pastel, lumière issue des seuls états réels. L’exploration illustrée des étapes reste explicitement pédagogique.

## 10. Métamorphose botanique en planches fixes

Le retour du 7 septembre précise la continuité graine→racines→arbre→lumière et sa découverte
dès l'écran vide. [Direction et contrat de métamorphose](metamorphosis-spec.md).

## 11. Croissance de l'arbre personnel

Le correctif suivant rétablit la croissance sur le parcours réel et affine fortement les étapes :
[direction et intégration](living-growth-spec.md). Il remplace le contrat de galerie seule.

## 12. Lumière du ciel, prolongement de l’illumination

Trois nouvelles planches suivent les 32 existantes, toutes conservées : la lumière descend
du ciel vers la couronne, traverse le bois vivant, puis rejoint les racines. La silhouette,
le cadrage et les matières pastel de la planche 32 restent les repères communs. La référence
utilisateur guide la lumière rose nacrée, sans reprendre son interface ni ses textes.
Les trois étapes prolongent la même famille Lumière et la croissance personnelle existante,
sans rééchelonner les états déjà atteints.

## Mon évolution — 2026-09-07

Use the current stage artwork as the stationary page background for the seed. Remove nested garden and text frames. Keep the region title and a small Comprendre control in one row, a short introduction, and a stage caption. Seed caption: « Une graine a été plantée, tu peux te féliciter ». Preserve branch access, list view, image retry and birth-time actions.

Validation: 390/768/1440 px, Nuit and Papier, seed/mixed/dense/unavailable states. First pass found blank announcement spacing, a cropped seed on wide viewports, and controls competing with the caption; corrected with a full region composition, contained wide artwork, and separate control placement. Final captures show no horizontal overflow or browser errors; Comprendre restores focus. WebKit mobile also verifies the seed and dialog.

## Launch portal — 2026-09-08

The founder authorizes an animated Anam launch screen. Reuse the official transparent
`public/scene/veille/anam-veille{,@2x}.png` portrait, with a shorter composition, an atmospheric
celestial glow and small points of light. A single slow camera approach lifts Anam into view;
the lowercase brand settles below her, followed by the welcome. No generated likeness or video.
The launch sequence is a scoped exception to static decorative surfaces: transform and opacity
animate for one finite appearance, with no new loop, loading percentage or added minimum wait.
The existing 2.2-second minimum, 6-second ceiling, 700ms exit and document-only trigger stay in place.
Reduced motion keeps a composed still image and the existing short stay. Paper and reinforced
contrast retain their own readable palette. If the portrait fails, the brand and light remain.
Launch-only dimensions, gradients and timing live in `design/tokens.json` and its generated CSS.
Review at 390/768/1440, short landscape, reduced motion, missing image and delayed resources.
