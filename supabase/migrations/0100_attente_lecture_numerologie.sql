-- Distinguish an active lease from retry cooldown without spending another attempt.
create or replace function public.commencer_lecture_numerologie(p_source text, p_annee integer)
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
  if v_l.bail_jusque > now() then return jsonb_build_object('statut','en_cours','reessaiApres',3); end if;
  if v_l.jour_essais = v_jour and v_l.essais >= 3 then return jsonb_build_object('statut','limite'); end if;
  if v_l.dernier_essai > now() - interval '2 minutes' then return jsonb_build_object('statut','patience','reessaiApres',ceil(extract(epoch from (v_l.dernier_essai + interval '2 minutes' - now())))::integer); end if;
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

-- A read-only status endpoint: polling never starts another paid generation.
create function public.etat_lecture_numerologie()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_l public.lecture_numerologie%rowtype;
  v_source text;
begin
  if v_uid is null or not public.a_consenti_art9() or public.est_barre_minorite() then
    raise exception 'numerologie_interdite' using errcode = '42501';
  end if;
  select * into v_l from public.lecture_numerologie where utilisatrice_id = v_uid;
  if not found then return jsonb_build_object('statut','absente'); end if;
  select md5(u.date_naissance::text || '|' || coalesce(u.nom_complet,'')) into v_source
    from public.utilisatrice u where u.id = v_uid;
  if v_l.source = v_source and v_l.annee = extract(year from now() at time zone 'Europe/Paris')::integer
     and v_l.version = '1' and v_l.portrait is not null then
    return jsonb_build_object('statut','prete');
  end if;
  if v_l.bail_jusque > now() then return jsonb_build_object('statut','en_cours','reessaiApres',3); end if;
  if v_l.jour_essais = (now() at time zone 'Europe/Paris')::date and v_l.essais >= 3 then
    return jsonb_build_object('statut','limite');
  end if;
  if v_l.dernier_essai > now() - interval '2 minutes' then
    return jsonb_build_object('statut','patience','reessaiApres',ceil(extract(epoch from (v_l.dernier_essai + interval '2 minutes' - now())))::integer);
  end if;
  return jsonb_build_object('statut','absente');
end;
$$;
revoke all on function public.etat_lecture_numerologie() from public,anon;
grant execute on function public.etat_lecture_numerologie() to authenticated;
