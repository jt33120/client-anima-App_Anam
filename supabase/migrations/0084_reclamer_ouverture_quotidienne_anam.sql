-- Une seule parole ouvre le jour : soit une salutation générique, soit une ouverture précise qui
-- porte elle-même la salutation. La préparation est LECTURE SEULE. Les deux réservations qui
-- dépensent une parole (pause et invitation) sont exécutées ici, dans la MÊME transaction que
-- l'INSERT du journal : si le journal échoue, leur écriture est annulée avec lui.

drop function if exists public.consigner_ouverture_quotidienne_anam(uuid, date, text);
drop function if exists public.commencer_ouverture_quotidienne_anam(uuid, date);
drop function if exists public.finaliser_ouverture_quotidienne_anam(uuid, date, uuid, text);

create table public.ouverture_jour_anam (
  utilisatrice_id uuid not null references public.utilisatrice(id) on delete cascade,
  jour date not null,
  nature text not null check (nature in ('preparation', 'ouverte', 'fil_existant')),
  jeton_preparation uuid,
  preparee_jusqu_a timestamptz,
  entree_journal_id uuid references public.entree_journal(id) on delete set null,
  -- Seule la partie déjà destinée au client est conservée. Les compteurs de pause restent internes.
  evenement_public jsonb,
  primary key (utilisatrice_id, jour),
  check (evenement_public is null or jsonb_typeof(evenement_public) = 'object'),
  check (
    (nature = 'preparation'
      and jeton_preparation is not null
      and preparee_jusqu_a is not null
      and entree_journal_id is null
      and evenement_public is null)
    or (nature = 'ouverte'
      and jeton_preparation is null
      and preparee_jusqu_a is null)
    or (nature = 'fil_existant'
      and jeton_preparation is null
      and preparee_jusqu_a is null
      and entree_journal_id is null
      and evenement_public is null)
  )
);

alter table public.ouverture_jour_anam enable row level security;
alter table public.ouverture_jour_anam force row level security;
revoke all on table public.ouverture_jour_anam from public, anon, authenticated, service_role;

comment on table public.ouverture_jour_anam is
  'Outbox interne : bail exclusif, première parole du jour Europe/Paris et métadonnée publique de son éventuel geste. Les jours antérieurs sont retirés à la visite suivante.';

-- Source unique du write-gate utilisé par les deux phases et par les réservations historiques.
-- `FOR SHARE` garde les lignes jusqu'à la fin de la transaction : une révocation ou une barrière de
-- minorité concurrente finit entièrement avant cette écriture, ou attend qu'elle soit entièrement finie.
create or replace function public.compte_autorise_ouverture_anam(cible uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  autorisee boolean;
begin
  select true into autorisee
    from public.utilisatrice u
    join public.consentement c on c.utilisatrice_id = u.id
   where u.id = cible
     and u.mineur_detecte = false
     and u.barriere_minorite_le is null
     and c.art9_accorde = true
     and c.ia_reconnue = true
     and c.cgu_acceptees = true
     and c.revoked_at is null
   for share of u, c;
  return coalesce(autorisee, false);
end;
$$;

revoke all on function public.compte_autorise_ouverture_anam(uuid)
  from public, anon, authenticated, service_role;

-- Les deux RPC historiques restent les sources de vérité de leur règle métier. Cette migration ne
-- recopie ni la fenêtre ni la garde de détresse : elle ajoute seulement le write-gate manquant et
-- son verrou de révocation, puis la finalisation les appelle sous l'identité de la cible.
create or replace function public.reserver_invitation_integration(p_fenetre_heures integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := (select auth.uid());
  v_dite_le   timestamptz;
  v_mouvement boolean;
begin
  if v_uid is null then return false; end if;
  if p_fenetre_heures is null or p_fenetre_heures <= 0 then
    raise exception 'fenetre_invitation_invalide';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 4910));
  if not public.compte_autorise_ouverture_anam(v_uid) then return false; end if;

  select i.dite_le into v_dite_le
    from public.invitation_integration i where i.utilisatrice_id = v_uid;

  if v_dite_le is null then
    insert into public.invitation_integration (utilisatrice_id, dite_le) values (v_uid, now());
    return true;
  end if;
  if v_dite_le > now() - pg_catalog.make_interval(hours => p_fenetre_heures) then
    return false;
  end if;

  select exists (
    select 1 from public.branche b
     where b.utilisatrice_id = v_uid
       and (b.date_feuillaison > v_dite_le or b.date_rayonnement > v_dite_le)
  ) into v_mouvement;

  if not v_mouvement
     and v_dite_le > now() - pg_catalog.make_interval(hours => p_fenetre_heures * 4) then
    return false;
  end if;

  update public.invitation_integration set dite_le = now() where utilisatrice_id = v_uid;
  return true;
