-- Réservation atomique de l'allocation résiduelle gratuite (Story 3.4, correctif concurrence).
--
-- Une réservation représente l'ADMISSION durable d'un tour logique. Elle ne décrit ni une facture
-- ni une réponse fournisseur : `usage_ia` reste le registre séparé du coût réellement engagé.
-- Le mois est toujours calculé côté PostgreSQL en UTC et la clé opaque ne contient aucun contenu
-- de conversation (NON-art. 9).

create table public.reservation_quota_ia (
  utilisatrice_id uuid        not null references public.utilisatrice(id) on delete cascade,
  mois_utc        date        not null,
  cle_idempotence text        not null,
  cree_le         timestamptz not null default now(),
  primary key (utilisatrice_id, mois_utc, cle_idempotence),
  constraint reservation_quota_ia_mois_premier_jour
    check (extract(day from mois_utc) = 1),
  constraint reservation_quota_ia_cle_non_vide
    check (btrim(cle_idempotence) <> ''),
  constraint reservation_quota_ia_cle_canonique
    check (cle_idempotence = lower(cle_idempotence))
);

-- Reprise des admissions du mois déjà matérialisées par l'ancien comptage. Le marqueur
-- `post_premiere_seance=true` n'était posé que sur la ligne PRINCIPALE d'un tour gratuit éligible ;
-- les sous-appels et la sécurité sont donc exclus sans interpréter le coût fournisseur.
insert into public.reservation_quota_ia (
  utilisatrice_id,
  mois_utc,
  cle_idempotence,
  cree_le
)
select
  u.utilisatrice_id,
  date_trunc('month', u.cree_le at time zone 'UTC')::date,
  lower(case
    -- `usage_ia` n'a historiquement garanti que NOT NULL. Une éventuelle clé vide ne doit pas faire
    -- échouer toute la migration : son UUID technique fournit une identité stable, sans contenu.
    when btrim(u.cle_idempotence) = '' then 'historique:' || u.id::text
    else u.cle_idempotence
  end),
  u.cree_le
from public.usage_ia u
where u.post_premiere_seance = true
  and u.exempte_quota = false
  -- Seul le mois courant doit survivre au déploiement : les mois clos ne participent plus jamais à
  -- une décision et leur reprise gonflerait inutilement le registre/verrouillerait `usage_ia`.
  and u.cree_le >= (
    date_trunc('month', statement_timestamp() at time zone 'UTC') at time zone 'UTC'
  )
  and u.cree_le < (
    (date_trunc('month', statement_timestamp() at time zone 'UTC') + interval '1 month')
      at time zone 'UTC'
  )
on conflict (utilisatrice_id, mois_utc, cle_idempotence) do nothing;

alter table public.reservation_quota_ia enable row level security;
alter table public.reservation_quota_ia force row level security;

-- Aucune policy : une session utilisatrice ne peut ni observer ni fabriquer son quota. Le serveur
-- peut uniquement le lire ; l'écriture nominale traverse la RPC sérialisée ci-dessous.
revoke all on table public.reservation_quota_ia from public, anon, authenticated, service_role;
grant select on table public.reservation_quota_ia to service_role;

comment on table public.reservation_quota_ia is
  'Admissions durables de tours logiques dans le quota gratuit mensuel UTC. NON-art. 9, deny-by-default ; distinct du coût réel usage_ia.';
comment on column public.reservation_quota_ia.cle_idempotence is
  'Clé opaque du tour logique : un retry réutilise la même clé et ne consomme jamais une seconde unité.';

create or replace function public.reserver_quota_ia_atomique(
  p_utilisatrice uuid,
  p_cle_idempotence uuid,
  p_limite bigint
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mois date := date_trunc('month', statement_timestamp() at time zone 'UTC')::date;
  v_cle text := lower(p_cle_idempotence::text);
  v_total bigint;
begin
  if p_utilisatrice is null then
    raise exception 'reserver_quota_ia_atomique : utilisatrice requise';
  end if;
  if p_cle_idempotence is null then
    raise exception 'reserver_quota_ia_atomique : cle idempotence requise';
  end if;
  if p_limite is null or p_limite < 0 then
    raise exception 'reserver_quota_ia_atomique : limite invalide';
  end if;

  -- Toutes les admissions qui partagent réellement une limite sont sérialisées. Une collision de
  -- hash ne ferait que sérialiser deux comptes sans changer leur résultat.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_utilisatrice::text || ':' || v_mois::text, 340083)
  );

  -- Réconciliation de rollout, SOUS le même verrou : une ancienne instance peut avoir écrit son
  -- marqueur compatible après le backfill global et avant son remplacement. Ces lignes deviennent
  -- ici des admissions du registre AVANT toute décision. `usage_ia` n'est ni compté directement ni
  -- utilisé comme mutex ; il ne fournit que la reprise historique d'un tour déjà servi.
  insert into public.reservation_quota_ia (
    utilisatrice_id,
    mois_utc,
    cle_idempotence,
    cree_le
  )
  select
    u.utilisatrice_id,
    v_mois,
    lower(case
      when btrim(u.cle_idempotence) = '' then 'historique:' || u.id::text
      else u.cle_idempotence
    end),
    u.cree_le
  from public.usage_ia u
  where u.utilisatrice_id = p_utilisatrice
    and u.post_premiere_seance = true
    and u.exempte_quota = false
    and u.cree_le >= (v_mois::timestamp at time zone 'UTC')
    and u.cree_le < ((v_mois + interval '1 month') at time zone 'UTC')
  on conflict (utilisatrice_id, mois_utc, cle_idempotence) do nothing;

  -- L'idempotence précède le plafond : une réservation déjà admise reste autorisée même si la
  -- limite a depuis été atteinte ou abaissée à zéro.
  if exists (
    select 1
      from public.reservation_quota_ia r
     where r.utilisatrice_id = p_utilisatrice
       and r.mois_utc = v_mois
       and r.cle_idempotence = v_cle
  ) then
    return true;
  end if;

  select count(*)
    into v_total
    from public.reservation_quota_ia r
   where r.utilisatrice_id = p_utilisatrice
     and r.mois_utc = v_mois;

  -- `p_limite = 0` tombe ici : refus sans insertion.
  if v_total >= p_limite then
    return false;
  end if;

  insert into public.reservation_quota_ia (
    utilisatrice_id,
    mois_utc,
    cle_idempotence
  ) values (
    p_utilisatrice,
    v_mois,
    v_cle
  );

  return true;
end;
$$;

revoke all on function public.reserver_quota_ia_atomique(uuid, uuid, bigint)
  from public, anon, authenticated;
grant execute on function public.reserver_quota_ia_atomique(uuid, uuid, bigint)
  to service_role;

comment on function public.reserver_quota_ia_atomique(uuid, uuid, bigint) is
  'Réserve atomiquement une unité mensuelle UTC par tour logique. Service-role only ; retourne false sans écrire lorsque le plafond est atteint.';
