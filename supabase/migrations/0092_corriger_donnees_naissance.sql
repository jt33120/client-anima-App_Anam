-- RC-E4 — rectifier date, heure et lieu sans permettre l'édition des signes dérivés.
--
-- Le navigateur n'envoie jamais de coordonnées. La Server Action re-résout un code INSEE dans le
-- même référentiel que l'onboarding. Le serveur calcule le thème AVANT l'appel, puis cette RPC
-- pose entrées et dérivé dans UNE transaction ; aucun résultat astrologique ne vient du navigateur.

create table public.audit_correction_naissance (
  id bigserial primary key,
  utilisatrice_id uuid not null references public.utilisatrice(id) on delete cascade,
  evenement text not null default 'correction_donnees_naissance',
  statut text not null check (statut in ('corrigee', 'refusee', 'consentement_absent')),
  version_contrat integer not null check (version_contrat = 1),
  cree_le timestamptz not null default now()
);

alter table public.audit_correction_naissance enable row level security;
alter table public.audit_correction_naissance force row level security;
revoke all on public.audit_correction_naissance from public, anon, authenticated;
grant select on public.audit_correction_naissance to service_role;

comment on table public.audit_correction_naissance is
  'RC-E4 : piste minimale de rectification. Aucun ancien ou nouveau lieu, date, heure, coordonnée, thème ou texte ; seulement événement, statut, version et horodatage.';

-- Autorisation transactionnelle privée : elle permet aux triggers de distinguer la RPC atomique
-- d'un PATCH libre sur les colonnes. Aucun rôle applicatif ne peut créer cette preuve.
create table public.correction_naissance_autorisee (
  transaction_id bigint not null,
  utilisatrice_id uuid not null references public.utilisatrice(id) on delete cascade,
  primary key (transaction_id, utilisatrice_id)
);
alter table public.correction_naissance_autorisee enable row level security;
alter table public.correction_naissance_autorisee force row level security;
revoke all on public.correction_naissance_autorisee from public, anon, authenticated, service_role;
grant select on public.correction_naissance_autorisee to service_role;

create or replace function public.date_naissance_immuable()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if old.date_naissance is not null
     and new.date_naissance is distinct from old.date_naissance
     and not exists (
       select 1
         from public.correction_naissance_autorisee a
        where a.transaction_id = txid_current()
          and a.utilisatrice_id = old.id
     ) then
    raise exception 'date_naissance_correction_protegee' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.naissance_corrigible()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_correction boolean := false;
  v_lieu_change boolean := false;
  v_lieu_correction boolean := false;
  v_autorisee boolean := false;
begin
  v_autorisee := exists (
    select 1
      from public.correction_naissance_autorisee a
     where a.transaction_id = txid_current()
       and a.utilisatrice_id = old.id
  );

  if (old.date_naissance  is not null and new.date_naissance  is null)
     or (old.heure_naissance is not null and new.heure_naissance is null and not v_autorisee)
     or (old.lieu_naissance  is not null and new.lieu_naissance  is null)
     or (old.lieu_latitude   is not null and new.lieu_latitude   is null)
     or (old.lieu_longitude  is not null and new.lieu_longitude  is null)
     or (old.lieu_fuseau     is not null and new.lieu_fuseau     is null) then
    raise exception 'naissance_effacement_refuse' using errcode = '23514';
  end if;

  v_lieu_change :=
    new.lieu_naissance is distinct from old.lieu_naissance
    or new.lieu_latitude is distinct from old.lieu_latitude
    or new.lieu_longitude is distinct from old.lieu_longitude
    or new.lieu_fuseau is distinct from old.lieu_fuseau;
  v_lieu_correction := v_lieu_change and (
    old.lieu_naissance is not null
    or old.lieu_latitude is not null
    or old.lieu_longitude is not null
    or old.lieu_fuseau is not null
  );

  if v_lieu_correction and not v_autorisee then
    raise exception 'lieu_naissance_correction_protegee' using
      errcode = '42501',
      hint = 'Le lieu se corrige uniquement par la RPC qui pose ses quatre champs ensemble.';
  end if;

  v_correction :=
    (old.date_naissance is not null and new.date_naissance is distinct from old.date_naissance)
    or (old.heure_naissance is not null and new.heure_naissance is distinct from old.heure_naissance)
    or v_lieu_correction;

  if v_correction then
    if not v_autorisee then
      if not public.a_consenti_art9() then
        raise exception 'correction_sans_consentement' using errcode = '42501';
      end if;
      if public.est_barre_minorite() then
        raise exception 'correction_sous_barriere' using errcode = '42501';
      end if;
    end if;
    new.naissance_corrections := old.naissance_corrections + 1;
    new.naissance_corrigee_le := now();
  else
    new.naissance_corrections := old.naissance_corrections;
    new.naissance_corrigee_le := old.naissance_corrigee_le;
  end if;
  return new;
end;
$$;

comment on column public.utilisatrice.naissance_corrections is
  'Nombre de rectifications réelles des données de naissance, posé par le serveur. Piste d audit non affichée et jamais utilisée comme plafond.';
comment on column public.utilisatrice.naissance_corrigee_le is
  'Date de la dernière rectification des données de naissance, sans conservation des anciennes valeurs.';

