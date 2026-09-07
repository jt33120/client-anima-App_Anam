# Revue indépendante — première livraison du carnet céleste

2026-09-06. Périmètre : layout, thème, scène, navigation, accès, composants modifiés, tokens et
livraison. Aucun défaut bloquant de front restant parmi les points examinés après corrections.

Cette revue porte sur la première livraison `40dcd225`. Les retours utilisateur ultérieurs
sur l'accueil trop grand/plat et le fil masqué au clavier ouvrent une nouvelle validation dans
[validation-nocturne.md](validation-nocturne.md). Les mesures de boîtes ci-dessous ne reproduisaient
pas un clavier physique mobile et ne prouvent donc pas la correction de ce dernier défaut.

## Défauts corrigés et preuves

- **Contraste système écrasé par Nuit.** La spécificité du thème nuit neutralisait le renforcement
  demandé par `prefers-contrast: more`. Le générateur CSS donne désormais la priorité à la règle
  d'accessibilité. Chromium confirme, en Papier comme en Nuit, texte secondaire renforcé,
  bordure forte et opacité d'illustration nulle lorsque le contraste système est demandé.
- **Illustration conservée en contraste explicite.** `data-a11y="contraste"` fixe maintenant
  `--carnet-image-opacity: 0`; valeur calculée vérifiée dans Chromium.
- **Sélecteur bloqué après refus de stockage.** Si `setItem` échouait mais que `getItem` fonctionnait,
  l'ancien snapshot empêchait le retour à Papier. Le repli `sessionPreference` devient prioritaire.
  Scénario Chromium avec `QuotaExceededError` limité à cette préférence : Papier → Nuit → Papier,
  avec le bon libellé accessible après chaque clic.
- **Typographie de navigation sans effet.** Le sélecteur de classe globale a été corrigé; mesures
  du rendu : 12 px sur mobile et 15 px sur bureau.

`node scripts/build-carnet-tokens.mjs --check` et `git diff --check` passent. Les deux suites
`carnet-contraste` et `tokens-parite` totalisent **100 tests réussis**. Le générateur demeure la
source de la feuille CSS; aucun correctif manuel de sa sortie.

Mesures sur le harness local synthétique à **320, 390, 768 et 1440 px** : aucun débordement
horizontal, champ du composeur dégagé de la navigation. Ces mesures complètent la boucle de
captures du pilote; elles ne remplacent pas une vérification authentifiée en production.
Caveat locale est servie en WOFF2, **52 320 octets**, avec sa licence OFL.

## Portée backend et données

Comparaison par contenu/hash de **367 fichiers suivis** dans `app/api`, `lib`, `supabase`,
`proxy.ts`, `next.config.ts`, `package.json` et `vercel.json` avec le SHA de production initial
`2024cdec7c232aede8b418381f18360576768eda` : **zéro différence**. Les migrations 0091, 0092 et 0093
sont elles aussi identiques octet pour octet à cette référence.

Les changements TSX inspectés ajoutent structure, classes, annotations, glyphes et préférence
visuelle locale. Aucun appel réseau, RPC, action métier ou collecte personnelle n'est ajouté.
Les accès, consentements, protections de confidentialité et distinctions absent/indisponible
restent portés par leurs contrats existants.

Le contrôle distant du pilote signale 0091–0093 absentes du schéma distant. Cette dérive précède
la refonte : cache quotidien stable, correction de naissance/audit et export de cet audit.
La livraison du front ne corrige pas cette dérive et ne constitue pas une preuve d'alignement
du schéma. Aucune migration n'est autorisée ni appliquée dans cette tranche.

## Livraison

Utiliser la commande Vercel **`deploy --prod` normale** depuis un checkout propre du commit livré,
avec métadonnées branche/SHA explicites. Ce checkout exclut notamment `opencode.json`, préexistant
non suivi. Le prébuild `--promotion` et l'environnement Vercel restent inchangés : aucun
`--prebuilt`, aucune variable forcée, aucun passage Preview → promotion destiné à éviter le
contrôle. Si la commande normale refuse la promotion, conserver ce verdict et la branche sans
contourner le contrôle ni modifier la base.

La référence et la commande de retour figurent dans [deployment.md](deployment.md). Vérifier
Ready, SHA et alias après livraison; ne pas présenter les seuls tests locaux comme cette preuve.
