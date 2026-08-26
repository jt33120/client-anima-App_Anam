-- Migration forward-only — comptabilité IA par utilisatrice (AD-2, FR-043).
--
-- `usage_ia` reste le registre INTERNE, server-authoritative et sans contenu art. 9. Une clé
-- fournisseur par personne est explicitement hors architecture : la clé reste un secret serveur
-- unique, et l'attribution vit ici. Les colonnes ajoutées séparent trois choses qui ne doivent plus
-- être confondues : le coût fournisseur, l'entitlement premium observé et le quota produit.
--
-- Les défauts décrivent honnêtement les lignes historiques déjà présentes. Tout nouvel appel écrit
-- les dimensions explicites via `metrerUsageIa`; les inserts historiques/directs restent compatibles.

-- Les SDK exposent des entiers sûrs JavaScript, plus larges que `integer` PostgreSQL. Le passage à
-- bigint est sans perte et évite qu'un compteur valide côté serveur échoue seulement à l'upsert.
alter table public.usage_ia
  alter column tokens_entree type bigint,
  alter column tokens_sortie type bigint;

alter table public.usage_ia
  add column operation text not null default 'historique',
  add column capacite text,
  add column unite_usage text not null default 'token',
  add column premium_au_moment_appel boolean,
  add column exempte_quota boolean not null default false,
  add column comptabilise_financierement boolean not null default false,
  add column tarif_version text not null default 'historique_non_tarife',
  add column tarif_connu boolean not null default false,
  add column devise text not null default 'USD',
  add column prix_entree_usd_par_million numeric(20, 8),
  add column prix_sortie_usd_par_million numeric(20, 8),
  add column cout_usd numeric(20, 12);

alter table public.usage_ia
  add constraint usage_ia_tokens_non_negatifs
    check (tokens_entree >= 0 and tokens_sortie >= 0) not valid,
  add constraint usage_ia_operation_non_vide
    check (btrim(operation) <> ''),
  add constraint usage_ia_operation_connue
    check (
      operation in (
        'historique', 'conversation', 'detection_detresse', 'detection_reconceptualisation',
        'detection_retour_theme', 'hypothese_enneagramme', 'compactage_contexte',
        'extraction_arc', 'restitution_lecture', 'bilan_seance', 'synthese_periodique'
      )
    ),
  add constraint usage_ia_capacite_connue
    check (
      capacite is null or capacite in (
        'echange', 'compactage', 'reconceptualisation', 'synthese', 'detection',
        'retour_theme', 'hypothese_enneagramme', 'lecture'
      )
    ),
  add constraint usage_ia_unite_non_vide
    check (btrim(unite_usage) <> ''),
  add constraint usage_ia_tarif_version_non_vide
    check (btrim(tarif_version) <> ''),
  add constraint usage_ia_devise_usd
    check (devise = 'USD'),
  add constraint usage_ia_prix_non_negatifs
    check (
      (prix_entree_usd_par_million is null or prix_entree_usd_par_million >= 0)
      and (prix_sortie_usd_par_million is null or prix_sortie_usd_par_million >= 0)
      and (cout_usd is null or cout_usd >= 0)
    ),
  add constraint usage_ia_tarif_connu_complet
    check (
      (
        tarif_connu
        and prix_entree_usd_par_million is not null
        and prix_sortie_usd_par_million is not null
        and cout_usd is not null
      ) or (
        not tarif_connu
        and prix_entree_usd_par_million is null
        and prix_sortie_usd_par_million is null
        and cout_usd is null
      )
    ),
  add constraint usage_ia_financier_explicitement_attribue
    check (
      not comptabilise_financierement
      or (operation <> 'historique' and capacite is not null)
    ),
  add constraint usage_ia_quota_et_exemption_distincts
    check (not (post_premiere_seance and exempte_quota));

comment on column public.usage_ia.operation is
  'Opération métier du sous-appel (conversation, detection_detresse, synthese_periodique…). Jamais de contenu utilisateur.';
comment on column public.usage_ia.capacite is
  'Capacité déclarée au port IA, donc source du tier serveur. NULL uniquement pour les lignes historiques.';
comment on column public.usage_ia.unite_usage is
  'Unité des quantités persistées. Première tranche : token (tokens_entree/tokens_sortie).';
comment on column public.usage_ia.premium_au_moment_appel is
  'Instantané de l''entitlement au départ de l''appel. NULL = historique ou lecture impossible, jamais une supposition gratuite/premium.';
comment on column public.usage_ia.exempte_quota is
  'True : ce coût fournisseur ne consomme aucune limite produit. La détection/réponse de sécurité reste toujours hors quota (FR-043).';
comment on column public.usage_ia.comptabilise_financierement is
  'True : l''appel entre dans la comptabilité fournisseur, indépendamment de exempte_quota.';
comment on column public.usage_ia.tarif_version is
  'Version datée du catalogue appliqué ; historique_non_tarife pour les lignes antérieures à 0081.';
comment on column public.usage_ia.tarif_connu is
  'False : modèle non catalogué ou ligne historique ; cout_usd reste alors NULL plutôt qu''un faux zéro.';
comment on column public.usage_ia.devise is
  'Devise des prix et du coût fournisseur. Première tranche : USD.';
comment on column public.usage_ia.prix_entree_usd_par_million is
  'Prix d''entrée exact en USD par million de tokens, figé avec la ligne pour audit historique.';
comment on column public.usage_ia.prix_sortie_usd_par_million is
  'Prix de sortie exact en USD par million de tokens, figé avec la ligne pour audit historique.';
comment on column public.usage_ia.cout_usd is
  'Coût exact de l''appel en USD, calculé sans flottant puis persisté en numeric(20,12). NULL si le tarif est inconnu.';

comment on table public.usage_ia is
  'Registre interne de comptabilité IA par sous-appel et par utilisatrice (AD-2). Sans contenu art. 9, deny-by-default, service_role uniquement, idempotent par (utilisatrice_id, cle_idempotence). Le coût financier et le quota produit sont explicitement distincts.';
