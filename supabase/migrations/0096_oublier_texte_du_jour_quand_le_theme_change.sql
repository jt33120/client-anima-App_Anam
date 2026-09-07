-- ══════════════════════════════════════════════════════════════════════════════════════════════
-- 0096 — UN THÈME QUI CHANGE EMPORTE LE TEXTE DU JOUR QUI EN DÉCOULE
-- ══════════════════════════════════════════════════════════════════════════════════════════════
--
-- ── LE DÉFAUT QUE CETTE MIGRATION FERME ────────────────────────────────────────────────────────
--
-- Depuis 0094, le texte du jour NOMME son socle de naissance : « ton Soleil de naissance est en
-- Poissons, ton Ascendant Vierge ». Ce texte est figé pour quarante-huit heures.
--
-- Or le thème natal PEUT CHANGER, et pas seulement par accident : RC-E4 (0092) permet de rectifier
-- une date, une heure ou un lieu, et la Story 5.3 recalcule le thème dès qu'une heure de naissance
-- est ajoutée — c'est le parcours normal du produit, pas un cas limite. Sans cette migration, la
-- personne qui vient de corriger sa date de naissance continue de lire, pendant deux jours, un texte
-- qui affirme l'ancien signe. Elle a corrigé, le produit a dit « c'est fait », et il continue de lui
-- répéter la version fausse.
--
-- ⚠️ CE N'EST PAS UN PROBLÈME DE FRAÎCHEUR DE CACHE, C'EST UN PROBLÈME DE VÉRITÉ. Un texte périmé
-- qui parle de la météo se rattrape tout seul ; celui-ci affirme une identité, sous le nom d'une
-- personne réelle, à quelqu'un qui vient précisément de dire que cette identité était mal saisie.
--
-- ── POURQUOI UN TRIGGER SUR `theme_natal`, ET NON UN `delete` DANS LA RPC DE RECTIFICATION ─────
--
-- Parce que la rectification n'est pas le seul chemin. Ajouter son heure de naissance recalcule le
-- thème sans passer par `corriger_donnees_naissance` — c'est `lireThemeNatal` qui écrit, depuis la
-- page. Une garde posée dans la RPC aurait couvert le chemin auquel on pensait, et laissé ouvert
-- celui que tout le monde emprunte. Le trigger, lui, est attaché au FAIT (l'empreinte d'entrées a
-- changé), pas au chemin qui l'a produit : c'est le même raisonnement que le write-gate en
-- `with check` plutôt que dans une route.
--
-- ⚠️ ANCRÉ SUR `empreinte_entrees`, PAS SUR `contenu`. L'empreinte EST le résumé des entrées du
-- calcul, et 0039 refuse déjà un recalcul dont l'empreinte n'a pas bougé : si elle change, le socle
-- natal a changé. Se brancher sur `contenu` déclencherait aussi sur un changement d'adaptateur
-- d'éphéméride qui ne déplace aucun signe, et jetterait un texte encore juste.
--
-- ⚠️ SUR `update` SEULEMENT. Un `insert` est un PREMIER thème : rien n'a pu être écrit avant lui à
-- partir d'un socle, et `OLD` n'existe pas dans la clause `when` d'un trigger d'insertion.

create or replace function public.oublier_texte_du_jour_personnel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  delete from public.texte_du_jour_personnel where utilisatrice_id = new.utilisatrice_id;
  return null;
end;
$fn$;

revoke all on function public.oublier_texte_du_jour_personnel()
  from public, anon, authenticated, service_role;

create trigger theme_natal_oublie_le_texte_du_jour
  after update of empreinte_entrees on public.theme_natal
  for each row
  when (old.empreinte_entrees is distinct from new.empreinte_entrees)
  execute function public.oublier_texte_du_jour_personnel();

comment on function public.oublier_texte_du_jour_personnel() is
  'Un thème recalculé rend faux le texte du jour qui nommait l''ancien socle. Le trigger est attaché au fait (empreinte changée), jamais au chemin qui l''a produit : la rectification RC-E4 et l''ajout d''une heure de naissance passent tous les deux par là.';
