-- Private, bounded AI numerology readings. Generated content is never client-writable.
create table public.lecture_numerologie (
  utilisatrice_id uuid primary key references public.utilisatrice(id) on delete cascade,
  id uuid not null unique default gen_random_uuid(),
  annee integer not null,
  source text not null,
  version text not null default '1',
  guidance_annee text check (guidance_annee is null or char_length(btrim(guidance_annee)) between 40 and 1600),
  vision_long_terme text check (vision_long_terme is null or char_length(btrim(vision_long_terme)) between 40 and 1600),
  portrait text check (portrait is null or char_length(btrim(portrait)) between 40 and 1600),
  note integer check (note between 1 and 5),
  partage_anam boolean not null default false,
  jeton uuid,
  bail_jusque timestamptz,
  dernier_essai timestamptz,
  jour_essais date not null default (now() at time zone 'Europe/Paris')::date,
  essais integer not null default 0 check (essais between 0 and 3),
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  constraint lecture_numerologie_forme check (
    (guidance_annee is null and vision_long_terme is null and portrait is null and note is null and not partage_anam)
    or (guidance_annee is not null and vision_long_terme is not null and portrait is not null)
  ),
  constraint lecture_numerologie_partage check (not partage_anam or (note is not null and note = 5))
);
alter table public.lecture_numerologie enable row level security;
alter table public.lecture_numerologie force row level security;
revoke all on table public.lecture_numerologie from public, anon, authenticated, service_role;
grant select on table public.lecture_numerologie to service_role;
grant select (utilisatrice_id,id,annee,source,version,guidance_annee,vision_long_terme,portrait,note,partage_anam)
  on public.lecture_numerologie to authenticated;
create policy lecture_numerologie_lecture on public.lecture_numerologie for select to authenticated
using (utilisatrice_id = (select auth.uid()) and public.a_consenti_art9() and not public.est_barre_minorite()
  and annee = extract(year from now() at time zone 'Europe/Paris')::integer
  and source = (select md5(u.date_naissance::text || '|' || coalesce(u.nom_complet, ''))
               from public.utilisatrice u where u.id = (select auth.uid())));

-- The row persists across source changes so changing a name cannot reset the daily cost bound.
create function public.commencer_lecture_numerologie(p_source text, p_annee integer)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_source text;
  v_jour date := (now() at time zone 'Europe/Paris')::date;
  v_l public.lecture_numerologie%rowtype;
  v_jeton uuid := gen_random_uuid();
begin
  if v_uid is null or not public.a_consenti_art9() or public.est_barre_minorite() then
    raise exception 'numerologie_interdite' using errcode = '42501';
  end if;
  select md5(u.date_naissance::text || '|' || coalesce(u.nom_complet, '')) into v_source
    from public.utilisatrice u where u.id = v_uid for update;
  if v_source is null or p_source is distinct from v_source
     or p_annee is distinct from extract(year from v_jour)::integer then
    raise exception 'numerologie_source_perimee' using errcode = '22023';
  end if;
  insert into public.lecture_numerologie(utilisatrice_id,annee,source)
    values(v_uid,p_annee,p_source) on conflict (utilisatrice_id) do nothing;
  select * into v_l from public.lecture_numerologie l where l.utilisatrice_id = v_uid for update;
  if v_l.source = p_source and v_l.annee = p_annee and v_l.version = '1' and v_l.portrait is not null then
    return jsonb_build_object('statut','prete');
  end if;
  if v_l.bail_jusque > now() then return jsonb_build_object('statut','en_cours'); end if;
  if v_l.jour_essais = v_jour and v_l.essais >= 3 then return jsonb_build_object('statut','limite'); end if;
  if v_l.dernier_essai > now() - interval '2 minutes' then return jsonb_build_object('statut','en_cours'); end if;
  update public.lecture_numerologie set id = gen_random_uuid(), annee = p_annee, source = p_source,
    version = '1', guidance_annee = null, vision_long_terme = null, portrait = null,
    note = null, partage_anam = false, jeton = v_jeton, bail_jusque = now() + interval '90 seconds',
    dernier_essai = now(), jour_essais = v_jour,
    essais = case when v_l.jour_essais = v_jour then v_l.essais + 1 else 1 end, maj_le = now()
    where utilisatrice_id = v_uid returning * into v_l;
  return jsonb_build_object('statut','reservee','id',v_l.id,'jeton',v_jeton);
