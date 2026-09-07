-- ══════════════════════════════════════════════════════════════════════════════════════════════
-- 0095 — LE TEXTE DU JOUR PERSONNEL ENTRE DANS L'EXPORT (art. 15)
-- ══════════════════════════════════════════════════════════════════════════════════════════════
--
-- 0094 crée une table qui porte un contenu écrit SUR elle : trois paragraphes qui nomment son socle
-- de naissance, une branche de son arbre et ce qui a été retenu d'elle. Sa sœur partagée
-- (`texte_du_jour_stable`) est exclue de l'export parce qu'elle ne porte aucune identité ; celle-ci
-- en porte une, et le motif d'exclusion ne s'y transpose pas.
--
-- ⚠️ CE CORPS REPART INTÉGRALEMENT DE 0093 ET N'AJOUTE QUE CETTE SECTION. C'est le patron du dépôt
-- pour cette fonction depuis 0086 : `create or replace` remplace le corps ENTIER, et n'en réécrire
-- qu'un morceau reviendrait à supprimer en silence les vingt-neuf autres. Toute divergence entre les
-- deux fichiers est un défaut, pas une variante — `tests/export-inventaire.test.ts` compte les
-- sections et les compare à l'inventaire.

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
