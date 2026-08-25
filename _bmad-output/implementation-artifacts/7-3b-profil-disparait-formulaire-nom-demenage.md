---
baseline_commit: e58de95
---

# Story 7.3b : `/profil` disparaît — et son formulaire de nom déménage

Status: done

## Story

En tant que Julian,
je veux qu'il n'existe plus qu'une seule surface de compte,
afin que deux listes ne divergent pas au premier ajout — et sans perdre au passage le seul moyen de
corriger un prénom.

**Couvre :** amendement d'`EXPERIENCE.md` du 2026-08-25 §6 · `EXPERIENCE.md` ligne 77 · FR-058 ·
AD-7, AD-10, AD-12 · **extraite de la 7.3**, qui était déjà large.

---

## Ce qui a bougé

`/profil` a été livré le **2026-08-23** en réponse d'urgence à « il manque un bouton Profil » : une
page pleine listant six liens, faute de menu de compte. La Story 7.3 a livré le menu ; cette
page-ci n'avait plus d'objet, sauf pour **une** chose qui n'existait nulle part ailleurs.

| Ce qui disparaît | Ce qui arrive |
|---|---|
| `app/profil/` (page, action, loading) | `render/reglages/FormulaireNom.tsx` |
| `render/profil/` (composant, CSS) | la copie du nom dans `copie-reglages.ts` |
| `lib/domain/copie-profil.ts` | `enregistrerNom` dans `app/reglages/actions.ts` |
| l'entrée `profil` de `pied-halte.ts` et de `HORS_MENU` | |
| `URL_PROFIL` dans `lib/scene/surimpression.ts` | |

Le formulaire est **en tête** de `/reglages`, et ce n'est pas de la mise en page : `EXPERIENCE.md`
ligne 77 range le prénom dans Réglages **depuis le 2026-07-21**, et c'est ce qu'on vient changer le
plus souvent — le rythme quotidien se règle une fois.

`URL_CORRIGER_LE_NOM` et la porte « Ton nom » pointent désormais sur `/reglages`. Comme annoncé dans
la 7.5 : **une seule ligne à changer**, et elle a changé.

---

## Contrôles

- **Suite complète** : 4331 verts, **131 rouges = la ligne de base exacte**. `tsc`, `eslint`,
  `next build` propres — `/profil` a disparu du manifeste de routes.
- **Campagne de mutation — 9 essais, 9 tués** (dont 2 après correction des gardes).

| # | Mutant | Verdict |
|---|---|---|
| R1 | la copie du nom disparaît avec `/profil` | tué |
| R2 | le formulaire monté **sous condition** (`{false && …}`) | **a SURVÉCU** → garde corrigée, puis tué |
| R3 | l'action d'enregistrement ne suit pas le déménagement | tué |
| R4 | le lien de correction du nom pointe encore sur `/profil` | tué |
| R5 | la porte « Ton nom » **renommée** en n'importe quoi | **a SURVÉCU** → garde corrigée, puis tué |
| R6 | la porte « Ton nom » supprimée du socle | tué |
| R7 | l'action n'est plus branchée sur le formulaire | tué |

**R2 est la même faute que P9, le même jour.** Ma garde cherchait `<FormulaireNom` **n'importe où**
dans la page : `{false && <FormulaireNom` la laissait verte, et le formulaire n'était plus rendu du
tout. Une garde qui lit un **texte** au lieu d'un **câblage** ne garde rien. Elle refuse désormais
un montage conditionnel et vérifie que l'action est branchée.

**R5 a montré qu'une garde d'URL ne suffit pas.** Vérifier les seules cibles laissait passer une
porte **renommée** : le lien menait au bon endroit et ne disait plus où il menait — une porte perdue
pour qui la cherche des yeux. Les titres sont assertés.

---

## ⚠️ Le +1 de la ligne de base, et comment il a été trouvé

La suite est passée de **131 à 132** échecs, sans qu'aucun test visible ne change. La méthode qui a
tranché est celle du 2026-08-22 : un **worktree détaché sur HEAD**, avec `.env.test.local` copié
pour que les deux mesures soient comparables, puis un **diff des titres de tests en échec** entre
les deux arbres — un seul nouveau, nommé.

La cause : `tests/stripe-checkout-garde.test.ts` lit la liste de `git ls-files` et ouvre chaque
fichier. `app/profil/actions.ts` était supprimé du disque mais **encore dans l'index**. Ce n'était
donc pas une régression, c'était un état d'index — et deviner l'aurait été tout autant que le nier.

---

## Ce que cette story laisse

La suite `navigateur` de la CI a rendu son premier verdict le même jour : **73 passés, 17 échoués**.
Six de ces échecs sont des spécifications **périmées** (`/reperes` a été replié dans `/aide` le
2026-08-23) ; les autres sont des **défauts réels** — dont la scène mesurée à **4 im/s** pendant le
tour guidé, et le signe d'Anam à **1087 ms**. Ils appartiennent aux Epics 8 et 11, et ils ont
maintenant un chiffre.
