-- L'ouverture quotidienne est une parole d'Anam sans tour utilisatrice préalable. Elle ne peut donc
-- pas emprunter `consigner_tour_anam` (0068), dont la garde exige justement l'autre côté du tour.
-- Cette RPC spécialisée reste service_role-only : une session JWT ne peut jamais forger une parole
-- d'Anam dans le journal immuable. La clé porte le jour civil parisien et l'index de 0016 rend les
-- rechargements et requêtes concurrentes idempotents.

create or replace function public.consigner_ouverture_quotidienne_anam(
  cible uuid,
  p_jour date,
  p_contenu text
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserees integer := 0;
begin
  if p_contenu is null or btrim(p_contenu) = '' then
    return false;
  end if;

  -- Le jour vient de la même horloge que l'écriture. Une date arbitraire permettrait de remplir
  -- l'historique d'ouvertures passées ou futures ; ce chemin n'écrit que celle d'aujourd'hui.
  if p_jour is distinct from (statement_timestamp() at time zone 'Europe/Paris')::date then
    raise exception 'consigner_ouverture_quotidienne_anam : jour invalide';
  end if;

  -- La RPC traverse la RLS par nécessité (côté Anam), donc elle réaffirme le write-gate de 0016
  -- au point d'écriture : consentement art. 9 vivant et aucune barrière de minorité.
  if not exists (
    select 1
      from public.utilisatrice u
      join public.consentement c on c.utilisatrice_id = u.id
     where u.id = cible
       and u.barriere_minorite_le is null
       and c.art9_accorde = true
       and c.ia_reconnue = true
       and c.revoked_at is null
  ) then
    raise exception 'consigner_ouverture_quotidienne_anam : compte non autorise';
  end if;

  insert into public.entree_journal (utilisatrice_id, cle_tour, role, contenu)
  values (cible, 'ouverture-jour:' || p_jour::text, 'anam', p_contenu)
  on conflict (utilisatrice_id, cle_tour, role) do nothing;

  get diagnostics v_inserees = row_count;
  return v_inserees = 1;
end;
$$;

revoke all on function public.consigner_ouverture_quotidienne_anam(uuid, date, text)
  from public, anon, authenticated;
grant execute on function public.consigner_ouverture_quotidienne_anam(uuid, date, text)
  to service_role;

comment on function public.consigner_ouverture_quotidienne_anam(uuid, date, text) is
  'Grave au plus une première parole d''Anam par jour civil Europe/Paris. Service-role only, write-gate art. 9 et minorité réaffirmés, idempotence par la clé ouverture-jour:YYYY-MM-DD.';
