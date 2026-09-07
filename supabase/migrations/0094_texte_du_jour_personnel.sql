-- ══════════════════════════════════════════════════════════════════════════════════════════════
-- 0094 — LE TEXTE DU JOUR, ÉCRIT POUR ELLE : trois parties, une personne, un jour
-- ══════════════════════════════════════════════════════════════════════════════════════════════
--
-- Retour du fondateur du 2026-09-07 : « je veux des horoscopes beaucoup plus précis et structurés.
-- Une partie factuelle sur l'horoscope poissons et ascendant et tout ce qu'on sait à ce niveau sur
-- la personne. Un deuxième paragraphe personnalisé avec les fichiers de contexte créés par Anam.
-- Enfin un troisième paragraphe sur les actions ou la manière de le rendre concret. »
--
-- ── POURQUOI UNE SECONDE TABLE, ET NON UNE COLONNE DE PLUS SUR 0091 ────────────────────────────
--
-- `texte_du_jour_stable` est un cache SYSTÈME PARTAGÉ : sa clé est (jour, signature minimisée,
-- version éditoriale), sans aucune identité, et c'est ce qui permet à toutes les personnes d'un même
-- ciel de partager un texte, donc un appel au modèle. Un texte qui nomme un prénom, une branche de
-- son arbre et son Soleil natal n'est partageable avec personne : la propriété est INVERSÉE.
-- Ajouter `utilisatrice_id` à 0091 aurait rendu FAUSSE sa garde écrite (« cette table partagée ne
-- contient aucune identité »), et `tests/texte-du-jour-sql.test.ts` l'aurait dit.
--
-- ⚠️ 0091 N'EST PAS SUPPRIMÉE, ET CE N'EST PAS DE LA TIMIDITÉ. Les trois extracteurs du dépôt
-- (`rls-catalogue`, `effacement-schema`, `export-inventaire`) construisent leurs listes à partir des
-- `create table` du CORPUS de migrations, et aucun ne sait voir un `drop`. Une table supprimée
-- resterait dans leurs listes, et la sonde d'isolation de `rls-catalogue` rougirait sur une table
-- absente — une garde de sécurité rouge pour une raison qui n'a rien à voir avec la sécurité. Elle
-- cesse simplement d'être lue et écrite ; ses lignes expirent seules en quarante-huit heures, sa
-- purge continue de tourner, et ses deux verdicts d'inventaire restent VRAIS. La retirer est une
-- story à elle seule, qui devra d'abord apprendre aux trois extracteurs à voir une suppression.
--
-- ── QUI PEUT LA LIRE : PERSONNE, SAUF LE SYSTÈME ───────────────────────────────────────────────
--
-- Patron de `carte_contexte` (0079). `authenticated` détient les privilèges DML sur les tables de ce
-- schéma : une garde écrite dans une route, ou dans le seul corps d'une RPC, ne garderait rien — un
-- POST REST direct l'obtiendrait. On les lui RETIRE tous, et la RLS est FORCÉE SANS AUCUNE POLICY,
-- ce qui vaut deny-all pour tout le monde, propriétaire compris.
--
-- ⚠️ ET C'EST POUR ÇA QU'IL N'Y A PAS DE `with check` ICI. La règle du dépôt — « la garde d'écriture
-- vit dans le `with check` de la policy, jamais dans la RPC seule » — vise les tables que
-- `authenticated` peut écrire. Ici il ne peut RIEN : il n'y a pas de serrure à poser sur une porte
-- murée. LE JOUR OÙ UNE POLICY DE LECTURE S'OUVRIRA SUR CETTE TABLE, LA GARDE D'ÉCRITURE DEVRA
-- NAÎTRE AVEC ELLE, DANS SON `with check`. Le contrôle de consentement art. 9 vit en amont, dans
-- `envoyerSousEgressArt9` à l'écriture ET dans `verifierDroitsArt9` à la relecture : une révocation
-- doit empêcher de RESSERVIR un texte déjà en cache, pas seulement d'en produire un nouveau.