create or replace function public.corriger_donnees_naissance(
  p_utilisatrice_id uuid,
  p_date date,
  p_heure time without time zone,
  p_lieu_nom text,
  p_lieu_latitude double precision,
  p_lieu_longitude double precision,
  p_lieu_fuseau text,
  p_empreinte_theme text,
  p_theme jsonb,
  p_date_attendue date,
  p_heure_attendue time without time zone,
  p_lieu_nom_attendu text,
  p_lieu_latitude_attendue double precision,
  p_lieu_longitude_attendue double precision,
  p_lieu_fuseau_attendu text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := p_utilisatrice_id;
  v_etat_attendu boolean;
  v_change boolean;
begin
  if v_uid is null then return 'refusee'; end if;

  -- Cette fonction est réservée au service_role de la Server Action. Elle vérifie donc la cible
  -- explicitement, au lieu de s'appuyer sur auth.uid(), nul pour une tâche serveur privilégiée.
  perform 1 from public.utilisatrice u where u.id = v_uid for update;
  if not found then return 'refusee'; end if;

  if not exists (
       select 1
         from public.consentement c
        where c.utilisatrice_id = v_uid
          and c.art9_accorde = true
          and c.ia_reconnue = true
          and c.revoked_at is null
     )
     or exists (
       select 1
         from public.utilisatrice u
        where u.id = v_uid
          and (u.mineur_detecte or u.barriere_minorite_le is not null)
     ) then
    insert into public.audit_correction_naissance(utilisatrice_id, statut, version_contrat)
    values (v_uid, 'consentement_absent', 1);
    return 'consentement_absent';
  end if;

  if p_date is null
     or p_date > (((now() at time zone 'Europe/Paris')::date) - interval '18 years')::date
     or p_date < (((now() at time zone 'Europe/Paris')::date) - interval '131 years')::date
     or nullif(btrim(p_lieu_nom), '') is null
     or p_lieu_latitude is null or p_lieu_latitude not between -90 and 90
     or p_lieu_longitude is null or p_lieu_longitude not between -180 and 180
     or nullif(btrim(p_lieu_fuseau), '') is null
     or p_empreinte_theme is null or p_empreinte_theme !~ '^[0-9a-f]{64}$'
     or jsonb_typeof(p_theme) is distinct from 'object'
     or (p_theme->>'schema') is distinct from '2'
     or jsonb_typeof(p_theme->'positions') is distinct from 'array'
     or jsonb_typeof(p_theme->'absents') is distinct from 'array' then
    insert into public.audit_correction_naissance(utilisatrice_id, statut, version_contrat)
    values (v_uid, 'refusee', 1);
    return 'refusee';
  end if;

  select p_date_attendue is not distinct from u.date_naissance
      and p_heure_attendue is not distinct from u.heure_naissance
      and p_lieu_nom_attendu is not distinct from u.lieu_naissance
      and p_lieu_latitude_attendue is not distinct from u.lieu_latitude
      and p_lieu_longitude_attendue is not distinct from u.lieu_longitude
      and p_lieu_fuseau_attendu is not distinct from u.lieu_fuseau,
         p_date is distinct from u.date_naissance
      or p_heure is distinct from u.heure_naissance
      or p_lieu_nom is distinct from u.lieu_naissance
      or p_lieu_latitude is distinct from u.lieu_latitude
      or p_lieu_longitude is distinct from u.lieu_longitude
      or p_lieu_fuseau is distinct from u.lieu_fuseau
    into v_etat_attendu, v_change
    from public.utilisatrice u
   where u.id = v_uid;

  if v_etat_attendu is not true or v_change is not true then
    insert into public.audit_correction_naissance(utilisatrice_id, statut, version_contrat)
    values (v_uid, 'refusee', 1);
    return 'refusee';
  end if;

  insert into public.correction_naissance_autorisee(transaction_id, utilisatrice_id)
  values (txid_current(), v_uid);

  begin
    update public.utilisatrice
       set date_naissance = p_date,
           heure_naissance = p_heure,
           lieu_naissance = p_lieu_nom,
           lieu_latitude = p_lieu_latitude,
           lieu_longitude = p_lieu_longitude,
           lieu_fuseau = p_lieu_fuseau
     where id = v_uid;

    if not found then raise exception 'utilisatrice_absente'; end if;

    insert into public.theme_natal as t (
      utilisatrice_id, empreinte_entrees, contenu
    ) values (
      v_uid, p_empreinte_theme, p_theme
    )
    on conflict (utilisatrice_id) do update
       set version = t.version + 1,
           empreinte_entrees = excluded.empreinte_entrees,
           contenu = excluded.contenu
     where t.empreinte_entrees is distinct from excluded.empreinte_entrees;
  exception when others then
    delete from public.correction_naissance_autorisee
     where transaction_id = txid_current() and utilisatrice_id = v_uid;
    insert into public.audit_correction_naissance(utilisatrice_id, statut, version_contrat)
    values (v_uid, 'refusee', 1);
    return 'refusee';
  end;

  delete from public.correction_naissance_autorisee
   where transaction_id = txid_current() and utilisatrice_id = v_uid;
  insert into public.audit_correction_naissance(utilisatrice_id, statut, version_contrat)
  values (v_uid, 'corrigee', 1);
  return 'corrigee';
end;
$$;

revoke all on function public.corriger_donnees_naissance(uuid, date, time without time zone, text, double precision, double precision, text, text, jsonb, date, time without time zone, text, double precision, double precision, text)
  from public, anon, authenticated, service_role;
grant execute on function public.corriger_donnees_naissance(uuid, date, time without time zone, text, double precision, double precision, text, text, jsonb, date, time without time zone, text, double precision, double precision, text)
  to service_role;

comment on function public.corriger_donnees_naissance(uuid, date, time without time zone, text, double precision, double precision, text, text, jsonb, date, time without time zone, text, double precision, double precision, text) is
  'RC-E4 : transaction date heure lieu et thème précalculé réservée à la Server Action service_role, avec comparaison sous verrou. Le lieu est re-résolu depuis un code INSEE ; aucun thème ne vient du navigateur.';
