---
baseline_commit: 9fb1958
---

# Story 7.1 : Écrire la halte « Ton socle » dans l'architecture de l'information

Status: done

## Story

En tant que Julian,
je veux que la halte « Ton socle » et le déplacement du plancher de cartes soient écrits et datés
dans `EXPERIENCE.md`,
afin qu'aucune story de l'Epic 7 ne construise contre le document qui gagne en cas d'écart.

**Couvre :** FR-055, FR-031 (DUR), FR-058 · UX-DR-11, UX-DR-30 (`epics.md:220`) · `EXPERIENCE.md`
lignes 62, 77, 86, 87, 144, 452, 505 · décision de Julian du 2026-08-25 (option B).

---

## Ce que cette story livre, en une phrase

**Zéro ligne de comportement.** Elle écrit six décisions dans le document contractuel d'UX, et pose la
garde de CI qui les empêche de se périmer en silence — parce que les treize stories suivantes de
l'Epic 7 vont toutes s'y appuyer.

---

## Les décisions, et pourquoi elles sont tombées comme ça

### 1. « Ton socle » est une entrée de **premier rang**, en **deuxième** position

L'alternative écrite dans la story était « ou une sous-entrée de Réglages ». Refusée pour deux
raisons qui ne sont pas de goût : Réglages est l'endroit où l'on **change** quelque chose
(`EXPERIENCE.md` ligne 77 : prénom, heure de naissance, thème, notifications), et « Ton socle » est un
endroit où l'on **regarde** ; et c'est l'écran qui rend **FR-055** vrai — la promesse « gratuit à
vie » ne peut pas vivre à deux niveaux de profondeur.

Deuxième et pas première : **« Aide et ressources » reste première, toujours** (FR-077). Deuxième et
pas dernière : le socle est ce que le produit savait **avant le premier mot**, « Ce qu'Anam retient »
est ce qu'il a appris **après**.

### 2. Le plancher des cartes passe de **4 à 3**, et il compte le **catalogue**

Catalogue retenu : `mantra`, `horoscope`, `enneagramme`.

**Écart assumé avec la rédaction de la Story 7.7**, qui rangeait `enneagramme` parmi « les trois
cartes qui ne changent jamais » et le retirait. Elle allait au-delà de ce que Julian a demandé : sa
remarque sur l'ennéagramme était l'**inverse** d'un retrait — « c'est à toi de dire : vous n'avez pas
encore fait votre ennéagramme, faites-le maintenant ». Retirer la carte retire le seul endroit où
cette phrase peut être lue par quelqu'un qui n'est pas parti la chercher. La 7.8 réécrit son texte ;
la 7.7 retire `theme` et `nombres`, et eux seuls.

**Ce que le plancher compte a dû être tranché aussi**, parce que deux gardes mesuraient deux nombres
différents en se réclamant toutes deux d'UX-DR-30 : l'assertion du module comptait le catalogue (5),
`tests/rendu/carte-anam.test.tsx` comptait les objets à l'écran (6). Le plancher gouverne le
**catalogue** ; la carte « Anam » (`EXPERIENCE.md` ligne 145) est un composant distinct rendu hors
grille et n'entre pas dans le compte. La 7.7 repose les gardes de rendu là-dessus.

### 3. Le refus de la grille d'icônes-rubriques est **tenu** — et son alternative est **chiffrée**

Julian a demandé « une page d'icônes scintillants, représentant les différentes rubriques ». Le
document la refuse deux fois (lignes 144 et 505). Le refus tient. **Mais l'issue inverse est écrite
d'avance avec son prix** (§4 de l'amendement) : la grille **REMPLACE** la bibliothèque, ne s'y ajoute
jamais, et coûte l'amendement des lignes 144 et 505, la perte d'objet de `lib/domain/bibliotheque.ts`,
le **changement de sujet** de `tests/bibliotheque-frontiere.test.ts` (jamais son assouplissement — la
garde FR-031 doit être reportée sur le type de la grille), et la réécriture des Stories 7.7 et 7.10.

Sans ce prix écrit d'avance, l'arbitrage se refait **à chaud** le jour où Julian insiste, et personne
ne sait ce qu'il coûte.

### 4. « Moi » reste un **lieu**, pas un hub de compte

Aucune entrée de compte ne déménage dans la région ; aucune rubrique nominative au-dessus du pli
(ligne 452) ; aucune icône d'état, aucun taux de complétude, aucune pastille (FR-031, DUR).

