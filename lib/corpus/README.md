# lib/corpus — les textes d'Anima

**Tout ce qui est écrit ici a un auteur, et cet auteur est Anima.** Pas Anam (l'intelligence
artificielle), pas un modèle de langage, pas nous.

Ce n'est pas une politesse envers l'autrice, c'est deux exigences du produit qui se combinent :

- **FR-054** — « Les interprétations proviennent du **corpus d'Anima**. Aucun texte générique acheté
  ou repris. »
- **FR-086** — « Anam ≠ Anima. Anima est une **personne réelle et identifiable**. Anam ne fabrique
  jamais une parole d'Anima. **Toute citation inventée attribuée à une personne réelle est un défaut
  critique.** »

Les trois façons de remplir ces textes sans elle sont fermées, chacune pour sa raison :

| | Ce qui casse |
|---|---|
| Les faire **générer** par un modèle | FR-047 (le socle est calculé) **et** FR-054 |
| Les **écrire nous-mêmes** | c'est alors du texte générique repris — précisément ce que FR-054 bannit |
| Les **acheter** ou les **recopier** | FR-054, et le droit d'auteur par-dessus |

Et dans les trois cas, le texte finirait signé du nom d'une personne réelle.

## Pourquoi cette couche est séparée de `lib/astro/`

`lib/astro/` est le socle, et il ne produit **que des nombres et des énumérations**. C'est ce qui
rend FR-053 (« le socle ne prédit jamais ») **structurel** plutôt que déclaratif : il n'y existe
aucun endroit où une prédiction pourrait s'écrire, et une garde d'absence surveille l'apparition
d'un champ de texte (`tests/astro-architecture.test.ts`).

Poser de la prose dans `lib/astro/` détruirait cette propriété — la garde se mettrait à voir du
texte partout et ne protégerait plus rien. D'où deux couches, toutes deux **pures**, de deux natures :

```
lib/astro/   → du CALCUL, aucune prose.        lib/corpus/ → de la PROSE, aucun calcul.
```

## Ce que cette couche n'a pas le droit de connaître

