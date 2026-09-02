# Sprint Change Proposal — retours terrain n° 2 (Julian + Anima), 2026-09-02

Artefact BMAD de synthèse. Base : plan « bmad » (jugé meilleur 34/35), greffes des plans « valeur » et « doctrine », corrections des deux jugements, revérification dans le dépôt à HEAD `7199e98` (branche `claude/anam-logout-button-e2ly08`) le 2026-09-02.

Règles d'écriture encodées pour TOUTE copie de ce lot (il n'existe pas de skill « humanizer ») : zéro U+2014 (« — » devient « : » quand la suite explique, « , » quand elle précise, « . » + majuscule quand c'est une phrase) ; tutoiement ; une ou deux phrases ; indicatif présent ; jamais d'impératif adressé (« Écris », « Indique », « Raconte ») ; rassurant sans promesse d'état (`lexique-interdit.ts:143-146`) ni futur adressé (`marqueurs-prediction.ts`, FR-053) ; apostrophe typographique « ’ » ; chiffres en toutes lettres là où FR-031 balaie ; aucun mot de la liste INTERDITS de `tests/tronc-absence.test.ts:70-91` (flou, pastille, badge, premium, offre, %, incomplet).

Commande de test locale (pas de Docker, l'environnement pointe sur la base distante) : `env -u SUPABASE_URL -u NEXT_PUBLIC_SUPABASE_URL npx vitest run <fichiers>`. Les specs `e2e/` ne tournent qu'en CI (`supabase start` + Playwright) : chaque story qui touche `e2e/` attend le feu vert CI de sa PR.

⚠️ Des sessions parallèles écrivent dans l'arbre de travail (tâches #4, #5, #6, #9, #10 « in_progress »). Relire `git status` avant chaque story et ne jamais écraser un fichier modifié non commité.

---

## 0. Contexte et ce qui est DÉJÀ fait (preuves)

### 0.1 Commité à HEAD 7199e98

| Retour | Fait | Preuve |
|---|---|---|
| 9 GRAINE | **Livré entièrement.** `GraineAttente` (SVG, souffle 0,975→1,025 sur la courbe du lotus, soulèvement 3 unités sans ressort, halo en opacité, `reduced-motion` fixe) est intégrée à l'étape 0 ; le moteur ne peint plus la graine ; les gardes « aucun svg » sont amendées. | `2311aed`, `72cc015` ; `render/arbre/ArbreInteractif.tsx:37,460` ; `render/arbre/arbre.module.css:131-137` (`.graineAttente`, top 54,61 %) ; `render/arbre/graine-attente.module.css:58-101` ; `tests/rendu/graine-attente.test.tsx` (13 cas), `tests/rendu/graine-integree.test.tsx:116-229`. « Rebondir » est traduit en souffle + soulèvement par l'en-tête de `GraineAttente.tsx:20-27` (charte DESIGN.md:139 `rebond: 'interdit'`, :475). Reste : rien d'obligatoire (spec e2e optionnelle, §4). |
| 10 NUMÉROLOGIE (69 textes) | **Livré.** Les 69 lectures commencent par « Ton chemin de vie 7 symbolise… » / « Ton année personnelle 4 est traditionnellement une année de… », tutoiement, zéro tiret, ≤ 360 caractères ; gardé par `tests/corpus-architecture.test.ts:454-548` (bloc « [2026-08-31] »). | `7199e98` ; `lib/corpus/textes-de-base.ts:38-55` (note d'en-tête), `:178`, `:245`. Reste : harmoniser la date de la note (« 2026-08-31 » → retour reçu le 2026-08-31, livré le 2026-09-02, à dire), amender `CAHIER-CORPUS-ANIMA.md:433` (« il ne les répète pas », toujours en place), retirer « d’Anima » du titre (E2-S1). |
| 8 VILLES HOMONYMES (domaine) | **Domaine livré.** `LieuNaissance` porte `population`, `departement: { code, nom }`, `libelle` (« Saint-Denis (93) », « Saint-Denis (974) », « Ajaccio (2A) ») ; tri par population décroissante ; 101 départements dans `communes-france.json`. | `7e1f53d` ; `lib/astro/lieux.ts:42-68`, `codeDepartement` L126, `libelleLieu` L139 ; `lib/astro/adapters/lieux-france.ts:107` (`parPertinence`) ; `tests/lieux.test.ts:150-157`. Reste : le formulaire rend encore `{l.nom}` seul (`app/heure-naissance/formulaire-heure.tsx:209`) et le fixture `tests/rendu/heure-naissance.test.tsx:124-129` ment (`nom: "Bordeaux (33)"`). |
| 2 AVATAR (asset) | **Asset livré.** Anam détourée corps entier, pied intact, 6 formats (`png/webp/avif` × 1x 200×260 / 2x 400×520, RGBA). | `10870cf` ; `public/scene/seuil/anam-seuil*` ; `scripts/generer-assets-anam.mjs:36` (`plumer: false`). `ImageAnam` accepte déjà `format: "seuil"` (`render/conversation/ImageAnam.tsx:20`), style `.imageAnam.seuil` jamais monté (`conversation.module.css:252-255`, `min(58vw, 19rem)`, 4/5). Reste : rien n'est monté au seuil (`render/scene-dom.tsx:607-669` rend l'arbre-décor et aucune image). |
| 2 ÉTOILES (module) | **Module pur livré, testé, non intégré.** `render/seuil/remplissage-etoiles.ts` (DUREE 4 500 ms, MAX 500 étoiles, DPR ≤ 2, 400×520, rAF arrêté à la fin, reduced-motion = une trame) + `tests/rendu/remplissage-etoiles.test.ts`. | `55496e0`, `6d75d7f`. Aucun import dans `render/`/`app/` (grep = 0). |
| 10 NUMÉROLOGIE (toggles) | Les deux toggles validés (« La méthode de calcul », « Voir le calcul ») et la preuve hors du pli existent. | `1cdd85d` ; `render/socle/FicheSocle.tsx:165-170, 197-203`. |
| 8 « passer sans heure » | Déjà possible : case `sans_heure` (`formulaire-heure.tsx:158`), thème `midi_par_defaut`, horoscope calculé sans heure ; gardé par `tests/heure-naissance-actions.test.ts:273-357`. | vérifié |
| 1 fond | Le retour « violet plein ennuyeux » du 2026-08-20 a déjà produit un fond en 4 couches, voie lactée, lune, 80 étoiles, grain sans blend. | `render/monde.module.css:30-50, 155-192, 228-253`, `e2e/ligne-de-base.json` |

### 0.2 En cours dans l'arbre de travail (NON commité, sessions parallèles)

`git status` au moment de la synthèse :
- **« Trois places » → « Trois dimensions »** (retour 6) : `render/premier-passage.tsx:65-70` (h2 « Trois dimensions », commentaire daté), `render/reperes/Reperes.tsx:53-56` (aria-label + h2 « Les trois dimensions »), `lib/domain/copie-reperes.ts:80-88` (« d’une dimension à l’autre », « changer de dimension »), `tests/rendu/premier-passage.test.tsx:53` (`toBe("Trois dimensions")`), **NEUF** `tests/trois-dimensions.test.ts` (refuse « trois places », « d’une place à l’autre », « changer de place » dans les deux surfaces, commentaires retirés). Choix pris : renommer en place, littéral gardé par test (AD-7, `lib/domain/premier-passage.ts:9-15` justifie que ce bloc porte ses phrases). **Manque** : `e2e/premier-passage.spec.ts:31,38,57` et `e2e/reperes.spec.ts:65,99` disent encore « Trois places » / « Les trois places » (E1-S3).
- **« Chemin de vie (7) »** (retour 10) : `lib/domain/fiche-socle.ts:299-317` compose `intitule: \`${intitule} (${valeur})\`` pour la lecture seule (grille et aperçu nus, « Expression (11) » jamais « (11/2) »), `render/socle/FicheSocle.tsx:224-226` (commentaire, rendu inchangé), `tests/fiche-socle.test.ts` (+73 lignes), `tests/rendu/fiche-socle.test.tsx` (+51). À relire puis commiter (E2-S1).

### 0.3 Rien n'est fait pour

Tagline et bouton du seuil (`scene-dom.tsx:650`, `:668`) ; région « Moi » (`lib/scene/regions.ts:44`) ; tutoriel (6 étapes, 6 tirets, « Et si tu perds le fil » `copie-guide.ts:137`) ; ouverture d'Anam (`ouverture-seance.ts:138,160,188`) ; tirets (aucune garde, aucune règle dans `consigne-voix.ts`) ; palette (`tokens.ts:16-33` toujours `#0C0A1E`/`#8FC1EF`, 0 occurrence de Soft Balance) ; horoscope dans `/socle?univers=astrologie` (`app/socle/page.tsx:104-108` ne lit pas `lireSocleQuotidien`) ; bloc sans-heure en bas de la section (`FicheSocle.tsx:310-316`) ; positions dépliées (`:277-293`) ; ennéagramme (`introduction.tsx:22-34`, deux niveaux de `<details>`).

### 0.4 Faits qui recadrent le lot

1. **FR-086 ne protège pas les textes de base contre Julian.** `lib/corpus/textes-de-base.ts:1-24` : toute la table (mantras, 27 horoscopes, 9 repères, 69 nombres) est faite de « textes de départ » écrits sur décision de Julian du 2026-08-23 (« tu dois faire les cartes de base, et Anima corrigera »), non signés, remplaçables clé par clé, dans cette seule table (`corpus-architecture.test.ts:426-449`), sous `lexique-voix` et sous le détecteur de futur adressé. Le fondateur peut donc les faire réécrire. Ce que FR-086 interdit, c'est l'ATTRIBUTION : `TITRE_LECTURE_NUMEROLOGIE = "Lecture symbolique d’Anima"` (`copie-socle.ts:66`) l'enfreint déjà.
2. **« Rebondir » et « écran de chargement long » sont traduits, pas copiés.** Charte : `rebond: 'interdit'` (DESIGN.md:139), « aucun rebond, aucun ressort, aucun overshoot » (:475), « le fondu de région est la seule grammaire de mouvement » (`monde.module.css:6-10`), gate `e2e/fluidite.spec.ts:46` (≥ 60 % de `/aide`, seuil déjà à 5 im/s mobile à cause des 80 étoiles, `ligne-de-base.json` « _mesure_des_couches_2026-08-26 »). Le remplissage d'étoiles n'est PAS cyclique (il s'arrête) : c'est ce qui le rend admissible ; le seuil n'attend rien, donc la porte reste un geste (0045).
3. **« Aujourd’hui » a déjà deux sens dans le produit** : h2 de la section quotidienne (`render/accueil/Bibliotheque.tsx:52`, gardé par `tests/rendu/bibliotheque.test.tsx:55`) et séparateur du fil (`render/conversation/Fil.tsx:193-194`). Deux entêtes homonymes sur un écran = défaut documenté (`copie-guide.ts:53-57`) : on renomme le h2 interne, on exempte le séparateur.
4. **La palette brute ne tient pas le gate** : Gray 1,78 et Periwinkle 2,74 sur Ivory. Déclinaison « nuit navy » (fond #1C2740 dérivé de Navy #33415E) recalculée ici avec la formule WCAG : 18/18 paires nuit vertes (min 3,24 bordure-forte/surface-elevee), 9/9 paires clair (min 4,83), voile fond@85 % sur blanc : texte 8,06, texte-doux 5,43. Ivory en fond natif est refusé par la doctrine (`globals.css:6-8`, DESIGN.md:303, `tests/accessibilite.test.ts:25-27`).
5. **`e2e/barre-basse.spec.ts:83-125` ne stocke aucune ligne de base pixel** : deux `page.screenshot` du même run comparés entre eux (L104, L116). Rien à régénérer après la palette ou le renommage.
6. **`URL_AJOUTER_SON_HEURE` (`copie-socle.ts:46-49`) et `PORTES_DU_SOCLE` (`:85-89`) sont deux objets distincts** : changer le libellé du premier ne touche pas `tests/rendu/fiche-socle.test.tsx:308-325`.

---

## 1. Epics et stories

### E1 — Voix et concision (retours 3, 4, 5, 6, 7, 12)

Objectif : chaque texte du produit tient en une ou deux phrases, tutoie, rassure, n'ordonne pas, ne porte plus un tiret cadratin ; les mots de navigation sont ceux du fondateur (« Commencer », « trois dimensions », « Aujourd’hui »).

#### E1-S1 — La garde « zéro cadratin », écrite EN PREMIER, en rouge
Retours : 12, 5. Effort : S (la garde seule ; les réécritures sont E1-S7).

Critères :
- NEUF `tests/copie-sans-cadratin.test.ts` sur le patron de `tests/qa-visuelle-19-aout.test.ts:114-181` (chaînes `"…"`/`` `…` `` + texte JSX, commentaires retirés) sur `app/**/*.{ts,tsx}`, `render/**/*.{ts,tsx}`, `lib/**/*.ts` : aucun U+2014.
- EXEMPTS nommés avec leur preuve : `lib/domain/export-lisible.ts` (valeur vide « — » L113, figée par `tests/export-lisible.test.ts:166`) ; `lib/courriel/gabarits.ts` (signature « — Anam » L60/L193, exigée par `tests/retention-avis.test.ts:41`) ; `lib/domain/bilan.ts:22` (classe regex) ; consignes modèle (`consigne-voix.ts`, `consigne-phase.ts`, `consigne-synthese.ts`, `consigne-lecture.ts`, `consigne-bilan.ts`, `consigne-compactage.ts`, `contexte-anam.ts`, `retour-theme.ts`, `reconceptualisation.ts`, `signaux-arc.ts`, `enneagramme-hypothese.ts` L86/L88 seulement : exempter par ligne ou scinder) ; `lib/safety/corpus-detresse.ts`, `detecteur-detresse.ts`, `consigne-detresse.ts` ; `lib/domain/pied-halte.ts`, `inventaire-export.ts`, `inventaire-effacement.ts` (motifs internes/export HTML, à réécrire plus tard) ; `console.*`/`throw`.
- Méta-test « chaque exemption est nécessaire » (patron `tests/lexique-voix.test.ts:50-56`) et [CONTRÔLE DU CONTRÔLE] : une chaîne piégée est attrapée ; le balayage voit > 150 fichiers.
- Le premier run liste les fautifs : c'est l'inventaire exact (≈ 92 chaînes affichées, ±5 ; inventaire brut vérifié : 220 occurrences hors commentaires dont 23 `consigne-phase.ts`, 12 `pied-halte.ts`, 12 `corpus-detresse.ts`, 9 `inventaire-export.ts`).

Fichiers : `tests/copie-sans-cadratin.test.ts` (NOUVEAU). Tests à ajuster : aucun. Risques : la garde est rouge jusqu'à E1-S7 ; la commiter avec `it.skip`-free mais dans la même PR que les réécritures, ou commiter d'abord la liste d'exemptions et laisser le run rouge guider (recommandé : même PR, commit séparé).

#### E1-S2 — Seuil : nouvelle tagline, bouton « Commencer », copie descendue de `lib/domain/copie-seuil.ts`
Retours : 3, 4, 12. Effort : S.

Critères :
- `lib/domain/copie-seuil.ts` (NOUVEAU, module pur gelé) exporte `TITRE_SEUIL = "Anam"`, `PHRASE_SEUIL`, `PORTE_SEUIL = "Commencer"`.
- `app/page.tsx:155-166` passe `seuil={{ titre: TITRE_SEUIL, phrase: PHRASE_SEUIL, porte: PORTE_SEUIL }}` (même patron que `guide={{…}}`, `menu={{…}}`) ; `render/scene-dom.tsx` reçoit la prop (interface `ProprietesSceneRendue` L50-60, destructuration L222-270) et rend `{seuil.titre}` L640, `{seuil.phrase}` L650, `{seuil.porte}` L668 ; plus aucun littéral.
- Le h1 reste exactement « Anam » (`e2e/seuil.spec.ts:54`). La phrase passe en classe `t-corps` (voix produit ; doctrine `t-anam` = Anam parle, `tests/deconnexion.test.ts:132-137`, et `tests/socle-incomplet.test.ts:232` classe déjà la tagline comme promesse du produit) : vérifier que `.seuilTexte p` (`monde.module.css:712-731`) ne dépend pas de `t-anam` pour sa taille.
- Le bouton garde `className={s.affordance}` (min-height `--cible-tactile`, `monde.module.css:805-830`) et `onClick={() => aller("accueil")}` ; passer `.affordance` en bouton plein (`background: var(--accent); color: var(--sur-accent)`) pour « l'effet wow » (décision D2).
- Le commentaire `scene-dom.tsx:653-662` reste, sa citation L657 (« entrer dans le monde ») est mise à jour.
- Les 20 occurrences de `/entrer dans le monde/i` dans 9 fichiers e2e deviennent `/^Commencer$/` : `e2e/_entrer.ts:57` EN PREMIER (échec silencieux sinon : `isVisible().catch(() => false)`, toute la suite cliquerait dans un seuil inert) ; `e2e/seuil.spec.ts:76,205,217,229,256` ; `e2e/barre-basse.spec.ts:89,139,182,221` ; `e2e/fluidite.spec.ts:61,114,177` ; `e2e/premier-passage.spec.ts:26` (+ commentaire L16) ; `e2e/scene-imagerie.spec.ts:53,85` ; `e2e/glissement.spec.ts:106` ; `e2e/guide.spec.ts:39` ; `e2e/reperes.spec.ts:34`.
- NEUF `tests/copie-seuil.test.ts` : `PORTE_SEUIL === "Commencer"` ; `PHRASE_SEUIL` : 0 U+2014, ≤ 2 phrases, aucun `/bonjour|bonsoir/i`, `chercherInterdits()` et `chercherPredictions()` vides (`lib/domain/lexique-interdit.ts:272`, `marqueurs-prediction.ts:266`), aucun motif INTERDITS de `tronc-absence.test.ts:70-91` ; frontière : `app/page.tsx` contient `seuil={{`, `render/scene-dom.tsx` (commentaires retirés) ne contient ni « ne te jugera », ni « entrer dans le monde », ni « Commencer ».

Tests à ajuster : les 20 lignes e2e ci-dessus ; `tests/socle-incomplet.test.ts:232` (commentaire). Risques : « Commencer » existe capitalisé sur `/enneagramme` (`test-court.tsx:135`, `enneagramme-halte.test.tsx:101`) : haltes différentes, pas de collision, mais la casse capitalisée rompt l'« invitation basse » (D2). `e2e/_entrer.ts:32` (`/continuer|commencer|suivant/i`) vise `/naissance`, ne pas le réutiliser au seuil.

Copie proposée :
- `PHRASE_SEUIL` : « Un lieu qui t’appartient : un espace d’échange, pour te comprendre et évoluer à ton rythme. »
- Variante courte : « Un espace à toi, pour échanger, te comprendre et avancer à ton rythme. »
- `PORTE_SEUIL` : « Commencer » · `TITRE_SEUIL` : « Anam »

#### E1-S3 — « Trois dimensions » : commiter l'arbre de travail, aligner les specs e2e
Retour : 6. Effort : XS. Déjà fait : tout le code (§0.2).

Critères :
- Commiter tel quel : `render/premier-passage.tsx`, `render/reperes/Reperes.tsx`, `lib/domain/copie-reperes.ts`, `tests/rendu/premier-passage.test.tsx`, `tests/trois-dimensions.test.ts` (exécuter `tests/trois-dimensions.test.ts tests/rendu/premier-passage.test.tsx tests/premier-passage-frontiere.test.ts tests/reperes*.test.ts`).
- `e2e/premier-passage.spec.ts:31,38,57` → « Trois dimensions » ; `e2e/reperes.spec.ts:56` (titre du test), `:65` → « Les trois dimensions », `:99` → `/les trois dimensions|glisser latéralement|mode d’emploi/`.
- « trois » en lettres, jamais « 3 » (`tests/rendu/premier-passage.test.tsx:86-92`, FR-031). Aucun titre du tour ne s'appelle exactement « Trois dimensions » (`e2e/premier-passage.spec.ts:31` `exact: true`).

Risques : « dimension » pour Anam / Mon arbre / Aujourd’hui est le mot du fondateur ; `copie-reperes.ts` décrit encore les trois comme des lieux (lisible, accepté).

#### E1-S4 — Région « Moi » → « Aujourd’hui » (source unique, collision d'entêtes levée, gardes, e2e)
Retour : 7. Effort : M.

Critères :
- `lib/scene/regions.ts:44` : `{ id: "accueil", nom: "Aujourd’hui", destinationDirecte: true }` (apostrophe TYPOGRAPHIQUE : `qa-visuelle-19-aout.test.ts:114-181` balaie `lib/`) ; id interne, `REGION_FOYER` (L69), URL, stockage inchangés ; commentaires L16, L26-40 rafraîchis.
- h1 de région, aria-label des sections, boutons de barre suivent sans changement (`render/scene-dom.tsx:689,764,819`).
- `render/accueil/Bibliotheque.tsx:52` : le h2 interne devient « Ce que le jour propose » (id `moi-aujourdhui` conservé) : sinon deux `region`/entêtes « Aujourd’hui » sur le même écran.
- `lib/domain/copie-reperes.ts:62` : `nom: "Aujourd’hui"` (fichier exempt, à la main).
- `app/_erreur/ErreurApplication.tsx:38` et `app/not-found.tsx:42` lisent le nom depuis `CATALOGUE_REGIONS` : « Revenir à Aujourd’hui ».
- `tests/scene-modele.test.ts` : `:152` EXEMPTS + `"render/conversation/Fil.tsx"` avec sa raison (séparateur de jour, `Fil.tsx:193-194`, usage distinct d'un nom de lieu) ; `:193` ANCIENS + « Moi » avec frontière de mot (passer la boucle L199 `includes` → `new RegExp(\`\\b${ancien}\\b\`)`, sinon « Mois », « Moins » rougissent) ; `:216` anti-vacuité → `toContain("Aujourd’hui")` (sinon la garde reste verte grâce aux commentaires e2e) ; `:220-260` tout `.toEqual([...])` après `.sort()` trie l'attendu aussi.
- EXPERIENCE.md : AJOUTER « ## Amendement du 2026-09-02 » après l'amendement §5 (L733-745) ; ne pas réécrire l'ancien (`tests/architecture-information.test.ts:191-196` exige qu'il cite encore « Moi »). `design/design-spec.md:63,69` à jour.
- Commentaires à rafraîchir : `render/premier-passage.tsx:82-86`, `render/GlypheUnivers.tsx:4`, `render/monde.module.css:332`, `render/arbre-vivant.tsx:94`, `render/conversation/Conversation.tsx:397`, `app/page.tsx:129`, `lib/domain/bibliotheque.ts:113`, `lib/domain/ouverture-seance.ts:42`, `lib/domain/menu-compte.ts:171-172`, `e2e/_sonde-couches.spec.ts:16-18`.

Tests à ajuster : `tests/tronc-absence.test.ts:239` → `["Aujourd’hui", "Anam", "Mon arbre"]` ; `tests/rendu/premier-passage.test.tsx:35` → `["Anam", "Mon arbre", "Aujourd’hui"]` ; `tests/rendu/bibliotheque.test.tsx:55` → `getByRole("region", { name: "Ce que le jour propose" })` ; e2e (30 occurrences dans 9 fichiers, patron du commit `baf1e1c`) : `premier-passage.spec.ts:39,44,49,55` ; `glissement.spec.ts:108,136-137,153,158,287,304,313,319,332` (`/^Moi$/` et helper `regionActive`) ; `seuil.spec.ts:207,211,219,225,249` (L249 sélecteur CSS `section[aria-label="Aujourd’hui"]`) ; `fluidite.spec.ts:69-81,185-195` ; `reperes.spec.ts:37,82` ; `guide.spec.ts:146` (`["Aujourd’hui", "Anam", "Mon arbre"].sort()`) ; `barre-basse.spec.ts:91,141` ; `scene-imagerie.spec.ts:58`.

Risques : trois sens du mot (fil, section, région) : choix du fondateur, documenté ; la région contient aussi « Tes univers » (non quotidien) : accepté. Une spec oubliée attend 45 s puis échoue : c'est ce que ANCIENS + anti-vacuité verrouillent AVANT la CI.

Copie : `regions.ts:44` « Aujourd’hui » · `Bibliotheque.tsx:52` « Ce que le jour propose » · `ErreurApplication.tsx:38`, `not-found.tsx:42` « Revenir à Aujourd’hui ».

#### E1-S5 — Tutoriel : cinq étapes d'une ou deux phrases, sans tiret, non directives, l'arbre qui grandit
Retours : 5, 6, 12. Effort : S. Dépend de E1-S3/E1-S4 (titres à éviter).

Critères :
- `lib/domain/copie-guide.ts:49-144` : ETAPES compte 5 étapes ; l'objet « Et si tu perds le fil » (L118-143, cible `[class*='porteSecours']`) est supprimé avec son commentaire ; les commentaires L53-57 et L60-70 sont réécrits (doctrine « expliquer la réécriture »).
- Chaque texte : 1 à 2 phrases, ≤ 170 caractères, 0 U+2014, aucun « je » (le produit parle, pas Anam), aucun impératif de tête, aucun chiffre, aucune promesse (FR-057 : ni « tu verras » ni « deviendra », `copie-arbre.ts:47-50`), apostrophe ’.
- Étape 2 : titre exactement « Ta barre », cible `nav[aria-label='Régions']` (`e2e/guide.spec.ts:67-69`). Étape 3 : titre « Chaque jour » (ni « L’accueil » : ANCIENS `scene-modele.test.ts:193` interdit ce littéral en e2e ; ni « Aujourd’hui » : nom de région ; ni « Trois dimensions » : h2 du premier passage).
- Seule citation « Majuscule » : « Ton socle » (existe dans ENTREES_MENU, `tests/guide-cibles.test.ts:177-201`).
- Libellés SUIVANT / TERMINER / QUITTER / RELANCER inchangés (`e2e/guide.spec.ts:63,106,133,155,167-168`, `e2e/_entrer.ts:82`) ; `render/guide/Guide.tsx` inchangé (saut silencieux L116-122).
- `tests/guide-cibles.test.ts:163` reste vert avec exactement 4 étapes ciblées (`> 3`, dernier cran : le dire dans le message).
- NEUF `tests/copie-guide-forme.test.ts` : 5 étapes ; ≥ 4 ciblées ; 0 U+2014 ; `texte.split(/[.!?…]+/).filter(Boolean).length ≤ 2` ; ≤ 170 caractères ; aucun `/\d/` ; aucun `\bje\b` ; aucun `/^(Écris|Raconte|Clique|Va)\b/` ; aucun titre parmi [« Et si tu perds le fil », « L’accueil », « Trois dimensions », « Aujourd’hui »] ; l'étape arbre matche `/grandit/` et `/avec toi/` et pas `/tu verras|deviendra|bientôt/`.
- `_bmad-output/planning-artifacts/epics.md:1493` : référence `copie-guide.ts:88-92` périmée à rafraîchir.

Tests à ajuster : `tests/qa-visuelle-19-aout.test.ts:72-102` (tutoiement), `tests/lexique-voix.test.ts:80-83` : à exécuter. `e2e/guide.spec.ts:80-116` plus sûr (textes plus courts). Risques : retirer l'étape 6 supprime la seule mention du « ? » (FR-077) et du « tu peux refaire ce tour » : la porte reste sur chaque écran, RELANCER reste sur `/reperes` et `/aide` (à noter dans le commit).

Copie proposée (libellés inchangés : « Suivant », « J’ai compris », « Passer le tour », « Faire le tour de l’application ») :
- Étape 1 (accueil, cible `null`) · titre « Le lieu tient en trois dimensions » · « Ce lieu tient en trois dimensions, et tu les parcours dans l’ordre que tu veux. Tout ce qui te concerne se trouve derrière la silhouette en haut à droite. »
- Étape 2 (accueil, `nav[aria-label='Régions']`) · titre « Ta barre » · « Les trois noms restent toujours là, en bas sur un téléphone, à gauche sur un grand écran. Tu peux aussi glisser l’écran de côté pour passer de l’un à l’autre. »
- Étape 3 (accueil, `[class*='bibliotheque'] article`) · titre « Chaque jour » · « Ici, seulement ce qui change avec le jour : le mantra et le ciel. Ton thème et tes nombres t’attendent dans « Ton socle », sans rien à rattraper. »
- Étape 4 (anam, `form, [class*='composeur']`) · titre « Anam » · « C’est ici qu’on se parle, comme tu écrirais à quelqu’un. Anam est une intelligence artificielle, et elle le dit elle-même. »
- Étape 5 (arbre, `[class*='troncSeul'], [class*='canevas']`) · titre « Ta graine » · « Ton arbre commence par une graine, ce qui était déjà là à ta naissance. Il grandit et évolue avec toi, à mesure que tu comprends des choses en parlant à Anam. »

#### E1-S6 — Ouverture d'Anam : l'ignorance dite avec chaleur, salutation soudée par un point
Retour : 12. Effort : S.

Critères :
- `accueillir` (`lib/domain/ouverture-seance.ts:136-139`) : `prenom ? \`${arrivee}, ${prenom}. ${suite}\` : \`${arrivee}. ${suite}\``, suite à majuscule ; `saluerOuvertureEvenement` (L156-161) : `\`${salutation}. ${phrase}\``.
- Les quatre branches (L164-208) sont réécrites sans « — », chacune ≤ 3 phrases au sens de `tests/ouverture-seance.test.ts:48` (split `/[.?]\s/`), première venue gardant un marqueur d'ignorance testable, finissant par une question, sans « bienvenue » ni « ! », commençant par « Te voilà »/« Te revoilà ».
- Puisque la soudure « — » → « . » ajoute une phrase sous le plafond de 3 (`voix-anam.ts:3-6`), chaque phrase événementielle tient en ≤ 2 phrases : `PHRASE_SOCLE_COMPLETE` (`arbitrage-ouverture.ts:163-165`, 2 ✓ hors tiret), `PHRASE_OUVERTURE_HYPOTHESE` (`enneagramme-hypothese.ts:154`, 2 ✓ hors tiret), `rythme-pause.ts:150-152` (3 aujourd'hui : à ramener à 2, relire ses tests).
- NEUF (dans `tests/ouverture-seance.test.ts`) : « aucune ouverture ne dépasse trois phrases » sur toutes les branches, « aucune ouverture ne contient U+2014 », et « chaque phrase événementielle connue ≤ 2 phrases ».

Tests à ajuster : `tests/ouverture-seance.test.ts:68` → `toBe("Te revoilà, Louise. Tu veux regarder ça avec moi ?")` ; `:74` et `:80` → `/je ne sais (encore )?rien de toi/i` ; `:82-88` verts par construction. Fixtures `tests/ouverture-quotidienne-journal.test.ts:65,102` et `tests/arbitrage-frontiere.test.ts:108,114` (« Te voilà — … ») : données, à moderniser pour la garde E1-S1 (qui ne balaie pas `tests/`, donc optionnel). Risques : la phrase est persistée au journal (`app/_ouverture/reclamer-ouverture.ts:207-215`) : seules les futures changent. Ne pas glisser vers une promesse d'état en voulant rassurer.

Copie proposée :
- Première venue : « Je ne sais encore rien de toi, et c’est très bien ainsi : on part de ce que tu as envie de dire. Qu’est-ce qui t’occupe en ce moment, même mal dit ? » (rendu : « Te voilà, Louise. Je ne sais encore rien de toi… »)
- Journal illisible (`dejaVenue === null`) : « Je suis là, et tu peux commencer par où tu veux. Qu’est-ce qui t’occupe en ce moment ? »
- Branche vivante : « On avait laissé « {branche} » en chemin : on peut reprendre là, ou partir d’ailleurs. Qu’est-ce qui t’occupe aujourd’hui ? »
- Retour simple : « Qu’est-ce qui t’occupe aujourd’hui ? Commence par où tu veux, même par le milieu. »
- `PHRASE_SOCLE_COMPLETE` : « Ton heure de naissance est enregistrée. J’ai repris ton thème avec elle : l’ascendant et les maisons en font partie maintenant. »
- `PHRASE_OUVERTURE_HYPOTHESE` : « Il y a une chose qui revient souvent dans ce que tu me racontes. Ça me donne une idée : tu veux la voir ? »
- `rythme-pause.ts:150-152` : « Tu es venue souvent ces jours-ci, et ce que tu as déposé reste là. Tu peux laisser reposer, ou continuer : les deux se valent. »

#### E1-S7 — Balayage des « — » de la copie affichée
Retours : 12, 5, 8, 11. Effort : L (≈ 92 réécritures mécaniques, guidées par la garde E1-S1).

Critères :
- Chaque tiret listé par la garde est remplacé (« : », « , », nouvelle phrase ; jamais « - ») en conservant les fragments épelés par des tests : `MESSAGE_SANS_HEURE` / `OU_TROUVER_SON_HEURE` (`tests/socle-incomplet.test.ts:155-211` : /heure de naissance/, /ascendant/, /maisons/, /lune/, /soleil|numérolog/, « je préfère ne pas te l’inventer », /rien ne se bloque/, /copie intégrale/, /acte de naissance/, /mairie/, /extrait|livret/ ; `tests/arc-seance.test.ts:257-259`) ; « je ne reconnais pas encore ce que tu as tapé » (`tests/rendu/heure-naissance-blocage.test.tsx:50`) ; « Laisse-moi ton adresse » (`tests/entrer-drapeau-passkeys.test.ts:55`) ; /arrêter|reprendre/ et /court/ (`tests/enneagramme-invitation.test.ts:90-103`).
- `tests/rendu/fiche-socle.test.tsx:227-247` (aucun élément réduit à « — ») reste vert ; `tests/offre-abonnement.test.ts:114`, `tests/quota-client.test.ts:117`, `tests/correction-naissance.test.ts:256` (interdisent « — Anam » hors courriel) restent verts.
- `lib/domain/normalisation-texte.ts` n'est pas touché (`qa-visuelle-19-aout.test.ts:184-194`).

Fichiers (lignes vérifiées par les juges à HEAD) : `lib/domain/copie-reglages.ts:30,36,128,138,210` ; `copie-reperes.ts:50,58,78,83,93` ; `copie-socle.ts:87,146,161,178,182` ; `copie-mes-donnees.ts:36,51,101,108` ; `copie-naissance.ts:29` ; `copie-memoire.ts:65` ; `message-sans-heure.ts:41,53` ; `enneagramme-items.ts:151` ; `lib/safety/ressources-aide.ts:40,41,47,49` ; `render/abonnement/copie-abonnement.ts:125,157,169,185,216` ; `render/arbre/copie-arbre.ts:32,58,201` ; `render/premier-passage.tsx:147` ; `app/(auth)/consentement/page.tsx:64,72,86,113` ; `formulaire-consentement.tsx:142,144` ; `consentement/revoque/page.tsx:46` ; `(auth)/entrer/page.tsx:61,105,142` ; `entrer/formulaire-entree.tsx:42` ; `entrer/actions.ts:167` ; `(auth)/naissance/formulaire-naissance.tsx:29,85` ; `naissance/actions.ts:61` ; `app/heure-naissance/formulaire-heure.tsx:75` ; `heure-naissance/actions.ts:165` ; `app/barriere/page.tsx:32-35` ; `app/cgu/page.tsx:15,48` ; `app/aide/page.tsx:175` ; `lib/corpus/textes-de-base.ts:161,164` (deux aspects d'horoscope, textes de départ : ponctuation seulement) ; `render/conversation/Conversation.tsx`, `app/abonnement/page.tsx`, `app/reglages/page.tsx`, `app/ancrages/page.tsx` (JSX, à confirmer par la garde).

Risques : `copie-abonnement.ts` et `copie-arbre.ts` sont de la copie produit dans `render/` (dette existante) : la garde les couvre, on ne les déplace pas. Ne toucher QUE le tiret dans les textes gardés par fragments.

Copie proposée (exemples de la règle) :
- `message-sans-heure.ts:41` : « … je préfère ne pas te l’inventer. Tout le reste est là : ton soleil, tes planètes, ta numérologie. Tu peux ajouter ton heure quand tu veux ; rien ne se bloque sans elle. »
- `message-sans-heure.ts:53` : « Ton heure de naissance est écrite sur la copie intégrale de ton acte de naissance, pas sur l’extrait simple ni sur le livret de famille. La mairie de ta commune de naissance la délivre gratuitement, sur place ou par internet. »
- `copie-memoire.ts:65` : « C’est la même phrase : il n’y a rien à enregistrer. »
- `copie-reglages.ts:36` : « Il faut un prénom, même un surnom, même une initiale. »
- `copie-socle.ts:182` : « Au pôle géographique exact, l’ascendant n’existe pas : ce n’est pas une donnée qui manque, c’est une limite de la notion elle-même. »
- `copie-socle.ts:87` (`PORTES_DU_SOCLE[0].quoi`) : « Elle complète le ciel : l’ascendant, le milieu du ciel et les maisons en dépendent. »
- `formulaire-heure.tsx:75` : « Choisis ta commune dans la liste qui s’ouvre sous le champ : je ne reconnais pas encore ce que tu as tapé. »
- `heure-naissance/actions.ts:165` : « Ton lieu de naissance est déjà enregistré : il ne se modifie pas. »
- `entrer/page.tsx:105` : « Laisse-moi ton adresse. Je t’enverrai un lien : pas de mot de passe à retenir, rien à perdre. »
- `premier-passage.tsx:147` : « … en attendant qu’Anima les reprenne, et certaines cartes attendent encore la leur. »
- `barriere/page.tsx:32` : « Harcèlement en ligne : gratuit, pour les jeunes, tous les jours. »
- `enneagramme-items.ts:151` (`MESSAGE_TYPE_ABSENT`) : « Le test n’a pas encore été passé. Les neuf types sont écrits et t’attendent ; il est court, et tu peux t’arrêter en route. »
- `copie-naissance.ts:29` : « … tu peux la corriger, autant de fois qu’il le faut. »

#### E1-S8 — Consigne de voix : pas de tiret cadratin dans les réponses vivantes d'Anam
Retour : 12. Effort : XS.

Critères : `lib/domain/consigne-voix.ts` gagne une ligne de règle ; un test de consigne (grep `consigne-voix` dans `tests/`) vérifie sa présence ; `consigne-voix.ts` reste exclu du scan lexical (`lexique-voix.test.ts:54`) ; AUCUN post-traitement dans `controle-sortie.ts` (risque de couper une réponse en flux). Copie : « N’emploie jamais le tiret cadratin (—) : préfère deux points, une virgule ou un point. » Risque : non testable ici (pas d'appel modèle) : à vérifier sur un compte de test après déploiement.

---

### E2 — Numérologie : le chiffre à côté du nom, la lecture non signée (retour 10)

#### E2-S1 — « Chemin de vie (7) » : commiter l'arbre de travail, retirer « d’Anima » du titre
Effort : XS. Déjà fait : domaine + rendu + tests (§0.2).

Critères :
- Relire et commiter `lib/domain/fiche-socle.ts`, `render/socle/FicheSocle.tsx`, `tests/fiche-socle.test.ts`, `tests/rendu/fiche-socle.test.tsx` ; s'assurer que les tests neufs contiennent l'anti-vacuité : chaque `article h3` de la lecture matche `/\((\d+)\)$/` et le chiffre capturé === valeur de la même clé dans la grille ; aucune `p.etiquette` de la grille ne contient « ( » ; `apercusDuSocle` (`fiche-socle.ts:556`) reste « Chemin de vie : 7 » ; aucun champ ajouté (`tests/socle-frontiere.test.ts:102-107,151-161`).
- `lib/domain/copie-socle.ts:66` : `TITRE_LECTURE_NUMEROLOGIE = "Lecture symbolique"` (FR-086 : textes de départ non signés, en-tête `textes-de-base.ts:15-17`) ; `tests/rendu/fiche-socle.test.tsx:170-186` lisent la constante, rien ne rougit.

Exécuter : `tests/fiche-socle.test.ts tests/rendu/fiche-socle.test.tsx tests/socle-frontiere.test.ts`.

#### E2-S2 — Les 69 lectures : relecture et documentation (le texte est livré)
Effort : XS. Déjà fait : `7199e98`.

Critères : `CAHIER-CORPUS-ANIMA.md:433` « Le texte les habite, il ne les répète pas » → « Le texte s’ouvre sur ce que le nombre symbolise, puis parle à la personne, au tutoiement (retour du fondateur, 2026-08-31) » ; `corpus-numerologie-a-ecrire.md:1-50` amendé ; note d'en-tête `textes-de-base.ts:38` datée (retour reçu 2026-08-31, livré 2026-09-02) ; relecture à l'œil de 6 textes (un par famille) pour le registre. Aucun test à toucher (`corpus-architecture.test.ts:535-548` garde déjà la structure ; `lexique-voix.test.ts:144-155`, `corpus-etat.test.ts:97-130` verts).

---

### E3 — Astrologie plus vite (retour 8)

Objectif : l'heure manquante visible et actionnable en tête (bulle d'Anam + gros bouton), l'horoscope en première information, le détail technique replié, `/heure-naissance` court, les homonymes départagés. Sans FR-031, sans prédiction, sans texte dans `render/`.

#### E3-S1 — Villes homonymes : le département à l'écran (le domaine est fait)
Effort : XS.

Critères :
- `app/heure-naissance/formulaire-heure.tsx:197-214` : chaque résultat rend `<span>{l.nom}</span><span className="t-meta">{l.departement.nom} ({l.departement.code})</span>` avec `aria-label={\`${l.nom}, ${l.departement.nom} (${l.departement.code})\`}` ; `heure-naissance.module.css:49-72` : `.resultat` en colonne, `min-height: var(--cible-tactile)` conservé (`tests/cible-tactile.test.ts:174-180`).
- Seul `code_lieu` est posté ; le serveur grave toujours `lieu.nom` (`actions.ts:189`, comparaison `:162`) : `tests/heure-naissance-actions.test.ts:96-108` (5 colonnes) inchangé.
- `tests/rendu/heure-naissance.test.tsx:123-135` : fixture réel `{ nom: "Bordeaux", code: "33063", latitude, longitude, fuseau, population: 260000, departement: { code: "33", nom: "Gironde" }, libelle: "Bordeaux (33)" }` et `findByRole("button", { name: "Bordeaux, Gironde (33)" })` ; `:89-101` `deja.lieu` reste une chaîne libre.

Risques : comptes déjà gravés sur un homonyme : le département n'est pas relisible a posteriori (seules lat/lon) : rien d'affiché rétroactivement. Ne jamais mettre le département dans `nom` (`tests/lieux.test.ts:151`, comptes existants).

#### E3-S2 — La bulle « il me manque ton heure » et son gros bouton EN TÊTE ; positions et angles repliés ; textes sortis de `render/` et `app/`
Effort : M.

Critères :
- `render/socle/FicheSocle.tsx:261-332` (`SectionAstrologie`) : quand `ciel.sansHeure` est non nul, le bloc (L310-316) est rendu juste après l'entête, AVANT `CarteNatale`, stylé en bulle (`.bulleAnam` : surface-elevee, bordure, rayon) : `MESSAGE_SANS_HEURE` en `t-anam`, puis `<a href="/heure-naissance" className={s.boutonHeure}>` accent pleine largeur ≤ 24 rem (classe contenant « bouton » → `min-height: var(--cible-tactile)`), puis `<details className={s.devoilement}><summary>{copie.titreOuTrouver}</summary><p>{ciel.sansHeure.ouChercher}</p></details>` ; le bloc n'est pas dupliqué en bas.
- « Les positions, en texte » (L275-282), la note `sensDuCielNonEcrit` et « Tes angles » (L286-293) sont enveloppés dans un `<details className={s.devoilement}>` FERMÉ dont le summary est `copie.titrePositions` ; « Tes maisons » reste son propre `details` (L295-308) ; `CarteNatale` (SVG) reste visible.
- Les littéraux quittent `render/` et `app/` vers `lib/domain/copie-socle.ts` et passent par la prop `copie` (`FicheSocle.tsx:337-356`, objet construit dans `app/socle/page.tsx:141-160`) : `SURTITRE_CIEL` (« Projection de naissance », `FicheSocle.tsx:268`), `TITRE_POSITIONS` (`:277`), `TITRE_OU_TROUVER`, `SURTITRE_PORTES` (« Tes données restent à toi », `:369`, oublié par les trois plans), `TITRE_UNIVERS_ASTROLOGIE` / `TITRE_UNIVERS_NUMEROLOGIE` (`page.tsx:138`), `INTRODUCTION_ASTROLOGIE` (`:147`, ment quand l'heure manque), `INTRODUCTION_NUMEROLOGIE` (`:150`) ; `MENTION_MISE_EN_AVANT` (« Mise en avant aujourd’hui », `render/accueil/Bibliotheque.tsx:121`) descend par la prop de `Bibliotheque` depuis `app/page.tsx`.
- `URL_AJOUTER_SON_HEURE.libelle` (`copie-socle.ts:46-49`) devient `LIEN_AJOUTER` de `copie-naissance.ts:35` (« Ajouter mon heure de naissance ») ; `PORTES_DU_SOCLE` (`:85-89`, « Ton heure de naissance ») ne change pas.
- Aucun mot de complétude (`tests/rendu/fiche-socle.test.tsx:290-305`), aucun futur adressé ; `copie-socle.ts` ajouté aux `SURFACES_DU_SOCLE` de `tests/socle-incomplet.test.ts:242-248`.

Tests : `tests/rendu/fiche-socle.test.tsx:250-254` vert ; AJOUTER : en mode astrologie sans heure, `a[href='/heure-naissance']` précède `svg` et `#socle-positions-texte` (`compareDocumentPosition`) ; le `details` dont le summary contient `TITRE_POSITIONS` existe et `open === false` (jsdom inclut le contenu fermé dans `textContent` : `:95-110,190-224` restent verts) ; `dessiner()` passe les nouvelles clés. `tests/fiche-socle.test.ts:267-289` inchangé (au pôle, pas de réparation). `tests/socle-frontiere.test.ts:114-141,164-168` : aucun champ ajouté à `SectionCiel`, `render/socle` n'importe pas `lib/domain`. `tests/cible-tactile.test.ts:174-180`. NEUF `tests/copie-socle.test.ts` : constantes sans U+2014, `chercherInterdits`/`chercherPredictions` vides ; frontière : `FicheSocle.tsx`, `app/socle/page.tsx`, `Bibliotheque.tsx` (commentaires retirés) ne contiennent plus « Projection de naissance », « Les positions, en texte », « Ton ciel de naissance, calculé », « Tes données restent à toi », « Mise en avant aujourd’hui ».

Risques : `MESSAGE_SANS_HEURE` fait 4 phrases et le fondateur veut « beaucoup moins de texte » : gardé mot pour mot par défaut (D8). FR-031 : la bulle ne doit pas se lire « profil incomplet » (EXPERIENCE.md:127) : un aveu d'Anam + un bouton, rien d'autre.

Copie : `ACTION_AJOUTER_HEURE` = `LIEN_ADDER` existant « Ajouter mon heure de naissance » · `TITRE_OU_TROUVER` « Où la trouver » · `TITRE_POSITIONS` « Le détail des positions » · `SURTITRE_CIEL` « Projection de naissance » · `SURTITRE_PORTES` « Tes données restent à toi » · `INTRODUCTION_ASTROLOGIE` « Ton ciel de naissance, calculé à partir de ta date et de ton lieu, et de ton heure quand tu l’as donnée. Rien ici n’est généré par un modèle. » · `INTRODUCTION_NUMEROLOGIE` « Tes nombres, calculés à partir de ta naissance et de ton nom. L’année personnelle suit l’année civile indiquée. » · `MENTION_MISE_EN_AVANT` « Mise en avant aujourd’hui ».

#### E3-S3 — L'horoscope du jour, première information de l'univers Astrologie
Effort : M. Dépend de E3-S2 (ordre des blocs).

Critères :
- `app/socle/page.tsx:104-108` : en mode astrologie, après `lireThemeNatal`, appel `lireSocleQuotidien(supabase, auth.user.id, new Date(), undefined, theme)` avec `themeDejaLu` (`lib/data/lire-quotidien.ts:200`) pour ne jamais lancer deux calculs (leçon 5.6, `app/page.tsx:78-94`) ; `carteHoroscope` (`lib/domain/cartes-socle.ts:147-172`) fournit titre + texte ; repli `null` → rien n'est rendu (jamais un texte fabriqué : `socle-frontiere:164-182`).
- `FicheSocle` reçoit une prop optionnelle `cielDuJour?: { titre: string; texte: string; mention: string | null }` dans `ProprietesFicheSocle` (pas dans `render/socle/types.ts` : `tests/socle-frontiere.test.ts:114-141` compte les déclarations) et rend `<article aria-labelledby="socle-ciel-jour" className="fondu-texte">` AVANT `SectionAstrologie`, texte en `t-anam` si écrit, note du corpus en `t-corps` sinon (calculée dans `app/`).
- Mode « tout » inchangé : exactement 2 `section[aria-labelledby]` (`tests/rendu/fiche-socle.test.tsx:344-354`, un `article` n'est pas une `section`). Le catalogue d'« Aujourd’hui » ne bouge pas (`tests/bibliotheque.test.ts:89-108`, `architecture-information:111-131`).

Tests : NEUF dans `tests/rendu/fiche-socle.test.tsx` : mode astrologie avec `cielDuJour` → article « Ton ciel du jour » présent et AVANT la section ciel ; sans la prop → aucun article ; `tests/cartes-socle.test.ts:59-80` inchangé. Risques : `lireThemeNatal` peut ÉCRIRE (premier calcul) : `themeDejaLu` impératif. Le commentaire `lib/corpus/horoscope.ts:18-22` (« aucun écrit ») est périmé (27/27 écrits, `textes-de-base.ts:119-146`) : le corriger dans le même commit.

Copie : titre « Ton ciel du jour » (`carteHoroscope.titre`, existant). Aucun texte nouveau.

#### E3-S4 — `/heure-naissance` : un écran court, un gros bouton, l'aide sous un pli
Retours : 8, 12. Effort : S.

Critères :
- `app/heure-naissance/page.tsx:91-93` : h1 « Ton heure de naissance » + UNE phrase (`INTRO_HEURE`) ; `OU_TROUVER_SON_HEURE` passe sous `<details><summary>{TITRE_OU_TROUVER}</summary>` (texte inchangé mot pour mot).
- `formulaire-heure.tsx` : aides `:141` et `:189-191` en une phrase ; case `sans_heure` `:158` en une phrase ; confirmation `:238-239` en une phrase sans tiret ; succès `:115` inchangé (déjà court, sans futur adressé) ; labels des champs, bouton « Enregistrer » (`:257`), `.bouton` accent ≤ 24 rem (`heure-naissance.module.css:104-121`) conservés.
- Aucun futur adressé (`tests/socle-incomplet.test.ts:242-283` liste ces deux fichiers).

Tests : `tests/rendu/heure-naissance.test.tsx:45-48,56-62,106-121` (labels /l’heure de ta naissance/, /ta commune de naissance/, /je ne connais pas mon heure/, /enregistrer/) restent verts ; `tests/rendu/heure-naissance-blocage.test.tsx:38-67` ; `tests/heure-naissance-actions.test.ts:184-204` (confirmation exigée côté serveur, inchangé). Risques : la case de confirmation (AC8, write-once 0039) et la case `sans_heure` ne peuvent pas disparaître : on raccourcit seulement.

Copie : `INTRO_HEURE` « Ton heure sert à calculer ton ascendant et tes maisons. Sans elle, tout le reste est déjà là. » · aide heure « Telle qu’elle est écrite sur ta copie intégrale d’acte de naissance. » (inchangée) · aide commune « C’est ta commune qui donne l’instant exact de ta naissance. Le référentiel couvre la France. » · case « Je ne connais pas mon heure de naissance, ma commune suffit pour l’instant. » · confirmation « J’ai vérifié : ma commune de naissance ne pourra plus être changée, mon heure restera corrigeable depuis « Ce qu’Anam retient ». » · summary « Où la trouver ».

#### E3-S5 — « Ajouter mon heure de naissance » sous la porte Astrologie de la région Aujourd’hui
Effort : S.

Critères :
- `lib/domain/univers-moi.ts:34` : `universMoi(statutEnneagramme, heureManque: boolean)` ; la porte Astrologie (L36-42) porte `action: { libelle: LIEN_AJOUTER, url: "/heure-naissance" }` quand vrai, `null` sinon.
- `lib/data/lire-bibliotheque.ts:115-124,170` : le prédicat `manqueLHeure(socle.theme)` (`socle-incomplet.ts:86`) est calculé depuis le thème DÉJÀ lu par `lireSocleQuotidien` ; jamais vrai quand le thème est indisponible (une panne n'est pas « tu ne l'as pas donnée »).
- Rendu déjà en place : `.actionUnivers` (`Bibliotheque.tsx:95-100`, `accueil.module.css:204-215`) ; aucun mot « incomplet », aucun compteur ; pas de persistance, pas de dépense (ce n'est pas une parole proactive).

Tests : `tests/rendu/bibliotheque.test.tsx:52-76` inchangé + AJOUTER « bouton rendu avec action » ; NEUF `tests/univers-moi.test.ts` (ou dans `tests/bibliotheque.test.ts`) : action présente ssi `heureManque`, libellé sans prédiction. Risques : deux gros boutons possibles sur l'écran (ennéagramme + heure), chacun sous sa porte ; FicheTronc garde exactement 2 actions (`tests/rendu/tronc-incomplet.test.tsx:84-103`), n'y rien ajouter.

---

### E4 — Seuil et première impression (retour 2)

#### E4-S1 — L'avatar d'Anam détouré remplace l'arbre au seuil, avec un fondu long (plénitude)
Effort : L (4 gardes e2e réécrites à l'aveugle).

Critères :
- `render/scene-dom.tsx:607-669` : dans la section Seuil, au-dessus de `.seuilTexte`, `<div className={\`${s.avatarSeuil} imagerie\`} aria-hidden={false}><div className="fondu-plenitude"><ImageAnam format="seuil" alt="Illustration nocturne" eager /></div></div>` : `imagerie` et la classe de fondu sur DEUX éléments distincts (« jeton mort », `e2e/scene-imagerie.spec.ts:94-113`, commentaire `scene-dom.tsx:585-594`). Le commentaire L618-635 (« IL N'Y A PLUS QU'UNE SEULE IMAGE ») est réécrit : la décision est renversée par un asset détouré.
- `render/conversation/ImageAnam.tsx:20-63` : prop optionnelle `eager?: boolean` → `loading="eager"` (défaut `lazy` pour presence/veille) ; alt jamais « femme au lotus » (UX-DR-15) ; jamais dans l'icône (`tests/identite-route`).
- L'arbre-décor s'éteint AU SEUIL SEULEMENT : `.arbreAuSeuil { --imagerie-opacite: 0 }` (`monde.module.css:300-302`, même grammaire que `@media (max-height: 600px)` L693-701) ; la ligne de classes `scene-dom.tsx:592-594` reste textuellement identique (`tests/anam-fond-etoile.test.ts:10`).
- Budget vertical iPhone 14 (390×664, 512 px utiles, identité + porte = 300 px) : `.avatarSeuil { height: min(30vh, 14rem); aspect-ratio: 200 / 260 }` (≈ 199 px) ; nouveaux jetons `--avatar-l`/`--avatar-h` dans `.monde` (`monde.module.css:24-25`), `.seuil { padding-top: calc(var(--cible-tactile) + var(--esp-6) + var(--avatar-h) + var(--esp-7)) }` (`:683-685`) ; `@media (max-height: 600px)` masque l'avatar comme l'arbre ; la porte reste dans le viewport sans geste (`e2e/seuil.spec.ts:75-78`, `premier-passage.spec.ts:26-28`).
- Mouvement : `.fondu-plenitude { animation: anam-fondu var(--duree-plenitude, 2400ms) var(--courbe) both }` dans `globals.css:300-311`, ajouté au bloc reduced-motion L313-325 (→ `--duree-courte`) ; opacité seule (« le fondu », seule grammaire admise) ; aucun `will-change`.
- Contraste renforcé : le wrapper `imagerie` cède à 0 (`globals.css:133-135`).
- `public/scene/anam-seuil.png` (RGB, sans alpha) reste interdit et intact (`tests/scene-sans-bords.test.ts:63-72`).

Tests à ajuster (réécrits, jamais supprimés) : `e2e/seuil.spec.ts:39,58` témoin `[class*="arbreMonde"] canvas` → `[class*="avatarSeuil"] img` ; `:63-73` collisions h1/p/button contre la boîte de l'avatar, `h1.top > avatar.bottom` ; `:110-121` `images === 0` → exactement 1 `img` dont `src` commence par `/scene/seuil/` ; `:123-193` [L'ARBRE EST ENTIER] → [L'AVATAR EST ENTIER] : `naturalWidth > 0`, boîte incluse dans le viewport, aucun `onError` (repli plumeux absent) ; `:92-107` (écran court) reste vrai. `e2e/scene-imagerie.spec.ts:66-77` → au seuil, opacité effective de l'arbre-décor 0 et de l'avatar > 0,9 ; `:94-113` avatar cède en contraste renforcé. `tests/scene-sans-bords.test.ts:116-137` : `.seuil` tire sa réserve de `var(--avatar-h)` (garder « `--arbre-l` déclaré une fois ») ; `:141-156` : + `public/scene/seuil/anam-seuil.png` et `@2x` (alpha, > 50 px). `tests/voile.test.ts:46-54` inchangé. NEUF `tests/seuil-avatar.test.ts` : `.fondu-plenitude` n'anime que l'opacité, est réduit sous reduced-motion, `imagerie` et `fondu-plenitude` jamais sur le même élément dans `scene-dom.tsx`, aucun `will-change` ajouté. `e2e/ligne-de-base.json` : aucune tolérance ajoutée (`mobile › seuil.spec.ts` : 1).

Risques : trois specs e2e réécrites sans Playwright local : commit isolé, PR étiquetée « revert si rouge ». L'arbre-décor reste monté mais invisible partout après cette story (diff minimal ; retrait = story de nettoyage, §4). `plumer: false` : le pied est net, le bord bas se pose sur la lueur du fond, pas sous un voile.

#### E4-S2 — Le remplissage d'étoiles : l'avatar se remplit lentement (module existant intégré, 4,5 s, la boucle s'arrête)
Effort : M (module et tests existent). Dépend de E4-S1 (le fondu long reste le repli mergé).

Critères :
- NEUF `render/seuil/RemplissageEtoiles.tsx` (`"use client"`) : monte un `<canvas aria-hidden>` sur la boîte de l'avatar (`pointer-events: none`) + `ImageAnam` ; `useEffect` → `demarrerRemplissage` (`render/seuil/remplissage-etoiles.ts`, `DUREE_DEFAUT_MS` 4 500) quand `region === "seuil"` et l'image `/scene/seuil/anam-seuil@2x.png` (same-origin, canvas non souillé) est décodée ; à `termine`, l'`img` apparaît via `.fondu-plenitude` et le canvas reste sur sa dernière trame ; `arreter()` au démontage et au départ du seuil (`e2e/seuil.spec.ts:234-272` [LE FONDU] reste conforme).
- `MAX_ETOILES` = 300 sur mobile (≤ 768 px) avant tout autre remède ; graine `mulberry32` posée côté client après montage (patron `Etoiles()` `scene-dom.tsx:138-175`, hydratation).
- Pendant la séquence, les 80 `.etoile` du ciel sont gelées : `.regionActive.seuil .etoile { animation-play-state: paused }` dans un bloc SÉPARÉ de `.etoile {}` (`tests/scene-accessibilite.test.ts:154-176` isole le bloc de base et son `will-change`).
- Reduced-motion : état final dessiné une fois, avatar visible, rien ne boucle.
- Le bouton « Commencer » est visible et actif dès la première trame : le franchissement reste un geste (`app/_seuil/marquer-franchissement.ts:11-15`, 0045).
- CSP inchangée (`lib/ai/entetes-art9.ts` : script noncé, image same-origin, aucun wasm/CDN).
- Commentaire d'en-tête du composant : la séquence n'est PAS cyclique (une fois, 4,5 s, arrêt) et n'est pas un chargement (rien n'est attendu) : sinon la prochaine QA la retire (« SANS animation cyclique », `HalteEnAttente.tsx:22`, `surimpression.tsx:41`).

Tests : `tests/rendu/remplissage-etoiles.test.ts` existant, à exécuter ; NEUF `tests/rendu/remplissage-etoiles-composant.test.tsx` : canvas `aria-hidden`, `cancelAnimationFrame` au démontage, reduced-motion = une trame ; NEUF e2e dans `e2e/seuil.spec.ts` [LES ÉTOILES S'ARRÊTENT] : après 6 s, `requestAnimationFrame` n'est plus appelé (compteur via `page.addInitScript`) ; `e2e/fluidite.spec.ts:57-59` (mesure du seuil à 1 400 ms, PENDANT la séquence) est LE juge : ≥ 60 % de `/aide` sans tolérance ajoutée. Repli si rouge : retirer le montage du composant (E4-S1 reste), pas de tolérance.

Risques : ~300 `drawImage` par trame pendant 4,5 s sur le premier écran mobile déjà à 5 im/s : la pause des étoiles DOM est ce qui rend la story jouable. Le lotus SVG « aux mains » annoncé par `10870cf` est hors périmètre (§4).

---

### E5 — Système visuel Soft Balance (retour 1)

#### E5-S1 — Palette nuit navy + Sky, mode clair d'accessibilité re-tokenisé, parité sur trois blocs, gate WCAG, PWA, anneau de focus
Effort : M.

Critères :
- `app/styles/tokens.ts:16-33` `couleursNuit` : fond `#1C2740`, surface `#26324D`, surface-elevee `#33415E` (Navy), texte `#F0EFEA` (Ivory), texte-doux `#C9C6BD`, bordure `#33415E`, bordure-forte `#7A90C9` (Periwinkle), accent `#D3DBF0` (Sky, le lotus), accent-doux `#26324D`, sur-accent `#1C2740`, arbre-tronc `#8C88B0`, arbre-branche `#A9B8E6`, arbre-feuillage `#9CC5E8`, succes `#86B79E`, alerte `#D0A05C`, lueur `#D3DBF0`, **+ `nebuleuse` `#2E2A5A`** (l'ancien violet, décor seulement, 1,13:1 sur fond). Recalculé ici : 18/18 paires de `tests/contraste.test.ts:16-36` vertes (min 3,24 bordure-forte/surface-elevee, arbre-tronc/fond 4,43) ; voile fond@85 % sur blanc : texte 8,06, texte-doux 5,43 (`tests/voile.test.ts:60-64`, `tests/surimpression.test.ts:86-91`). Le Gray `#B8B5AC` ne ferait que 4,52 sous voile : marge trop juste, d'où `#C9C6BD`.
- `couleursClair` (`:40-57`, typée `Record<keyof couleursNuit>` : la clé `nebuleuse` est obligatoire) : fond `#F0EFEA`, surface `#FFFFFF`, surface-elevee `#D3DBF0`, texte `#1C2740`, texte-doux `#5F5D57`, bordure `#B8B5AC`, bordure-forte `#4C63A8`, accent `#41579B`, accent-doux `#D3DBF0`, sur-accent `#FFFFFF`, arbre-tronc `#4C63A8`, arbre-branche `#41579B`, arbre-feuillage `#33415E`, succes `#3B7357`, alerte `#8A5A16`, lueur `#41579B`, nebuleuse `#E0D2C7` (Beige). 9/9 paires vertes (min 4,83).
- `app/styles/globals.css` : les TROIS blocs recopiés (`:root` L14-29, `:root[data-a11y="contraste"]` L89-104, `@media (prefers-contrast: more) { :root:not([data-a11y="nuit"]) }` L109-130) ; en-tête L6-8 amendé (la nuit reste native, sa teinte change).
- `tests/tokens-parite.test.ts:25-40` gagne un 3e `describe` sur le bloc `@media` (regex `/@media\s*\(prefers-contrast:\s*more\)\s*\{\s*:root:not\(\[data-a11y="nuit"\]\)\s*\{([^}]*)\}/`) : c'est le seul chemin actif et il n'est gardé par rien aujourd'hui (vérifié L26, L35).
- `public/manifest.webmanifest:12-13` et `app/layout.tsx:47` = `#1C2740` (`tests/manifeste-couleurs.test.ts:44-75`).
- `e2e/clavier.spec.ts:23-24` : `ANNEAU.couleur` dérivé de `couleursNuit["bordure-forte"]` (import + hex→rgb) au lieu de `rgb(119, 113, 156)` codé en dur.
- Docs dans le même commit : `design/design-spec.md:81` (« pas de nouvelle palette » amendé avec la date et le retour), DESIGN.md:313-386 (tables de ratios recalculées avec `ratioContraste` de `app/styles/contraste.ts:30`, et la note : Sky = accent ET lueur, admis parce que la lueur n'est jamais cliquable).

Tests : `tests/contraste.test.ts` (le gate, inchangé, exécuter) ; `tests/tokens-parite.test.ts` (3e bloc) ; `tests/manifeste-couleurs.test.ts` ; `tests/voile.test.ts` ; `tests/surimpression.test.ts` ; `tests/qa-visuelle-19-aout.test.ts:40-56` (outlines en `var(--bordure-forte)`) ; `tests/accessibilite.test.ts:13-27` (aucun `prefers-color-scheme: light`) ; `tests/arbre-lunaire.test.ts:29-38` et `tests/arbre-rendu.test.ts:310-315` INCHANGÉS (PALETTE_LUNAIRE gelée : bois `#9A96BE` reste à 5,29 sur navy). `e2e/barre-basse.spec.ts` : comparaison intra-run, rien à régénérer.

Risques : l'arbre lunaire (`MoteurArbreLunaire.ts:15-23`) et le décor `arbre-vivant.tsx` (10 hex, invisible après E4-S1) gardent leurs teintes indigo sur navy : même famille, harmonisation fine hors périmètre (§4). Le lotus (`LotusAttente.tsx:49-77`, `#7FA6CE/#C2DCF3`) est cohérent avec Sky. Le rendu réel n'est vérifiable qu'à l'œil : captures Playwright CI avant/après sur seuil, Aujourd’hui, Anam, Mon arbre, `/socle` avant merge.

#### E5-S2 — Textures et dégradés : nébuleuse tokenisée, couleurs en dur migrées, papier des cartes
Effort : S. Dépend de E5-S1 (`--nebuleuse`).

Critères :
- `render/monde.module.css:46-50` : le halo `#1a1640` (L48) → `color-mix(in srgb, var(--nebuleuse) 55%, var(--fond))` ; une couche nébuleuse tiède décentrée est ajoutée (radial statique, aucune animation, aucun blend) ; le souffle froid utilise `var(--accent)` 14 %.
- Couleurs en dur migrées : `monde.module.css:169` (`#b9c8ee` → `var(--lueur)`), `:185-186` (rgba lune → `color-mix` de `--lueur`/`--accent`), `:825` ; `render/reperes/reperes.module.css:92` et `render/guide/guide.module.css:121` (`rgba(143,193,239,.06)` → `color-mix(in srgb, var(--accent) 6%, transparent)`) ; `guide.module.css:36` (`rgba(6,5,18,.82)` → `color-mix(in srgb, var(--fond) 82%, transparent)`) ; `render/reglages/reglages.module.css:160-161` → `var(--texte)`/`var(--surface)`.
- Cartes d'Aujourd’hui et du socle (`render/accueil/accueil.module.css:299-334`, `render/socle/socle.module.css:64-92`) : dégradé « papier » statique `linear-gradient(168deg, var(--surface), color-mix(in srgb, var(--surface-elevee) 40%, var(--surface)))` ; le grain plein écran existant reste seul (opacity 0.05, sans `mix-blend-mode`) ; aucun `::after` animé, aucun `filter`/`backdrop-filter` (`monde.module.css:52-110`).
- Aucune couleur brute dans `app/aide/*.module.css` ni le bloc détresse (`tests/aide-route.test.ts:89-97`, `tests/conversation-detresse.test.ts:60-65`).

Tests : NEUF `tests/couleurs-tokenisees.test.ts` : aucun `#[0-9a-f]{3,6}` ni `rgba?(` hors `data:` URI dans `monde/guide/reperes/reglages.module.css` (commentaires retirés) ; `tests/anam-fond-etoile.test.ts:13-18` (`.regionConversation` transparent) et `tests/scene-accessibilite.test.ts:154-176` inchangés ; `e2e/fluidite.spec.ts` en CI (couches statiques = 0 coût par trame). Risques : le violet ne survit qu'à 1,13:1 : une nuance, pas une couleur, à dire à Julian.

---

### E6 — Ennéagramme : moins de scroll, plus de dynamique (retour 11)

#### E6-S1 — Introduction en deux phrases, un seul niveau de tiroir, accordéon exclusif natif
Retours : 11, 5, 12. Effort : S.

Critères :
- `lib/domain/enneagramme-items.ts:171-183` : `INTRODUCTION_ENNEAGRAMME`, `LIMITE_ENNEAGRAMME`, `ANNONCE_DU_TEST` ≤ 2 phrases chacune, sans « — », fragments gardés (/grille de lecture/, /hypothèse/, /arrêter|reprendre/, /court/, aucun chiffre, aucun « étape »/« question » : `tests/enneagramme-invitation.test.ts:90-114`, `phrases.length === 3` conservé) ; + `TITRE_INTRODUCTION`, `TITRE_REPERES`, `LIBELLE_TYPE`.
- `app/enneagramme/introduction.tsx:22-34` : le `<details className={s.reperes}>` de premier niveau disparaît au profit d'un `<h3>` « Voir les neuf repères » (le texte est gardé par `tests/rendu/enneagramme-halte.test.tsx:92` `/Voir les neuf repères/i`) ; les 9 `<details className={s.repere}>` reçoivent `name="repere"` (accordéon exclusif natif, un seul ouvert, zéro JS ; Baseline 2024, dégradation = comportement actuel) ; `.repere` padding `--esp-4` → `--esp-3`, gap `--esp-3` → `--esp-2` (`enneagramme.module.css:66-80`) ; summary garde `min-height: var(--cible-tactile)`.
- Les 9 textes restent ceux du corpus, dans le DOM au premier rendu (`enneagramme-halte.test.tsx:88-96`, `tests/corpus-enneagramme.test.ts:64-71`) ; l'introduction reste démontée dès `demarre` (`test-court.tsx:129-140`, FR-031 : `enneagramme-halte.test.tsx:111-128`).

Tests : NEUF (dans `tests/rendu/enneagramme-halte.test.tsx`) : les 9 `details` partagent `name="repere"` ; `tests/cible-tactile.test.ts:174-180`. Risques : ENN-1 (summaries « Type N ») et ENN-2 (spoiler du résultat) restent ouverts (sprint-change 2026-08-30:52-64), non tranchés ici.

Copie : `INTRODUCTION_ENNEAGRAMME` « L’ennéagramme est une grille de lecture : neuf manières de porter son attention, de décider et de réagir. Ici, il se fonde seulement sur tes réponses à des situations du quotidien. » · `LIMITE_ENNEAGRAMME` « Le résultat reste une hypothèse : il ne prouve pas qui tu es, et il peut ne retenir aucun type. » · `ANNONCE_DU_TEST` « C’est court, et « Je ne sais pas » est une réponse comme une autre. Tu peux t’arrêter et reprendre plus tard : ce que tu as posé reste là. » · `TITRE_INTRODUCTION` « Avant de commencer » · `TITRE_REPERES` « Voir les neuf repères » · `LIBELLE_TYPE` « Type ».

#### E6-S2 — Les neuf repères dans une feuille pop-up (un niveau, Échap, focus rendu)
Effort : M. Conditionnelle (D12).

Critères :
- NEUF `render/feuille/Feuille.tsx` + `feuille.module.css` : mécanique extraite de `render/menu/MenuCompte.tsx:118-249` (déclencheur `aria-haspopup="dialog" aria-expanded aria-controls`, montage seulement si ouvert, fond fixed z-60 `color-mix(var(--fond) 72%)` sans `backdrop-filter`, `role="dialog" aria-modal aria-labelledby tabIndex=-1` z-61, focus sur la feuille, piège Tab, Échap et fond ferment, focus rendu au déclencheur, `children`) ; `MenuCompte` n'est pas modifié ; `render/feuille/` n'importe ni `lib/domain` ni `lib/corpus`.
- NEUF `app/enneagramme/reperes-feuille.tsx` (`"use client"`) reçoit `reperes`, `titre`, `libelleOuvrir`, `libelleFermer` par props depuis `introduction.tsx` (serveur) et rend dans la feuille l'accordéon de E6-S1 ; jamais une feuille par type (EXPERIENCE.md:87 « un niveau, jamais deux », :200) ; aucune fermeture automatique ; transition ≤ `--duree-standard`, neutralisée sous reduced-motion.
- Jamais montée pendant le questionnaire (FR-031) ; « Fermer » et le déclencheur déclarent `min-height: var(--cible-tactile)`.

Tests : `tests/rendu/enneagramme-halte.test.tsx:88-96` : cliquer « Voir les neuf repères » AVANT d'attendre les 9 textes ; `tests/enneagramme-halte.test.ts:41-54` : + `introduction.tsx`, `reperes-feuille.tsx` ; NEUF `tests/rendu/feuille.test.tsx` (patron `menu-compte-rendu.test.tsx:63-77,145-165,207-212`) ; `tests/rendu/menu-compte-rendu.test.tsx:217-225` inchangé. Risques : story la plus « composant » ; ENN-2 : rendre les 9 textes plus accessibles amplifie le spoiler.

Copie : `TITRE_FEUILLE_REPERES` « Les neuf repères » · `LIBELLE_FERMER_REPERES` « Fermer ».

---

## 2. Décisions produit à trancher (défaut retenu pour livrer aujourd'hui)

| # | Décision | Défaut retenu |
|---|---|---|
| D1 | Tagline du seuil : registre et texte | Voix PRODUIT en `t-corps` ; « Un lieu qui t’appartient : un espace d’échange, pour te comprendre et évoluer à ton rythme. » |
| D2 | Bouton du seuil : casse et style | « Commencer » capitalisé (cohérent avec `/enneagramme`), bouton plein accent Sky / texte navy (effet wow) plutôt qu'invitation basse bordée |
| D3 | Seuil : composition | L'avatar REMPLACE l'arbre au seuil (un seul objet ; T9 interdit d'empiler deux illustrations) ; l'arbre-décor reste monté invisible (diff minimal) ; hauteur bornée `min(30vh, 14rem)` |
| D4 | Étoiles | Livrer E4-S2 aujourd'hui par-dessus E4-S1 (le fondu long 2,4 s est le repli déjà mergé) ; 4 500 ms ; 300 étoiles mobile ; pas de lotus SVG « aux mains » |
| D5 | Palette | Nuit navy `#1C2740` en mode natif, Sky `#D3DBF0` en accent ET lueur, Ivory/Beige réservés au mode contraste renforcé re-tokenisé ; le violet survit en `--nebuleuse` (1,13:1) ; `design-spec.md:81` amendé. Alternative « fond Ivory natif » : refonte de doctrine + 6 tests, hors journée |
| D6 | Arbre lunaire sur navy | Garder `PALETTE_LUNAIRE` gelée (bois 5,29:1 sur navy), relire à l'écran après déploiement |
| D7 | h2 interne de la section quotidienne | « Ce que le jour propose » (formule de `copie-reperes.ts:63`) pour éviter deux régions « Aujourd’hui » ; `Fil.tsx` exempté de la garde anti-littéral |
| D8 | `MESSAGE_SANS_HEURE` dans la bulle | Gardé mot pour mot (4 phrases, 11 fragments gardés) ; option : 2 phrases en conservant « il me manque ton heure », « je préfère ne pas te l’inventer », « bloque », « ajouter » (relire `socle-incomplet:155-211`, `arc-seance:257-259`) |
| D9 | « Bulle d'Anam » avant l'ajout de l'heure | Bulle en tête de l'univers Astrologie (E3-S2) + gros bouton sous la porte d'Aujourd’hui (E3-S5), sans persistance. La parole proactive en conversation exige une RPC/migration (patron 0040-0045) non testable sans Docker |
| D10 | Titre de la lecture numérologique | « Lecture symbolique » (sans « d’Anima ») : textes de départ non signés (FR-086) |
| D11 | Tirets : exemptions et réponses vivantes | Exempter la signature courriel « — Anam » (`retention-avis.test:41`) et le « — » de valeur vide de l'export (`export-lisible.test:166`) ; règle dans `consigne-voix.ts` OUI ; post-traitement `controle-sortie.ts` NON ; les 2 tirets d'horoscope de `textes-de-base.ts:161,164` réécrits (ponctuation seule) |
| D12 | Ennéagramme | E6-S1 aujourd'hui ; E6-S2 (feuille) seulement si E1 à E5 sont verts ; « Type 1 »…« Type 9 » et le spoiler ENN-2 restent des décisions du fondateur |
| D13 | Graine « rebondit » | Livré comme souffle ±2,5 % + soulèvement 3 unités sans ressort (`72cc015`, charte DESIGN.md:139/475) : à dire au fondateur, rien à refaire |
| D14 | Villes | `nom` gravé inchangé (aucune migration, comptes existants) ; département et libellé = données d'affichage ; tri par population déjà livré |
| D15 | Tutoriel et porte de secours | Retirer « Et si tu perds le fil » supprime la seule mention du « ? » dans le tour ; la porte reste sur chaque écran et `/aide` la documente : accepté |

---

## 3. Ordre d'implémentation et merges intermédiaires

Chaque PR est mergeable seule ; unitaires verts localement (`env -u SUPABASE_URL -u NEXT_PUBLIC_SUPABASE_URL npx vitest run`), `next lint`, `next build` ; les PR marquées (CI) attendent la suite navigateur. Un commit par story. Relire `git status` avant chaque story (sessions parallèles).

1. **PR 1 « Socle et dimensions » (unitaires seuls, mergeable tout de suite)** : E1-S3 (commiter l'arbre de travail « Trois dimensions » + 5 lignes e2e), E2-S1 (commiter « Chemin de vie (7) » + `TITRE_LECTURE_NUMEROLOGIE`), E2-S2 (docs corpus). Merge.
2. **PR 2 « Voix et concision » (CI : e2e « Commencer » et « Aujourd’hui »)** : E1-S1 garde rouge → E1-S2 seuil (`_entrer.ts:57` en premier) → E1-S4 « Aujourd’hui » (ANCIENS `\bMoi\b`, anti-vacuité, 30 lignes e2e) → E1-S5 tutoriel → E1-S6 ouverture d'Anam → E1-S7 balayage des tirets (la garde passe au vert) → E1-S8 consigne-voix. Merge après CI.
3. **PR 3 « Astrologie plus vite » (unitaires seuls)** : E3-S1 homonymes (formulaire + fixture) → E3-S2 bulle + bouton + repli + textes sortis → E3-S3 horoscope en tête → E3-S4 `/heure-naissance` court → E3-S5 bouton sur Aujourd’hui. Merge. (Peut avancer en parallèle de PR 2 : aucun fichier commun sauf `message-sans-heure.ts` dont seul le tiret change dans PR 2.)
4. **PR 4 « Ennéagramme » (unitaires seuls)** : E6-S1. Merge.
5. **PR 5 « Système visuel » (CI : clavier.spec, fluidite)** : E5-S1 palette + parité 3 blocs + PWA + anneau → E5-S2 textures et tokenisation. Captures CI avant/après relues. Merge.
6. **PR 6 « Seuil » (CI : seuil.spec, scene-imagerie, fluidite ; étiquetée « revert si rouge »)** : E4-S1 avatar + fondu long (commit isolé) → E4-S2 remplissage d'étoiles (commit isolé, revert seul possible). Merge si fluidité ≥ 60 % sans tolérance ; sinon merge E4-S1 seul.
7. **Si le temps reste** : E6-S2 feuille pop-up (PR 7), spec e2e optionnelle [LA GRAINE RESPIRE].
8. Vérification finale : promotion Vercel, parcours à l'œil (seuil, Aujourd’hui, Anam, Mon arbre, `/socle?univers=astrologie`, `/heure-naissance`, `/enneagramme`), test d'une réponse vivante d'Anam sans tiret.

---

## 4. Hors périmètre de la session, et pourquoi

- **Parole proactive d'Anam en conversation avant l'ajout de l'heure** (« il manque ton heure de naissance ») : exige une parole dépensée à l'écran (patron RPC `annonce_socle_due`, migrations 0040-0045), donc du SQL non testable sans Docker. Livré à la place : bulle en tête de l'univers (E3-S2), bouton sur la porte (E3-S5), `FicheTronc` existante au tap.
- **Fond Ivory natif / thème clair « par goût »** : contredit `globals.css:6-8`, DESIGN.md:303, `design-spec.md:81`, `tests/accessibilite.test.ts:25-27` ; la palette brute ne tient l'AA que Navy ↔ {Ivory, Sky, Beige}. Seul le mode d'accessibilité est re-tokenisé.
- **Réglage utilisateur « Lisibilité renforcée »** (setter `data-a11y="contraste"`, DESIGN.md:317) : jamais implémenté (seul `tokens.ts:38` en parle), non demandé.
- **Harmonisation de `PALETTE_LUNAIRE` et du décor `arbre-vivant.tsx`** avec le navy : palette de handoff gelée (`tests/arbre-lunaire.test.ts:29-38`) ; lisible sur navy (5,29:1) ; à re-échantillonner avec une mesure visuelle en session suivante.
- **Retrait complet de l'arbre-décor `ArbreVivant`** (invisible partout après E4-S1) et nettoyage de ses 4 gardes : story de suite.
- **Lotus SVG « aux mains » en finale du remplissage** (annoncé par `10870cf`) et toute éclosion de pétales.
- **Raccourcissement de `MESSAGE_SANS_HEURE`** à 2 phrases : option documentée (D8), non livrée par défaut.
- **Post-traitement mécanique des « — » dans les réponses vivantes** (`controle-sortie.ts`) et réécriture des consignes modèle truffées de tirets (`consigne-phase.ts` : 23) : seule la règle de `consigne-voix.ts` est ajoutée ; validation sur le modèle réel après déploiement.
- **Déplacement doctrinal de `render/abonnement/copie-abonnement.ts` et `render/arbre/copie-arbre.ts` vers `lib/domain`** : dette existante ; la garde zéro cadratin les couvre quand même. Idem les 9 motifs de `inventaire-export.ts` (export HTML, exemptés aujourd'hui).
- **Noms des neuf types d'ennéagramme (ENN-1) et spoiler du résultat (ENN-2)** : écriture et décision du fondateur (sprint-change 2026-08-30:52-70).
- **Adaptateur de lieux mondial** (GeoNames) pour les natives hors France : `LieuxPort` le permet, pas aujourd'hui.
- **Relecture par Anima** des 69 lectures restructurées : elle reprend la main clé par clé, exactement comme avant (`textes-de-base.ts:54-62`).
- **Tests SQL et suites e2e en local** : `supabase start` impossible sans Docker ; aucune migration dans ce lot ; la CI de la PR est le seul juge des specs navigateur, d'où les commits isolés et le revert prévu pour PR 6.