end;
$$;

revoke all on function public.reserver_invitation_integration(integer) from public, anon;
grant execute on function public.reserver_invitation_integration(integer) to authenticated;

create or replace function public.reserver_pause_rythme(
  p_seances integer,
  p_minutes integer,
  p_apaisement_jours integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_dernier timestamptz;
begin
  if v_uid is null then return false; end if;
  if p_apaisement_jours is null or p_apaisement_jours <= 0 then
    raise exception 'apaisement_invalide';
  end if;
  if p_seances is null or p_minutes is null or p_seances < 0 or p_minutes < 0 then
    raise exception 'mesure_invalide';
  end if;
  -- La source de vérité AD-17 reste exactement cette RPC, avant tout verrou et tout INSERT.
  if public.branche_bloquee_par_detresse() then return false; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 4911));
  if not public.compte_autorise_ouverture_anam(v_uid) then return false; end if;

  select max(p.propose_le) into v_dernier
    from public.pause_rythme p where p.utilisatrice_id = v_uid;
  if v_dernier is not null
     and v_dernier > now() - pg_catalog.make_interval(days => p_apaisement_jours) then
    return false;
  end if;

  insert into public.pause_rythme (utilisatrice_id, seances, minutes)
  values (v_uid, p_seances, p_minutes);
  return true;
end;
$$;

revoke all on function public.reserver_pause_rythme(integer, integer, integer) from public, anon;
grant execute on function public.reserver_pause_rythme(integer, integer, integer) to authenticated;

-- Toute écriture du journal prend le même verrou que le registre. Contrairement à un simple
-- advisory lock, le trigger CONSULTE ensuite le bail persistant : tant qu'il est actif, il refuse
-- vraiment un tour ordinaire. Seul le finaliseur détenteur du jeton peut insérer la parole réservée.
create or replace function public.verrouiller_entree_journal_jour()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  jour_ecriture date;
  registre public.ouverture_jour_anam%rowtype;
  jeton_finalisation text;
  est_finaliseur boolean;
