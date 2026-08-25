-- ══════════════════════════════════════════════════════════════════════════════════════════════
-- 0080 — LES DEUX PORTES DE LA CARTE : la charger, l'écrire, et rien d'autre
-- ══════════════════════════════════════════════════════════════════════════════════════════════
--
-- La 0079 a posé la table et l'a fermée à tout le monde : RLS forcée, aucune policy, aucun grant à
-- `authenticated` ni à `anon`. Elle est donc, en l'état, inatteignable — ce qui était le but, et ce
-- qui la rend inutilisable tant que le serveur n'a pas de porte nommée pour y entrer.
--
-- ⚠️ POURQUOI DEUX RPC PLUTÔT QU'UN ACCÈS TABLE SOUS `service_role`. `service_role` contourne la RLS
-- par conception : `admin.from('carte_contexte')` marcherait. C'est précisément ce qu'on refuse. Le
-- patron du dépôt depuis la 0012 (`charger_seance` / `ecrire_seance`) est une SURFACE NOMMÉE : deux
-- fonctions, deux signatures, deux grants, que la revue peut compter. Un accès table ouvre les sept
-- verbes DML d'un coup et ne laisse aucune trace de ce qu'on avait l'intention d'autoriser.
--
-- ⚠️ ET SURTOUT : `authenticated` N'A EXECUTE SUR AUCUNE DES DEUX. C'est ce qui fait tenir la
-- décision produit du 2026-08-25 — « la carte ne se montre nulle part » — MÊME CONTRE UNE REQUÊTE
-- FORGÉE. Une RPC `security definer` accordée à `authenticated`, si commode soit-elle, rendrait la
-- carte lisible par quiconque possède une session et sait taper une URL. Ce ne serait plus
-- « invisible dans le produit », ce serait « invisible dans l'interface ».
--
-- L'export (0057/0079), lui, ne passe par aucune de ces deux portes : il lit la table directement,
-- sous son propre `security definer`, borné par `auth.uid()`. C'est la voie de l'art. 15 et elle
-- reste séparée — un droit légal n'emprunte pas le tuyau du produit.

-- ── Lecture : charge la carte courante (service_role — le tour de conversation la préfixe) ──────
--
-- `setof` et non un composite scalaire, pour la raison écrite en 0012 : sur zéro ligne, un
-- `returns public.carte_contexte` rendrait un composite TOUT-À-NULL au lieu de rien, et le dépôt
-- lirait « une carte existe, tous ses champs sont vides » là où la vérité est « aucune carte ». La
-- distinction décide du compactage : la première est un état, la seconde est un premier passage.
create or replace function public.charger_carte_contexte(cible uuid)
returns setof public.carte_contexte
language sql
stable
security definer
set search_path = ''
as $$
  select c.* from public.carte_contexte c where c.utilisatrice_id = cible;
$$;

revoke all on function public.charger_carte_contexte(uuid) from public, anon, authenticated;
grant execute on function public.charger_carte_contexte(uuid) to service_role;

comment on function public.charger_carte_contexte(uuid) is
  'Charge la carte de contexte (0079) pour le préfixe système d''un tour. service_role SEUL : '
  'accordée à `authenticated`, elle rendrait lisible par requête forgée ce que le produit ne montre '
  'nulle part. L''export art. 15 lit la table par sa propre voie (0057).';


-- ── Écriture : l'upsert du compactage (service_role — jamais la cliente) ────────────────────────
--
-- ⚠️ `p_compacte_jusqu_a` NE RECULE JAMAIS. C'est ce qui rend le compactage idempotent : deux tours
-- concurrents qui compactent la même tranche écrivent la même borne, et un rejeu tardif — un
-- `after()` lent, une réémission — ne peut pas ramener la borne en arrière et faire recompacter du
-- verbatim déjà résumé. La garde est ICI et non dans le code appelant, parce que c'est le seul
-- endroit que deux exécutions simultanées traversent toutes les deux.
--
-- Les cinq champs, eux, sont écrits tels quels : c'est `analyserCompactage` (TypeScript) qui a déjà
-- refusé ce qui ne se lisait pas, et ce sont les deux CONTRAINTES DE TABLE de la 0079 — aucun
-- chiffre, deux cent quarante caractères — qui tranchent en dernier ressort. Une consigne au modèle
-- peut être contournée par le modèle ; une contrainte de table, non.
create or replace function public.ecrire_carte_contexte(
  cible                uuid,
  p_presentant         text,
  p_precipitant        text,
  p_predisposant       text,
  p_perpetuant         text,
  p_protecteur         text,
  p_compacte_jusqu_a   timestamptz
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
begin
  if cible is null then
    raise exception 'carte_sans_identite' using errcode = '42501';
  end if;

  insert into public.carte_contexte as c (
    utilisatrice_id, presentant, precipitant, predisposant, perpetuant, protecteur,
    compacte_jusqu_a, maj_le
  )
  values (
    cible, p_presentant, p_precipitant, p_predisposant, p_perpetuant, p_protecteur,
    p_compacte_jusqu_a, now()
  )
  on conflict (utilisatrice_id) do update set
    presentant       = excluded.presentant,
    precipitant      = excluded.precipitant,
    predisposant     = excluded.predisposant,
    perpetuant       = excluded.perpetuant,
    protecteur       = excluded.protecteur,
    -- La borne AVANCE ou reste. `greatest` ignore les `null` : une borne absente d'un côté ne
    -- ramène pas l'autre à zéro.
    compacte_jusqu_a = greatest(c.compacte_jusqu_a, excluded.compacte_jusqu_a),
    maj_le           = now();
end;
$fn$;

revoke all on function public.ecrire_carte_contexte(uuid, text, text, text, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.ecrire_carte_contexte(uuid, text, text, text, text, text, timestamptz)
  to service_role;

comment on function public.ecrire_carte_contexte(uuid, text, text, text, text, text, timestamptz) is
  'Upsert de la carte de contexte par le compactage (service_role SEUL). La borne `compacte_jusqu_a` '
  'ne recule jamais (`greatest`) : le compactage reste idempotent sous rejeu et sous concurrence.';
