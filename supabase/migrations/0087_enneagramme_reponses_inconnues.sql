-- Story 13.8 — « Je ne sais pas » est une réponse explicite et non scorée.
--
-- Migration additive et rétrocompatible : la table, la contrainte et les privilèges ne changent
-- pas. Seul leur prédicat existant accepte désormais JSON null en plus des niveaux 0..3. Toutes les
-- tentatives écrites avant cette migration restent donc valides à l'identique.
create or replace function public.reponses_enneagramme_valides(p_reponses jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p_reponses) = 'object'
     and (select count(*) from jsonb_object_keys(p_reponses)) <= 18
     and not exists (
       select 1
       from jsonb_each(p_reponses) as e(cle, valeur)
       where e.cle !~ '^e[1-9][ab]$'
          or (
            jsonb_typeof(e.valeur) <> 'number'
            and jsonb_typeof(e.valeur) <> 'null'
          )
          or (
            jsonb_typeof(e.valeur) = 'number'
            and (e.valeur)::numeric not in (0, 1, 2, 3)
          )
     );
$$;

comment on function public.reponses_enneagramme_valides(jsonb) is
  'Story 13.8 — réponses du test : objet <= 18 clés e<1-9><a|b>, valeurs 0..3 ou null pour « Je ne sais pas ».';
