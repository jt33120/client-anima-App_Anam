---
title: "Sprint Change Proposal — Fiabilité, Ennéagramme et Numérologie"
date: 2026-08-26
status: approved-for-implementation
approval_basis: "Julian — [A] le 2026-08-26"
workflow: bmad-correct-course
mode: batch
scope: major
---

# Sprint Change Proposal — 26 août 2026

## Décision proposée

Accepter une correction majeure en deux temps : **restaurer la compatibilité production avant toute évolution visuelle**, puis remplacer les parcours qui produisent une fausse certitude. Le retour ne remet pas en cause les invariants BMad ; il révèle deux décisions d’implémentation contraires à leur intention : livraison app/base non atomique et Ennéagramme qui force un type malgré FR-052.

OpenRouter n’entre pas dans la solution. La Numérologie est déjà déterministe et l’architecture interdit un intermédiaire US sur le chemin article 9. La clé publiée doit être révoquée ; aucune copie ne sera faite dans le dépôt ou Vercel.

## 1. Preuves et critique du besoin

| Retour | Cause établie | Besoin réel |
|---|---|---|
| Écran serveur, puis reload réussi | Protection anti-version-skew absente ; aucun boundary français. Le skew est l’hypothèse dominante, pas un digest prouvé faute de logs conservés | Continuité entre déploiements et reprise locale sûre |
| « Anam n’a pas pu ouvrir… » en boucle | Production à `0080`, code à `0086`; RPC d’ouverture `0084` absentes. L’erreur est aplatie et un polling 300 ms est illimité | Schéma/app compatibles, cause typée, reprise bornée |
| Ennéagramme abstrait et départage absurde | 18 items, deux par type ; égalités structurellement fréquentes ; l’UI demande un numéro sans l’expliquer | Scénarios observables, droit de ne pas savoir, incertitude assumée |
| Numérologie trop interprétative | Les 69 lectures sont en réalité `non_ecrit`; six valeurs apparaissent sans leur arithmétique | Méthode et calcul vérifiables, lecture symbolique séparée |

Le calcul théorique des réponses actuelles donne environ 41 % d’égalité au sommet sous réponses uniformes indépendantes : c’est un signal structurel, pas une statistique d’usage. Les 65 tests ouverture, 82 tests Ennéagramme et 136 tests Numérologie passent parce qu’ils vérifient le comportement local, pas l’écart avec la production ni la qualité du questionnaire.

## 2. Impact BMad

- **Story 14.5** est corrigée : synchronisation `0081–0086`, états `connexion-requise | concurrence | service-indisponible`, attente bornée et composeur non bloqué si seul le greeting échoue.
- **Story 14.6** est créée : contrôle de dérive avant promotion, stratégie expand/app/contract, identifiant de déploiement et frontières d’erreur françaises.
- **Story 13.8** remplace explicitement la décision historique de préserver le départage Ennéagramme. L’historique reste lisible ; il n’est pas réécrit comme s’il n’avait jamais existé.
- **Story 13.9** sépare trace factuelle de calcul et corpus symbolique.
- **Epic 15 et Stories 13.6–13.7** restent valables : seuil privé, Socle synthétique et Astrologie exacte.

FR-031 (aucun score), FR-047 (calcul, jamais LLM), FR-052 (hypothèse, jamais assertion), FR-053 (aucune prédiction) et FR-054/086 (seul corpus Anima attribuable) sont renforcés. Le PRD, `epics.md` et `EXPERIENCE.md` seront amendés après approbation, sans modifier silencieusement les stories terminées.

## 3. Solution et séquence

1. Inspecter les migrations en attente, sauvegarder/dry-run, appliquer `0081–0086`, puis smoke Anam authentifié.
2. Ajouter un check CI/livraison qui compare les migrations locale/distante avant Vercel ; rendre les prochains changements expand/app/contract.
3. Ajouter `deploymentId` ou protection anti-skew, `error.tsx`/`global-error.tsx` français et résultats typés pour les lectures Supabase attendues.
4. Refaire l’Ennéagramme : explication et limites avant « Commencer », disclosure des neuf repères issus du corpus, questions concrètes à fréquence, quatre choix illustrés et « Je ne sais pas » comme manque. Supprimer le choix manuel d’un type ; utiliser un nombre fini de questions de précision, sinon conclure « ne tranche pas aujourd’hui ».
5. Rendre la Numérologie traçable : entrée, conventions, réductions et année ; une seule note si le corpus est vide ; éventuelle « Lecture symbolique d’Anima » séparée.
6. Finaliser seuil/Socle/Astrologie, revoir et tester, intégrer à `main`, pousser, surveiller Vercel et vérifier son SHA.

Les icônes de réponse seront des SVG déterministes cohérents avec les glyphes natifs, libellés et accessibles ; une génération raster ajouterait du poids sans améliorer ce composant.

## 4. Recherche et choix make/buy

- Next/Vercel fournit déjà les mécanismes nécessaires : [version skew Next](https://nextjs.org/docs/app/guides/self-hosting) et [Skew Protection Vercel](https://vercel.com/docs/skew-protection). Aucune bibliothèque n’est nécessaire.
- La littérature conclut à des preuves mixtes sur la fiabilité/validité de l’Ennéagramme ; le produit doit rester exploratoire ([Hook et al., 2021](https://pubmed.ncbi.nlm.nih.gov/33332604/)). Les réponses doivent correspondre à la formulation comportementale ([Olson et al., 2019](https://academic.oup.com/jssam/article/7/1/34/4989440)). Faute d’instrument neuf types, licencié et validé répondant au cadre produit, la story part du domaine existant et documente sa version, sans revendiquer une validation psychométrique.
- Une option « je ne sais pas » peut augmenter les non-réponses mais évite ici une réponse intime inventée ; elle reste manquante, jamais moyenne ([Kmetty & Stefkovics, 2022](https://www.tandfonline.com/doi/full/10.1080/13645579.2021.1929714)).
- OpenRouter gratuit est variable et limité ; ZDR ne remplace pas un DPA couvrant les utilisatrices et données sensibles. Il reste hors production ([FAQ](https://openrouter.ai/docs/faq), [ZDR](https://openrouter.ai/docs/guides/features/zdr), [routage UE](https://openrouter.ai/docs/guides/features/sovereign-ai)).

## 5. Portes et handoff

- **Go production DB :** dry-run compris, compatibilité du code actif vérifiée, sauvegarde/récupération connue.
- **Go UX :** aucune étiquette à deviner, aucun score, inconnue persistée, clavier/lecteur d’écran et 390/768/1440 validés.
- **Go livraison :** tests ciblés, `quality`, E2E et revue adversariale verts ; schéma aligné ; SHA Vercel = `origin/main`.
- **Handoff après approbation :** développement exécute stories ; UX vérifie compréhension et hiérarchie ; architecture revoit migrations, RLS, anti-skew et WebAuthn ; revue contrôle les chemins d’échec et la production.