create table public.texte_du_jour_personnel (
  -- ⚠️ ELLE PEND À `public.utilisatrice`, JAMAIS À `auth.users`. Les deux moteurs d'effacement
  -- retirent branche → utilisatrice → auth.users, et tiennent pour vrai qu'« `utilisatrice` emporte
  -- les autres tables ». Une table accrochée ailleurs survivrait à tout effacement qui ne touche pas
  -- l'auth. `tests/effacement-schema.test.ts` compte les ancrages à `auth.users` et en exige
  -- EXACTEMENT UN : celui d'`utilisatrice` elle-même.
  utilisatrice_id uuid not null references public.utilisatrice(id) on delete cascade,
  jour date not null,
  version_editoriale text not null check (char_length(version_editoriale) between 1 and 80),

  -- ⚠️ TÉMOINS, PAS CLÉS — ET PAS DANS LE FILTRE DE LECTURE NON PLUS. Ils disent SUR QUOI le texte a
  -- été écrit, pour le diagnostic. Les mettre dans le filtre ferait régénérer — et refacturer — dès
  -- que le ciel se recalcule ou qu'une branche est nommée à midi, et le texte changerait sous ses
  -- yeux entre deux affichages du même jour. L'invalidation réelle est EXPLICITE : 0096 supprime la
  -- ligne quand sa date de naissance est rectifiée, ce qui est le seul cas où le texte devient FAUX.
  condensat_signature text not null check (condensat_signature ~ '^[0-9a-f]{64}$'),
  condensat_matiere text not null check (condensat_matiere ~ '^[0-9a-f]{64}$'),

  -- ⚠️ TROIS COLONNES, PAS UN `jsonb`. Un tableau accepterait un quatrième élément, une partie vide,
  -- un intitulé inventé — et la contrainte redeviendrait une règle applicative de plus, c'est-à-dire
  -- une règle que la base ne tient pas. Les bornes sont en PARITÉ GARDÉE avec `PARTIE_MIN` et
  -- `PARTIE_MAX` de `lib/domain/verdict-horoscope.ts` : deux nombres pour une seule règle finissent
  -- toujours par diverger, et `tests/texte-du-jour-personnel-sql.test.ts` compare les deux.
  ciel text check (char_length(ciel) between 60 and 380),
  pour_toi text check (char_length(pour_toi) between 60 and 380),
  gestes text check (char_length(gestes) between 60 and 380),

  -- ⚠️ UNE LIGNE `corpus` EST UNE PIERRE TOMBALE, PAS UN TEXTE. Elle dit « pour cette personne, ce
  -- jour-là, le modèle a déjà eu sa chance et l'a manquée ». Elle borne le coût : sans elle, un refus
  -- lexical reproductible déclencherait un appel fournisseur à CHAQUE affichage.
  --
  -- ⚠️ ET ELLE N'EST POSÉE QUE SUR UN VERDICT DÉCISIF, JAMAIS SUR UN DÉLAI. Voir le commentaire de
  -- `lib/ai/texte-du-jour.ts` : au délai, la génération est encore en vol, et la tombale la battrait
  -- au `on conflict do nothing`. C'est le défaut qui rendrait ce cache inutilisable — avec un cache
  -- PAR PERSONNE, personne d'autre ne gagne la course à sa place.
  provenance text not null check (provenance in ('modele', 'corpus')),
  constraint texte_du_jour_personnel_forme check (
    (provenance = 'modele' and ciel is not null and pour_toi is not null and gestes is not null)
    or (provenance = 'corpus' and ciel is null and pour_toi is null and gestes is null)
  ),

  cree_le timestamptz not null default now(),
  expire_le timestamptz not null,
  primary key (utilisatrice_id, jour, version_editoriale),
  constraint texte_du_jour_personnel_ttl check (expire_le > cree_le)
);

comment on table public.texte_du_jour_personnel is
  'Retour du fondateur 2026-09-07 : les trois parties du texte du jour, écrites POUR ELLE. Donnée art. 9 dérivée — effacée avec elle par cascade, servie à l''export art. 15, invalidée par une rectification de date de naissance, purgée à 48 h par l''ordonnanceur.';

