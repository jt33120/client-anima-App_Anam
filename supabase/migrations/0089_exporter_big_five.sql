-- Le Big Five (0088) écrit deux tables rattachées à une personne : le résultat retenu et la passe
-- en cours. Elles doivent donc suivre le droit d'accès (art. 15), comme leurs jumelles de
-- l'ennéagramme — et `tests/export-inventaire.test.ts` l'exige, en comparant les sections servies
-- par cette fonction aux tables déclarées « inclus » dans l'inventaire.
--
-- Ce corps repart intégralement de la dernière définition, 0086. Aucun retrait de colonne n'est
-- ajouté : ni les positions ni les réponses ne sont des capacités, ce sont les données elles-mêmes.

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
      jsonb_build_object('table', 'abonnement_poussee', 'colonnes', jsonb_build_array('cle_p256dh', 'cle_auth'),
                         'motif', 'clés de poussée : une capacité sur ton appareil, pas une donnée sur toi'),
      jsonb_build_object('table', 'preference_courriel', 'colonnes', jsonb_build_array('jeton'),
                         'motif', 'jeton de désabonnement : quiconque le lit peut te désabonner sans être toi'),
      jsonb_build_object('table', 'reservation_quota_ia', 'colonnes', jsonb_build_array('cle_idempotence'),
                         'motif', 'clé de rejeu technique : elle permet de réutiliser une admission, sans rien dire sur toi'),
      jsonb_build_object('table', 'ouverture_jour_anam', 'colonnes', jsonb_build_array('jeton_preparation'),
                         'motif', 'jeton de bail technique : il autorise sa finalisation, sans rien dire sur toi')
    ),

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
      from public.abonnement_poussee t where t.utilisatrice_id = v_uid)
  ) into v_doc;

  insert into public.audit_securite (utilisatrice_id, type, decision)
  values (v_uid, 'export_donnees', 'servi');

  return v_doc;
end;
$fn$;

revoke all on function public.exporter_mes_donnees() from public, anon;
grant execute on function public.exporter_mes_donnees() to authenticated;
