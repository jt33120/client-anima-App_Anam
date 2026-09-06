---
id: SPEC-arbre-celeste
companions:
  - ../../../design/tree-of-life-spec.md
  - mapping-stades.md
  - stories.md
sources: []
---

# Anima — arbre de vie céleste

## Why

Julian confie une nouvelle évolution visuelle : un arbre de vie plus naturel, magique et pastel,
dont la croissance mène de la graine à la pleine lumière dans la nuit céleste existante.
L’arbre doit rendre sensible le parcours réel de la personne, avec une profondeur et une
matière plus crédibles, tout en gardant ses actions accessibles et sa livraison réversible.

## Capabilities

- **CAP-1**
  - **intent:** Contempler un arbre naturel et magique intégré à l’univers céleste.
  - **success:** Graine, pousse, feuillaison et rayonnement présentent des silhouettes et matières
    lisibles sur des projections contrôlées à 390, 768 et 1440 px.
- **CAP-2**
  - **intent:** Reconnaître sa croissance réelle et retrouver chaque branche de son parcours.
  - **success:** Les branches affichées correspondent aux données ; feuillaison pleine et
    rayonnement restent distincts, sans score inventé, et fiches/conversations restent reliées.
- **CAP-3**
  - **intent:** Explorer l’arbre et sa liste avec les mêmes possibilités d’action.
  - **success:** Cibles de 44 px, clavier, focus, zoom, liste équivalente, contraste renforcé et
    mouvement réduit sont vérifiés sans perte d’action ni d’information.
- **CAP-4**
  - **intent:** Profiter d’un arbre fluide qui respecte les capacités du terminal.
  - **success:** L’état immobile ne déclenche aucune reconstruction ni peinture continue ;
    caches, résolution bornée et libération des ressources sont contrôlés.
- **CAP-5**
  - **intent:** Essayer la nouvelle interface et revenir à la version précédente.
  - **success:** Une production READY concorde avec le SHA de la branche et ses preuves ;
    le déploiement précédent reste restaurable sans migration.
- **CAP-6**
  - **intent:** Comprendre les métamorphoses possibles de son arbre.
  - **success:** Quatre illustrations manuelles, clairement fictives et distinctes du parcours
    personnel, expliquent graine, pousse, feuillaison et rayonnement sans changer les données.

## Constraints

- Front uniquement : préserver API, données, auth, confidentialité, consentements et règles métier.
- Les états et intensités projetés sont l’autorité. Le rayonnement exige la déclaration déjà
  prévue ; aucune durée d’observation, densité de branches ou apparence ne le déclenche.
- Préserver saut direct naissance vers rayonnement, réconciliation monotone, indisponibilité
  distincte du vide et sens du tronc incomplet. Le mapping compagnon précise ces invariants.
- Conserver l’ambiance nocturne par défaut, le choix Papier et la priorité du contraste renforcé.
- Conserver les actions et la correspondance entre géométrie, points interactifs et liste.
- L’exploration pédagogique utilise le même rendu et distingue ses exemples des données réelles ;
  elle ne présente ni parcours linéaire obligatoire ni progression automatique.
- Livrer sur codex/carnet-celeste-ui par un build production normal, contrôles de promotion
  inchangés ; exclure le fichier préexistant opencode.json.

## Non-goals

- Créer un score spirituel, un niveau global, des seuils affichés ou des étapes métier nouvelles.
- Changer backend, migrations, progression persistée ou opérations sur les données distantes.
- Promettre une progression à partir d’une animation, de l’inactivité ou d’un nombre de visites.
- Fusionner automatiquement dans main ou présenter une simulation comme une preuve sur téléphone physique.

## Success signal

Sur l’URL Vercel vérifiée, l’arbre raconte les mêmes données avec une silhouette botanique plus
convaincante, une lumière fidèle aux états et des interactions accessibles. Les preuves couvrent
les principaux stades et tailles ; le rollback vers dpl_7wkZgRtjNVkgC4tNiWjfNSSj7YE8 est conservé.

## Assumptions

- Le réalisme demandé concerne la matière, les raccords et la profondeur d’un arbre stylisé.
- La baseline fournie par le pilote est le SHA 7c8c2d21255f04d8e3e75b97637d36b146ebd58c,
  production READY dpl_7wkZgRtjNVkgC4tNiWjfNSSj7YE8 ; elle sera revalidée lors de la livraison.