alter table public.texte_du_jour_personnel enable row level security;
alter table public.texte_du_jour_personnel force row level security;
revoke all on table public.texte_du_jour_personnel from public, anon, authenticated, service_role;
grant select on table public.texte_du_jour_personnel to service_role;

create index texte_du_jour_personnel_expiration_idx
  on public.texte_du_jour_personnel (expire_le);

-- ── LE PREMIER TEXTE SERVI FAIT FOI ────────────────────────────────────────────────────────────
--
-- `on conflict do nothing` puis relecture : deux instances qui écrivent pour la même personne le
-- même jour rendent la MÊME ligne, et c'est la première qui gagne. Sans arbitrage atomique partagé,
-- deux affichages du même jour montreraient deux textes différents sous le même titre — et rien ne
-- rougirait, puisque les deux seraient plausibles.
create or replace function public.figer_texte_du_jour_personnel(
  p_utilisatrice_id uuid,
  p_jour date,
  p_version_editoriale text,
  p_condensat_signature text,
  p_condensat_matiere text,
  p_ciel text,
  p_pour_toi text,
  p_gestes text,
  p_provenance text
)
returns table (
  utilisatrice_id uuid,
  jour date,
  version_editoriale text,
  condensat_signature text,
  condensat_matiere text,
  ciel text,
  pour_toi text,
  gestes text,
  provenance text
)
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
begin
  if p_utilisatrice_id is null then
    raise exception 'texte_du_jour_sans_identite' using errcode = '42501';
  end if;

  -- ⚠️ PURGE BORNÉE À ELLE, ALORS QUE 0091 PURGEAIT TOUT. Là-bas la table compte quelques centaines
  -- de lignes ; ici elle en compte une par personne et par jour, et une purge globale à chaque
  -- écriture ferait porter à une visite le ménage de tout le monde. Le gros du travail revient à
  -- l'ordonnanceur, qui a une fenêtre pour ça.
  delete from public.texte_du_jour_personnel
   where utilisatrice_id = p_utilisatrice_id and expire_le <= now();

  insert into public.texte_du_jour_personnel (
    utilisatrice_id, jour, version_editoriale,
    condensat_signature, condensat_matiere,
    ciel, pour_toi, gestes, provenance, expire_le
  )
  values (
    p_utilisatrice_id, p_jour, p_version_editoriale,
    p_condensat_signature, p_condensat_matiere,
    p_ciel, p_pour_toi, p_gestes, p_provenance,
    ((p_jour + 1)::timestamp at time zone 'Europe/Paris') + interval '48 hours'
  )
  on conflict do nothing;

  return query
  select t.utilisatrice_id, t.jour, t.version_editoriale,
         t.condensat_signature, t.condensat_matiere,
         t.ciel, t.pour_toi, t.gestes, t.provenance
    from public.texte_du_jour_personnel t
   where t.utilisatrice_id = p_utilisatrice_id
     and t.jour = p_jour
     and t.version_editoriale = p_version_editoriale
     and t.expire_le > now();
end;
$fn$;

revoke all on function public.figer_texte_du_jour_personnel(uuid, date, text, text, text, text, text, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.figer_texte_du_jour_personnel(uuid, date, text, text, text, text, text, text, text)
  to service_role;

-- ── LA PURGE PÉRIODIQUE ────────────────────────────────────────────────────────────────────────
--
-- Le TTL n'est pas qu'un filtre de lecture : l'ordonnanceur de rétention appelle cette purge à
-- chaque fenêtre, comme il le fait déjà pour 0091. Aucun cron Postgres parallèle n'est créé ; le
-- produit conserve sa porte périodique unique.
create or replace function public.purger_textes_du_jour_personnels_expires()
returns integer
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_retires integer;
begin
  delete from public.texte_du_jour_personnel where expire_le <= now();
  get diagnostics v_retires = row_count;
  return v_retires;
end;
$fn$;

revoke all on function public.purger_textes_du_jour_personnels_expires()
  from public, anon, authenticated, service_role;
grant execute on function public.purger_textes_du_jour_personnels_expires() to service_role;
