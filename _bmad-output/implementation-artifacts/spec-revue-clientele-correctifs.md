---
title: 'Implémenter la revue clientèle du parcours Anam'
type: 'feature'
created: '2026-09-05'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'bc1b75537783229f68a8022fd6740121957ef549'
context:
  - '_bmad-output/planning-artifacts/sprint-change-proposal-2026-09-05-revue-clientele-parcours.md'
  - 'design/design-spec.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-Anima-2026-07-22/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le parcours vu par la cliente reste incohérent dans son accueil, ses libellés, ses univers, la conversation Anam et Mon évolution ; certains retours Notion confondent en outre comportement absent, capacité déjà livrée et extension sensible.

**Approach:** Implémenter les 33 stories P0/P1 du programme approuvé, dans l'ordre des gates RC-A0 à RC-J5. Retenir la variante visuelle B « nuit douce + papier lumineux » et exclure RC-D3/RC-G3.

## Boundaries & Constraints

**Always:** Conserver mot pour mot la phrase d'accueil fournie ; séparer portail, seuil et région Anam ; préserver `/aide`, le fil, les calculs et les protections de consentement/minorité ; utiliser les tokens existants et des assets versionnés ; tester les états sans heure, vide, repli, erreur, contenu dense, contraste et mouvement réduit ; travailler uniquement avec Supabase local et données fictives.

**Ask First:** Tout accès ou déploiement distant, changement du calcul astrologique/numérologique, nouvelle doctrine produit non tranchée dans le plan, ou impossibilité démontrée de satisfaire un critère sans élargir les données.

**Never:** Implémenter RC-D3 ou RC-G3 ; envoyer journal, prénom ou naissance brute au rédacteur du ciel ; éditer directement Soleil/Lune/Ascendant ; introduire fruit, score, jauge, arbre final garanti, clé IA navigateur ou dépendance runtime à un outil de design.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Lancement | Document froid sur `/`, puis navigation interne | Portail une fois, puis seuil si compte neuf ; aucun rejeu interne | `/aide` et lien profond restent directs |
| Ciel | Thème avec/sans heure, modèle disponible/indisponible | Texte stable, factuel, 2–3 phrases ; repères honnêtes | Corpus relu, aucune valeur inventée |
| Naissance | Correction heure/date/lieu autorisée ou refusée | Aperçu, validation serveur, recalcul cohérent | Ancien profil intact, erreur explicite |
| Anam | Journal vide/existant, tap/clavier/lecteur d'écran | Phrase statique seulement sans tour ; focus selon modalité | Repli visible en un tap sur mobile |
| Évolution | Zéro/plusieurs branches | Explication toujours accessible, graine/arbre illustratifs | Aucun état de panne présenté comme vide |

</frozen-after-approval>

## Code Map

- `design/design-spec.md`, `app/styles/tokens.ts`, `app/styles/globals.css` — direction B et fondation tokenisée.
- `render/portail/*`, `lib/scene/portail.ts`, `lib/domain/copie-portail.ts` — portail, arbre, lotus et cycle de vie.
- `render/accueil/*`, `render/GlypheUnivers.tsx` — Aujourd'hui, libellés, cartes et pictogrammes.
- `lib/domain/signature-ciel.ts`, `lib/ai/texte-du-jour.ts` — qualité, minimisation, stabilité et repli du ciel.
- `supabase/migrations/0091_texte_du_jour_stable.sql`, `supabase/migrations/0092_corriger_donnees_naissance.sql` — persistance partagée et correction protégée.
- `render/socle/*`, `lib/data/corriger-naissance.ts`, `render/memoire/CorrectionNaissance.tsx` — Astrologie, Numérologie et naissance.
- `render/psychologie/*`, `app/enneagramme/resultat.tsx`, `lib/corpus/enneagramme.ts` — Psychologie et définitions générales.
- `render/scene-dom.tsx`, `render/conversation/*` — accueil, décor, focus et continuité Anam.
- `lib/scene/regions.ts`, `lib/domain/copie-reperes.ts`, `render/arbre/*` — Mon évolution et explication permanente.
- `tests/`, `e2e/` — contrats, accessibilité, données, responsive et parcours complet.

## Tasks & Acceptance

**Execution:**
- [x] Gates RC-A0/A1/A2/D0 — figer baseline, doctrine, données et design dans les documents/tests.
- [x] `design/*`, `app/styles/*` — livrer les tokens et composants papier lumineux.
- [x] `render/portail/*`, `render/accueil/*` — livrer Lots 1 et accueil du Lot 2.
- [x] `lib/ai/*`, `lib/domain/signature-ciel.ts`, `supabase/migrations/0091_*` — stabiliser le ciel.
- [x] `render/socle/*`, `lib/data/corriger-naissance.ts`, `supabase/migrations/0092_*` — livrer Astrologie/Numérologie et correction protégée.
- [x] `render/psychologie/*`, `app/enneagramme/*`, `lib/corpus/enneagramme.ts` — livrer Psychologie/Ennéagramme général.
- [x] `render/scene-dom.tsx`, `render/conversation/*` — livrer Anam sans régression de mémoire.
- [x] `lib/scene/regions.ts`, `render/arbre/*` — livrer Mon évolution.
- [x] `tests/`, `e2e/` — prouver RC-J1 à RC-J5 et mettre les documents BMAD en cohérence.

