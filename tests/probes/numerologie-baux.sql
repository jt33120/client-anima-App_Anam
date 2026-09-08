-- Run against local Supabase only. Every synthetic row and clock change is rolled back.
begin;
do $$
declare
  v_uid uuid := gen_random_uuid();
  v_source text := md5('1990-01-01|');
  v_annee integer := extract(year from now() at time zone 'Europe/Paris')::integer;
  v_premier jsonb;
  v_suivant jsonb;
  v_compte integer;
begin
  insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data)
    values(v_uid,'numerologie-probe-' || v_uid::text || '@exemple.fr','{}','{}');
  update public.utilisatrice set date_naissance = '1990-01-01' where id = v_uid;
  insert into public.consentement(utilisatrice_id,art9_accorde,ia_reconnue,cgu_acceptees)
    values(v_uid,true,true,true);
  perform set_config('request.jwt.claim.sub',v_uid::text,true);
  v_premier := public.commencer_lecture_numerologie(v_source,v_annee);
  if v_premier->>'statut' <> 'reservee' then raise exception 'initial_claim_failed'; end if;
  if public.commencer_lecture_numerologie(v_source,v_annee)->>'statut' <> 'en_cours' then
    raise exception 'concurrent_claim_not_blocked';
  end if;

  -- Expiry reclaims the lease once the retry cooldown is also over.
  update public.lecture_numerologie set bail_jusque=now()-interval '1 second',
    dernier_essai=now()-interval '3 minutes' where utilisatrice_id=v_uid;
  v_suivant := public.commencer_lecture_numerologie(v_source,v_annee);
  if v_suivant->>'statut' <> 'reservee' or v_suivant->>'jeton' = v_premier->>'jeton' then
    raise exception 'expired_lease_not_reclaimed';
  end if;
  perform public.terminer_lecture_numerologie(v_uid,(v_premier->>'jeton')::uuid,
    repeat('Old generation must stay absent. ',3),repeat('Old generation must stay absent. ',3),repeat('Old generation must stay absent. ',3));
  if exists(select 1 from public.lecture_numerologie where utilisatrice_id=v_uid
    and (portrait is not null or jeton::text <> v_suivant->>'jeton')) then
    raise exception 'stale_token_changed_current_generation';
  end if;

  -- Third attempt is allowed, fourth is blocked even after another lease expiry.
  update public.lecture_numerologie set bail_jusque=now()-interval '1 second',
    dernier_essai=now()-interval '3 minutes' where utilisatrice_id=v_uid;
  if public.commencer_lecture_numerologie(v_source,v_annee)->>'statut' <> 'reservee' then
    raise exception 'third_attempt_not_allowed';
  end if;
  update public.lecture_numerologie set bail_jusque=now()-interval '1 second',
    dernier_essai=now()-interval '3 minutes' where utilisatrice_id=v_uid;
  if public.commencer_lecture_numerologie(v_source,v_annee)->>'statut' <> 'limite' then
    raise exception 'fourth_attempt_not_blocked';
  end if;

  -- Editing a name must clear the content and lease without resetting daily attempts.
  update public.utilisatrice set nom_complet='Louise Dupont' where id=v_uid;
  select essais into v_compte from public.lecture_numerologie where utilisatrice_id=v_uid;
  if v_compte <> 3 then raise exception 'source_change_reset_daily_cap'; end if;
  if public.commencer_lecture_numerologie(md5('1990-01-01|Louise Dupont'),v_annee)->>'statut' <> 'limite' then
    raise exception 'source_change_bypassed_daily_cap';
  end if;

  -- A new civil day restores three attempts; this is not a permanent lockout.
  update public.lecture_numerologie set jour_essais=(now() at time zone 'Europe/Paris')::date-1
    where utilisatrice_id=v_uid;
  if public.commencer_lecture_numerologie(md5('1990-01-01|Louise Dupont'),v_annee)->>'statut' <> 'reservee' then
    raise exception 'new_day_did_not_restore_attempts';
  end if;
  select essais into v_compte from public.lecture_numerologie where utilisatrice_id=v_uid;
  if v_compte <> 1 then raise exception 'new_day_counter_not_reset'; end if;
  raise notice 'Numerology lease expiry, stale token, daily cap, source-change cap and next-day recovery: PASS';
end;
$$;
rollback;
