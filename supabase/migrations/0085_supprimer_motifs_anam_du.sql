-- La carte « Anam se manifeste » a été retirée de Moi : la page dédiée à Anam est désormais le
-- seul lieu où sa parole apparaît. Sa RPC de lecture n'a donc plus d'appelant et ne doit pas rester
-- exposée à `authenticated` comme une API fantôme.
drop function if exists public.motifs_anam_du();
