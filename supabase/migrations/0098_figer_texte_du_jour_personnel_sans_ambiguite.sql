-- ══════════════════════════════════════════════════════════════════════════════════════════════
-- 0098 — LA PURGE DE `figer_texte_du_jour_personnel` DÉSIGNAIT DEUX CHOSES À LA FOIS
-- ══════════════════════════════════════════════════════════════════════════════════════════════
--
-- ── LE DÉFAUT, ET COMMENT IL A ÉTÉ TROUVÉ ──────────────────────────────────────────────────────
--
-- 0094 déclare `returns table (utilisatrice_id uuid, jour date, …)`. En PL/pgSQL, ces colonnes de
-- sortie sont des VARIABLES dans la portée du corps. La purge écrite juste en dessous :
--
--     delete from public.texte_du_jour_personnel
--      where utilisatrice_id = p_utilisatrice_id and expire_le <= now();
--
-- désigne alors DEUX choses du même nom — la variable de sortie et la colonne de la table. Postgres
-- ne devine pas : il lève `42702 column reference "utilisatrice_id" is ambiguous`, à CHAQUE appel.
--
-- ⚠️ CONSÉQUENCE EXACTE : aucune écriture n'aboutissait. `texteDuJourGenere` attrape l'échec du
-- dépôt, journalise « cache indisponible » et rend `null` pour une provenance modèle — donc le
-- corpus, tous les jours, pour tout le monde. La fonctionnalité entière aurait été livrée morte,
-- sans qu'une seule page ne casse.
--
-- Aucun test du dépôt ne pouvait le voir : les gardes SQL lisent le FICHIER (le texte est
-- parfaitement valide à la lecture), et les tests qui exécutent vraiment du SQL demandent une base
-- que l'environnement local n'a pas. Il a été trouvé en APPELANT la fonction sur la production,
-- après l'avoir déployée — la seule sonde qui pouvait le dire.
--
-- 0091 échappait au piège par chance : sa purge ne filtre que sur `expire_le`, qui ne figure pas
-- dans sa table de sortie.
--
-- ── LE CORRECTIF ───────────────────────────────────────────────────────────────────────────────
--
-- Un alias sur la table, et toutes les références de colonnes qualifiées. On ne renomme PAS les
-- colonnes de sortie : elles font partie du contrat lu par `depot-texte-du-jour-personnel.ts`.

create or replace function public.figer_texte_du_jour_personnel(
  p_utilisatrice_id uuid,
  p_jour date,
  p_version_editoriale text,
  p_condensat_signature text,
  p_condensat_matiere text,
  p_ciel text,
  p_pour_toi text,
  p_gestes text,
  p_provenance text
)
returns table (
  utilisatrice_id uuid,
  jour date,
  version_editoriale text,
  condensat_signature text,
  condensat_matiere text,
  ciel text,
  pour_toi text,
  gestes text,
  provenance text
)
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
begin
  if p_utilisatrice_id is null then
    raise exception 'texte_du_jour_sans_identite' using errcode = '42501';
  end if;

  -- ⚠️ ALIAS `p` ET COLONNES QUALIFIÉES : sans lui, `utilisatrice_id` désigne aussi la colonne de
  -- sortie déclarée plus haut, et Postgres refuse l'ordre entier.
  delete from public.texte_du_jour_personnel as p
   where p.utilisatrice_id = p_utilisatrice_id and p.expire_le <= now();

  insert into public.texte_du_jour_personnel as p (
    utilisatrice_id, jour, version_editoriale,
    condensat_signature, condensat_matiere,
    ciel, pour_toi, gestes, provenance, expire_le
  )
  values (
    p_utilisatrice_id, p_jour, p_version_editoriale,
    p_condensat_signature, p_condensat_matiere,
    p_ciel, p_pour_toi, p_gestes, p_provenance,
    ((p_jour + 1)::timestamp at time zone 'Europe/Paris') + interval '48 hours'
  )
  on conflict do nothing;

  return query
  select t.utilisatrice_id, t.jour, t.version_editoriale,
         t.condensat_signature, t.condensat_matiere,
         t.ciel, t.pour_toi, t.gestes, t.provenance
    from public.texte_du_jour_personnel t
   where t.utilisatrice_id = p_utilisatrice_id
     and t.jour = p_jour
     and t.version_editoriale = p_version_editoriale
     and t.expire_le > now();
end;
$fn$;

revoke all on function public.figer_texte_du_jour_personnel(uuid, date, text, text, text, text, text, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.figer_texte_du_jour_personnel(uuid, date, text, text, text, text, text, text, text)
  to service_role;
