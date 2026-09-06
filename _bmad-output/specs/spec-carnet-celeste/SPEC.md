---
id: SPEC-carnet-celeste
companions:
  - ../../../design/design-spec.md
  - stories.md
  - deployment.md
sources: []
---

# Anima — carnet céleste

## Why

Julian confie une refonte complète du front pour découvrir une nouvelle expression d'Anima :
pastel, manuscrite et spirituelle, avec des contrastes et une organisation plus lisibles. Il doit
éprouver le résultat sur Vercel et revenir à l'interface initiale si elle ne lui convient pas.

## Capabilities

- **CAP-1**
  - **intent:** Parcourir un univers visuel cohérent dans toute l'application.
  - **success:** Accueil, Anam, univers, accès, compte et aide partagent la direction documentée,
    constatée sur des captures représentatives aux trois largeurs de référence.
- **CAP-2**
  - **intent:** Comprendre les informations essentielles et trouver chaque action existante.
  - **success:** Hiérarchie et ordre de lecture fonctionnent à 390, 768 et 1440 px; destinations,
    formulaires et actions utiles restent accessibles.
- **CAP-3**
  - **intent:** Utiliser une interface réactive et accessible dans ses états réels.
  - **success:** Focus visible, cibles de 44 px, contrastes AA, mouvement réduit et états vide,
    chargement, erreur et dense sont vérifiés sur les composants modifiés.
- **CAP-4**
  - **intent:** Choisir une ambiance nuit confortable lorsque souhaité.
  - **success:** Le choix Papier/Nuit fonctionne et textes, surfaces et rendus concernés restent
    lisibles, y compris en contraste renforcé.
- **CAP-5**
  - **intent:** Essayer la refonte sur une branche Vercel dédiée.
  - **success:** Une URL réelle accessible est Ready, correspond au SHA livré et affiche le front
    attendu sans changement des services métier.
- **CAP-6**
  - **intent:** Revenir à la version initiale sans perte de données.
  - **success:** SHA et déploiement initiaux sont enregistrés; une procédure concrète permet le
    retour sans migration.

## Constraints

- Front exclusivement; préserver API, données, auth, consentements, confidentialité, calculs et
  contrats réseau. Préserver les distinctions entre absence, indisponibilité et refus.
- La nouvelle demande supplante la nuit native obligatoire : ivoire, encre aubergine, pastels
  lavande/rose/sauge, serif éditorial et annotations manuscrites rares forment la direction.
- Préserver tokens historiques et parité; la surcouche carnet est générée depuis une source
  unique, `design/tokens.json`, selon le contrat de design compagnon.
- Réutiliser les assets déclarés; préserver clavier, contraste renforcé et mouvement réduit.
  Aucun résultat personnel ni message Anam fabriqué.
- Garder la branche isolée et l'état initial identifiable. Exclure `opencode.json`, préexistant
  non suivi, de cette livraison.

## Non-goals

- Modifier backend, données distantes, migrations ou algorithmes.
- Changer politique de consentement, sécurité d'accès ou destinations métier.
- Fusionner automatiquement la refonte dans main pour la faire essayer.

## Success signal

Julian ouvre une URL Vercel vérifiée correspondant au commit de la branche et essaie les parcours
avec le nouveau front. Il dispose d'un geste de retour vers le déploiement initial. Le rapport
nomme les vérifications réalisées et leurs limites, avec captures aux trois largeurs.

## Assumptions

- « Voir en prod » signifie une URL Vercel réelle et testable : Preview si accessible; promotion
  de la branche si nécessaire à l'accès réel, avec retour documenté et sans fusion.
- Les assets existants suffisent; une nouvelle bibliothèque ou génération ne conditionne pas la
  livraison.
