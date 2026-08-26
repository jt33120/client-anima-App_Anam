# Epic 3 Context: Devenir premium

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Permettre à l’utilisatrice, après avoir reçu le bilan complet de sa première séance, de choisir sans pression un abonnement annuel web qui débloque la relation avec Anam dans la durée. L’epic doit rendre le paiement, l’entitlement, le quota résiduel, la résiliation et le remboursement fiables et rejouables, tout en maintenant un socle gratuit à vie et en empêchant toute mécanique commerciale d’interférer avec la sécurité.

## Stories

- Story 3.1: L’ossature d’abonnement — Stripe Checkout, webhooks idempotents, projection d’état
- Story 3.2: Le paywall à la clôture de la première séance
- Story 3.3: Tronc gratuit, branches premium, socle jamais coupé
- Story 3.4: Allocation résiduelle et métrage d’usage exactement-une-fois
- Story 3.5: Résiliation en trois clics et garantie de remboursement

## Requirements & Constraints

- L’offre est unique : 69 €/an sur le web, sans achat intégré, prix barré, urgence, rareté artificielle ni autre dark pattern. La proposition n’apparaît qu’une fois, sous un bilan déjà livré ; la première séance reste intégrale et de qualité inchangée.
- Le gratuit à vie comprend le socle calculé, le test d’ennéagramme, le mantra et l’horoscope quotidiens, les ressources d’aide, la première séance jusqu’au bilan et le tronc de l’arbre. Le premium couvre la conversation illimitée, les branches, lectures, ancrages, plans d’étapes, synthèses et mémoire longue.
- Après le bilan, un compte gratuit conserve une allocation de conversation paramétrable à l’exécution. Son épuisement arrête seulement l’échange avec Anam : le reste du produit demeure accessible. Un compte premium n’est pas soumis à ce quota.
- Aucun paywall, quota, bilan commercial, carte d’abonnement ou courriel commercial ne doit apparaître pendant un épisode de détresse. La levée des limites est une garde serveur et prime sur tout état commercial.
- La garantie rembourse sur simple demande après trois mois sans branche posée. Elle porte exclusivement sur cet artefact produit, jamais sur l’état de la personne. Résiliation et remboursement doivent être sans friction, sans questionnaire ni rétention, et l’utilisatrice doit être informée avant reconduction.
- Les indicateurs pertinents sont les utilisatrices payantes qui reviennent, la conversion vers le payant, le renouvellement annuel, ainsi que les remboursements et résiliations précoces comme contre-métriques.

## Technical Decisions

- Utiliser Stripe Checkout hébergé. Les secrets restent côté serveur ; les montants sont stockés en centimes EUR (`6900`). Toute mutation passe par un route handler authentifié et respecte l’isolation RLS par utilisatrice.
- Vérifier la signature de chaque webhook avant traitement. Dédupliquer les événements par leur identifiant fournisseur et faire de `abonnement` une projection à écrivain unique avec les états `actif`, `resilie` et `expire`. Paiement, renouvellement, résiliation et remboursement doivent pouvoir être rejoués sans double effet.
- L’entitlement premium est la source interrogée par toutes les gardes fonctionnelles. Un compte peut toutefois être premium à titre gracieux : ne jamais fabriquer de client, d’abonnement ou d’événement Stripe pour le représenter.
- Écrire l’usage IA une seule fois par requête logique avec une clé d’idempotence, puis le réconcilier à la fin ou à l’avortement du stream. Le registre d’usage est attribué à l’utilisatrice mais ne contient aucune donnée sensible ni contenu de conversation.
- Lire les paramètres produit, notamment l’allocation résiduelle, depuis la configuration à l’exécution. Les réponses d’erreur et les états de paiement utilisent le registre système, jamais la voix d’Anam.
- Le retour de Stripe doit restaurer la position précédente, quel que soit le résultat, sans dramatisation ni relance. Le libellé bancaire doit rester neutre et configurable ; sa valeur finale dépend de l’entité juridique qui encaisse.

## UX & Interaction Patterns

- La carte d’abonnement vit dans le fil sous le bilan, jamais en modale, plein écran ou interstitiel. « M’abonner » et « Pas maintenant » sont immédiatement visibles et de lisibilité égale ; un refus ferme la carte pour le reste de la session.
- La carte explique sur la même surface ce qui reste gratuit, ce que débloque le premium et la garantie de remboursement. Tous ces textes sont en registre produit avec Inter ; Anam ne vend rien. La garantie apparaît près du prix en métadonnée lisible, pas derrière un lien.
- L’arbre reste une destination identique pour tous les comptes. Une utilisatrice gratuite voit son tronc, même incomplet, et l’espace vide des futures branches, sans cadenas, flou, fantôme, compteur ni pastille premium.
- L’abonnement reste accessible depuis le menu de compte. La résiliation tient en trois clics maximum : menu, abonnement, résilier, avec une confirmation unique sur la même vue. Les feuilles ne s’empilent pas et le focus revient au déclencheur.
- Respecter WCAG 2.2 AA, des cibles d’au moins 44 × 44 px, des libellés explicites, le zoom à 200 % sans perte et la redistribution à 400 %. Aucune action ou information ne disparaît automatiquement avant lecture.

## Cross-Story Dependencies

- La Story 3.1 fournit l’état d’abonnement et l’entitlement consommés par les Stories 3.2 à 3.5.
- La Story 2.9 fournit le bilan et le point de montage gardé où la Story 3.2 insère la proposition commerciale.
- La Story 3.4 partage avec les Stories 3.2 et 3.3 la distinction entre première séance, allocation résiduelle, gratuit permanent et premium illimité ; toutes réutilisent la même garde de détresse.
- L’éligibilité au remboursement dépend de l’existence des branches livrées par l’epic de mémoire et d’arbre. Les fonctionnalités premium ultérieures doivent toutes interroger le même entitlement côté serveur.
- L’entité juridique qui encaisse et le libellé bancaire associé doivent être tranchés avant d’accepter de vrais paiements.
