# Sprint change — retours terrain du 2026-08-30

Six retours livrés d'un bloc. Trois étaient **déjà codés** et invisibles ; deux sont
corrigés ici ; le reste demande un arbitrage produit, pas du code.

## 0. La cause racine commune — et pourquoi trois retours sur six étaient des fantômes

La base de production était restée à la migration **`0080`** pendant que le code
promu était à **`0087`**. Mesuré le 2026-08-30 :

| | Avant | Après |
|---|---|---|
| `max(version)` en prod | `0080` | `0087` |
| `commencer/finaliser_ouverture_quotidienne_anam` | absentes | présentes |
| `reserver_quota_ia_atomique` | absente | présente |
| `ouverture_jour_anam`, `reservation_quota_ia` | absentes | présentes |

Les 7 migrations `0081→0087` ont été appliquées, l'historique enregistré, le cache
PostgREST rechargé, les grants `service_role` vérifiés.

`docs/deploiement-schema-sans-derive.md` l'interdisait explicitement — « **Ne jamais
inverser les étapes 4 et 6** » (appliquer les migrations AVANT de promouvoir le
code). L'inversion a eu lieu parce que la porte `--promotion` ne pouvait pas tourner
faute d'accès Supabase dans le build Vercel, et qu'elle a été rendue non bloquante
le 2026-08-28 pour débloquer quatre promotions en ERROR.

**⚠️ La dette est donc toujours ouverte** : rien n'empêche aujourd'hui la même
inversion de se reproduire. Voir la story `OPS-1` ci-dessous.

### Ce que ça explique, retour par retour

| Retour | Verdict |
|---|---|
| « Anam n'a pas pu ouvrir la session, réessayer en boucle » | **Corrigé par les migrations.** `schema-incompatible` → le seul bouton offert était `window.location.reload()`, qui relançait le même échec. Composeur verrouillé pendant ce temps. |
| « rajouter l'option : je sais pas » | **Déjà codé** (Story 13.8), inerte faute de la migration `0087`. Actif depuis. |
| « quelle question de merde — *Plusieurs façons de te lire arrivent à égalité* » | **Déjà supprimé** du dépôt. Remplacé par « Le résultat reste ouvert », sans demande de choisir un numéro de type. La Server Action `departagerExAequo` a disparu, et un test interdit son retour. |
| « expliquer ce que c'est, sur quoi ça se fonde, toggle par type » | **Partiellement déjà codé** — voir `ENN-1` à `ENN-3`. |
| « This page couldn't load / je dois reload » | **Corrigé ici** (commit de ce sprint). |
| « numérologie plus factuelle » | **Corrigé ici** (commit de ce sprint), reste `NUM-1`. |

## 1. Livré dans ce sprint

- **Reprise unique sur la lecture d'onboarding.** `etapeOnboardingPour` était le seul
  `throw` nu du rendu de `/` ; tout le reste de `app/page.tsx` est gardé par un
  `.catch()`. Un JWT dont l'`iat` devance l'horloge Postgres rendait un 500 franc.
  La garde reste intacte : une panne durable lève toujours.
- **La preuve arithmétique remonte hors du pli** en numérologie. Elle existait,
  complète et testée, mais dans un `<details>` fermé sous un nombre en `t-display`.

## 2. Ce qui reste — stories à arbitrer

### `ENN-1` — Les neuf repères s'appellent « Type 1 »… « Type 9 »
Le `<summary>` de chaque volet du toggle est un numéro nu. On demande à quelqu'un qui
ne connaît pas l'ennéagramme de choisir quoi ouvrir parmi neuf numéros.
**Aucun nom de type n'existe nulle part dans le dépôt** — les nommer est une écriture,
donc la voix d'Anima (FR-086), donc pas notre main. **Décision attendue :** demander
neuf intitulés à Anima, ou dériver le `<summary>` de la première proposition du texte
existant.

### `ENN-2` — Le toggle montre le texte du RÉSULTAT
`reperesPourIntroduction()` et l'écran de résultat lisent la même clé de corpus. Lire
les neuf avant de répondre, c'est voir la réponse avant de passer le test.
**Décision attendue :** neuf textes courts et distincts pour l'introduction, ou
assumer le spoiler, ou déplacer le toggle après le test.

### `ENN-3` — « Sur quoi ça se fonde » n'est pas répondu
L'intro dit « il se fonde uniquement sur tes réponses », ce qui décrit la MÉTHODE
d'ici, pas l'origine ni le statut scientifique de la grille. Le sprint change du
2026-08-26 cite pourtant Hook et al. 2021 et assume « preuves mixtes ». Rien
n'atteint l'écran. **Décision attendue :** afficher le statut de preuve, comme
`/psychologie` le fait déjà pour Big Five (« la grille de score doit encore être
validée »).

### `ENN-4` — « Je ne sais pas » n'a pas d'icône dessin
Demandé : « un icône dessin qui représente les 4 réponses possibles ». Les 4 niveaux
ont bien un glyphe (répété `niveau + 1` fois) ; « Je ne sais pas » porte un `?`
typographique, et `tests/rendu/enneagramme-halte.test.tsx:192` **exige** qu'il n'ait
aucun `<svg>`. Le distinguer visuellement est délibéré : ce n'est pas un cinquième
degré sur l'échelle. **Décision attendue :** garder le `?`, ou changer la garde.

### `ENN-5` — ~41 % des passages finissent sans type
Chiffre du sprint change du 2026-08-26, sur 18 items. L'écran « Le résultat reste
ouvert » est donc l'issue la plus fréquente après une issue typée. Les « questions de
précision » prévues à l'étape 4 de ce plan **ne sont pas implémentées**. C'est le plus
gros reste fonctionnel du parcours.

### `NUM-1` — L'aperçu `/socle` ne porte pas la preuve
`apercusPourFiche` ne pousse que `{intitule, valeur}` : deux nombres nus sous
l'accroche « Tes repères essentiels, avec chaque calcul vérifiable ». La promesse
n'est tenue qu'un clic plus loin. Ajouter un champ impose de le refléter à
l'identique dans `render/socle/types.ts` (`tests/socle-frontiere.test.ts`).

### `OPS-1` — Rien n'empêche la prochaine dérive base/code
La porte `--promotion` est un `console.warn` quand les accès manquent, et le build
Vercel ne les aura jamais. **Recommandation :** déplacer la vérification dans la CI
GitHub, où les secrets ont leur place, et l'y rendre bloquante.

## 3. Dettes documentaires corrigées au passage

Deux en-têtes affirmaient que les textes de corpus n'étaient pas écrits, plus d'une
semaine après leur livraison — `lib/corpus/numerologie.ts` (« VOLONTAIREMENT VIDE DE
TEXTE », 69 écrits) et `lib/corpus/enneagramme.ts` (« tous `non_ecrit` », 9 écrits).
Le dépôt note que ce piège avait déjà coûté une demi-journée. Les deux renvoient
désormais à `lib/corpus/README.md`, que `tests/corpus-etat.test.ts` recalcule.