begin
  jour_ecriture := (statement_timestamp() at time zone 'Europe/Paris')::date;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.utilisatrice_id::text || ':' || jour_ecriture::text, 0)
  );

  select * into registre
    from public.ouverture_jour_anam oj
   where oj.utilisatrice_id = new.utilisatrice_id and oj.jour = jour_ecriture;

  if found and registre.nature = 'preparation' then
    jeton_finalisation := current_setting('anima.ouverture_jeton', true);
    -- Sans GUC, la dernière comparaison vaut NULL. Un booléen tri-valué ferait alors aussi valoir
    -- `not est_finaliseur` à NULL et laisserait passer l'INSERT qu'il devait refuser.
    est_finaliseur := coalesce(
      new.role = 'anam'
        and new.cle_tour = 'ouverture-jour:' || jour_ecriture::text
        and jeton_finalisation = registre.jeton_preparation::text,
      false
    );
    -- `statement_timestamp()` est figé AVANT une éventuelle attente sur le verrou. L'expiration,
    -- elle, se décide à l'instant où le verrou est enfin détenu : sinon un bail mort paraît vivant.
    if registre.preparee_jusqu_a > clock_timestamp() and not est_finaliseur then
      raise exception using
        errcode = '55P03',
        message = 'ouverture_quotidienne_en_preparation';
    elsif registre.preparee_jusqu_a <= clock_timestamp() then
      if est_finaliseur then
        raise exception using errcode = '55P03', message = 'ouverture_quotidienne_bail_expire';
      end if;
      -- Le premier tour ordinaire après expiration gagne atomiquement la journée. Si son INSERT
      -- échoue ensuite, cette mise à jour est annulée avec lui par la transaction du trigger.
      update public.ouverture_jour_anam
         set nature = 'fil_existant', jeton_preparation = null, preparee_jusqu_a = null,
             entree_journal_id = null, evenement_public = null
       where utilisatrice_id = new.utilisatrice_id and jour = jour_ecriture;
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.verrouiller_entree_journal_jour()
  from public, anon, authenticated;

create trigger entree_journal_verrou_jour
  before insert on public.entree_journal
  for each row execute function public.verrouiller_entree_journal_jour();

create function public.commencer_ouverture_quotidienne_anam(
  cible uuid,
  p_jour date
) returns table (
  statut text,
  jeton uuid,
  entree_id uuid,
  entree_contenu text,
  entree_creee_le timestamptz,
  evenement_public jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  registre public.ouverture_jour_anam%rowtype;
  registre_present boolean;
  ancienne public.entree_journal%rowtype;
  nouveau_jeton uuid;
begin
  if p_jour is distinct from (statement_timestamp() at time zone 'Europe/Paris')::date then
    raise exception 'commencer_ouverture_quotidienne_anam : jour invalide';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(cible::text || ':' || p_jour::text, 0)
  );
  if not public.compte_autorise_ouverture_anam(cible) then
    raise exception 'commencer_ouverture_quotidienne_anam : compte non autorise';
  end if;

  delete from public.ouverture_jour_anam oj
   where oj.utilisatrice_id = cible and oj.jour < p_jour;

  select * into registre
    from public.ouverture_jour_anam oj
   where oj.utilisatrice_id = cible and oj.jour = p_jour;
  registre_present := found;

  if registre_present and registre.nature = 'ouverte' then
    select * into ancienne from public.entree_journal ej where ej.id = registre.entree_journal_id;
    if found then
      return query select 'deja_commencee'::text, null::uuid,
        ancienne.id, ancienne.contenu, ancienne.cree_le, registre.evenement_public;
    else
      return query select 'deja_commencee'::text, null::uuid,
        null::uuid, null::text, null::timestamptz, null::jsonb;
    end if;
    return;
  end if;
  if registre_present and registre.nature = 'fil_existant' then
    return query select 'deja_commencee'::text, null::uuid,
      null::uuid, null::text, null::timestamptz, null::jsonb;
    return;
  end if;
  if registre_present and registre.preparee_jusqu_a > clock_timestamp() then
    return query select 'en_cours'::text, null::uuid,
      null::uuid, null::text, null::timestamptz, null::jsonb;
    return;
  end if;

  -- Même après expiration, on ne reprend JAMAIS le bail sans recontrôler le journal sous le verrou.
  -- Un tour ordinaire arrivé après l'expiration gagne alors la journée et interdit une salutation tardive.
  select * into ancienne
    from public.entree_journal ej
   where ej.utilisatrice_id = cible
     and ej.cle_tour = 'ouverture-jour:' || p_jour::text
     and ej.role = 'anam'
   limit 1;
  if found then
    if registre_present then
      update public.ouverture_jour_anam
         set nature = 'ouverte', jeton_preparation = null, preparee_jusqu_a = null,
             entree_journal_id = ancienne.id, evenement_public = null
       where utilisatrice_id = cible and jour = p_jour;
    else
      insert into public.ouverture_jour_anam (
        utilisatrice_id, jour, nature, entree_journal_id
      ) values (cible, p_jour, 'ouverte', ancienne.id);
    end if;
    return query select 'deja_commencee'::text, null::uuid,
      ancienne.id, ancienne.contenu, ancienne.cree_le, null::jsonb;
    return;
  end if;

  if exists (
    select 1 from public.entree_journal ej
     where ej.utilisatrice_id = cible
       and ej.cree_le >= (p_jour::timestamp at time zone 'Europe/Paris')
       and ej.cree_le < ((p_jour + 1)::timestamp at time zone 'Europe/Paris')
  ) then
    if registre_present then
      update public.ouverture_jour_anam
         set nature = 'fil_existant', jeton_preparation = null, preparee_jusqu_a = null,
             entree_journal_id = null, evenement_public = null
       where utilisatrice_id = cible and jour = p_jour;
    else
      insert into public.ouverture_jour_anam (utilisatrice_id, jour, nature)
      values (cible, p_jour, 'fil_existant');
    end if;
    return query select 'deja_commencee'::text, null::uuid,
      null::uuid, null::text, null::timestamptz, null::jsonb;
    return;
  end if;

  nouveau_jeton := gen_random_uuid();
  if registre_present then
    update public.ouverture_jour_anam
       set nature = 'preparation', jeton_preparation = nouveau_jeton,
           preparee_jusqu_a = clock_timestamp() + interval '15 seconds',
           entree_journal_id = null, evenement_public = null
     where utilisatrice_id = cible and jour = p_jour;
  else
    insert into public.ouverture_jour_anam (
      utilisatrice_id, jour, nature, jeton_preparation, preparee_jusqu_a
    ) values (
      cible, p_jour, 'preparation', nouveau_jeton,
      clock_timestamp() + interval '15 seconds'
    );
  end if;
  return query select 'a_preparer'::text, nouveau_jeton,
    null::uuid, null::text, null::timestamptz, null::jsonb;
