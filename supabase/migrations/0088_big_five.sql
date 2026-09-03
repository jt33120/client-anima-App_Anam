-- ════════════════════════════════════════════════════════════════════════════════════════════════
-- 0088 — LES CINQ GRANDS FACTEURS (2026-09-03 · FR-031 · FR-054 · AD-12 · AD-13)
-- ════════════════════════════════════════════════════════════════════════════════════════════════
--
-- Jumelle de 0049, et délibérément. Le Big Five est un second questionnaire, avec la même échelle
-- (`lib/domain/echelle-likert.ts`), les mêmes gestes et les mêmes gardes. Tout ce que 0049 a payé
-- vaut ici sans être re-débattu :
--
--   • LES GARDES SONT DANS LES `with check`, jamais dans une RPC ni une Server Action. `authenticated`
--     détient les sept privilèges DML sur chaque table de `public` (0041/0048) : ce qu'une RPC
--     refuserait, un POST REST direct l'obtiendrait ;
--   • DÉPOSER un résultat est gaté par le consentement art. 9 et la minorité ; EFFACER son résultat
--     ou sa tentative ne l'est PAS — retirer une étiquette n'est pas en déposer une, et c'est
--     précisément le geste de celle qui vient de révoquer son consentement (0021, 0049) ;
--   • LE BARÈME N'EST PAS UNE GARDE. Une personne peut poster les cinq positions de son choix par
--     l'API REST sans avoir répondu à un énoncé. Ce ne sont que ses propres données ; rejouer le
--     barème en SQL le dupliquerait (la divergence R1-bis, payée deux fois par ce dépôt).
--
-- ── CE QUI EST PROPRE À CETTE MIGRATION : AUCUN NOMBRE NE SE STOCKE (FR-031) ────────────────────
--
-- Le résultat retenu n'est PAS un score. Le calcul rend, par facteur, une POSITION parmi trois, et
-- c'est cela seul qui entre en base — cinq colonnes bornées par un `check`, jamais un entier, jamais
-- un pourcentage. Une colonne `score smallint` aurait suffi à faire revenir la jauge que FR-031
-- refuse : un rendu finit toujours par peindre en barre ce que la base lui donne en nombre.
--
-- Les RÉPONSES, elles, restent des entiers 0..3 dans `big_five_tentative` — c'est la matière brute
-- du test, pas un résultat, et elle disparaît dès que le test conclut (voir la RPC).
--
-- ── ET AUCUNE COLONNE DE TEXTE LIBRE (FR-053) ──────────────────────────────────────────────────
--
-- Comme `enneagramme` et `theme_natal` : il n'existe ici aucun endroit où une prédiction pourrait
-- s'écrire. L'interprétation vit dans `lib/corpus/big-five.ts`, sous le balayage du détecteur.

