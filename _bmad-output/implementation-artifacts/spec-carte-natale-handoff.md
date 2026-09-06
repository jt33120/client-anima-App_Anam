---
title: 'Intégrer la carte natale peinte et interactive'
type: 'feature'
created: '2026-09-06'
status: 'done'
review_loop_iteration: 0
baseline_commit: '87998390b63752bbf2c80241fecbdeb2c889100b'
context:
  - '{project-root}/design/design-spec.md'
  - '{project-root}/_bmad-output/implementation-artifacts/5-1-theme-natal-calcule-une-fois-grave.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La carte natale actuelle est une projection polaire exacte mais abstraite, peu lisible et sans identité planétaire. Elle ressemble à un instrument technique plutôt qu'à un thème natal Anima.

**Approach:** Porter le handoff `/Users/juliantalou/Downloads/handoff_carte_natale` dans la halte Astrologie : roue zodiacale orientée sur l'Ascendant, planètes illustrées, maisons, axes, aspects majeurs, anti-collision, sélection et commandes tactiles, tout en conservant les données déterministes du socle comme unique vérité.

## Boundaries & Constraints

**Always:** Dériver dessin et texte de la même longitude sérialisée ; conserver la Terre comme point d'observation non affiché ; annoncer les absences ; utiliser les assets SVG fournis, les tokens Anima, les cibles tactiles de 44 px, le clavier et le mouvement réduit ; garder le détail textuel existant.

**Ask First:** Toute nouvelle source d'éphémérides, modification du système de maisons ou interprétation astrologique rédigée.

**Never:** Inventer Chiron, le mouvement rétrograde ou une position ; afficher une carte exacte sans heure fiable ; déplacer une longitude pour l'esthétique sans ligne de rappel ; introduire un calcul astronomique dans `render/` ; modifier `opencode.json`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Thème complet | Longitudes, angles et maisons calculés | Roue complète, ASC à gauche, planètes sélectionnables, texte concordant | N/A |
| Stellium | Plusieurs corps à moins de l'écart visuel | Voies radiales distinctes et rappels vers les longitudes vraies | Aucun recouvrement silencieux |
| Heure absente | Précision `midi_par_defaut` | Pas de roue présentée comme exacte ; appel existant vers l'heure de naissance | Les positions certaines restent dans le détail textuel |
| Corps non couvert | Chiron absent de l'éphéméride | Aucun faux corps ; manque existant conservé | Raison lisible sous le pli |

</frozen-after-approval>

## Code Map

- `lib/domain/fiche-socle.ts` — construit le modèle de vue depuis le thème natal déterministe.
- `render/socle/types.ts` — redéclare la frontière sérialisable sans accès au domaine.
- `render/socle/FicheSocle.tsx` — ordonne horoscope, roue et détail textuel.
- `render/socle/CarteNatale.tsx` — nouveau client interactif issu du handoff.
- `render/socle/CarteNatale.module.css` — matière, responsive et états d'interaction tokenisés.
- `public/images/astrologie/planets/` — miniatures SVG fournies par le handoff.
- `tests/fiche-socle.test.ts` et `tests/rendu/fiche-socle.test.tsx` — concordance du modèle et du DOM.

## Tasks & Acceptance

**Execution:**
- [x] `public/images/astrologie/planets/*` — intégrer les assets fournis sans les redessiner.
- [x] `lib/domain/fiche-socle.ts` et `render/socle/types.ts` — exposer les aspects majeurs déterministes sous forme sérialisée, sans ajouter de fausse donnée.
- [x] `render/socle/CarteNatale.tsx` — porter la géométrie, l'orientation, l'anti-collision, la sélection et les contrôles du handoff.
- [x] `render/socle/CarteNatale.module.css` — adapter le rendu peint aux tokens et aux largeurs 390/768/1440.
- [x] `render/socle/FicheSocle.tsx` — remplacer l'ancien cadran tout en conservant l'ordre produit.
- [x] `tests/*fiche-socle*` — garder précision, absence et accessibilité.

**Acceptance Criteria:**
- Given un thème complet, when la halte Astrologie s'affiche, then les douze signes, maisons, axes et tous les corps disponibles sont placés depuis leurs longitudes exactes et chaque planète ouvre une fiche lisible.
- Given un amas de corps, when la roue se dessine, then chaque miniature reste distinguable et reliée à sa longitude vraie.
- Given une heure absente ou Chiron non couvert, when la halte s'affiche, then aucune précision ni planète n'est inventée.
- Given clavier, tactile ou mouvement réduit, when la roue est manipulée, then les mêmes informations restent accessibles sans animation obligatoire.

## Spec Change Log

## Design Notes

Le handoff est la source visuelle. Sa palette est traduite vers les rôles existants plutôt que recopiée en couleurs locales. Les deux nœuds actuels sont moyen et vrai : ils utilisent tous deux le glyphe nord, jamais l'asset sud qui raconterait une donnée différente.

## Verification

**Commands:**
- `npm test -- tests/lexique-voix.test.ts tests/copie-sans-cadratin.test.ts tests/fiche-socle.test.ts tests/rendu/fiche-socle.test.tsx tests/socle-frontiere.test.ts` — 545 tests verts.
- `npm run lint` et `npx tsc --noEmit` — lint et typage verts.
- `npx next build` — production compilée.
- `git diff --check` — diff propre.

**Manual checks:**
- Captures 390, 768 et 1440 px : lisibilité, absence de collision et aucun débordement.

## Suggested Review Order

**Expérience principale**

- Point d'entrée de la roue peinte, précise et accessible.
  [`CarteNatale.tsx:189`](../../render/socle/CarteNatale.tsx#L189)

- L'ancienne projection est remplacée sans déplacer le détail textuel.
  [`FicheSocle.tsx:279`](../../render/socle/FicheSocle.tsx#L279)

- Le responsive et les états tactiles restent portés par les tokens Anima.
  [`CarteNatale.module.css:1`](../../render/socle/CarteNatale.module.css#L1)

**Vérité astrologique**

- Les aspects majeurs sont calculés avec des orbes explicites et bornés.
  [`fiche-socle.ts:507`](../../lib/domain/fiche-socle.ts#L507)

- La frontière de rendu expose uniquement des données sérialisées.
  [`types.ts:83`](../../render/socle/types.ts#L83)

**Preuves**

- Le domaine garantit des longitudes d'aspects exactes et concordantes.
  [`fiche-socle.test.ts:349`](../../tests/fiche-socle.test.ts#L349)

- La parité domaine-rendu verrouille la nouvelle structure d'aspects.
  [`socle-frontiere.test.ts:71`](../../tests/socle-frontiere.test.ts#L71)