### 5. `/profil` disparaît — et son formulaire de nom ne se perd pas

Les six liens sont repris par `lib/domain/menu-compte.ts` (Story 7.2). Le **formulaire de nom**
(prénom, nom complet, avertissement « changer le nom complet recalcule les nombres ») déménage vers
`/reglages`, que la ligne 77 désigne déjà comme le lieu du prénom. C'est la seule partie de `/profil`
qui n'existe nulle part ailleurs : la supprimer sans la déplacer retirerait le seul moyen de corriger
son prénom.

---

## ⚠️ Le défaut trouvé en écrivant, que la story n'avait pas prévu

**Insérer une ligne dans le tableau d'architecture de l'information aurait invalidé une centaine de
citations, en silence.** Le dépôt cite `EXPERIENCE.md` **par numéro de ligne** depuis les
commentaires de code, les tests et `epics.md` — `EXPERIENCE.md:144` neuf fois, `:62` six fois, `:200`
sept fois, `:452`, `:505`, `:511`… Une ligne insérée en 74 décale tout ce qui suit. Aucune garde ne
l'aurait vu.

La story demandait pourtant d'ajouter la ligne « au même format que les autres ». Résolution : la
section est **ajoutée en fin de fichier** et y porte la ligne du tableau, au format exact ; les seules
retouches **en place** sont celles qui **conservent le nombre de lignes** (86 et 144). Vérifié par
`diff` sur les 608 premières lignes : deux lignes modifiées, zéro décalage.

---

## Ce qui a été touché

| Fichier | Ce qui change |
|---|---|
| `…/EXPERIENCE.md` | +163 lignes en fin de fichier (amendement daté) ; lignes 86 et 144 amendées **en place** ; `updated:` passe à 2026-08-25 |
| `_bmad-output/planning-artifacts/epics.md` | UX-DR-30 (ligne 220) : plancher 4 → 3, une seule ligne conservée |
| `lib/domain/bibliotheque.ts` | commentaire du catalogue réécrit ; assertion `< 4` → `< 3` |
| `tests/architecture-information.test.ts` | **nouveau** — 14 tests |
| `…/sprint-status.yaml` | Epics 7 à 12 ajoutés (48 stories), 7.1 à `done` |

---

## Contrôles

- **Suite complète** : 4220 verts, **131 rouges = la ligne de base exacte** (échecs de base seule,
  sans Postgres local). `tsc --noEmit` et `eslint` propres.
- **Campagne de mutation — 14 mutants, 14 tués.** Restauration par instantané `cp`, jamais
  `git checkout`.

| # | Mutant | Verdict |
|---|---|---|
| M1 | assertion `< 3` → `< 4` | tué |
| M2 | `epics.md` UX-DR-30 : `3 à 6` → `4 à 6` | tué |
| M3 | `EXPERIENCE.md` ligne 144 : `3 à 6` → `4 à 6` | tué |
| M4 | amendement §3 : `3 minimum` → `4 minimum` | tué |
| M5 | commentaire du module : `plancher de 3` → `plancher de 4` | tué |
| M6 | « Ton socle » retiré du menu (ligne 86) | tué |
| M7 | « Ton socle » déplacé en 3ᵉ position | tué |
| M8 | ligne de tableau « Ton socle » supprimée | tué |
| M9 | bloc « Issue B » supprimé | tué |
| M10 | marqueur `[REFUS TENU]` retiré | tué |
| M11 | destination du formulaire de nom effacée | tué |
| M12 | amendement entier supprimé | tué |
| M13 | assertion mise en commentaire, remplacée par `if (false)` | tué |
| M14 | catalogue réduit à 2 clés | tué |

M7 et M13 avaient d'abord échoué à **s'appliquer** (échappement `perl`). Un mutant qui ne mute rien
ne prouve rien : les deux ont été réécrits en Python et rejoués jusqu'à muter réellement.

---

## Ce que cette story laisse à la suivante

- **7.2** connaît désormais le placement exact de « Ton socle » (2ᵉ entrée, premier rang) et le sort
  de `/profil` (une seule surface de compte).
- **7.7** connaît le catalogue retenu (3 clés) et sait que la borne compte le catalogue, pas l'écran.
- **7.5** sait que « Ton heure de naissance » et « Ton type » vivent **sous la halte**, au contact du
  manque qu'ils corrigent.
- **Rien n'est bloqué.** Aucune porte externe, aucune décision en attente.
