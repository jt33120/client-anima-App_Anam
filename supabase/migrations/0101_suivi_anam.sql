-- A visible, revisable path. Only the owner writes personal reference documents;
-- Anam can adjust a bounded path or integrate its first step, after a journalled exchange.
create function public.suivi_reperes_valides(v jsonb)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare k text;
begin
  if v is null or jsonb_typeof(v) <> 'object' then return false; end if;
  if (select count(*) from jsonb_object_keys(v)) <> 3
     or not (v ?& array['ceQuiCompte','ceQuiAide','aRespecter']) then return false; end if;
  foreach k in array array['ceQuiCompte','ceQuiAide','aRespecter'] loop
    if jsonb_typeof(v->k) <> 'string' or char_length(v->>k) > 2000 then return false; end if;
  end loop;
  return true;
end;
$$;
revoke all on function public.suivi_reperes_valides(jsonb) from public,anon,authenticated;

create function public.suivi_etapes_valides(v jsonb, avec_ids boolean)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare e jsonb; ids text[] := '{}';
begin
  if v is null or jsonb_typeof(v) <> 'array' then return false; end if;
  if jsonb_array_length(v) > 3 then return false; end if;
  for e in select value from jsonb_array_elements(v) loop
    if jsonb_typeof(e) <> 'object' then return false; end if;
    if (select count(*) from jsonb_object_keys(e)) <> (case when avec_ids then 3 else 2 end)
       or not (e ?& array['titre','pratiqueId']) then return false; end if;
    if jsonb_typeof(e->'titre') <> 'string' or char_length(e->>'titre') not between 1 and 160
       or not public.texte_significatif(e->>'titre') then return false; end if;
    if e->'pratiqueId' <> 'null'::jsonb and (
       jsonb_typeof(e->'pratiqueId') <> 'string' or e->>'pratiqueId' not in (
         'respiration-douce','ancrage-sensoriel','pause-attention','meteo-interieure',
         'recul-pensee','geste-bienveillant','valeur-petit-pas','savourer-instant','big-five','enneagramme'
       )) then return false; end if;
    if avec_ids then
      if not (e ? 'id') or jsonb_typeof(e->'id') <> 'string'
         or (e->>'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
         or (e->>'id') = any(ids) then return false; end if;
      ids := array_append(ids, e->>'id');
    end if;
  end loop;
  return true;
end;
$$;
revoke all on function public.suivi_etapes_valides(jsonb,boolean) from public,anon,authenticated;

create table public.suivi_anam (
  utilisatrice_id uuid primary key references public.utilisatrice(id) on delete cascade,
  revision integer not null default 0 check (revision >= 0),
  pause boolean not null default false,
  cap text not null default '' check (char_length(cap) <= 160),
  synthese text not null default '' check (char_length(synthese) <= 1200),
  reperes jsonb not null default '{"ceQuiCompte":"","ceQuiAide":"","aRespecter":""}'::jsonb
    check (public.suivi_reperes_valides(reperes)),
  etapes jsonb not null default '[]'::jsonb check (public.suivi_etapes_valides(etapes,true)),
  niveau_arbre integer not null default 0 check (niveau_arbre between 0 and 34),
  maj_le timestamptz not null default now()
);
alter table public.suivi_anam enable row level security;
alter table public.suivi_anam force row level security;
revoke all on table public.suivi_anam from public,anon,authenticated,service_role;
grant select (utilisatrice_id,revision,pause,cap,synthese,reperes,etapes,niveau_arbre,maj_le)
  on public.suivi_anam to authenticated;
grant select on table public.suivi_anam to service_role;
create policy suivi_anam_lecture on public.suivi_anam for select to authenticated
  using (utilisatrice_id = (select auth.uid()));

create table public.suivi_evenement (
  id uuid primary key default gen_random_uuid(),
  utilisatrice_id uuid not null references public.utilisatrice(id) on delete cascade,
  source_id uuid not null,
  cle_tour text not null check (char_length(cle_tour) between 1 and 200),
  empreinte text not null check (empreinte ~ '^[0-9a-f]{64}$'),
  revision integer not null check (revision > 0),
  type text not null check (type in ('ajuster','avancer')),
  resume text not null check (char_length(resume) between 1 and 500 and public.texte_significatif(resume)),
  titre_etape text check (titre_etape is null or char_length(titre_etape) between 1 and 160),
  niveau_arbre integer not null check (niveau_arbre between 0 and 34),
  cree_le timestamptz not null default now(),
  unique (utilisatrice_id,cle_tour),
  unique (utilisatrice_id,revision),
  constraint suivi_source_proprietaire foreign key (utilisatrice_id,source_id)
    references public.entree_journal(utilisatrice_id,id) on delete cascade,
  check ((type = 'ajuster' and titre_etape is null) or (type = 'avancer' and titre_etape is not null))
);
alter table public.suivi_evenement enable row level security;
alter table public.suivi_evenement force row level security;
revoke all on table public.suivi_evenement from public,anon,authenticated,service_role;
grant select on table public.suivi_evenement to service_role;
grant select (id,utilisatrice_id,source_id,revision,type,resume,titre_etape,niveau_arbre,cree_le)
  on public.suivi_evenement to authenticated;
create policy suivi_evenement_lecture on public.suivi_evenement for select to authenticated
  using (utilisatrice_id = (select auth.uid()));
create index suivi_evenement_histoire on public.suivi_evenement(utilisatrice_id,revision desc);

-- No caller identity in the arguments. A user may edit their references and stop the path;
-- resuming is unavailable during the existing distress window, while pausing remains possible.
create function public.modifier_suivi_personnel(p_revision integer,p_commande jsonb)
returns integer language plpgsql volatile security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_s public.suivi_anam%rowtype; v_action text;
begin
  if v_uid is null or not public.a_consenti_art9() or public.est_barre_minorite() then
    raise exception 'suivi_refuse' using errcode = '42501';
  end if;
  perform 1 from public.utilisatrice where id = v_uid for update;
  if not found then raise exception 'suivi_refuse' using errcode = '42501'; end if;
  if p_revision is null or p_revision < 0 or p_revision = 2147483647
     or p_commande is null or jsonb_typeof(p_commande) <> 'object' then
    raise exception 'suivi_invalide' using errcode = '22023';
  end if;
  if not public.a_consenti_art9() or public.est_barre_minorite() then
    raise exception 'suivi_refuse' using errcode = '42501';
  end if;
  -- Revocation must serialize with this write, including while another transaction holds the path.
  perform 1 from public.consentement c where c.utilisatrice_id = v_uid
    and c.art9_accorde and c.ia_reconnue and c.cgu_acceptees and c.revoked_at is null for share;
  if not found then raise exception 'suivi_refuse' using errcode = '42501'; end if;
  v_action := p_commande->>'action';
  if (select count(*) from jsonb_object_keys(p_commande)) <> 3
     or not (p_commande ?& array['action','revision'])
     or p_commande->'revision' <> to_jsonb(p_revision) then
    raise exception 'suivi_invalide' using errcode = '22023';
  end if;
  if v_action = 'reperes' then
    if not (p_commande ? 'reperes') or not public.suivi_reperes_valides(p_commande->'reperes') then
      raise exception 'suivi_invalide' using errcode = '22023';
    end if;
  elsif v_action = 'pause' then
    if not (p_commande ? 'pause') or jsonb_typeof(p_commande->'pause') <> 'boolean' then
      raise exception 'suivi_invalide' using errcode = '22023';
    end if;
    if p_commande->'pause' = 'false'::jsonb and public.branche_bloquee_par_detresse() then
      raise exception 'suivi_refuse' using errcode = '42501';
    end if;
  else raise exception 'suivi_invalide' using errcode = '22023'; end if;
  insert into public.suivi_anam(utilisatrice_id) values(v_uid) on conflict do nothing;
  select * into v_s from public.suivi_anam where utilisatrice_id = v_uid for update;
  if v_s.revision <> p_revision then raise exception 'suivi_conflit' using errcode = 'PT409'; end if;
  update public.suivi_anam set
    reperes = case when v_action = 'reperes' then p_commande->'reperes' else reperes end,
    pause = case when v_action = 'pause' then (p_commande->>'pause')::boolean else pause end,
    revision = revision + 1, maj_le = now()
    where utilisatrice_id = v_uid returning revision into v_s.revision;
  return v_s.revision;
end;
$$;
revoke all on function public.modifier_suivi_personnel(integer,jsonb) from public,anon;
grant execute on function public.modifier_suivi_personnel(integer,jsonb) to authenticated;

-- A narrow service-only mutation, analogous to consigner_tour_anam. It never returns documents.
-- The application authenticates the target and reads content separately under her JWT.
create function public.appliquer_outil_suivi_anam(
  p_utilisatrice_id uuid,p_cle_tour text,p_revision integer,p_commande jsonb
) returns integer language plpgsql volatile security definer set search_path = '' as $$
declare
  v_s public.suivi_anam%rowtype;
  v_source public.entree_journal%rowtype;
  v_empreinte text;
  v_precedente text;
  v_type text;
  v_etapes jsonb;
  v_resume text;
  v_titre text := null;
  v_structure integer;
  v_rayonnements integer;
  v_niveau integer;
begin
  -- Lock the owner first: creation, user edits and model writes share this lock.
  perform 1 from public.utilisatrice u where u.id = p_utilisatrice_id
    and u.date_naissance is not null and not u.mineur_detecte and u.barriere_minorite_le is null for update;
  if not found then raise exception 'suivi_refuse' using errcode = '42501'; end if;
  perform 1 from public.consentement c where c.utilisatrice_id = p_utilisatrice_id
    and c.art9_accorde and c.ia_reconnue and c.cgu_acceptees and c.revoked_at is null for share;
  if not found then raise exception 'suivi_refuse' using errcode = '42501'; end if;
  if p_revision is null or p_revision < 0 or p_revision = 2147483647
     or p_cle_tour is null or char_length(p_cle_tour) not between 1 and 200
     or p_commande is null or jsonb_typeof(p_commande) <> 'object' then
    raise exception 'suivi_invalide' using errcode = '22023';
  end if;
  v_empreinte := encode(sha256(convert_to(jsonb_build_object('revision',p_revision,'commande',p_commande)::text,'UTF8')),'hex');
  select empreinte into v_precedente from public.suivi_evenement
    where utilisatrice_id = p_utilisatrice_id and cle_tour = p_cle_tour;
  if found then
    if v_precedente <> v_empreinte then raise exception 'suivi_conflit' using errcode = 'PT409'; end if;
    select revision into v_niveau from public.suivi_anam where utilisatrice_id = p_utilisatrice_id;
    return v_niveau;
  end if;
  if exists (select 1 from public.episode_detresse e where e.utilisatrice_id = p_utilisatrice_id
      and (e.fin is null or e.fenetre_expire_at > now())) then
    raise exception 'suivi_refuse' using errcode = '42501';
  end if;
  select * into v_source from public.entree_journal where utilisatrice_id = p_utilisatrice_id
    and cle_tour = p_cle_tour and role = 'utilisatrice';
  if not found then raise exception 'suivi_refuse' using errcode = '42501'; end if;
  v_type := p_commande->>'type';
  -- A short confirmation can accept a proposed path; integrating a step requires a fuller account.
  if not (p_commande ? 'preuve') or jsonb_typeof(p_commande->'preuve') <> 'string'
     or char_length(p_commande->>'preuve') not between (case when v_type = 'ajuster' then 1 else 8 end) and 500
     or not public.texte_significatif(p_commande->>'preuve')
     or strpos(v_source.contenu,p_commande->>'preuve') = 0 then
    raise exception 'suivi_invalide' using errcode = '22023';
  end if;
  if v_type = 'ajuster' then
    if (select count(*) from jsonb_object_keys(p_commande)) <> 5
       or not (p_commande ?& array['type','cap','synthese','etapes','preuve'])
       or jsonb_typeof(p_commande->'cap') <> 'string' or char_length(p_commande->>'cap') not between 1 and 160
       or not public.texte_significatif(p_commande->>'cap')
       or jsonb_typeof(p_commande->'synthese') <> 'string' or char_length(p_commande->>'synthese') not between 1 and 1200
       or not public.texte_significatif(p_commande->>'synthese')
       or not public.suivi_etapes_valides(p_commande->'etapes',false) then
      raise exception 'suivi_invalide' using errcode = '22023';
    end if;
    if jsonb_array_length(p_commande->'etapes') < 1 then raise exception 'suivi_invalide' using errcode = '22023'; end if;
    v_resume := p_commande->>'cap';
  elsif v_type = 'avancer' then
    if (select count(*) from jsonb_object_keys(p_commande)) <> 4
       or not (p_commande ?& array['type','etapeId','bilan','preuve'])
       or jsonb_typeof(p_commande->'etapeId') <> 'string'
       or jsonb_typeof(p_commande->'bilan') <> 'string' or char_length(p_commande->>'bilan') not between 1 and 500
       or not public.texte_significatif(p_commande->>'bilan') then
      raise exception 'suivi_invalide' using errcode = '22023';
    end if;
    v_resume := p_commande->>'bilan';
  else raise exception 'suivi_invalide' using errcode = '22023'; end if;
  insert into public.suivi_anam(utilisatrice_id) values(p_utilisatrice_id) on conflict do nothing;
  select * into v_s from public.suivi_anam where utilisatrice_id = p_utilisatrice_id for update;
  if v_s.revision <> p_revision then raise exception 'suivi_conflit' using errcode = 'PT409'; end if;
  if v_s.pause then raise exception 'suivi_refuse' using errcode = '42501'; end if;
  v_niveau := v_s.niveau_arbre;
  if v_type = 'ajuster' then
    select jsonb_agg(e.value || jsonb_build_object('id',gen_random_uuid()) order by e.ord)
      into v_etapes from jsonb_array_elements(p_commande->'etapes') with ordinality e(value,ord);
    update public.suivi_anam set cap = p_commande->>'cap', synthese = p_commande->>'synthese',
      etapes = v_etapes, revision = revision + 1, maj_le = now() where utilisatrice_id = p_utilisatrice_id;
  else
    if jsonb_array_length(v_s.etapes) = 0 or (v_s.etapes->0->>'id') is distinct from (p_commande->>'etapeId') then
      raise exception 'suivi_conflit' using errcode = 'PT409';
    end if;
    v_titre := v_s.etapes->0->>'titre';
    -- Exact existing illustration projection: branches remain untouched, including rayonnement.
    select least(23,coalesce(sum(1 + floor(least(1,greatest(0,
      case when etat = 'naissance' then 0 else intensite end))*10 + 0.000001)),0))::integer,
      count(*) filter (where etat = 'rayonnement')::integer
      into v_structure,v_rayonnements from public.branche where utilisatrice_id = p_utilisatrice_id;
    v_niveau := least(34,greatest(v_s.niveau_arbre,
      v_structure + case when v_structure = 23 then least(11,v_rayonnements) else 0 end) + 1);
    update public.suivi_anam set etapes = etapes - 0, niveau_arbre = v_niveau,
      revision = revision + 1, maj_le = now() where utilisatrice_id = p_utilisatrice_id;
  end if;
  insert into public.suivi_evenement(utilisatrice_id,source_id,cle_tour,empreinte,revision,type,resume,titre_etape,niveau_arbre)
    values(p_utilisatrice_id,v_source.id,p_cle_tour,v_empreinte,v_s.revision+1,v_type,v_resume,v_titre,v_niveau);
  return v_s.revision + 1;
end;
$$;
revoke all on function public.appliquer_outil_suivi_anam(uuid,text,integer,jsonb) from public,anon,authenticated;
grant execute on function public.appliquer_outil_suivi_anam(uuid,text,integer,jsonb) to service_role;

comment on table public.suivi_anam is 'Suivi visible et révisable : repères personnels écrits par elle, cap et prochaines étapes proposés par Anam. Aucun score ni état de branche modifié.';
comment on table public.suivi_evenement is 'Reçus de mutations Anam, rattachés au tour utilisateur exact. Idempotence sans copie des anciens documents ; export et effacement inclus.';

-- A completed tool may outlive a broken response stream. The JWT owner can recover only its
-- operation type before paying for another model call; private replay keys remain unreadable.
create function public.lire_recu_suivi(p_cle_tour text,p_message_source text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_contenu text; v_type text;
begin
  if v_uid is null or not public.a_consenti_art9() or public.est_barre_minorite() then
    raise exception 'suivi_refuse' using errcode = '42501';
  end if;
  if p_cle_tour is null or char_length(p_cle_tour) not between 1 and 200 or p_message_source is null then
    raise exception 'suivi_invalide' using errcode = '22023';
  end if;
  select j.contenu,e.type into v_contenu,v_type from public.entree_journal j
    left join public.suivi_evenement e on e.source_id = j.id and e.utilisatrice_id = v_uid
    where j.utilisatrice_id = v_uid and j.cle_tour = p_cle_tour and j.role = 'utilisatrice';
  if not found then return null; end if;
  if v_contenu is distinct from p_message_source then raise exception 'suivi_conflit' using errcode = 'PT409'; end if;
  if v_type is null then return null; end if;
  return jsonb_build_object('type',v_type);
end;
$$;
revoke all on function public.lire_recu_suivi(text,text) from public,anon;
grant execute on function public.lire_recu_suivi(text,text) to authenticated;


create or replace function public.exporter_mes_donnees()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_uid uuid := (select auth.uid());
  v_doc jsonb;
begin
  if v_uid is null then
    raise exception 'export_sans_identite' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'version', 1,
    'genere_le', now(),
    'retraits', jsonb_build_array(
      jsonb_build_object('table', 'suivi_evenement', 'colonnes', jsonb_build_array('cle_tour','empreinte'), 'motif', 'clés techniques de rejeu et empreinte de commande'),
      jsonb_build_object('table', 'lecture_numerologie', 'colonnes', jsonb_build_array('jeton'), 'motif', 'jeton de finalisation technique'),
      jsonb_build_object('table', 'abonnement_poussee', 'colonnes', jsonb_build_array('cle_p256dh', 'cle_auth'),
                         'motif', 'clés de poussée : une capacité sur ton appareil, pas une donnée sur toi'),
      jsonb_build_object('table', 'preference_courriel', 'colonnes', jsonb_build_array('jeton'),
                         'motif', 'jeton de désabonnement : quiconque le lit peut te désabonner sans être toi'),
      jsonb_build_object('table', 'reservation_quota_ia', 'colonnes', jsonb_build_array('cle_idempotence'),
                         'motif', 'clé de rejeu technique : elle permet de réutiliser une admission, sans rien dire sur toi'),
      jsonb_build_object('table', 'ouverture_jour_anam', 'colonnes', jsonb_build_array('jeton_preparation'),
                         'motif', 'jeton de bail technique : il autorise sa finalisation, sans rien dire sur toi')
    ),

    'lecture_numerologie', (select coalesce(jsonb_agg(to_jsonb(t) - 'jeton'), '[]'::jsonb)
                              from public.lecture_numerologie t where t.utilisatrice_id = v_uid),
    'suivi_anam', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.suivi_anam t where t.utilisatrice_id = v_uid),
    'suivi_evenement', (select coalesce(jsonb_agg((to_jsonb(t) - 'cle_tour' - 'empreinte') order by t.revision), '[]'::jsonb) from public.suivi_evenement t where t.utilisatrice_id = v_uid),
    'utilisatrice', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
                       from public.utilisatrice t where t.id = v_uid),
    'consentement', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                       from public.consentement t where t.utilisatrice_id = v_uid),

    'entree_journal', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                         from public.entree_journal t where t.utilisatrice_id = v_uid),
    'fait_extrait', (select coalesce(jsonb_agg(to_jsonb(t) order by t.maj_le), '[]'::jsonb)
                       from public.fait_extrait t where t.utilisatrice_id = v_uid),
    'branche', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                  from public.branche t where t.utilisatrice_id = v_uid),
    'branche_retour', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                         from public.branche_retour t where t.utilisatrice_id = v_uid),
    'resume_glissant', (select coalesce(jsonb_agg(to_jsonb(t) order by t.maj_le), '[]'::jsonb)
                          from public.resume_glissant t where t.utilisatrice_id = v_uid),
    'synthese', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                   from public.synthese t where t.utilisatrice_id = v_uid),
    'intention', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                    from public.intention t where t.utilisatrice_id = v_uid),
    'signal_reconceptualisation', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                                     from public.signal_reconceptualisation t where t.utilisatrice_id = v_uid),

    'theme_natal', (select coalesce(jsonb_agg(to_jsonb(t) order by t.calcule_le), '[]'::jsonb)
                      from public.theme_natal t where t.utilisatrice_id = v_uid),
    'enneagramme', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                      from public.enneagramme t where t.utilisatrice_id = v_uid),
    'enneagramme_hypothese', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                                from public.enneagramme_hypothese t where t.utilisatrice_id = v_uid),
    'enneagramme_tentative', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                                from public.enneagramme_tentative t where t.utilisatrice_id = v_uid),
    'big_five', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                   from public.big_five t where t.utilisatrice_id = v_uid),
    'big_five_tentative', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                             from public.big_five_tentative t where t.utilisatrice_id = v_uid),
    'carte_contexte', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
                         from public.carte_contexte t where t.utilisatrice_id = v_uid),

    'tirage', (select coalesce(jsonb_agg(to_jsonb(t) order by t.tire_a), '[]'::jsonb)
                 from public.tirage t where t.utilisatrice_id = v_uid),
    'lecture', (select coalesce(jsonb_agg(to_jsonb(t) order by t.ouverte_a), '[]'::jsonb)
                  from public.lecture t where t.utilisatrice_id = v_uid),

    'seance', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                 from public.seance t where t.utilisatrice_id = v_uid),
    'usage_ia', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                   from public.usage_ia t where t.utilisatrice_id = v_uid),
    'reservation_quota_ia', (select coalesce(
        jsonb_agg((to_jsonb(t) - 'cle_idempotence') order by t.cree_le), '[]'::jsonb)
      from public.reservation_quota_ia t where t.utilisatrice_id = v_uid),
    'ouverture_jour_anam', (select coalesce(
        jsonb_agg((to_jsonb(t) - 'jeton_preparation') order by t.jour), '[]'::jsonb)
      from public.ouverture_jour_anam t where t.utilisatrice_id = v_uid),
    'episode_detresse', (select coalesce(jsonb_agg(to_jsonb(t) order by t.debut), '[]'::jsonb)
                           from public.episode_detresse t where t.utilisatrice_id = v_uid),
    'audit_securite', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                         from public.audit_securite t where t.utilisatrice_id = v_uid),
    'audit_correction_naissance', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                                     from public.audit_correction_naissance t where t.utilisatrice_id = v_uid),
    'pause_rythme', (select coalesce(jsonb_agg(to_jsonb(t) order by t.propose_le), '[]'::jsonb)
                       from public.pause_rythme t where t.utilisatrice_id = v_uid),
    'invitation_integration', (select coalesce(jsonb_agg(to_jsonb(t) order by t.dite_le), '[]'::jsonb)
                                 from public.invitation_integration t where t.utilisatrice_id = v_uid),
    'notification_envoyee', (select coalesce(jsonb_agg(to_jsonb(t) order by t.envoye_le), '[]'::jsonb)
                               from public.notification_envoyee t where t.utilisatrice_id = v_uid),

    'abonnement', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                     from public.abonnement t where t.utilisatrice_id = v_uid),
    'remboursement', (select coalesce(jsonb_agg(to_jsonb(t) order by t.demande_le), '[]'::jsonb)
                        from public.remboursement t where t.utilisatrice_id = v_uid),
    'information_reconduction', (select coalesce(jsonb_agg(to_jsonb(t) order by t.echeance), '[]'::jsonb)
                                   from public.information_reconduction t where t.utilisatrice_id = v_uid),
    'preference_socle', (select coalesce(jsonb_agg(to_jsonb(t) order by t.maj_le), '[]'::jsonb)
                           from public.preference_socle t where t.utilisatrice_id = v_uid),
    'preference_courriel', (select coalesce(jsonb_agg((to_jsonb(t) - 'jeton') order by t.maj_le), '[]'::jsonb)
                              from public.preference_courriel t where t.utilisatrice_id = v_uid),
    'abonnement_poussee', (select coalesce(
      jsonb_agg((to_jsonb(t) - 'cle_p256dh' - 'cle_auth') order by t.cree_le), '[]'::jsonb)
      from public.abonnement_poussee t where t.utilisatrice_id = v_uid),

    -- Les trois parties du texte du jour écrites POUR ELLE (0094). C'est un contenu produit sur elle
    -- à partir de sa naissance et de ses échanges : il relève du droit d'accès au même titre qu'une
    -- lecture ou qu'une synthèse. Il ne vit que quarante-huit heures, et c'est une raison de plus de
    -- le servir tant qu'il existe — pas une raison de le taire.
    'texte_du_jour_personnel', (select coalesce(jsonb_agg(to_jsonb(t) order by t.jour), '[]'::jsonb)
                                  from public.texte_du_jour_personnel t where t.utilisatrice_id = v_uid)
  ) into v_doc;

  insert into public.audit_securite (utilisatrice_id, type, decision)
  values (v_uid, 'export_donnees', 'servi');

  return v_doc;
end;
$fn$;

revoke all on function public.exporter_mes_donnees() from public, anon;
grant execute on function public.exporter_mes_donnees() to authenticated;
