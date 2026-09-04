-- ════════════════════════════════════════════════════════════════════════════════════════════════
-- 0090 — LA PREUVE D'EFFACEMENT DOIT POUVOIR LIRE (2026-09-04 · art. 17 · AD-14)
-- ════════════════════════════════════════════════════════════════════════════════════════════════
--
-- ── LE DÉFAUT, ET IL N'EST PAS CELUI QU'ON CROIT ────────────────────────────────────────────────
--
-- `tests/effacement-sql.test.ts` ne se contente pas d'effacer : il RELIT ensuite les trente-six
-- tables du schéma, colonne par colonne, pour vérifier que l'identifiant n'apparaît nulle part. Ce
-- balayage est la story 6.7 elle-même — « on ne compte pas les lignes des tables qu'on pense avoir
-- effacées, on cherche dans TOUTES ».
--
-- Sur `ouverture_jour_anam`, ce balayage échoue depuis 0084 :
--
--     Error: lecture ouverture_jour_anam: permission denied for table ouverture_jour_anam
--
-- 0084 a écrit `revoke all on table public.ouverture_jour_anam from public, anon, authenticated,
-- service_role` et n'a jamais rendu le `select` à `service_role`. Sa jumelle 0083, écrite la veille,
-- fait le même `revoke` et rend le `select` la ligne suivante, avec le motif en clair : « Le serveur
-- peut uniquement le lire ». C'est une omission, pas une décision — rien dans 0084 ne l'argumente.
--
-- ── CE QUE CETTE OMISSION COÛTE, ET CE QU'ELLE NE COÛTE PAS ─────────────────────────────────────
--
-- Elle ne casse PAS le produit : l'application ne lit jamais cette table en direct, elle passe par
-- `commencer_ouverture_quotidienne_anam` et ses sœurs, toutes `security definer`.
--
-- Elle casse la PREUVE. Une table qu'aucun rôle ne peut relire est une table dont personne ne peut
-- démontrer qu'elle a été vidée. L'effacement, lui, fonctionne — la cascade depuis `utilisatrice`
-- ignore les privilèges — mais « ça marche » et « on peut le montrer » sont deux choses, et l'art. 17
-- demande la seconde.
--
-- ── POURQUOI `SELECT` SEUL, ET POURQUOI CE N'EST PAS UN AFFAIBLISSEMENT ─────────────────────────
--
-- `service_role` est la clé du SERVEUR : elle ne quitte jamais l'hôte, aucun navigateur ne la voit,
-- et elle contourne déjà la RLS partout ailleurs. Lui rendre la lecture d'une table dont les RPC
-- `security definer` lisent déjà tout le contenu ne lui apprend rien de neuf.
--
-- ⚠️ ET SURTOUT : PAS D'`INSERT`, PAS D'`UPDATE`, PAS DE `DELETE`. L'écriture nominale doit rester
-- sérialisée par `commencer_ouverture_quotidienne_anam` (verrou consultatif, bail exclusif). Rendre
-- l'écriture directe à `service_role` ouvrirait un second chemin d'écriture non sérialisé — et
-- c'est précisément ce que 0084 a construit son verrou pour empêcher. `anon` et `authenticated`
-- restent sans le moindre privilège, comme avant.
grant select on table public.ouverture_jour_anam to service_role;

comment on table public.ouverture_jour_anam is
  'Outbox interne : bail exclusif, première parole du jour Europe/Paris et métadonnée publique de '
  'son éventuel geste. Les jours antérieurs sont retirés à la visite suivante. Lecture ouverte à '
  '`service_role` (0090) pour que la preuve d''effacement puisse relire la table ; écriture toujours '
  'réservée aux RPC sérialisées.';