Aucun import de `@/lib/ai/*` (il n'existe pas de « génération » de corpus), aucun de `@/lib/data/*`,
aucun `server-only`, aucun Supabase, aucun `app/`, aucun `render/`. Un corpus est une **constante** :
il se relit à l'identique, sans base, sans réseau, sans appel facturé.

Gardé par `tests/corpus-architecture.test.ts`.

## Deux contrôles que cette couche reçoit gratuitement

1. **Le contrôle de voix bloquant de la Story 2.8.** `tests/lexique-voix.test.ts` balaie `app/`,
   `render/` et `lib/` **en récursif** — donc tout texte déposé ici passe automatiquement sous le
   lexique médical (NFR-008), les formulations bannies (FR-085), « soigner » (FR-023) et l'interdit
   d'emoji. C'est une des raisons du choix de l'emplacement, et la raison pour laquelle
   **`lib/corpus/` ne doit JAMAIS être ajouté aux exclusions de ce test.**
2. **Le détecteur de prédiction (FR-053).** `lib/domain/marqueurs-prediction.ts`, appliqué à chaque
   texte écrit par `tests/corpus-architecture.test.ts`.

## L'état des corpus

⚠️ **CE TABLEAU EST VÉRIFIÉ PAR LA CI**, ligne à ligne, contre ce que les modules contiennent
réellement (`tests/corpus-etat.test.ts`). Ne le modifiez pas à la main en espérant qu'il ait raison :
si vous le changez sans changer le code, le build casse — et c'est le but.

Il a menti pendant des semaines. Il annonçait **cinq** corpus, 186 créneaux et **zéro texte écrit**,
alors que cinq corpus sur sept étaient COMPLETS. Le 2026-08-25, une investigation de code l'a lu, en
a conclu que la numérologie était vide, et a déclaré bloqué un chantier parfaitement faisable. Un
document faux avait arrêté un travail. C'est pour ça que ce tableau est désormais calculé.

| Corpus | Créneaux | Écrits | Story |
|---|---|---|---|
| Numérologie · `numerologie` | 69 | **69** | 5.2 |
| Mantras du jour · `mantra` | 60 | **60** | 5.4 |
| Horoscope du jour · `horoscope` | 27 | **27** | 5.4 |
| Ennéagramme · `enneagramme` | 9 | **9** | 5.5 |
| Big Five · `big-five` | 15 | **15** | — |
| Human Design · `human-design` | 18 | **18** | — |
| Ancrages · `ancrages` | 24 | **24** | — |
| Description des cartes · `description-cartes` | 21 | **0** | 5.7 |
| Sens des cartes · `sens-cartes` | 21 | **0** | 5.7, ramené de 24 à 21 en 5.10 |
| **Total** | **264** | **222** | |

**Ce qui reste à écrire, et par qui.** Les 42 créneaux non écrits sont les deux corpus du jeu de
cartes, et ils relèvent d'Anima seule (FR-054, FR-086) : c'est un travail d'ÉCRITURE, pas de code.

**Ce qui n'a même pas de créneau.** Le thème natal n'apparaît nulle part dans ce tableau, et ce n'est
pas un oubli : **il n'a aucun corpus déclaré**. `lib/domain/cartes-socle.ts` code son texte en
`NON_ECRIT` en dur. Toute surface qui prétendrait « expliquer ton thème » afficherait donc un tableau
d'éphémérides sans une ligne de sens. Le corpus d'astrologie natale est à créer entièrement.

Le **sens des cartes** est le seul corpus qui ne vit pas dans ce dossier, et c'est délibéré : il
porte `import "server-only"`, que `tests/corpus-architecture.test.ts` interdit ici. Toute sa valeur
tient à ce qu'il **ne franchisse jamais** la frontière client (AD-11 : « le catalogue de sens n'a
aucune représentation côté client avant la réponse de l'utilisatrice »), et `server-only` transforme
cette exigence en **échec de build**. Le poser dans `lib/corpus/` aurait obligé à percer une
exception dans une garde saine — et une garde à exceptions finit par n'en être plus une.

### Ce qui n'est PAS du corpus d'Anima

| Textes | Créneaux | Écrits | Qui les écrit |
|---|---|---|---|
| **Descriptions des cartes** (`description-cartes.ts`) | 21 | **0** | produites **avec les visuels**, en regardant l'image |

Une description dit ce qui est **dessiné** — *une porte entrouverte dans un mur de pierre, au
crépuscule* —, jamais ce que ça veut dire. Ce n'est pas une interprétation, donc FR-054 ne la réserve
pas à Anima ; les compter dans le total ci-dessus corromprait le seul chiffre qui dit où en est la
porte pré-lancement d'écriture. Le balayage qui les empêche de dériver vers le sens vit dans
`description-cartes.ts` et se prouve dans `tests/description-cartes.test.ts`.

Chaque corpus est **déclaré complet**, et les créneaux non écrits se rendent honnêtement
`non_ecrit`. Là où un texte de départ existe, il vient de `textes-de-base.ts` et n'est **pas signé** :
Anima reprend la main en remplaçant une entrée, sans toucher au code.

Les deux corpus de 2026-09-03 suivent exactement cette règle. Le **Big Five** croise ses cinq facteurs
avec trois positions (`bas`, `median`, `haut`) : un facteur sans position n'est pas un résultat, c'est
le nom d'une échelle, donc le couple est l'unité de sens et ce n'est pas le croisement que la 5.4
refuse. Le **Human Design** écrit ses cinq types, ses sept autorités et les **six lignes** du profil —
et pas les douze profils, qui seraient un produit cartésien sur ces mêmes six lignes, et dont la
complétude dépendrait d'une propriété de mécanique céleste plutôt que d'une décision d'écriture.

Les neuf créneaux d'ennéagramme sont l'axe MINIMAL — un texte par type. Les ailes (18), les instincts
(27), les flèches (18) et le croisement complet (54) sont des produits cartésiens sur les mêmes neuf
types, et la 5.4 a écrit la règle en refusant les siens : on garde l'axe qu'une personne identifie
comme ELLE, on refuse le croisement. Les dix-huit énoncés du test court, eux, ne sont **pas** du
corpus (ils n'interprètent rien) : ils vivent dans `lib/domain/enneagramme-items.ts`.

**Vue d'ensemble pour Anima** — `_bmad-output/implementation-artifacts/POUR-ANIMA-ce-qui-attend.md` :
les quatre piles dans l'ordre, les règles de voix, et les cinq questions dont la réponse décide de
ce qu'on construit ensuite (dont : à quoi sert le catalogue de sens, et faut-il le supprimer).

**Porte pré-lancement ouverte** — voir `sprint-status.yaml`, entrée « LE CORPUS D'ANIMA ». Par ordre
d'urgence : les 12 textes du **chemin de vie** (le seul nombre que les gens connaissent, il suffit à
rendre la carte vivante), puis les 12 de l'**expression**, puis les 45 restants. La fiche d'écriture
est `_bmad-output/implementation-artifacts/corpus-numerologie-a-ecrire.md`.

## Comment on écrit un créneau

```ts
import { ecrit } from "./port";
import { cleNumerologie } from "./numerologie";

// dans la table de CORPUS_NUMEROLOGIE :
[cleNumerologie("chemin_de_vie", 7)]: ecrit("…"),
```

`ecrit()` refuse une chaîne vide à la construction : un créneau vide déclaré « écrit » passerait le
compte de complétude et n'afficherait rien — le pire des deux mondes.
