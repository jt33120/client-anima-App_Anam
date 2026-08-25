---
baseline_commit: 5334a79
---

# Story 7.5 : La halte « Ton socle » — la première fois que FR-055 est tenu

Status: done

## Story

En tant qu'utilisatrice,
je veux un écran qui me montre l'ensemble de mon socle — mes six nombres avec leur sens, mes dix
corps avec leur signe, leur degré et leur maison, mon ascendant, mon milieu du ciel — et qui me dise
franchement ce qui manque et pourquoi,
afin que la promesse « gratuit à vie » soit vraie.

**Couvre :** FR-055, FR-047 à FR-051, FR-053, FR-054, FR-058, FR-077, FR-031 (DUR) · AD-1, AD-6,
AD-7, AD-10 · UX-DR-22, UX-DR-36 · dépend de la Story 7.1 (faite).

---

## ⚠️ Pourquoi cette story a été prise AVANT les 7.2 et 7.3

Le plan les ordonnait 7.2 (le catalogue du menu) → 7.3 (le glyphe et la feuille) → 7.5 (la halte).
Cet ordre casse deux fois en route, et aucune story ne le disait :

- **7.2 fait entrer « Ton socle » dans le menu**, mais la halte n'existe qu'en 7.5 : le lien serait
  **mort** entre les deux commits.
- **7.2 exige qu'il n'existe plus qu'une seule liste d'entrées de compte** — donc que `/profil`
  disparaisse ou consomme le module. Le faire disparaître avant que la feuille de la 7.3 existe
  laisserait le compte **sans aucune surface**.

La halte d'abord règle les deux : elle est atteignable par URL comme les cinq autres haltes depuis
toujours, et `/profil` la porte en tête dès aujourd'hui.

---

## Ce que cette story livre, en une phrase

La **première surface où FR-055 est vrai** : les six nombres avec leurs six textes, au lieu d'un.

---

## Les trois défauts que la halte solde

| Défaut | Mesure |
|---|---|
| **FR-055 non tenu** | `carteNombres` ne porte que le chemin de vie (`cartes-socle.ts:219-222`). Les **69 créneaux de numérologie sont écrits** ; **cinq textes sur six** n'étaient lisibles nulle part. |
| **Cinq corps sur douze** | `CORPS_DE_CARTE` s'arrête à Mars — contrainte de vignette assumée en commentaire. Jupiter, Saturne, Uranus, Neptune, Pluton et les deux nœuds paraissent ici pour la première fois. |
| **Le milieu du ciel n'existait pas à l'écran** | Calculé depuis la Story 5.1, **aucune occurrence** sous `render/` ni `app/`. Il traversait toute la chaîne et mourait avant le DOM, sans qu'une ligne ne rougisse. |

---

## Les décisions

### La mention IA est DUE sur cette halte — et c'est un fait, pas une préférence

Le premier jet écrivait `mention: false` : « tout est calculé, les textes viennent d'Anima ». C'était
faux. Un type retenu a **deux origines** (`lire-enneagramme.ts` : `"test" | "hypothese"`) ; dans le
second cas la **valeur** a été proposée par un modèle et acceptée par elle. Cela suffit à faire de la
page une surface où paraît quelque chose qu'un modèle a produit (AI Act art. 50 §2).

L'échappatoire existait — n'afficher que les types issus du test — et elle a été **refusée par
écrit** : elle dirait « le test t'attend » à quelqu'une qui a déjà un type. **On ne trie pas
l'affichage pour s'épargner une mention.** Le motif est dans `pied-halte.ts`, où le test d'inventaire
le lit.

### Le silence du corpus de thème natal est DIT, pas comblé

Zéro créneau d'astrologie natale existe. Trois issues : taire le vide (un tableau d'éphémérides muet,
que `cartes-socle.ts` a explicitement refusé), le combler (fabriquer, sous la signature d'une
personne réelle, un texte qu'elle n'a pas écrit — FR-054/FR-086), ou le dire. La page le dit.
Un test **vérifie qu'aucune clé de thème n'existe encore dans le corpus** : le jour où Anima les
écrit, il rougit — et la page devra les afficher au lieu d'annoncer un vide qui n'existe plus.

### Une seule vérité par absence

L'aveu sans heure est `MESSAGE_SANS_HEURE` **mot pour mot**, et l'inventaire vient de
`socle-incomplet.ts`. Le piège que ça évite est nommé dans un test : **au pôle géographique exact,
l'ascendant n'existe pas** et aucune heure ne le fera exister — la halte obéit à `reparableParLHeure`
au lieu de relire `angles.statut`, donc elle n'envoie personne à la mairie pour rien.

### Le lien de correction du nom pointe sur `/profil`, pas sur `/reglages`

L'amendement du 2026-08-25 déménage le formulaire de nom vers `/reglages` — mais c'est la Story 7.3
qui pose ce geste. Pointer d'avance créerait un lien mort. Une constante, une ligne à changer, et un
test qui **vérifie que chacune des trois URL correspond à une page qui existe**.

