---
baseline_commit: 7cbed22
---

# Story 7.2 : Le catalogue du menu de compte — le modèle, et sa garde de frontière

Status: done

## Story

En tant qu'utilisatrice,
je veux que les entrées de mon compte forment une liste unique et toujours dans le même ordre,
afin de retrouver chaque chose à la même place, sans jamais y voir de compteur ni de pastille.

**Couvre :** AD-1, AD-7, AD-10 · FR-031 (DUR), FR-077, FR-012 · UX-DR-11 · `EXPERIENCE.md` lignes 73
et 86 (amendée le 2026-08-25) · `deferred-work.md:899-903` · dépend de 7.1 et de 7.5 (faites).

---

## Ce que cette story livre, en une phrase

**Le modèle, pas l'écran** : un catalogue gelé de neuf entrées, sa garde de frontière écrite **avant**
le composant, et la fin de la seconde liste d'entrées de compte.

---

## Ce module est la réponse à dix commentaires écrits dans le dépôt

« elle n'est atteignable que par URL tant que le menu de compte n'existe pas » — `app/reglages`,
`app/lectures`, `app/memoire`, `app/ancrages`, `lib/courriel/gabarits.ts`, `deferred-work.md` (×4), et
jusqu'à `app/(auth)/consentement/revoquer/page.tsx` qui l'écrivait déjà en **Story 1.6**.
`EXPERIENCE.md` le spécifie depuis le 2026-07-21 et il n'a jamais été construit.

---

## Les décisions

### La garde est écrite AVANT le composant, et c'est la moitié de la story

Une garde écrite **après** garde ce que le composant fait déjà — elle grave l'existant, défauts
compris. Écrite avant, elle dit ce que le composant **aura le droit** de faire. La 7.3 dessinera la
feuille ; ce fichier fixe d'avance ce qu'elle ne pourra pas y mettre.

Le défaut visé est nommé : **le compte fuit par le type** (leçon 4.10 puis 5.6). La façon naturelle
de poser une pastille de non-lu sur « La synthèse » n'est pas d'écrire du CSS, c'est d'ajouter
`aDuNouveau` au type — et le rendu suit tout seul. `EntreeMenu` a **trois champs, tous `string`**, et
le test l'asserte champ par champ et forme par forme.

### « Ce que j'ai accepté » mène à une page de confirmation, et c'est ÉCRIT plutôt que masqué

`EXPERIENCE.md` ligne 74 décrit une surface de **consultation** du consentement art. 9, révocable
(FR-012). Elle n'existe pas : la seule page du sujet s'intitule « **Retirer ton consentement** ».

Deux mauvaises sorties étaient possibles. **La retirer du menu** : FR-012 exige que la révocation soit
atteignable, et l'omettre rendrait un droit dépendant d'une URL connue. **La laisser avec un
sous-titre neutre** : on clique pour relire et on atterrit sur retirer — un sursaut, pas une
navigation. Elle reste, et **son sous-titre dit la destination**. La page de revue est un manque
nommé dans le module, pas un oubli.

### Un inventaire, pas une liste

Même renversement de charge que `pied-halte.ts` : **toute halte du produit est soit dans le
catalogue, soit dans `HORS_MENU` avec un motif écrit**. Sans cet inventaire, une halte livrée demain
resterait atteignable par URL seule — la dette exacte que cette story solde, reconstituée en silence.

### Les deux entrées qui quittent `/profil` sans entrer dans le menu ne sont pas perdues

« Ton heure de naissance » et « Ton type » vivent sous la halte « Ton socle » (`PORTES_DU_SOCLE`,
amendement §1), **au contact du manque qu'elles réparent** : on découvre qu'il manque son heure en
regardant son ciel, pas en ouvrant une liste de réglages. Et elles y sont **même quand rien ne
manque** — une porte qui n'apparaît qu'en cas de problème est une porte qu'on ne trouve pas quand on
la cherche.

---

## Ce qui a été touché

| Fichier | |
|---|---|
| `lib/domain/menu-compte.ts` | **nouveau** — 9 entrées gelées + `HORS_MENU` motivé |
| `lib/domain/copie-profil.ts` | `ENTREES` **supprimée** ; le formulaire de nom reste (il n'existe nulle part ailleurs) |
| `app/profil/page.tsx` | consomme `ENTREES_MENU` |
| `lib/domain/copie-socle.ts`, `fiche-socle.ts`, `render/socle/*` | la section « Ce que tu peux changer » |
| `tests/menu-compte-frontiere.test.ts` | **nouveau** — 16 tests |

---

## Contrôles

- **Suite complète** : 4293 verts, **131 rouges = la ligne de base exacte**. `tsc`, `eslint`,
  `next build` propres.
- **Campagne de mutation — 10 mutants, 10 tués.**

| # | Mutant | Verdict |
|---|---|---|
| P1 | « Aide et ressources » n'est plus première (FR-077) | tué |
| P2 | « Ton socle » retiré du catalogue | tué |
| P3 | `EntreeMenu` gagne `aDuNouveau: boolean` | tué |
| P4 | une URL qui ne mène nulle part | tué |
| P5 | `/ancrages` entre dans le menu | tué |
| P6 | le motif d'exclusion d'`/ancrages` s'efface | tué |
| P7 | l'heure de naissance perd son verdict d'inventaire | tué |
| P8 | une seconde liste d'entrées renaît dans `copie-profil` | tué |
| P9 | `/profil` sert une liste vide | **a d'abord SURVÉCU** → garde corrigée, puis tué |
| P10 | le catalogue cesse d'être gelé | tué |

**P9 est la trouvaille de la campagne.** Ma garde cherchait la chaîne « ENTREES_MENU » **n'importe où
dans le fichier** : remplacer `entrees={ENTREES_MENU}` par `entrees={[]}` la laissait verte, puisque
la ligne d'import contient toujours le mot. La page aurait servi un menu **vide** sans qu'une ligne
ne rougisse. La garde lit désormais le **câblage** de la propriété, pas l'import.

---

## Ce que cette story laisse à la suivante

- **7.3** n'a plus qu'à dessiner : le glyphe, la feuille, le piège de propagation du pointeur, le
  « ? » qui ne bouge pas — et à repointer `URL_CORRIGER_LE_NOM` vers `/reglages` en déplaçant le
  formulaire de nom, ce qui fait disparaître `/profil`.
- **7.4** compte ses clics sur ce catalogue.
