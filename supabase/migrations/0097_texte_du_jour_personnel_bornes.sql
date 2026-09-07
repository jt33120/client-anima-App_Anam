-- ══════════════════════════════════════════════════════════════════════════════════════════════
-- 0097 — LES BORNES DES TROIS PARTIES SUIVENT CELLES DU VERDICT
-- ══════════════════════════════════════════════════════════════════════════════════════════════
--
-- 0094 posait `char_length between 60 and 380` sur les trois colonnes, en parité avec `PARTIE_MIN`
-- et `PARTIE_MAX` de `lib/domain/verdict-horoscope.ts`. Ces deux nombres étaient ESTIMÉS.
--
-- Mesure du 2026-09-07, dix générations réelles sur le modèle qui sert en production : les parties
-- font de 500 à 780 signes. À 380, le verdict refusait dix textes sur dix (`trop_long`), et la
-- fonctionnalité n'aurait jamais rien produit. Le domaine passe à 700 ; la base suit, dans le même
-- commit, parce que deux nombres pour une seule règle finissent toujours par diverger — et le
-- chemin d'échec, ici, serait « cache indisponible », un message qui ne dit rien de la vraie cause.
--
-- ⚠️ ÉLARGISSEMENT PUR, DONC SANS RISQUE POUR L'EXISTANT : toute ligne déjà acceptée par l'ancienne
-- borne l'est par la nouvelle. Aucune donnée n'est réécrite, aucune ligne n'est perdue.

alter table public.texte_du_jour_personnel
  drop constraint if exists texte_du_jour_personnel_ciel_check,
  drop constraint if exists texte_du_jour_personnel_pour_toi_check,
  drop constraint if exists texte_du_jour_personnel_gestes_check;

alter table public.texte_du_jour_personnel
  add constraint texte_du_jour_personnel_ciel_check
    check (char_length(ciel) between 60 and 700),
  add constraint texte_du_jour_personnel_pour_toi_check
    check (char_length(pour_toi) between 60 and 700),
  add constraint texte_du_jour_personnel_gestes_check
    check (char_length(gestes) between 60 and 700);
