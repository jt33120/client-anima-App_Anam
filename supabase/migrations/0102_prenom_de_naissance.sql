-- ══════════════════════════════════════════════════════════════════════════════════════════════
-- 0102 — LE PRÉNOM DE NAISSANCE, PARCE QUE L'ARBRE DE VIE LE COMPTE SÉPARÉMENT
-- ══════════════════════════════════════════════════════════════════════════════════════════════
--
-- ── POURQUOI UNE COLONNE DE PLUS, ALORS QU'IL Y EN A DÉJÀ DEUX ────────────────────────────────
--
-- `utilisatrice` porte déjà `prenom` et `nom_complet`. Aucun des deux ne convient, et c'est une
-- distinction de fond, pas un détail de saisie :
--
--   • `prenom` est une donnée d'ADRESSE — comment Anam la nomme. Ce peut être un diminutif, un
--     surnom, un prénom d'usage. `lib/data/lire-numerologie.ts` REFUSE déjà de le lire pour un
--     calcul, et ce refus est juste : compter « Caro » à la place de « Caroline » donne un nombre
--     faux, et personne ne s'en apercevrait.
--   • `nom_complet` est le nom de naissance ENTIER, prénoms compris. On ne peut pas en extraire
--     les prénoms sans deviner où ils s'arrêtent : « Jean-Marc Van der Berg » n'a aucune frontière
--     lisible par une machine, et « Dupont Marie » existe aussi.
--
-- L'arbre de vie (`lib/astro/arbre-de-vie.ts`) calcule ses BRANCHES sur les prénoms de naissance
-- SEULS. Il faut donc les demander. Tant que la colonne est nulle, les branches disent leur
-- absence et proposent le lien vers /reglages — une absence nommée, jamais un nombre deviné
-- (FR-050, même discipline que les trois nombres du nom).
--
-- ── CE QUE CETTE MIGRATION NE FAIT PAS, ET POURQUOI ──────────────────────────────────────────
--
-- ⚠️ AUCUN TRIGGER D'INVALIDATION SUR `lecture_numerologie`. La 0099 en pose deux, sur
-- `date_naissance` et `nom_complet` : la lecture symbolique générée est calée sur ces deux entrées
-- par son `source` (un md5), et la changer périme la lecture. Le prénom de naissance N'ENTRE PAS
-- dans cette lecture — `messagesNumerologie` n'envoie que les six nombres et l'année, dont aucun ne
-- le lit. Ajouter le déclencheur « pour faire pareil » ferait jeter, à chaque correction de
-- prénom, une génération payante qui reste parfaitement valide.
-- Le jour où une lecture générée s'appuierait sur les branches, ce verdict s'inverse — et c'est
-- ICI qu'il faut revenir, pas ailleurs.
--
-- ⚠️ AUCUNE LIGNE AUX INVENTAIRES RGPD. Ils raisonnent par TABLE, pas par colonne :
-- `lib/domain/inventaire-export.ts` déclare déjà `utilisatrice` comme « inclus » et
-- `inventaire-effacement.ts` comme « efface ». `exporter_mes_donnees()` exporte `to_jsonb(t)` sur
-- la ligne entière, donc la colonne part avec l'export sans qu'on la nomme, et l'effacement passe
-- par la même cascade depuis `auth.users`. Vérifié avant d'écrire cette migration, pas supposé.

alter table public.utilisatrice
  add column if not exists prenom_de_naissance text;

comment on column public.utilisatrice.prenom_de_naissance is
  'Les prénoms de NAISSANCE, seuls, sans le nom de famille. Distincts de `prenom` (une donnée d''adresse, possiblement un diminutif) et de `nom_complet` (le nom entier, dont on ne peut pas extraire les prénoms sans deviner). Lus par l''arbre de vie pour ses branches, par rien d''autre. Nuls tant qu''ils ne sont pas saisis : les branches disent alors leur absence.';

-- ── LES PRIVILÈGES, COLONNE PAR COLONNE ───────────────────────────────────────────────────────
--
-- ⚠️ SUR CETTE TABLE, `authenticated` NE DÉTIENT AUCUN PRIVILÈGE DE TABLE : tout est accordé
-- colonne par colonne depuis la 0041. Une colonne neuve n'hérite donc de RIEN — ce qui est la
-- bonne valeur par défaut, et ce qui oblige à écrire ici, noir sur blanc, ce que la session a le
-- droit de voir et d'écrire. Même raisonnement, et mêmes mots, que la 0078 pour `seuil_franchi_le`.
grant select (prenom_de_naissance) on public.utilisatrice to authenticated;

-- L'écriture est ouverte, contrairement à `seuil_franchi_le` : un prénom de naissance se corrige,
-- comme `prenom` et `nom_complet` que la 0041 a rendus au même formulaire. La GARDE reste dans la
-- policy `utilisatrice_proprietaire` (`with check (auth.uid() = id)`), jamais dans la Server
-- Action : ce qu'une action refuserait, un POST REST direct l'obtiendrait.
grant update (prenom_de_naissance) on public.utilisatrice to authenticated;

-- ⚠️ ET RIEN POUR `anon`. La 0041 lui a révoqué tout sur cette table ; un `grant` de colonne posé
-- ici le lui rendrait pour cette colonne. On ne lui en donne aucun, et ce silence est délibéré.
