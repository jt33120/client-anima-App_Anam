# Design spec — Anima

## 1. Intention

En trois secondes, Anima doit sembler calme, intime et lisible : un lieu nocturne habité, jamais
un tableau de bord administratif. Les anti-adjectifs sont dense, clinquant et opaque.

Cette note resserre les décisions déjà décrites dans les artefacts BMAD `DESIGN.md` et
`EXPERIENCE.md`. Elle ne crée pas une seconde direction artistique.

## 2. Décision forte

La nuit galactique reste continue, tandis que chaque action repose sur une surface locale nette.
La hiérarchie vient de Fraunces pour la voix et les titres, d’Inter pour l’interface, puis du rythme
et des bordures — jamais d’un empilement d’effets.

## 3. Tokens

- Source de vérité actuelle : `app/styles/tokens.ts`, reflétée et gardée par
  `app/styles/globals.css` et `tests/tokens-parite.test.ts`.
- Cette source existante prévaut sur la convention générique `design/tokens.json` jusqu’à une
  migration dédiée ; introduire un second fichier de tokens maintenant créerait deux vérités.
- Couleurs : rôles `fond`, `surface`, `surface-elevee`, `texte`, `texte-doux`, `bordure`,
  `bordure-forte`, `accent` et `accent-doux` exclusivement.
- Espacement, rayons, cible tactile et mouvement : échelles `--esp-*`, `--rayon-*`,
  `--cible-tactile`, `--duree-*` et `--courbe` exclusivement.
- Aucun flou d’arrière-plan, filtre plein écran, ombre de texte ou animation cyclique. La scène a
  déjà montré que ces effets dégradent fortement les performances.

## 4. Navigation et menu de profil

- Le glyphe de profil reste en haut à droite et ouvre immédiatement un dialogue modal nommé.
- Le contenu est organisé dans cet ordre stable : **Aide**, **Explorer**, **Compte**,
  **Confidentialité**. Une information identitaire ou relationnelle ne partage plus une liste plate
  avec l’abonnement et les droits sur les données.
- Les intitulés et descriptions restent courts. Aucun compteur, badge, cadenas ni signal commercial.
- Un appui produit un retour visuel immédiat. Une navigation lente nomme la destination en cours,
  pose `aria-busy` et conserve un emplacement stable pour éviter tout saut de mise en page.
- Échap, le fond et le bouton Fermer referment la feuille ; le focus revient au glyphe. La
  tabulation reste bornée dans le dialogue tant qu’il est ouvert.

## 5. Page d’aide

- Deux gestes distincts sont toujours visibles : **Retour à Anima** ferme normalement la halte et
  revient dans le produit ; **Sortie rapide** ouvre un site neutre en remplaçant l’historique.
- La sortie rapide n’est jamais le bouton de fermeture ordinaire et son nom ne peut pas être le
  vague « Quitter ».
- Les ressources humaines restent avant le mode d’emploi et la transparence. Les longs contenus
  sont découpés en panneaux et fiches, avec une mesure de lecture bornée.
- La page reste publique, sans session, sans IA et sans traceur.

## 6. États et accessibilité

- Cibles tactiles d’au moins `--cible-tactile`, anneau `:focus-visible` sur chaque contrôle.
- États livrés : fermé/ouvert, navigation au repos/en cours, contenu court/dense, et mode contraste
  renforcé. Les routes lentes gardent leurs `loading.tsx` locaux ; le menu fournit en plus la réponse
  au geste avant le changement de route.
- Le mouvement cède à `prefers-reduced-motion`; l’information d’attente, elle, reste visible.

## 7. Assets

Le glyphe de profil existant est conservé comme asset de navigation déjà établi. Les trois
portes de « Moi » emploient une unique famille de glyphes SVG au trait, sans bibliothèque externe
ni emoji. « Mon arbre » emploie exclusivement le moteur Canvas issu du handoff lunaire canonique :
ni PNG de référence, ni ancien arbre SVG alternatif.

## 8. Moi, Psychologie et Anam

- « Moi » commence par le jour, le ciel et le mantra. Un fondu vertical conduit ensuite à trois
  portes stables : Astrologie, Numérologie et Psychologie. Human Design vit dans Psychologie avec
  l'Ennéagramme et Big Five ; il n'est pas dupliqué comme univers de premier rang.
- Une porte est une surface locale entière, avec glyphe, intitulé, phrase courte et destination.
  L’Ennéagramme absent ajoute une action explicite ; aucun badge ne remplace cette phrase.
- La halte Psychologie distingue visuellement ce qui est disponible de ce dont la méthode ou le
  moteur reste à valider. Un futur outil n’imite jamais un résultat.
- Dans Anam, l’arbre persistant s’éteint totalement. Le ciel reste visible, le fil garde ses voiles
  locaux et un repère « Aujourd’hui » sépare le nouveau jour sans devenir une carte.

## 9. Non-buts

Pas de nouveau thème, pas de nouvelle palette, pas de navigation imbriquée, pas d’animation
élaborée et pas de déplacement de la sortie rapide hors de `/aide` dans cette tranche.
