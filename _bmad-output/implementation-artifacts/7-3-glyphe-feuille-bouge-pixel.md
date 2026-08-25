---
baseline_commit: eb75f59
---

# Story 7.3 : Le glyphe et la feuille — et le « ? » ne bouge pas d'un pixel

Status: done

## Story

En tant qu'utilisatrice,
je veux un glyphe ancré en haut à droite qui ouvre une feuille par-dessus la scène,
afin d'atteindre mon compte sans quitter l'endroit où je suis — et je veux que la porte de secours
reste exactement où elle est.

**Couvre :** FR-077, FR-031 (DUR), FR-013, FR-060 · AD-7, AD-9, AD-15 · UX-DR-11, UX-DR-18,
UX-DR-20, UX-DR-38, UX-DR-42 · `EXPERIENCE.md` lignes 84, 86, 87, 148, 151, 216, 429 · dépend de 7.2.

---

## Le défaut, mesuré

« Profil » occupait **x = 143→191 sur 390 px** — le centre horizontal de l'écran — parce que
**trois** éléments de la surimpression portaient `margin-left: auto`. En flexbox, plusieurs marges
automatiques se **partagent** l'espace libre : chacune prise seule est correcte, et c'est leur
cohabitation qui casse le placement. Aucune relecture de feuille de style ne voit ça ; 5 300 tests
verts ne l'ont pas vu non plus.

La marge vit désormais **une seule fois**, sur `.groupeDroite`, et elle pousse le groupe entier au
bord quelle que soit sa composition — un compte gratuit n'a pas d'abonnement à afficher, le résultat
est le même. Ce qui règle au passage l'ancien « compromis » écrit dans le CSS : la position d'« Aide »
ne bouge plus quand le lien d'abonnement apparaît.

---

## Trois écarts assumés avec la rédaction de la story

### 1. L'indice d'attente est sur les LIENS, pas sur le glyphe

La story demandait `useLinkStatus()` sur le glyphe. Mais le glyphe n'est pas un `<Link>` : il ouvre
une feuille, **instantanément**, il n'y a aucune attente à indiquer. L'attente est **après**, quand
on touche une entrée. Et `useLinkStatus` ne se lit que depuis un enfant de `<Link>`
(`next/dist/docs/…/use-link-status.md`) : le poser sur un bouton ne compilerait rien d'utile.

### 2. « /aide en deux arrêts de tabulation » était FAUX, et l'en-tête le disait depuis la 1.8

`render/surimpression.tsx` promettait « au plus 2 pour Aide ». En conversation, pour une abonnée, la
mention IA puis « L'abonnement » précédaient déjà la porte : **trois arrêts**. Le chiffre traînait
depuis la Story 1.8 et personne ne l'avait mesuré.

Ce que FR-077 protège n'est pas une **distance**, c'est une **garantie** : toujours présente,
toujours au même endroit, indépendante de toute détection et du menu de compte, et **dernier arrêt**.
C'est ce qu'`e2e/clavier.spec.ts` vérifie déjà, et c'est ce qui compte. L'en-tête est corrigé.

### 3. Le glyphe est une silhouette, pas trois barres

Demandé le 2026-08-25 : « il devrait être en haut à droite, avec un icon de profil ».
`EXPERIENCE.md` ligne 84 dit « glyphe de menu » sans trancher lequel ; une silhouette dit « ton
compte » là où trois barres disent « d'autres pages ».

---

## ⚠️ Le trou que cette story creusait, bouché dans le même commit

Le glyphe **remplace le mot « Profil »** — et `/profil` était le **seul chemin** vers le formulaire de
nom. Le menu mène à « Réglages », qui ne porte que le rythme quotidien. Sans correctif, changer son
prénom devenait impossible autrement qu'en tapant une URL : **une fonctionnalité perdue par
déplacement**, la façon la plus discrète d'en perdre une.

Une troisième porte entre donc sous la halte « Ton socle » : « **Ton nom** ». Sa place n'y est pas un
pis-aller — le nom complet **détermine trois des six nombres**.

