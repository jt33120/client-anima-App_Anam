import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/data/supabase/server";
import type { FacteurRetenu } from "@/lib/domain/big-five";
import type { ReponseItem } from "@/lib/domain/echelle-likert";

/**
 * depot-big-five.ts — LES ÉCRITURES DU RÉSULTAT ET DE LA TENTATIVE (2026-09-03).
 *
 * Jumeau de `depot-enneagramme.ts`, moins l'hypothèse : Anam ne propose pas de Big Five, il n'y a
 * donc ni germe, ni acceptation, ni refus. Ce qui reste vaut à l'identique :
 *
 *   • SOUS LE JWT DE L'UTILISATRICE, jamais `service_role` — qui contournerait la RLS **et** le
 *     write-gate de consentement, c'est-à-dire les deux gardes de 0088 (AD-12, AD-13) ;
 *   • CHAQUE MUTATION REND UN BOOLÉEN OBTENU EN RELISANT (`.select()`), jamais un `error === null`.
 *     Les deux moitiés d'une policy échouent DIFFÉREMMENT : un `using` qui refuse rend ZÉRO LIGNE
 *     SANS ERREUR, un `with check` qui refuse lève 42501. Se fier à l'absence d'erreur annoncerait
 *     « c'est enregistré » à quelqu'un dont rien n'a été enregistré (leçon 4.9/T5) ;
 *   • NFR-022 — ni les positions, ni les réponses ne sont loggées ni portées par une erreur.
 *     Seulement le code Postgres.
 *
 * ⚠️ UNE SEULE RPC, ET ELLE NE GARDE RIEN. `terminer_tentative_big_five` existe parce que DEUX
 * LIGNES DOIVENT BOUGER ENSEMBLE (le résultat entre, la tentative sort), jamais pour « mieux
 * garder » : `authenticated` détient les sept privilèges DML sur chaque table de `public`, donc tout
 * ce qu'une RPC refuserait, un POST REST direct l'obtiendrait.
 */

export interface DepotBigFive {
  /**
   * Enregistre l'état des réponses. Rend l'identifiant de la passe — celui qui remonte jusqu'à la
   * `key` du composant. Idempotent : la même réponse renvoyée deux fois écrit la même chose.
   */
  enregistrerReponses(args: { reponses: readonly ReponseItem[] }): Promise<string>;
  /** Conclut : le résultat entre, la tentative sort, MÊME transaction. `false` = rien n'a bougé. */
  terminerTentative(args: { facteurs: readonly FacteurRetenu[] }): Promise<boolean>;
  /** Abandonne la passe en cours. `false` = il n'y en avait pas. Jamais gaté (c'est un retrait). */
  abandonnerTentative(): Promise<boolean>;
  /** Retire le résultat. Franc, sans tombstone, et ouvert en toutes circonstances (FR-067). */
  effacerResultat(): Promise<boolean>;
}

/**
 * Les réponses en objet JSONB, tel que `reponses_big_five_valides` (0088) l'exige.
 *
 * Un item répondu DEUX FOIS ne garde que la DERNIÈRE — un formulaire qui laisse revenir en arrière
 * produit exactement ça, et c'est déjà la règle de `conclure` (`lib/domain/big-five.ts`). Les deux
 * doivent coïncider, sans quoi ce qui est marqué à l'écran et ce qui est scoré divergeraient.
 */
export function reponsesBigFiveEnJson(
  reponses: readonly ReponseItem[],
): Record<string, number | null> {
  return Object.fromEntries(reponses.map((r) => [r.itemId, r.niveau]));
}

export function creerDepotBigFive(
  utilisatriceId: string,
  client?: SupabaseClient,
): DepotBigFive {
  const clientOu = async () => client ?? (await createSupabaseServerClient());

  return {
    async enregistrerReponses({ reponses }): Promise<string> {
      const supabase = await clientOu();
      // `tentative_id` n'est PAS dans la charge utile : sur conflit, seul `reponses` est réécrit, et
      // l'identifiant de la passe SURVIT. L'y mettre le régénérerait à chaque réponse — donc
      // remonterait le composant à chaque clic, donc perdrait le focus à chaque clic.
      const { data, error } = await supabase
        .from("big_five_tentative")
        .upsert(
          { utilisatrice_id: utilisatriceId, reponses: reponsesBigFiveEnJson(reponses) },
          { onConflict: "utilisatrice_id" },
        )
        .select("tentative_id")
        .maybeSingle<{ tentative_id: string }>();

      if (error) throw new Error(`bigFive.enregistrerReponses: ${error.code ?? "echec"}`);
      // Une écriture qui n'a rien relu alors qu'elle n'a pas levé serait un succès fantôme : sans
      // identifiant de passe, l'appelant n'aurait rien à poser en `key`.
      if (!data) throw new Error("bigFive.enregistrerReponses: sans_tentative");
      return data.tentative_id;
    },

    async terminerTentative({ facteurs }): Promise<boolean> {
      const supabase = await clientOu();
      // ⚠️ LES CINQ POSITIONS SONT NOMMÉES, JAMAIS ORDONNÉES. Passer un tableau positionnel à la RPC
      // ferait dépendre le résultat de l'ordre de `FACTEURS` : le jour où quelqu'un le réordonne
      // pour l'affichage, chaque personne se verrait attribuer les positions d'un autre axe — faux
      // de façon parfaitement déterministe, donc invisible à tout test de déterminisme. C'est la
      // règle D7 (appariement nominal), appliquée à la frontière SQL.
      const position = (nom: FacteurRetenu["facteur"]) =>
        facteurs.find((f) => f.facteur === nom)?.position ?? null;

      const { data, error } = await supabase.rpc("terminer_tentative_big_five", {
        p_ouverture: position("ouverture"),
        p_conscience: position("conscience"),
        p_extraversion: position("extraversion"),
        p_agreabilite: position("agreabilite"),
        p_stabilite: position("stabilite"),
      });
      if (error) throw new Error(`bigFive.terminerTentative: ${error.code ?? "echec"}`);
      return data === true;
    },

    async abandonnerTentative(): Promise<boolean> {
      const supabase = await clientOu();
      const { data, error } = await supabase
        .from("big_five_tentative")
        .delete()
        .eq("utilisatrice_id", utilisatriceId)
        .select("tentative_id");
      if (error) throw new Error(`bigFive.abandonnerTentative: ${error.code ?? "echec"}`);
      return (data ?? []).length > 0;
    },

    async effacerResultat(): Promise<boolean> {
      const supabase = await clientOu();
      const { data, error } = await supabase
        .from("big_five")
        .delete()
        .eq("utilisatrice_id", utilisatriceId)
        .select("utilisatrice_id");
      if (error) throw new Error(`bigFive.effacerResultat: ${error.code ?? "echec"}`);
      return (data ?? []).length > 0;
    },
  };
}
