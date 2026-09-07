---
id: SPEC-carnet-celeste
companions:
  - ../../../design/design-spec.md
  - iteration-nocturne.md
  - stories.md
  - validation-nocturne.md
  - deployment.md
sources: []
---

# Anima — carnet céleste

## Why

Julian confie une refonte du front pour éprouver une expression pastel, manuscrite et spirituelle
sur Vercel, avec retour possible. Après la première livraison, il précise sa direction : nuit
bleu ciel-violet, dégradés, textures, lotus et étoiles avec touches chaudes discrètes. Deux
problèmes observés doivent disparaître : un accueil trop grand et plat, et le fil Anam masqué
par le clavier mobile.

## Capabilities

- **CAP-1**
  - **intent:** Parcourir un univers visuel cohérent dans toute l'application.
  - **success:** Accueil, Anam, univers, accès, compte et aide partagent la direction nocturne
    documentée, constatée sur des captures représentatives aux trois largeurs de référence.
- **CAP-2**
  - **intent:** Comprendre les informations essentielles et trouver chaque action existante.
  - **success:** L'accueil présente du contenu utile dans le premier écran; sa composition reste
    compacte et hiérarchisée à 390, 768 et 1440 px, sans perdre destinations ni actions.
- **CAP-3**
  - **intent:** Utiliser une interface réactive et accessible dans ses états réels.
  - **success:** Focus visible, cibles de 44 px, contrastes AA, mouvement réduit et états réels
    sont vérifiés; clavier mobile ouvert, le fil reste lisible et défilable et le composeur
    demeure visible et utilisable sans recouvrement.
- **CAP-4**
  - **intent:** Entrer dans une ambiance nuit confortable et choisir Papier si souhaité.
  - **success:** Sans préférence, la première peinture est nocturne; le choix explicite reste
    réversible, y compris sans stockage, et le contraste renforcé conserve sa priorité.
- **CAP-5**
  - **intent:** Essayer la refonte sur une branche Vercel dédiée.
  - **success:** Une URL réelle accessible est Ready, correspond au SHA livré et affiche le front
    attendu sans changement des services métier.
- **CAP-6**
  - **intent:** Revenir à la version précédant la dernière itération sans perte de données.
  - **success:** SHA et déploiement précédents sont archivés; une procédure concrète permet le
    retour sans migration et la toute première référence reste conservée.

## Constraints

- Front exclusivement; préserver API, données, auth, consentements, confidentialité, calculs et
  contrats réseau. Préserver les distinctions entre absence, indisponibilité et refus.
- La demande nocturne supplante le défaut Papier initial. Le compagnon iteration-nocturne.md
  fait autorité sur cette révision de direction; les autres invariants de design demeurent.
- Préserver tokens historiques et parité; générer la surcouche depuis design/tokens.json.
- Lotus, étoiles, textures et dégradés ne réduisent ni contraste ni capacité d'interaction;
  contraste renforcé et mouvement réduit gardent priorité sur le décor.
- La correction clavier porte sur géométrie, défilement et focus sans changer les messages,
  leur persistance, les requêtes ou les actions métier.
- Garder la branche isolée et l'état initial identifiable. Exclure opencode.json, préexistant
  non suivi, de la livraison; conserver le contrôle de promotion Vercel sans contournement.

## Non-goals

- Modifier backend, données distantes, migrations ou algorithmes.
- Changer politique de consentement, sécurité d'accès ou destinations métier.
- Fusionner automatiquement la refonte dans main pour la faire essayer.
- Présenter une simulation de viewport comme la preuve d'un clavier physique réel.

## Success signal

Julian retrouve sur l'URL Vercel vérifiée une nuit plus riche, un accueil compact et un fil Anam
qui reste utilisable pendant la saisie mobile. Le rapport lie captures, conditions de clavier,
SHA, contrôles réalisés et limites restantes; un retour vers le déploiement précédent reste
concret et sans migration.

## Assumptions

- Une préférence Papier explicitement choisie reste valable; seule l'absence de choix déclenche
  la nouvelle Nuit par défaut.
- La publication emploie le déploiement --prod normal sur la branche déjà suivie, avec la même
  origine d'authentification. L'autorisation utilisateur de pousser et publier demeure acquise.
