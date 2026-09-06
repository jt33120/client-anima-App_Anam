# Livraison réversible — carnet céleste

## État initial inspecté le 2026-09-06

- Dépôt distant : `jt33120/client-anima-App_Anam`.
- Branche initiale : main, alignée avec la référence locale origin/main.
- SHA initial : `2024cdec7c232aede8b418381f18360576768eda`.
- Fichier non suivi préexistant : opencode.json, exclu de la livraison.
- Branche de refonte créée par le pilote : `codex/carnet-celeste-ui`.
- Projet Vercel confirmé : `anima-app`, équipe `julian-talous-projects`.
- Liaison : `prj_vJkrJXJnV8pgE9YIJT7cpP86nWUI` / `team_KYf60VZacnJM4aB74L0TCoJY`.
- Framework Next.js, racine du dépôt, Node 24.x; CLI locale 41.4.1 autorisée en lecture.
- vercel.json conserve cdg1 et le cron /api/ordonnanceur; aucun changement prévu.

La liaison Git Vercel est confirmée vers ce même dépôt; productionBranch vaut main.
La protection SSO vaut prod_deployment_urls_and_all_previews : les Preview et URL immuables
exigent un accès Vercel, tandis que le domaine public existant est la cible du test en condition.

Production active confirmée par CLI puis API Vercel (champs filtrés, aucun secret affiché) :

- ID : `dpl_AdP629qKoaeWkNhABqpVD6ZA3eo5`, READY, target production.
- URL immuable : https://anima-c39d4076o-julian-talous-projects.vercel.app.
- Alias public : https://anima-app-swart.vercel.app.
- Autres alias : anima-app-julian-talous-projects.vercel.app et
  anima-app-git-main-julian-talous-projects.vercel.app.
- Création : 2026-09-06 à 21:03 Europe/Paris.
- gitSource.sha et meta.githubCommitSha concordent avec le SHA initial sur main.

La correspondance Git/déploiement est donc vérifiée; aucun paramètre distant n'a été modifié.

## Procédure

1. Identifier déploiement de production actuel, SHA, URL immuable et alias; conserver cette
   référence avant promotion.
2. Intégrer uniquement front/docs/tests pertinents sur la branche, exécuter les contrôles et
   examiner le diff.
3. Pousser la branche et attendre sa Preview; vérifier URL, Ready, SHA et interface réelle.
   Si Julian peut y tester l'application, conserver les alias de production initiaux.
4. Si protection Preview ou origine d'auth empêche le test réel, promouvoir le déploiement de
   branche à l'origine existante après contrôles et archivage de la baseline. Aucune fusion dans
   main ni modification Supabase n'est nécessaire.

## Retour

Avec une Preview, la production reste disponible à son URL habituelle. Si la branche est
promue, réactiver la référence initiale via Vercel Rollback ou
`vercel rollback dpl_AdP629qKoaeWkNhABqpVD6ZA3eo5 --yes`, puis vérifier les alias et l'interface initiale. La syntaxe a été confirmée par la CLI locale.
Aucune migration ne conditionne le retour.

## Preuves finales à compléter par la livraison

- Branche livrée : `codex/carnet-celeste-ui`; SHA exact inscrit dans les métadonnées Vercel du déploiement.
- Déploiement et URL initiaux : vérifiés ci-dessus.
- URL cible de la refonte : https://anima-app-swart.vercel.app; publier via `vercel deploy --prod` normal.
- Contrôles locaux : build Next, lint, 590 tests de rendu, palette et parité; captures dans `design/reviews/carnet-celeste/`.
- Livraison depuis une archive propre du commit, sans fichier local non suivi, sans modification du prébuild ni variable de contournement.

Les E2E qui créent des comptes visent la stack Supabase locale, jamais la production. La CI
actuelle épingle 2.92.0 pour sa configuration passkey; cette observation ne modifie aucun pin.