end;
$$;

create function public.finaliser_ouverture_quotidienne_anam(
  cible uuid,
  p_jour date,
  p_jeton uuid,
  p_phrase_generique text,
  p_preparation jsonb
) returns table (
  entree_id uuid,
  entree_contenu text,
  entree_creee_le timestamptz,
  evenement_public jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  registre public.ouverture_jour_anam%rowtype;
  ligne public.entree_journal%rowtype;
  public_prepare jsonb;
  interne_prepare jsonb;
  type_public text;
  phrase_evenement text;
  reservation_ok boolean := true;
  ancien_sub text;
  contenu_final text;
  evenement_final jsonb;
  n_seances numeric;
  n_minutes numeric;
  n_apaisement numeric;
  n_fenetre numeric;
  n_seuil numeric;
  candidat_id uuid;
  branches_naissance integer;
  branche_cible uuid;
  premium_ok boolean;
begin
  if p_phrase_generique is null or btrim(p_phrase_generique) = ''
     or octet_length(p_phrase_generique) > 32768 then
    raise exception 'finaliser_ouverture_quotidienne_anam : phrase generique invalide';
  end if;
  if p_preparation is null or jsonb_typeof(p_preparation) <> 'object'
     or not (p_preparation ?& array['public', 'interne'])
     or exists (
       select 1 from jsonb_object_keys(p_preparation) as cles(cle)
        where cle not in ('public', 'interne')
     ) then
    raise exception 'finaliser_ouverture_quotidienne_anam : preparation invalide';
  end if;
  if p_jour is distinct from (statement_timestamp() at time zone 'Europe/Paris')::date then
    raise exception 'finaliser_ouverture_quotidienne_anam : jour invalide';
  end if;

  public_prepare := p_preparation -> 'public';
  interne_prepare := p_preparation -> 'interne';
  if public_prepare = 'null'::jsonb then
    if interne_prepare is distinct from 'null'::jsonb then
      raise exception 'finaliser_ouverture_quotidienne_anam : reservation sans evenement';
    end if;
  else
    if jsonb_typeof(public_prepare) <> 'object'
       or not (public_prepare ?& array['type', 'phrase'])
       or jsonb_typeof(public_prepare -> 'type') <> 'string'
       or jsonb_typeof(public_prepare -> 'phrase') <> 'string' then
      raise exception 'finaliser_ouverture_quotidienne_anam : evenement public invalide';
    end if;
    type_public := public_prepare ->> 'type';
    phrase_evenement := public_prepare ->> 'phrase';
    if btrim(phrase_evenement) = '' or octet_length(phrase_evenement) > 32768 then
      raise exception 'finaliser_ouverture_quotidienne_anam : phrase evenement invalide';
    end if;

    if type_public in ('pause', 'socle-complete') then
      if exists (
        select 1 from jsonb_object_keys(public_prepare) as cles(cle)
         where cle not in ('type', 'phrase')
      ) then
        raise exception 'finaliser_ouverture_quotidienne_anam : champs evenement interdits';
      end if;
    elsif type_public = 'invitation' then
      if not (public_prepare ? 'brancheCibleId')
         or jsonb_typeof(public_prepare -> 'brancheCibleId') <> 'string'
         or (public_prepare ->> 'brancheCibleId') !~
              '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
         or exists (
           select 1 from jsonb_object_keys(public_prepare) as cles(cle)
            where cle not in ('type', 'phrase', 'brancheCibleId')
         ) then
        raise exception 'finaliser_ouverture_quotidienne_anam : invitation invalide';
      end if;
    elsif type_public = 'proposition' then
      if not (public_prepare ? 'signalId')
         or jsonb_typeof(public_prepare -> 'signalId') <> 'string'
         or (public_prepare ->> 'signalId') !~
              '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
         or exists (
           select 1 from jsonb_object_keys(public_prepare) as cles(cle)
            where cle not in ('type', 'phrase', 'signalId')
         ) then
        raise exception 'finaliser_ouverture_quotidienne_anam : proposition invalide';
      end if;
    elsif type_public = 'hypothese-enneagramme' then
      if not (public_prepare ? 'hypotheseId')
         or jsonb_typeof(public_prepare -> 'hypotheseId') <> 'string'
         or (public_prepare ->> 'hypotheseId') !~
              '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
         or exists (
           select 1 from jsonb_object_keys(public_prepare) as cles(cle)
            where cle not in ('type', 'phrase', 'hypotheseId')
         ) then
        raise exception 'finaliser_ouverture_quotidienne_anam : hypothese invalide';
      end if;
    else
      raise exception 'finaliser_ouverture_quotidienne_anam : type evenement interdit';
    end if;

    if type_public = 'pause' then
      if jsonb_typeof(interne_prepare) <> 'object'
         or not (interne_prepare ?& array['type', 'seances', 'minutes', 'apaisementJours'])
         or exists (
           select 1 from jsonb_object_keys(interne_prepare) as cles(cle)
            where cle not in ('type', 'seances', 'minutes', 'apaisementJours')
         )
         or jsonb_typeof(interne_prepare -> 'type') <> 'string'
         or interne_prepare ->> 'type' <> 'pause'
         or jsonb_typeof(interne_prepare -> 'seances') <> 'number'
         or jsonb_typeof(interne_prepare -> 'minutes') <> 'number'
         or jsonb_typeof(interne_prepare -> 'apaisementJours') <> 'number' then
        raise exception 'finaliser_ouverture_quotidienne_anam : reservation pause invalide';
      end if;
      n_seances := (interne_prepare ->> 'seances')::numeric;
      n_minutes := (interne_prepare ->> 'minutes')::numeric;
      n_apaisement := (interne_prepare ->> 'apaisementJours')::numeric;
      if n_seances <> trunc(n_seances) or n_seances < 0 or n_seances > 2147483647
         or n_minutes <> trunc(n_minutes) or n_minutes < 0 or n_minutes > 20160
         or n_apaisement <> trunc(n_apaisement) or n_apaisement <= 0
         or n_apaisement > 2147483647 then
        raise exception 'finaliser_ouverture_quotidienne_anam : valeurs pause invalides';
      end if;
    elsif type_public = 'invitation' then
      if jsonb_typeof(interne_prepare) <> 'object'
         or not (interne_prepare ?& array['type', 'fenetreHeures', 'seuilBranches'])
         or exists (
           select 1 from jsonb_object_keys(interne_prepare) as cles(cle)
            where cle not in ('type', 'fenetreHeures', 'seuilBranches')
         )
         or jsonb_typeof(interne_prepare -> 'type') <> 'string'
         or interne_prepare ->> 'type' <> 'invitation'
         or jsonb_typeof(interne_prepare -> 'fenetreHeures') <> 'number'
         or jsonb_typeof(interne_prepare -> 'seuilBranches') <> 'number' then
        raise exception 'finaliser_ouverture_quotidienne_anam : reservation invitation invalide';
      end if;
      n_fenetre := (interne_prepare ->> 'fenetreHeures')::numeric;
      n_seuil := (interne_prepare ->> 'seuilBranches')::numeric;
      if n_fenetre <> trunc(n_fenetre) or n_fenetre <= 0 or n_fenetre > 2147483647
         or n_seuil <> trunc(n_seuil) or n_seuil <= 0 or n_seuil > 2147483647 then
        raise exception 'finaliser_ouverture_quotidienne_anam : fenetre invitation invalide';
      end if;
    elsif interne_prepare is distinct from 'null'::jsonb then
      raise exception 'finaliser_ouverture_quotidienne_anam : reservation interdite';
    end if;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(cible::text || ':' || p_jour::text, 0)
  );
  -- Ordre global : verrou du jour → verrou de l'effet → lignes de consentement. Le marquage du socle
  -- utilise déjà 4911 avant de mettre à jour `utilisatrice`; prendre la ligne d'abord puis 4911 créerait
  -- un cycle d'attente. Les RPC imbriquées reprendront le même verrou transactionnel sans bloquer.
  if public_prepare is distinct from 'null'::jsonb and type_public = 'pause' then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(cible::text, 4911));
  elsif public_prepare is distinct from 'null'::jsonb and type_public = 'invitation' then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(cible::text, 4910));
  end if;
  -- Ce verrou de lignes précède obligatoirement réservation ET INSERT.
  if not public.compte_autorise_ouverture_anam(cible) then
    raise exception 'finaliser_ouverture_quotidienne_anam : compte non autorise';
  end if;

  select * into registre
    from public.ouverture_jour_anam oj
   where oj.utilisatrice_id = cible and oj.jour = p_jour;
  if not found
     or registre.nature <> 'preparation'
     or registre.jeton_preparation is distinct from p_jeton
     or registre.preparee_jusqu_a <= clock_timestamp() then
    raise exception 'finaliser_ouverture_quotidienne_anam : bail invalide';
  end if;

  -- Compatibilité avec une ligne antérieure à cette outbox : elle est adoptée sans dépenser un
  -- événement candidat. Sous cette migration, le trigger interdit qu'une telle ligne apparaisse
  -- pendant le bail ; ce chemin ne couvre donc qu'un état déjà présent.
  select * into ligne
    from public.entree_journal ej
   where ej.utilisatrice_id = cible
     and ej.cle_tour = 'ouverture-jour:' || p_jour::text
     and ej.role = 'anam'
   limit 1;
  if found then
    update public.ouverture_jour_anam
       set nature = 'ouverte', jeton_preparation = null, preparee_jusqu_a = null,
           entree_journal_id = ligne.id, evenement_public = null
     where utilisatrice_id = cible and jour = p_jour;
    return query select ligne.id, ligne.contenu, ligne.cree_le, null::jsonb;
    return;
  end if;

  -- Ce test est redondant avec commencer + trigger, mais il est volontairement placé AVANT toute
  -- réservation : même un état ancien ou importé ne peut dépenser une parole après un tour ordinaire.
  if exists (
    select 1 from public.entree_journal ej
     where ej.utilisatrice_id = cible
       and ej.cree_le >= (p_jour::timestamp at time zone 'Europe/Paris')
       and ej.cree_le < ((p_jour + 1)::timestamp at time zone 'Europe/Paris')
  ) then
    raise exception 'finaliser_ouverture_quotidienne_anam : fil deja commence';
  end if;

  contenu_final := p_phrase_generique;
  evenement_final := null;
  if public_prepare is distinct from 'null'::jsonb then
    -- La sélection TypeScript a eu lieu sous le bail, mais avant cette transaction. On réaffirme ici
    -- la source métier de CHAQUE événement et on verrouille son support jusqu'à l'INSERT : un autre
    -- onglet ne peut pas consommer un signal, une hypothèse ou déplacer la branche cible entre la
    -- lecture et la parole. Le doute retombe sur la salutation générique, jamais sur un geste périmé.
    ancien_sub := current_setting('request.jwt.claim.sub', true);
    perform set_config('request.jwt.claim.sub', cible::text, true);
    begin
      reservation_ok := false;
      if type_public = 'pause' then
        select public.reserver_pause_rythme(
          n_seances::integer, n_minutes::integer, n_apaisement::integer
        ) into reservation_ok;

      elsif type_public = 'socle-complete' then
        -- `compte_autorise_ouverture_anam` tient déjà la ligne utilisatrice en SHARE : le marquage
        -- client concurrent attendra la fin de cette transaction et ne peut pas invalider ce oui.
        select public.annonce_socle_due() into reservation_ok;

      elsif type_public = 'hypothese-enneagramme' then
        candidat_id := null;
        select h.id into candidat_id
          from public.enneagramme_hypothese h
         where h.id = (public_prepare ->> 'hypotheseId')::uuid
           and h.utilisatrice_id = cible
           and h.statut = 'en_attente'
           and h.dite_le is null
           and h.id = (
             select due.id from public.charger_hypothese_a_dire() due limit 1
           )
         for share of h;
        reservation_ok := candidat_id is not null;

      elsif type_public in ('proposition', 'invitation') then
        candidat_id := null;
        select s.id into candidat_id
          from public.signal_reconceptualisation s
         where s.id = (
             select due.signal_id from public.charger_proposition_branche() due limit 1
           )
           and s.utilisatrice_id = cible
           and s.statut = 'en_attente'
           and (
             type_public = 'invitation'
             or s.id = (public_prepare ->> 'signalId')::uuid
           )
         for share of s;

        premium_ok := false;
        perform 1 from public.abonnement a
         where a.utilisatrice_id = cible and a.etat = 'actif'
         for share of a;
        premium_ok := found;
        reservation_ok := candidat_id is not null and premium_ok;

        if reservation_ok and type_public = 'invitation' then
          -- Verrouiller toutes les branches actuellement ouvertes empêche leur état et la cible la
          -- plus ancienne de glisser après le contrôle. Une insertion concurrente ne peut qu'ajouter
          -- une branche : elle ne rend pas l'invitation moins due.
          perform 1 from public.branche b
           where b.utilisatrice_id = cible and b.etat = 'naissance'
           for share of b;
          select count(*)::integer,
                 (select b2.id from public.branche b2
                   where b2.utilisatrice_id = cible and b2.etat = 'naissance'
                   order by b2.date_naissance asc, b2.id asc limit 1)
            into branches_naissance, branche_cible
            from public.branche b
           where b.utilisatrice_id = cible and b.etat = 'naissance';
          reservation_ok := branches_naissance >= n_seuil::integer
            and branche_cible is not distinct from (public_prepare ->> 'brancheCibleId')::uuid;
          if reservation_ok then
            select public.reserver_invitation_integration(n_fenetre::integer)
              into reservation_ok;
          end if;
        end if;
      end if;
    exception when others then
      reservation_ok := false;
      raise warning 'revalidation ouverture refusee (SQLSTATE %)', sqlstate;
    end;
    perform set_config('request.jwt.claim.sub', coalesce(ancien_sub, ''), true);
    if reservation_ok then
      contenu_final := phrase_evenement;
      evenement_final := public_prepare;
    end if;
  end if;

  -- Le trigger n'accepte cette insertion précise qu'avec le jeton du bail dans le contexte local.
  perform set_config('anima.ouverture_jeton', p_jeton::text, true);
  insert into public.entree_journal (utilisatrice_id, cle_tour, role, contenu)
  values (cible, 'ouverture-jour:' || p_jour::text, 'anam', contenu_final)
  returning * into ligne;
  perform set_config('anima.ouverture_jeton', '', true);

  update public.ouverture_jour_anam
     set nature = 'ouverte', jeton_preparation = null, preparee_jusqu_a = null,
         entree_journal_id = ligne.id, evenement_public = evenement_final
   where utilisatrice_id = cible and jour = p_jour;

  return query select ligne.id, ligne.contenu, ligne.cree_le, evenement_final;
