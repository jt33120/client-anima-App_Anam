-- Le premier texte servi pour {jour civil, signature minimisée, version éditoriale} fait foi.
-- Cette table partagée ne contient aucune identité ni donnée brute de naissance.
create table public.texte_du_jour_stable (
  jour date not null,
  condensat_signature text not null check (condensat_signature ~ '^[0-9a-f]{64}$'),
  version_editoriale text not null check (char_length(version_editoriale) between 1 and 80),
  texte text not null check (char_length(texte) between 1 and 900),
  provenance text not null check (provenance in ('modele', 'corpus')),
  cree_le timestamptz not null default now(),
  expire_le timestamptz not null,
  primary key (jour, condensat_signature, version_editoriale),
  check (expire_le > cree_le)
);

alter table public.texte_du_jour_stable enable row level security;
alter table public.texte_du_jour_stable force row level security;
revoke all on table public.texte_du_jour_stable from public, anon, authenticated, service_role;
grant select on table public.texte_du_jour_stable to service_role;

create or replace function public.figer_texte_du_jour(
  p_jour date,
  p_condensat_signature text,
  p_version_editoriale text,
  p_texte text,
  p_provenance text
)
returns table (
  jour date,
  condensat_signature text,
  version_editoriale text,
  texte text,
  provenance text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.texte_du_jour_stable where expire_le <= now();

  insert into public.texte_du_jour_stable (
    jour,
    condensat_signature,
    version_editoriale,
    texte,
    provenance,
    expire_le
  )
  values (
    p_jour,
    p_condensat_signature,
    p_version_editoriale,
    p_texte,
    p_provenance,
    ((p_jour + 1)::timestamp at time zone 'Europe/Paris') + interval '48 hours'
  )
  on conflict do nothing;

  return query
  select t.jour, t.condensat_signature, t.version_editoriale, t.texte, t.provenance
  from public.texte_du_jour_stable t
  where t.jour = p_jour
    and t.condensat_signature = p_condensat_signature
    and t.version_editoriale = p_version_editoriale
    and t.expire_le > now();
end;
$$;

revoke all on function public.figer_texte_du_jour(date, text, text, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.figer_texte_du_jour(date, text, text, text, text)
  to service_role;

comment on table public.texte_du_jour_stable is
  'Cache partagé sans identité. Le premier texte servi reste stable et expire 48 h après la fin du jour Europe/Paris.';

-- Le TTL n'est pas qu'un filtre de lecture : l'ordonnanceur de rétention appelle cette purge à
-- chaque fenêtre. Aucun cron Postgres parallèle n'est créé ; le produit conserve sa porte
-- périodique unique.
create or replace function public.purger_textes_du_jour_expires()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_retires integer;
begin
  delete from public.texte_du_jour_stable where expire_le <= now();
  get diagnostics v_retires = row_count;
  return v_retires;
end;
$$;

revoke all on function public.purger_textes_du_jour_expires()
  from public, anon, authenticated, service_role;
grant execute on function public.purger_textes_du_jour_expires() to service_role;