-- ── 1. LA FORME DES RÉPONSES ──────────────────────────────────────────────────────────────────
--
-- `immutable` : exigé pour servir dans une contrainte `check`. Vingt clés au plus, chacune un
-- identifiant d'énoncé, chaque valeur un entier de 0 à 3 ou `null` (« Je ne sais pas », qui est une
-- réponse explicite et non scorée — 0087 a posé la règle pour l'ennéagramme).
--
-- ⚠️ LE MOTIF DES CLÉS EST UN MIROIR DE `lib/domain/big-five-items.ts`, exactement comme celui de
-- 0049 l'est de `enneagramme-items.ts` : divergence assumée, bornée à la FORME d'un identifiant, et
-- gardée par `tests/big-five-sql.test.ts` qui compare les deux listes. La base ne lit pas le
-- TypeScript ; on ne duplique donc jamais le barème lui-même, qui n'existe qu'à un seul endroit.
create function public.reponses_big_five_valides(p_reponses jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p_reponses) = 'object'
     and (select count(*) from jsonb_object_keys(p_reponses)) <= 20
     and not exists (
       select 1
       from jsonb_each(p_reponses) as e(cle, valeur)
       where e.cle !~ '^b(0[1-9]|1[0-9]|20)$'
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

comment on function public.reponses_big_five_valides(jsonb) is
  '2026-09-03 — forme des réponses du Big Five : objet <= 20 clés « b01 » à « b20 », valeurs 0..3 ou '
  'null pour « Je ne sais pas ».';

-- ── 2. LE RÉSULTAT RETENU ─────────────────────────────────────────────────────────────────────
--
-- 1:1 sur `utilisatrice_id` (patron `enneagramme`/`theme_natal`) : deux résultats concurrents n'ont
-- aucun sens, et la clé primaire rend l'unicité STRUCTURELLE plutôt que dépendante de l'appelant.
--
-- ⚠️ CINQ COLONNES, PAS UN JSONB. Un `facteurs jsonb` aurait accepté n'importe quoi — un sixième
-- facteur, une position inventée, un score glissé à côté — et la contrainte aurait dû être une
-- fonction de plus. Cinq colonnes bornées disent la même chose et le schéma les vérifie lui-même.
create table public.big_five (
  utilisatrice_id uuid        primary key references public.utilisatrice(id) on delete cascade,
  ouverture       text        not null,
  conscience      text        not null,
  extraversion    text        not null,
  agreabilite     text        not null,
  stabilite       text        not null,
  cree_le         timestamptz not null default now(),
  maj_le          timestamptz not null default now(),
  -- Les trois positions du domaine, et rien d'autre. Une valeur hors domaine LÈVE (23514) au lieu
  -- d'entrer : c'est le même choix que la borne 1..9 du type d'ennéagramme.
  constraint big_five_ouverture_close    check (ouverture    in ('bas', 'median', 'haut')),
  constraint big_five_conscience_close   check (conscience   in ('bas', 'median', 'haut')),
  constraint big_five_extraversion_close check (extraversion in ('bas', 'median', 'haut')),
  constraint big_five_agreabilite_close  check (agreabilite  in ('bas', 'median', 'haut')),
  constraint big_five_stabilite_close    check (stabilite    in ('bas', 'median', 'haut'))
);

comment on table public.big_five is
  '2026-09-03 — le résultat retenu du Big Five : cinq POSITIONS, jamais un score (FR-031). Aucune '
  'colonne de texte libre : l''interprétation vit dans lib/corpus/big-five.ts.';

alter table public.big_five enable row level security;
alter table public.big_five force  row level security;

-- LECTURE : propriétaire, et RIEN d'autre. Ni consentement, ni premium, ni minorité — ses propres
-- données lui restent lisibles quoi qu'il arrive, parce que l'export FR-067 et l'effacement AD-14 en
-- dépendent.
create policy big_five_lecture on public.big_five
  for select using (auth.uid() = utilisatrice_id);

create policy big_five_depot on public.big_five
  for insert
  with check (auth.uid() = utilisatrice_id
              and public.a_consenti_art9()
              and not public.est_barre_minorite());

-- CORRECTION : refaire le test remplace le résultat, et c'est encore un dépôt. Le `using` borne ce
-- qu'on peut viser, le `with check` ce qu'on peut écrire — les deux sont nécessaires.
create policy big_five_correction on public.big_five
  for update
  using      (auth.uid() = utilisatrice_id)
  with check (auth.uid() = utilisatrice_id
              and public.a_consenti_art9()
              and not public.est_barre_minorite());

create policy big_five_retrait on public.big_five
  for delete using (auth.uid() = utilisatrice_id);

-- ── 3. LA TENTATIVE EN COURS ──────────────────────────────────────────────────────────────────
--
-- 1:1 également. « Refaire » remplace la ligne et change `tentative_id`, ce qui remonte jusqu'à la
-- `key` du composant (décision D9) : aucune réponse de la passe précédente ne survit à l'écran.
create table public.big_five_tentative (
  utilisatrice_id uuid        primary key references public.utilisatrice(id) on delete cascade,
  tentative_id    uuid        not null default gen_random_uuid(),
  reponses        jsonb       not null default '{}'::jsonb,
  cree_le         timestamptz not null default now(),
  maj_le          timestamptz not null default now(),
  constraint big_five_tentative_forme check (public.reponses_big_five_valides(reponses))
);

comment on table public.big_five_tentative is
  '2026-09-03 — la passe en cours du Big Five (NFR-017 : une fermeture d''onglet au douzième énoncé '
  'ne perd rien). Effacée par la RPC au moment où le test conclut.';

alter table public.big_five_tentative enable row level security;
alter table public.big_five_tentative force  row level security;

create policy big_five_tentative_lecture on public.big_five_tentative
  for select using (auth.uid() = utilisatrice_id);

create policy big_five_tentative_depot on public.big_five_tentative
  for insert
  with check (auth.uid() = utilisatrice_id
              and public.a_consenti_art9()
              and not public.est_barre_minorite());

create policy big_five_tentative_revision on public.big_five_tentative
  for update
  using      (auth.uid() = utilisatrice_id)
  with check (auth.uid() = utilisatrice_id
              and public.a_consenti_art9()
              and not public.est_barre_minorite());

-- Abandonner une tentative en cours ne dépend de rien : c'est un retrait.
create policy big_five_tentative_retrait on public.big_five_tentative
  for delete using (auth.uid() = utilisatrice_id);

-- ── 4. L'HORODATAGE ───────────────────────────────────────────────────────────────────────────
--
-- ⚠️ `before insert OR update`, JAMAIS `before update` seul — le défaut récurrent de ce dépôt
-- (0039→0041, 0021→0046, 0019→0046). Et la garde `auth.uid() is not null` laisse `service_role`
-- écrire des dates choisies : c'est ce dont dépend le réimport d'un export FR-067, sans quoi
-- restaurer un export détruirait les dates qu'il prétend rendre.
create function public.big_five_horodatage()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    if tg_op = 'INSERT' then new.cree_le := now(); end if;
    new.maj_le := now();
  end if;
  return new;
end;
$$;

create trigger big_five_horodatage
before insert or update on public.big_five
for each row execute function public.big_five_horodatage();

create trigger big_five_tentative_horodatage
before insert or update on public.big_five_tentative
for each row execute function public.big_five_horodatage();

-- ── 5. LES PRIVILÈGES ─────────────────────────────────────────────────────────────────────────
revoke all on public.big_five           from anon;
revoke all on public.big_five_tentative from anon;

revoke execute on function public.big_five_horodatage() from public, anon, authenticated;

revoke all     on function public.reponses_big_five_valides(jsonb) from public;
grant  execute on function public.reponses_big_five_valides(jsonb) to authenticated;

-- ── 6. CONCLURE : LE RÉSULTAT ENTRE, LA TENTATIVE SORT, MÊME TRANSACTION ──────────────────────
--
-- Même raisonnement qu'en 0049. Les réponses brutes sont un matériau plus intime que le résultat
-- qu'on en tire : en deux appels séparés, une panne entre les deux laisserait le résultat retenu ET
-- les vingt réponses en place, c'est-à-dire exactement le résidu art. 9 que la décision supprime.
--
-- Le DELETE est en premier, et c'est lui qui sérialise : deux onglets qui concluent en même temps se
-- bloquent sur la même ligne, et le second voit zéro.
--
-- ⚠️ `security invoker` : la RPC ne contourne RIEN. Si le consentement a été révoqué entre le
-- premier énoncé et le dernier, l'insert lève et la transaction entière est annulée — les réponses
-- lui restent.
create function public.terminer_tentative_big_five(
  p_ouverture    text,
  p_conscience   text,
  p_extraversion text,
  p_agreabilite  text,
  p_stabilite    text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid        uuid := (select auth.uid());
  v_supprimees integer;
begin
  if v_uid is null then return false; end if;

  delete from public.big_five_tentative t where t.utilisatrice_id = v_uid;
  get diagnostics v_supprimees = row_count;
  -- Rien à conclure : soit l'autre onglet a gagné la course, soit personne n'a jamais répondu. Dans
  -- les deux cas on n'écrit AUCUN résultat — une tentative absente ne se conclut pas.
  if v_supprimees = 0 then return false; end if;

  insert into public.big_five (
    utilisatrice_id, ouverture, conscience, extraversion, agreabilite, stabilite
  )
  values (v_uid, p_ouverture, p_conscience, p_extraversion, p_agreabilite, p_stabilite)
  on conflict (utilisatrice_id) do update
    set ouverture    = excluded.ouverture,
        conscience   = excluded.conscience,
        extraversion = excluded.extraversion,
        agreabilite  = excluded.agreabilite,
        stabilite    = excluded.stabilite;

  return true;
end;
$$;

revoke execute on function public.terminer_tentative_big_five(text, text, text, text, text)
  from public, anon;
grant  execute on function public.terminer_tentative_big_five(text, text, text, text, text)
  to authenticated;

comment on function public.terminer_tentative_big_five(text, text, text, text, text) is
  '2026-09-03 — conclut le Big Five : la tentative sort, les cinq positions entrent, MÊME '
  'transaction. Rend false si aucune tentative n''existait (course entre deux onglets).';