**Acceptance Criteria:**
- Given chaque état du plan RC, when sa preuve ciblée et le parcours complet sont exécutés, then les 33 stories cœur passent sans RC-D3/RC-G3, régression de calcul, fuite de journal, défaut bloquant AA ou ancien libellé actif.

## Spec Change Log

- 2026-09-06 — Implémentation, revue adversariale, contrôles visuels et validation complète terminés ; RC-D3 et RC-G3 restent explicitement hors périmètre.

## Design Notes

Direction retenue : nuit navy continue, grandes surfaces ivoire/Beige, accents Sky/Periwinkle, texture discrète, Fraunces pour la voix et Inter pour l'interface. L'arbre reste dominant au portail ; le lotus et les étoiles sont décoratifs, sans couche animée concurrente.

## Verification

**Commands:**
- `npm test` — 383 fichiers, 6 256 tests réussis, aucun échec.
- `npm run lint` et `npx tsc --noEmit` — zéro erreur.
- `npm run build` — build Next 16 réussi ; migrations locales cohérentes de 0001 à 0093.
- `npm run e2e` — 97 parcours réussis, 7 ignorés conditionnellement, aucun échec.
- Supabase local réinitialisé puis éprouvé — 38/38 tests ciblés SQL/RPC/TTL réussis.
- Revue visuelle Playwright — 390 px, 768 px et 1 440 px, mouvement réduit compris.
- `git diff --check` et `graft build && graft check` — diff propre et graphe synchronisé.

## Review Outcome

- Revue adversariale aveugle et chasse aux cas limites terminées sans conflit d'intention ni défaut de spec.
- Corrigés avant validation finale : consentement vivant sur cache modèle, repli durable fermé, purge TTL, transaction naissance + thème, barrière de minorité, heure effaçable, erreurs asynchrones, combobox clavier, focus de repli, cycle du portail, repères Ennéagramme/Numérologie et copies devenues obsolètes.
- Les 33 stories P0/P1 sont livrées ; RC-D3 (mantra personnalisé) et RC-G3 (Ennéagramme personnalisé via Anam) ne sont pas implémentées.

## Suggested Review Order

**Intention visuelle et point d'entrée**

- La direction approuvée fixe la hiérarchie nuit douce et papier lumineux.
  [`design-spec.md:67`](../../design/design-spec.md#L67)

- La page racine assemble portail unique, accueil et régions sans rejouer le lancement.
  [`page.tsx:160`](../../app/page.tsx#L160)

- Le cycle documentaire supprime le flash SSR et les rejeux internes.
  [`PortailAuLancement.tsx:7`](../../render/portail/PortailAuLancement.tsx#L7)

- La phrase cliente reste une constante statique, jamais un tour mémorisé.
  [`copie-anam.ts:1`](../../lib/domain/copie-anam.ts#L1)

**Rectification de naissance**

- L'action valide, barre la minorité et orchestre l'aperçu avant écriture.
  [`actions.ts:257`](../../app/memoire/actions.ts#L257)

- Le dépôt calcule le thème de confiance avant l'unique appel privilégié.
  [`corriger-naissance.ts:209`](../../lib/data/corriger-naissance.ts#L209)

- La RPC verrouille, compare et regrave entrées et thème dans une transaction.
  [`0092_corriger_donnees_naissance.sql:132`](../../supabase/migrations/0092_corriger_donnees_naissance.sql#L132)

- Le formulaire gère erreurs, clavier et sélection de lieu comme une combobox.
  [`CorrectionNaissance.tsx:54`](../../render/memoire/CorrectionNaissance.tsx#L54)

**Ciel quotidien et consentement**

- Le service réutilise le cache seulement après une nouvelle garde de droits.
  [`texte-du-jour.ts:160`](../../lib/ai/texte-du-jour.ts#L160)

- La migration rend le texte partagé stable, privé et physiquement purgable.
  [`0091_texte_du_jour_stable.sql:20`](../../supabase/migrations/0091_texte_du_jour_stable.sql#L20)

- Le job de rétention purge les textes expirés sans bloquer les obligations prioritaires.
  [`retention.ts:162`](../../lib/ordonnanceur/jobs/retention.ts#L162)

**Restitutions et évolution**

- La fiche unifie Astrologie et Numérologie, y compris leurs replis partiels.
  [`FicheSocle.tsx:491`](../../render/socle/FicheSocle.tsx#L491)

- Les neuf repères Ennéagramme restent généraux et indépendants du résultat personnel.
  [`enneagramme.ts:169`](../../lib/corpus/enneagramme.ts#L169)

- L'explication de Mon évolution reste accessible dans chaque état de l'arbre.
  [`ComprendreEvolution.tsx:37`](../../render/arbre/ComprendreEvolution.tsx#L37)

**Droits et preuves**

- L'export inclut la piste minimale de rectification sans conserver les anciennes valeurs.
  [`0093_exporter_audit_correction_naissance.sql:90`](../../supabase/migrations/0093_exporter_audit_correction_naissance.sql#L90)

- Le test réel prouve refus navigateur, atomicité, audit et concurrence.
  [`correction-donnees-naissance-rpc.test.ts:55`](../../tests/correction-donnees-naissance-rpc.test.ts#L55)

- Le helper E2E synchronise le nouvel HTML initial sans faux négatif d'animation.
  [`_entrer.ts:74`](../../e2e/_entrer.ts#L74)

- Les scénarios mobiles gardent action, graine et explication hors de la barre.
  [`barre-basse.spec.ts:196`](../../e2e/barre-basse.spec.ts#L196)
