# Revue limites — comptabilité IA par utilisatrice

Travaille sans aucun contexte de conversation préalable. Dans le workspace
`/Users/juliantalou/anima-app`, construis le diff de cette story depuis le baseline
`5bc50f5c46991b5585716e7c9c123e608eb1d3ff` pour les fichiers ci-dessous, en incluant intégralement
les fichiers non suivis :

- `_bmad-output/implementation-artifacts/spec-comptabilite-ia-par-utilisatrice.md`
- `supabase/migrations/0081_comptabilite_ia.sql`
- `lib/ai/tarification.ts`
- `lib/ai/metrage.ts`
- `lib/data/lire-allocation.ts`
- `lib/safety/detecteur-detresse.ts`
- `lib/safety/pipeline.ts`
- `lib/ordonnanceur/jobs/synthese.ts`
- `app/api/anam/message/route.ts`
- `tests/tarification-ia.test.ts`
- `tests/metrage-registre.test.ts`
- `tests/comptabilite-ia-cablage.test.ts`
- `tests/detecteur-detresse.test.ts`
- `tests/pipeline-securite.test.ts`
- `tests/synthese-job.test.ts`
- `tests/metrage-flux.test.ts`
- `tests/lire-allocation.test.ts`
- `tests/usage-ia.test.ts`
- `tests/gate-quota.test.ts`
- `tests/proposer-abonnement.test.ts`
- `tests/journal-route.test.ts`

Ignore tous les autres changements concurrents du worktree. Lis ensuite le diff comme seul artefact à
évaluer et invoque le skill `bmad-review-edge-case-hunter` sur ce diff. Marche chaque branche, frontière,
rejeu, panne partielle et invariant de quota/idempotence ; rends uniquement des constats actionnables avec
preuve exacte fichier/ligne et ne propose aucune modification.
