-- ══════════════════════════════════════════════════════════════════════════════════════════════
-- 0079 — LA CARTE DE CONTEXTE : ce qu'Anam comprend, et qui ne se montre nulle part
-- ══════════════════════════════════════════════════════════════════════════════════════════════
--
-- ── LE BESOIN ──────────────────────────────────────────────────────────────────────────────────
--
-- « Anam est juste un wrapper de LLM. Je veux une architecture de contexte, une architecture de
-- mémoire et de compacting intelligente pour garder ce qui est important et enlever le bruit. »
--
-- L'arc de séance (2.7) COMPTE : trois sujets abordés, deux reformulations, une confirmation. Il ne
-- sait rien de CE QUI a été dit. Et les faits retenus (4.2) forment une liste plate qui grossit sans
-- jamais se structurer — jusqu'à ce que la relire coûte plus qu'elle n'apprend.
--
-- Cette table est la couche qui comprend : ce qu'elle amène, ce qui l'a déclenchée, ce qui
-- l'entretient, ce qui tient déjà. C'est le modèle « 5P » employé comme carte de contexte.
--
-- ── CE QUE CETTE TABLE N'EST PAS ───────────────────────────────────────────────────────────────
--
-- ⚠️ CE N'EST PAS UN DIAGNOSTIC, et la distinction décide de tout le reste. Une formulation décrit
-- des MÉCANISMES et des APPUIS, un par ligne, réfutables. Elle ne classe personne, elle n'explique
-- pas qui elle est, elle ne prédit rien (FR-023).
--
-- ── QUI PEUT LA LIRE : PERSONNE, SAUF LE SYSTÈME ───────────────────────────────────────────────
--
-- Décision produit du 2026-08-25 : la carte ne se montre NULLE PART dans l'application. Aucun écran,
-- et Anam ne la récite pas. Montrer une formulation la transforme en verdict.
--
-- `authenticated` détient les sept privilèges DML sur toutes les tables de ce schéma : une garde
-- écrite dans une route ou dans le corps d'une RPC ne garderait rien. La table est donc en RLS
-- FORCÉE **sans aucune policy** — ce qui, en Postgres, vaut deny-all pour TOUT LE MONDE, le
-- propriétaire de la table compris : c'est précisément ce que `force` ajoute à `enable`. Seuls les
-- rôles `bypassrls` la traversent, et `service_role` en est un. Le patron est celui de
-- `pause_rythme` et d'`invitation_integration` — zéro policy, écriture sous `service_role` seul.
-- (Et non celui d'`abonnement`, qui porte une policy de LECTURE propriétaire : elle, on la voit.)
--
-- ⚠️ ELLE RESTE DANS L'EXPORT DE DONNÉES, ET CE N'EST PAS UNE CONTRADICTION. Le droit d'accès
-- (RGPD art. 15) porte sur TOUTE donnée personnelle, et une carte tenue sur quelqu'un en est une.
-- L'export est une voie légale, pas une surface produit : il passe par `service_role` (0057), donc
-- il traverse cette table sans qu'aucune policy n'ait à s'ouvrir. « Invisible dans le produit » et
-- « accessible sur demande » tiennent ensemble.
--
-- ── LES GARDES VIVENT ICI, PAS DANS LE CODE ────────────────────────────────────────────────────
--
-- FR-031 (« aucun compte n'est jamais affiché ») est tenu par une CONTRAINTE, pas par une consigne
-- au modèle ni par un filtre en TypeScript. Un modèle à qui l'on demande de résumer écrit « trois
-- fois cette semaine » spontanément ; le filtre applicatif existe aussi (`analyserCompactage`), mais
-- c'est celui-ci qui décide, parce que c'est le seul que personne ne peut contourner.

create table public.carte_contexte (
  -- ⚠️ ELLE PEND À `public.utilisatrice`, PAS À `auth.users`, ET LA CI A DÛ ME L'APPRENDRE. Dans sa
  -- première version, cette table était la SEULE des trente et une à s'accrocher directement à
  -- l'identité d'auth ; les trente autres pendent à `public.utilisatrice`. Les deux moteurs
  -- d'effacement (0058, 0061) retirent `branche`, puis `utilisatrice`, puis `auth.users`, et le
  -- commentaire de 0058 dit ce qu'ils tiennent pour vrai : « `utilisatrice` emporte les autres
  -- tables ». Une table accrochée ailleurs ne part plus par CETTE cascade mais par la dernière ligne
  -- du moteur : elle survivrait à tout effacement qui ne toucherait pas l'auth, et rien ne le dirait.
  -- Une garde de corpus compte désormais les ancrages (`tests/effacement-schema.test.ts`).
  utilisatrice_id uuid primary key references public.utilisatrice(id) on delete cascade,

  -- Les cinq champs. Tous nullables : une carte vide est l'état normal d'un premier passage, et
  -- `null` s'y lit « on ne sait pas » — jamais « il n'y a rien ».
  presentant   text,
  precipitant  text,
  predisposant text,
  perpetuant   text,
  protecteur   text,

  -- ⚠️ JUSQU'OÙ LE VERBATIM A DÉJÀ ÉTÉ COMPACTÉ. C'est ce qui rend le compactage idempotent et
  -- incrémental : on ne recompacte jamais ce qui l'a déjà été, et deux tours concurrents ne
  -- fabriquent pas deux cartes divergentes. `null` = rien n'a jamais été compacté.
  compacte_jusqu_a timestamptz,

  maj_le timestamptz not null default now()
);

comment on table public.carte_contexte is
  'Carte de contexte (5P) — ce qu''Anam a compris. JAMAIS montrée dans le produit (aucun écran, jamais récitée). Incluse à l''export (RGPD art. 15). Écrite par le compactage sous service_role uniquement.';

comment on column public.carte_contexte.precipitant is
  'LE DÉCLENCHEUR : ce qui s''est passé juste avant, et qui explique le « pourquoi maintenant ». Le champ le plus utile de la carte.';
comment on column public.carte_contexte.perpetuant is
  'Ce qui ENTRETIENT la chose aujourd''hui. Jamais une cause, jamais un trait de caractère.';
comment on column public.carte_contexte.compacte_jusqu_a is
  'Borne haute du verbatim déjà compacté. Rend le compactage incrémental et idempotent.';

-- ══════════════════════════════════════════════════════════════════════════════════════════════
-- LES CONTRAINTES — ce que la base refuse d'écrire, quoi qu'en dise le code
-- ══════════════════════════════════════════════════════════════════════════════════════════════
--
-- ⚠️ AUCUN CHIFFRE (FR-031, marqué DUR au PRD). « Trois fois cette semaine », « depuis deux mois »,
-- « la deuxième fois qu'elle en parle » : chacun est un compte, chacun ressort dans la bouche
-- d'Anam au tour suivant, et le produit ne compte jamais ce qu'une personne a ou n'a pas.
--
-- La contrainte porte sur les CHIFFRES et non sur les mots-nombres (« trois », « deux ») : on tient
-- ce qu'un contrôle peut tenir sans se mentir. Le reste vit dans la consigne, et c'est dit.
alter table public.carte_contexte
  add constraint carte_contexte_sans_chiffre check (
    coalesce(presentant, '')   !~ '[0-9]' and
    coalesce(precipitant, '')  !~ '[0-9]' and
    coalesce(predisposant, '') !~ '[0-9]' and
    coalesce(perpetuant, '')   !~ '[0-9]' and
    coalesce(protecteur, '')   !~ '[0-9]'
  );

-- ⚠️ LA LONGUEUR EST UNE GARDE DE COMPORTEMENT, PAS DE STOCKAGE. Au-delà de quelques lignes, un
-- modèle RÉCITE le contexte au lieu de s'en servir : il dit « je vois que tu as parlé de X, Y et Z »
-- et la conversation devient un inventaire. Le même constat a déjà borné `contexte-anam`.
-- La valeur DOIT rester alignée sur `CARTE_CHAMP_MAX` (lib/domain/carte-contexte.ts) — une garde
-- de parité le vérifie, comme pour les jetons de style.
alter table public.carte_contexte
  add constraint carte_contexte_champs_bornes check (
    coalesce(length(presentant), 0)   <= 240 and
    coalesce(length(precipitant), 0)  <= 240 and
    coalesce(length(predisposant), 0) <= 240 and
    coalesce(length(perpetuant), 0)   <= 240 and
    coalesce(length(protecteur), 0)   <= 240
  );

-- ══════════════════════════════════════════════════════════════════════════════════════════════
-- RLS — forcée, et AUCUNE policy : deny-all sauf le propriétaire de la table
-- ══════════════════════════════════════════════════════════════════════════════════════════════
--
-- ⚠️ `force` EN PLUS D'`enable`, ET CE N'EST PAS REDONDANT. Sans `force`, le propriétaire de la
-- table contourne la RLS ; avec, elle s'applique à lui aussi. C'est la doctrine AD-12 du dépôt
-- depuis la 0001, et c'est ce qui fait que « aucune policy » veut réellement dire « personne ».
alter table public.carte_contexte enable row level security;
alter table public.carte_contexte force row level security;

-- Aucun grant à `authenticated` ni à `anon` : ni lecture, ni écriture. Le compactage écrit sous
-- `service_role` (qui contourne la RLS par conception), l'export la lit sous `service_role` (0057).
revoke all on public.carte_contexte from authenticated, anon;


-- ══════════════════════════════════════════════════════════════════════════════════════════════
-- L'EXPORT SERT LA NOUVELLE SECTION (art. 15)
-- ══════════════════════════════════════════════════════════════════════════════════════════════
--
-- ⚠️ CE CORPS EST DÉRIVÉ DE LA 0057 PAR LECTURE DU FICHIER, PAS RETAPÉ. C'est la leçon écrite en
-- 0077 : « une fonction amendée plusieurs fois ne se réécrit JAMAIS de mémoire — on part de sa
-- dernière définition ». `exporter_mes_donnees` n'a qu'une seule définition (0057, vérifié), et
-- c'est elle qui a été relue et étendue d'UNE section. Rien d'autre n'a bougé.
--
-- La garde `tests/export-inventaire.test.ts` compare les sections servies par cette RPC aux tables
-- déclarées « inclus » : elle rougirait si l'une des deux avançait sans l'autre.

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
  -- ⚠️ ON LÈVE, ON NE REND PAS UN DOCUMENT VIDE. Sans identité, un `{}` serait servi comme fichier
  -- et se lirait « Anam n'a rien sur toi » — le mensonge exact que cette story existe pour éviter.
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
                         'motif', 'jeton de désabonnement : quiconque le lit peut te désabonner sans être toi')
    ),

    -- ── QUI ELLE EST ──────────────────────────────────────────────────────────────────────────
    'utilisatrice', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
                       from public.utilisatrice t where t.id = v_uid),
    'consentement', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                       from public.consentement t where t.utilisatrice_id = v_uid),

    -- ── LA MÉMOIRE, SES TROIS COUCHES (AD-8) ──────────────────────────────────────────────────
    -- `entree_journal` porte AUSSI les transcriptions conservées (NFR-003) : elles y sont déposées
    -- comme n'importe quel tour, donc elles sortent ici sans traitement particulier.
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

    -- ── LE SOCLE CALCULÉ ET LE TYPE ───────────────────────────────────────────────────────────
    'theme_natal', (select coalesce(jsonb_agg(to_jsonb(t) order by t.calcule_le), '[]'::jsonb)
                      from public.theme_natal t where t.utilisatrice_id = v_uid),
    'enneagramme', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                      from public.enneagramme t where t.utilisatrice_id = v_uid),
    'enneagramme_hypothese', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                                from public.enneagramme_hypothese t where t.utilisatrice_id = v_uid),
    'enneagramme_tentative', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                                from public.enneagramme_tentative t where t.utilisatrice_id = v_uid),

    -- ── CE QU'ANAM A COMPRIS (0079) ───────────────────────────────────────────────────────────
    -- ⚠️ INVISIBLE DANS LE PRODUIT, ET POURTANT SERVIE ICI. La carte ne s'affiche sur aucun écran
    -- et Anam ne la récite jamais (montrer une formulation la transforme en verdict, FR-023). Mais
    -- l'art. 15 porte sur TOUTE donnée personnelle : lui refuser l'accès à ce que le système a
    -- compris d'elle reviendrait à tenir un dossier secret. `carte_contexte` est en clé PRIMAIRE
    -- sur `utilisatrice_id` — d'où `id` et non `utilisatrice_id` dans la borne.
    'carte_contexte', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
                         from public.carte_contexte t where t.utilisatrice_id = v_uid),

    -- ── LES LECTURES ──────────────────────────────────────────────────────────────────────────
    'tirage', (select coalesce(jsonb_agg(to_jsonb(t) order by t.tire_a), '[]'::jsonb)
                 from public.tirage t where t.utilisatrice_id = v_uid),
    'lecture', (select coalesce(jsonb_agg(to_jsonb(t) order by t.ouverte_a), '[]'::jsonb)
                  from public.lecture t where t.utilisatrice_id = v_uid),

    -- ── CE QUE LE PRODUIT A FAIT D'ELLE ───────────────────────────────────────────────────────
    -- `seance`, `usage_ia`, `episode_detresse`, `audit_securite` sont DANS l'export et c'est une
    -- décision. Ce sont des données à caractère personnel la concernant (art. 15) : lui refuser
    -- l'accès à la façon dont le système l'a classée serait garder pour nous le seul jugement que
    -- le produit porte sur elle.
    'seance', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                 from public.seance t where t.utilisatrice_id = v_uid),
    'usage_ia', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                   from public.usage_ia t where t.utilisatrice_id = v_uid),
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

    -- ── L'ARGENT ET LES RÉGLAGES ──────────────────────────────────────────────────────────────
    'abonnement', (select coalesce(jsonb_agg(to_jsonb(t) order by t.cree_le), '[]'::jsonb)
                     from public.abonnement t where t.utilisatrice_id = v_uid),
    'remboursement', (select coalesce(jsonb_agg(to_jsonb(t) order by t.demande_le), '[]'::jsonb)
                        from public.remboursement t where t.utilisatrice_id = v_uid),
    'information_reconduction', (select coalesce(jsonb_agg(to_jsonb(t) order by t.echeance), '[]'::jsonb)
                                   from public.information_reconduction t where t.utilisatrice_id = v_uid),
    'preference_socle', (select coalesce(jsonb_agg(to_jsonb(t) order by t.maj_le), '[]'::jsonb)
                           from public.preference_socle t where t.utilisatrice_id = v_uid),
    -- Les deux seules lignes où l'on retire quelque chose. `to_jsonb(t) - 'colonne'` ôte la clé.
    'preference_courriel', (select coalesce(jsonb_agg((to_jsonb(t) - 'jeton') order by t.maj_le), '[]'::jsonb)
                              from public.preference_courriel t where t.utilisatrice_id = v_uid),
    'abonnement_poussee', (select coalesce(
                              jsonb_agg((to_jsonb(t) - 'cle_p256dh' - 'cle_auth') order by t.cree_le), '[]'::jsonb)
                             from public.abonnement_poussee t where t.utilisatrice_id = v_uid)
  ) into v_doc;

  -- AC3 — la trace, sans art. 9 : qui, quoi, quand. Jamais un extrait, jamais un compte de lignes
  -- (un volume est déjà un renseignement sur elle).
  insert into public.audit_securite (utilisatrice_id, type, decision)
  values (v_uid, 'export_donnees', 'servi');

  return v_doc;
end;
$fn$;

revoke all on function public.exporter_mes_donnees() from public, anon;
grant execute on function public.exporter_mes_donnees() to authenticated;