end;
$$;
revoke all on function public.commencer_lecture_numerologie(text,integer) from public,anon;
grant execute on function public.commencer_lecture_numerologie(text,integer) to authenticated;

create function public.terminer_lecture_numerologie(p_utilisatrice_id uuid,p_jeton uuid,p_guidance text,p_vision text,p_portrait text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare v_source text;
begin
  select md5(u.date_naissance::text || '|' || coalesce(u.nom_complet, '')) into v_source
    from public.utilisatrice u where u.id = p_utilisatrice_id
      and u.date_naissance is not null and not u.mineur_detecte and u.barriere_minorite_le is null
    for update;
  if v_source is null then return; end if;
  if not exists (select 1 from public.consentement c where c.utilisatrice_id = p_utilisatrice_id
     and c.art9_accorde and c.ia_reconnue and c.cgu_acceptees and c.revoked_at is null) then return; end if;
  update public.lecture_numerologie set guidance_annee = p_guidance, vision_long_terme = p_vision,
    portrait = p_portrait, note = null, partage_anam = false, jeton = null, bail_jusque = null, maj_le = now()
    where utilisatrice_id = p_utilisatrice_id and jeton = p_jeton and source = v_source
      and annee = extract(year from now() at time zone 'Europe/Paris')::integer
      and bail_jusque > now();
end;
$$;
revoke all on function public.terminer_lecture_numerologie(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.terminer_lecture_numerologie(uuid,uuid,text,text,text) to service_role;

create function public.noter_lecture_numerologie(p_id uuid,p_note integer,p_partager boolean)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_source text;
begin
  if v_uid is null or not public.a_consenti_art9() or public.est_barre_minorite() then
    raise exception 'numerologie_interdite' using errcode = '42501';
  end if;
  if p_note is null or p_note not between 1 and 5 or p_partager is null or (p_partager and p_note <> 5) then
    raise exception 'numerologie_note_invalide' using errcode = '22023';
  end if;
  select md5(u.date_naissance::text || '|' || coalesce(u.nom_complet, '')) into v_source
    from public.utilisatrice u where u.id = v_uid for update;
  update public.lecture_numerologie set note = p_note, partage_anam = p_partager and p_note = 5, maj_le = now()
    where utilisatrice_id = v_uid and id = p_id and source = v_source and portrait is not null and version = '1'
      and annee = extract(year from now() at time zone 'Europe/Paris')::integer;
  if not found then raise exception 'numerologie_lecture_perimee' using errcode = '22023'; end if;
end;
$$;
revoke all on function public.noter_lecture_numerologie(uuid,integer,boolean) from public,anon;
grant execute on function public.noter_lecture_numerologie(uuid,integer,boolean) to authenticated;

create function public.invalider_lecture_numerologie()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_uid uuid;
begin
  if tg_table_name = 'utilisatrice' then v_uid := new.id;
  else v_uid := new.utilisatrice_id; end if;
  update public.lecture_numerologie set id = gen_random_uuid(), guidance_annee = null, vision_long_terme = null,
    portrait = null, note = null, partage_anam = false, jeton = null, bail_jusque = null, maj_le = now()
    where utilisatrice_id = v_uid;
  return new;
end;
$$;
revoke all on function public.invalider_lecture_numerologie() from public,anon,authenticated;
create trigger numerologie_identite_changee after update of date_naissance,nom_complet on public.utilisatrice
for each row when (old.date_naissance is distinct from new.date_naissance or old.nom_complet is distinct from new.nom_complet)
execute function public.invalider_lecture_numerologie();
create trigger numerologie_consentement_retire after update of revoked_at,art9_accorde,ia_reconnue,cgu_acceptees on public.consentement
for each row when (new.revoked_at is not null or not new.art9_accorde or not new.ia_reconnue or not new.cgu_acceptees)
execute function public.invalider_lecture_numerologie();

alter table public.usage_ia drop constraint usage_ia_operation_connue, drop constraint usage_ia_capacite_connue;
alter table public.usage_ia add constraint usage_ia_operation_connue check (operation in (
  'historique','conversation','detection_detresse','detection_reconceptualisation','detection_retour_theme',
  'hypothese_enneagramme','compactage_contexte','extraction_arc','restitution_lecture','bilan_seance',
  'synthese_periodique','texte_du_jour','analyse_numerologie')),
add constraint usage_ia_capacite_connue check (capacite is null or capacite in (
  'echange','compactage','reconceptualisation','synthese','detection','retour_theme','hypothese_enneagramme','lecture','horoscope','numerologie'));

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