---

## Ce qui a été touché

| Fichier | |
|---|---|
| `lib/domain/fiche-socle.ts` | **nouveau** — le modèle de la halte, pur (AD-1) |
| `lib/domain/copie-socle.ts` | **nouveau** — les titres, les douze raisons d'absence, les trois portes |
| `render/socle/types.ts`, `FicheSocle.tsx`, `socle.module.css` | **nouveaux** — rendu muet (AD-7) |
| `app/socle/page.tsx` | **nouveau** — la halte, garde d'état art. 9, trois lectures en parallèle |
| `lib/domain/pied-halte.ts` | la halte `socle` déclarée, mention IA due, motif écrit |
| `lib/domain/enneagramme-items.ts` | `MESSAGE_TYPE_ABSENT` + `URL_PASSER_LE_TEST` — **un seul endroit** pour la phrase que 7.8 réutilise |
| `lib/domain/cartes-socle.ts` | `CORPS_LIBELLE`, `NOMBRE_LIBELLE`, `enSigne` exportés ; **chiffre de corpus périmé retiré** |
| `render/accueil/Bibliotheque.tsx` | même chiffre périmé retiré |
| `lib/domain/copie-profil.ts` | « Ton socle » en tête — la halte est atteignable dès maintenant |
| `tests/fiche-socle.test.ts`, `tests/socle-frontiere.test.ts`, `tests/rendu/fiche-socle.test.tsx` | **nouveaux** — 49 tests |

---

## Contrôles

- **Suite complète** : 4274 verts, **131 rouges = la ligne de base exacte**. `tsc`, `eslint` et
  `next build` propres ; `/socle` construit en route **dynamique** (art. 9, jamais mise en cache).
- **Campagne de mutation — 15 mutants, 15 tués.** Restauration par instantané `cp`.

| # | Mutant | Verdict |
|---|---|---|
| N1 | seul le chemin de vie porte un texte — **le défaut d'origine** | tué |
| N2 | le ciel retombe à cinq corps | tué |
| N3 | le milieu du ciel disparaît | tué |
| N4 | le degré est rendu sans heure connue | tué |
| N5 | les absences de nombres deviennent silencieuses | tué |
| N6 | l'aveu sans heure est reformulé au lieu d'être réutilisé | tué |
| N7 | le pôle reçoit un lien d'invitation inutile | tué |
| N8 | l'aveu du sens non écrit est retiré de l'écran | tué |
| N9 | le type absent réaccuse Anima | tué |
| N10 | le domaine gagne `complet: boolean` et `totalCalcules: number` | tué |
| N11 | un champ ajouté d'un **seul** côté de la frontière | tué |
| N12 | les cuspides tombent à six | tué |
| N13 | le rendu aplatit l'union du corpus (`?? silence`) | tué |
| N14 | une URL de réparation qui ne mène nulle part | tué |
| N15 | le lien de réparation cesse d'être rendu | tué |

**Deux de mes propres gardes ont été rendues précises plutôt qu'assouplies** : l'une interdisait le
mot « complet » et rougissait sur le libellé « Ton nom complet » ; l'autre interdisait tout tiret
cadratin et rougissait sur de la ponctuation. Une garde impossible à satisfaire finit toujours par
être assouplie jusqu'à ne plus rien garder — les deux visent désormais la **mesure** et l'**élément
creux**, pas le mot.

---

## ⚠️ Ce qui n'est PAS prouvé

**Aucun navigateur n'a vu cette page.** La suite e2e (`npm run e2e`) vise le stack Supabase **local**,
et il n'y en a plus depuis la décision du 2026-08-24 (100 % cloud, zéro Docker) — les 131 échecs de
ligne de base en sont la trace. Le DOM est prouvé (17 tests de rendu) ; les **pixels** ne le sont pas :
ni la tenue sur 390 px, ni le contraste, ni la longueur réelle des lignes de position.

C'est exactement la classe de défauts que la Story 11.1 et la QA visuelle existent pour attraper, et
la seule façon honnête de la fermer aujourd'hui est que Julian ouvre `/socle`.

---

## Ce que cette story laisse à la suivante

- **7.2** peut maintenant écrire `menu-compte.ts` avec « Ton socle » en deuxième position **sans lien
  mort**, et reprendre la liste de `copie-profil.ts` en entier.
- **7.3** n'aura qu'**une ligne** à changer pour repointer `URL_CORRIGER_LE_NOM` vers `/reglages`.
- **7.7** peut retirer « Ton thème » et « Tes nombres » de l'accueil : leur contenu est ici, en plus
  complet.
- **7.8** a sa phrase déjà écrite, à un seul endroit (`MESSAGE_TYPE_ABSENT`), et n'a plus qu'à la
  poser sur la carte de l'accueil et à annoncer le test sur `/enneagramme`.