---

## Les refus tenus

- **[FR-077]** Le « ? » est rendu **hors** du composant de menu, reste le **dernier** élément
  focusable, garde `aria-label="Aide"`, et reste atteignable **menu ouvert**. Un menu qui absorberait
  la porte de secours la rendrait dépendante d'un état d'ouverture, donc perdable au pire moment.
- **[FR-060]** Le raccourci d'abonnement **reste** dans la surimpression, en plus de l'entrée de
  menu : on souscrit en une carte en pleine conversation, et passer par le menu ajouterait un geste à
  la **sortie** seule — l'asymétrie exacte que la loi vise.
- **[`EXPERIENCE.md` ligne 87]** Profondeur modale d'un niveau : la feuille ne contient que des liens
  et **un** bouton, celui qui ferme. Un `aria-haspopup` à l'intérieur est refusé par test.
- **[Ligne 151]** L'écart « un mot simple — Aide » / « jamais d'icône » est **tenu et daté**, pas
  corrigé : sur 390 px, trois libellés flottants se touchaient. Il ne coûte rien au nom accessible,
  qui est ce que la règle protège réellement.

---

## Contrôles

- **Suite complète** : 4324 verts, **131 rouges = la ligne de base exacte**. `tsc`, `eslint`,
  `next build` propres.
- **Campagne de mutation — 15 mutants, 15 tués.**

| # | Mutant | Verdict |
|---|---|---|
| Q1 | la marge automatique revient sur `.porteSecours` | tué |
| Q2 | la porte de secours ne mène plus à `/aide` | tué |
| Q3 | le glyphe perd `aria-expanded` | tué |
| Q4 | la feuille est rendue en permanence (piège à focus invisible) | tué |
| Q5 | un `aria-haspopup` dans la feuille — seconde feuille en germe | tué |
| Q6 | le glissement de région n'est plus stoppé | tué |
| Q7 | Échap ne ferme plus | tué |
| Q8 | le focus ne revient pas au glyphe | tué |
| Q9 | le focus n'entre pas dans la feuille | tué |
| Q10 | le piège à focus ne boucle plus | tué |
| Q11 | l'état d'appui du glyphe disparaît | tué |
| Q12 | l'indice d'attente perd son délai (il clignote) | tué |
| Q13 | un flou plein écran derrière la feuille | tué |
| Q14 | le mouvement réduit retire le contenu au lieu du mouvement | tué |
| Q15 | le glyphe perd son nom accessible (`title` au lieu d'`aria-label`) | tué |

### ⚠️ La première campagne ne prouvait rien, et il faut le dire

Le harnais snapshotait ses fichiers par `for f in $FICHIERS` — que **zsh ne découpe pas** en mots.
Aucun instantané n'a été pris, donc **aucune restauration n'a eu lieu** : les cinq premiers mutants
se sont **empilés**, et chaque verdict « tué » mesurait la somme des précédents. Les mutations ont
été défaites une à une, l'état sain vérifié par `tsc` + `eslint` + les gardes, et la campagne
refaite avec un **témoin de restauration** qui `diff` chaque fichier après chaque essai.

Un mutant qui ne mute pas ne prouve rien ; un harnais qui ne restaure pas prouve encore moins.

---

## ⚠️ Ce qui n'est pas prouvé

Le défaut d'origine est **géométrique**, et jsdom n'a pas de moteur de mise en page : il ne mesure
rien. Ce commit garde la **cause** (combien de marges automatiques, et où) parce que c'est elle qui
se réintroduit en ajoutant un lien. La **position réelle** se mesure au navigateur — d'où le travail
`navigateur` ajouté à la CI le même jour.

---

## Ce que cette story laisse à la suivante

- **7.3b** : déménager le formulaire de nom vers `/reglages`, supprimer `app/profil/` et
  `render/profil/`, repointer `URL_CORRIGER_LE_NOM` et la porte « Ton nom ». Blast radius mesuré :
  6 fichiers de source, 3 de tests.
- **7.4** compte ses clics sur cette feuille, au navigateur.
