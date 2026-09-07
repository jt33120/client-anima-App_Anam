# Livraison réversible — carnet céleste

## Référence avant l'itération nocturne

- Branche locale et distante : `codex/carnet-celeste-ui`, suivi origin confirmé.
- SHA de première refonte : `40dcd22593c6c69737def3641f51f62c57b7a63c`.
- Déploiement READY production confirmé indépendamment par API Vercel :
  `dpl_DFEd5WyGwpeoQM5fbnTDFUNKC4z4`.
- URL immuable : https://anima-pnkj83tjc-julian-talous-projects.vercel.app.
- Alias public : https://anima-app-swart.vercel.app.
- Retour de la prochaine livraison :
  `vercel rollback dpl_DFEd5WyGwpeoQM5fbnTDFUNKC4z4 --yes`.

La prochaine itération utilise cette référence pour revenir à la première refonte. L'ancienne
référence ci-dessous est conservée pour retrouver l'interface antérieure à toute refonte.
Les métadonnées Vercel githubCommitSha et githubCommitRef concordent avec le SHA et la branche.
L'autorisation utilisateur de pousser et publier demeure acquise; aucune nouvelle confirmation
n'est nécessaire pour les gestes déjà autorisés. Aucune migration n'entre dans le périmètre.

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

Production avant toute refonte confirmée par CLI puis API Vercel (champs filtrés) :

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
4. Si protection Preview ou origine d'auth empêche le test réel, reconstruire la branche avec
   `vercel deploy --prod --yes` dans l'environnement de production, après contrôles et archivage
   de la baseline. Ne pas promouvoir directement le build Preview. Aucune fusion dans main ni
   modification Supabase n'est nécessaire.

## Collision de déploiement et correctif ciblé

La Preview Git du commit nocturne `8a8fe0b6dec1e7e6990ad0fef764bd21ef29375f` est READY.
La publication CLI normale de ce même commit a terminé son build, puis Vercel a refusé le
déploiement car son `deploymentId` existait déjà. La configuration préexistante dérivait cet
identifiant des 32 premiers caractères du SHA : deux publications du même commit partageaient
donc le même identifiant.

Le correctif de `next.config.ts` donne priorité à `VERCEL_DEPLOYMENT_ID`, puis conserve les
replis historiques `VERCEL_GIT_COMMIT_SHA` et `NEXT_DEPLOYMENT_ID`. La validation et la limite
de 32 caractères restent en place. Vercel documente cet identifiant comme propre à chaque
déploiement et disponible au build comme à l'exécution :
[variables système Vercel](https://vercel.com/docs/environment-variables/system-environment-variables#vercel_deployment_id).
La revue indépendante ne relève aucun blocage dans ce changement ciblé. Le pilote confirme
six tests de version skew réussis, ESLint et TypeScript réussis.

Le protocole Next de compatibilité entre versions est préservé : identifiant dans les ressources
et navigations, puis rechargement complet en cas de différence de version. Cette propriété ne
constitue pas une vérification de l'activation du service Skew Protection du projet ni une
garantie de conservation d'un état de formulaire uniquement en mémoire. Les requêtes `fetch`
personnalisées ne sont pas automatiquement couvertes par ce routage ; elles restent inchangées.
Voir le guide installé `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/deploymentId.md`
et la [documentation Vercel Skew Protection](https://vercel.com/docs/skew-protection).

Ce correctif ajoute une modification de configuration de livraison front à la portée UI.
La preuve antérieure des 367 fichiers inchangés reste une preuve de la refonte avant ce correctif ;
`next.config.ts` en est désormais l'exception explicite. API, logique métier, migrations,
`package.json`, `vercel.json` et contrôles de schéma ne sont pas modifiés.
L'écart distant préexistant sur les migrations 0091–0093 reste documenté ; aucune migration
n'est appliquée et aucune garantie de concordance du schéma distant n'est revendiquée.

La nouvelle livraison doit partir d'une archive propre du commit corrigé et poussé, avec une
commande `vercel deploy --prod` normale et les métadonnées de branche/SHA correspondantes.
Le prébuild `--promotion` s'exécute sans changement, sans `--prebuilt` ni neutralisation de
variable. Respecter un éventuel blocage du pipeline. L'ID READY, le SHA final et les alias restent
à confirmer après cette nouvelle exécution ; le rollback conservé demeure
`dpl_DFEd5WyGwpeoQM5fbnTDFUNKC4z4`.

## Retour avant toute refonte

Avec une Preview, la production reste disponible à son URL habituelle. Si la branche est
promue, réactiver la référence initiale via Vercel Rollback ou
`vercel rollback dpl_AdP629qKoaeWkNhABqpVD6ZA3eo5 --yes`, puis vérifier les alias et l'interface initiale. La syntaxe a été confirmée par la CLI locale.
Aucune migration ne conditionne le retour.

## Preuves de première livraison et prochaine itération

- Branche livrée : `codex/carnet-celeste-ui`; SHA exact inscrit dans les métadonnées Vercel du déploiement.
- Déploiement et URL initiaux : vérifiés ci-dessus.
- URL cible de la refonte : https://anima-app-swart.vercel.app; publier via `vercel deploy --prod` normal.
- Contrôles locaux : build Next, lint, 590 tests de rendu, palette et parité; captures dans `design/reviews/carnet-celeste/`.
- Livraison depuis une archive propre du commit, sans fichier local non suivi, sans modification du prébuild ni variable de contournement.
- L'itération nocturne ajoute ses propres captures et contrôles selon validation-nocturne.md;
  les preuves antérieures ne suffisent pas à clore le défaut du clavier mobile.

Les E2E qui créent des comptes visent la stack Supabase locale, jamais la production. La CI
actuelle épingle 2.92.0 pour sa configuration passkey; cette observation ne modifie aucun pin.