end;
$$;

revoke all on function public.commencer_ouverture_quotidienne_anam(uuid, date)
  from public, anon, authenticated;
grant execute on function public.commencer_ouverture_quotidienne_anam(uuid, date)
  to service_role;
revoke all on function public.finaliser_ouverture_quotidienne_anam(uuid, date, uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.finaliser_ouverture_quotidienne_anam(uuid, date, uuid, text, jsonb)
  to service_role;

comment on function public.commencer_ouverture_quotidienne_anam(uuid, date) is
  'Attribue sous verrou un bail court après relecture du journal, ou restitue la ligne et son événement public. Service-role only.';
comment on function public.finaliser_ouverture_quotidienne_anam(uuid, date, uuid, text, jsonb) is
  'Outbox atomique : valide la préparation, réserve pause/invitation via leurs RPC de référence, insère une parole et persiste sa métadonnée publique. Service-role only.';

-- Pont expand/app : les anciennes instances 0082 peuvent rester servies pendant que le nouveau
-- code commence à utiliser l'outbox. La signature historique délègue aux deux nouvelles phases et
-- conserve sa sémantique (`true` seulement quand CET appel grave la ligne). Elle sera retirée dans
-- une migration contract ultérieure, après disparition vérifiée des anciens déploiements.
create function public.consigner_ouverture_quotidienne_anam(
  cible uuid,
  p_jour date,
  p_contenu text
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  droit record;
  ligne record;
begin
  if p_contenu is null or btrim(p_contenu) = '' then
    return false;
  end if;

  select * into droit
    from public.commencer_ouverture_quotidienne_anam(cible, p_jour);
  if droit.statut is distinct from 'a_preparer' or droit.jeton is null then
    return false;
  end if;

  select * into ligne
    from public.finaliser_ouverture_quotidienne_anam(
      cible,
      p_jour,
      droit.jeton,
      p_contenu,
      jsonb_build_object('public', null, 'interne', null)
    );
  return ligne.entree_id is not null;
end;
$$;

revoke all on function public.consigner_ouverture_quotidienne_anam(uuid, date, text)
  from public, anon, authenticated;
grant execute on function public.consigner_ouverture_quotidienne_anam(uuid, date, text)
  to service_role;

comment on function public.consigner_ouverture_quotidienne_anam(uuid, date, text) is
  'Pont de compatibilité 0082 vers l''outbox 0084, service-role only. À retirer après extinction des anciens déploiements.';
