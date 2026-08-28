# Déployer sans dérive entre le code et Supabase

La promotion de production est désormais impossible tant que l’historique des migrations lié ne
correspond pas exactement aux fichiers du dépôt. La porte utilise uniquement les commandes de
lecture de la CLI Supabase : `migration list --linked`, puis `db push --linked --dry-run` quand un
écart existe. Elle ne dépend donc d’aucune RPC applicative qui pourrait elle-même manquer.

## Ce que le build vérifie

- `npm run schema:check` valide les noms, l’unicité et la continuité des fichiers locaux.
- `npm run schema:check:linked` compare les deux historiques et échoue dans les deux sens de dérive.
- `npm run build` lance automatiquement la comparaison distante lorsque
  `VERCEL_ENV=production`. Les builds locaux et de préversion restent sur la vérification locale.
- La sortie ne reprend ni URL, ni mot de passe, ni message SQL. Elle affiche seulement les versions
  absentes et les noms de migrations confirmés par le dry-run.

Le build de production a besoin de trois secrets Vercel : `SUPABASE_PROJECT_REF`,
`SUPABASE_ACCESS_TOKEN` et `SUPABASE_DB_PASSWORD`. `NEXT_PUBLIC_SUPABASE_URL` peut fournir la
référence de projet en repli, mais les deux secrets restent obligatoires lorsqu’aucun lien local
n’existe dans l’environnement éphémère.

## Ordre de promotion

1. Lancer `npm run schema:check:linked`. Un échec est attendu tant que la base est en retard.
2. Examiner `supabase db push --linked --dry-run`. Le plan doit contenir uniquement les migrations
   attendues et aucune graine.
3. Faire relire les opérations contractuelles, les verrous et les changements de droits.
4. Appliquer les migrations avec le geste d’exploitation explicitement autorisé.
5. Relancer `npm run schema:check:linked` jusqu’au verdict de parité.
6. Promouvoir ensuite le code. Le `deploymentId` fondé sur le SHA Vercel force un ancien onglet à
   rejoindre le nouveau déploiement lors de sa prochaine navigation.

Ne jamais inverser les étapes 4 et 6. Une vérification rouge interdit le merge ou la promotion.

## Audit 0081–0086 du 26 août 2026

La lecture distante effectuée avant toute modification montrait une parité jusqu’à `0080`, puis
`0081` à `0086` uniquement en local. Le dry-run distant annonçait exactement ces six fichiers ;
aucune migration n’a été appliquée pendant l’audit.

| Phase | Migrations | Compatibilité vérifiée |
|---|---|---|
| Expand | `0081`–`0083` | Colonnes, registre quotidien et réservation atomique sont ajoutés avant leurs appelants. |
| App | `0084` | L’outbox et les nouvelles RPC deviennent la voie nominale. L’ancienne signature `consigner_ouverture_quotidienne_anam` reste un pont vers l’outbox pendant le déploiement. |
| Contract | `0085` | La RPC de la carte Anam est retirée après disparition de son appelant déjà livré. |
| Extension compatible | `0086` | L’export est remplacé à signature constante pour inclure les nouveaux registres. |

Le pont de `0084` doit être retiré dans une migration contract ultérieure seulement après extinction
vérifiée des anciens déploiements. Il ne faut pas réécrire une migration déjà appliquée pour le
faire.

## Diagnostic sûr

- `schema-incompatible` signifie que l’application attend une relation ou une RPC absente ; la
  copie visible parle d’une mise à jour du service, jamais de SQL.
- `incident-temporaire` couvre les pannes réseau ou réponses illisibles ; un nouveau geste reste
  explicite.
- Un bail d’ouverture encore occupé est vérifié au maximum trois fois, à 5 puis 10 secondes. Après
  cela, aucune boucle ne continue. Le composeur reste protégé tant que la fin du bail n’est pas
  confirmée ; seule une nouvelle action explicite reprend la vérification.

## Références officielles

- [Next.js — `deploymentId`](https://nextjs.org/docs/app/api-reference/config/next-config-js/deploymentId)
- [Next.js — gestion des erreurs](https://nextjs.org/docs/app/getting-started/error-handling)
- [Supabase — workflow local et migrations](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Supabase — migrations de base de données](https://supabase.com/docs/guides/deployment/database-migrations)
