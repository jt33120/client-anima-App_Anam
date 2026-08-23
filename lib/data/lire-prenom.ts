import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * lire-prenom.ts — LE PRÉNOM, ET RIEN D'AUTRE (retour du 2026-08-23).
 *
 * Anam ouvre la séance, et une ouverture qui ne sait pas à qui elle parle est une formule. Le
 * prénom est déjà lu par `lire-contexte-anam.ts` pour la route de conversation ; la page de scène,
 * elle, n'a besoin que de lui — rapatrier les cinq sources du contexte pour un seul champ
 * ajouterait quatre requêtes à chaque chargement.
 *
 * Sous le JWT : la policy d'`utilisatrice` est ce qui garantit qu'on ne lit que la sienne (AD-12).
 * Repli sur `null` — une ouverture sans prénom existe et se lit bien ; une page qui tombe, non.
 */
export async function lirePrenom(
  supabase: SupabaseClient,
  utilisatriceId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("utilisatrice")
    .select("prenom")
    .eq("id", utilisatriceId)
    .maybeSingle<{ prenom: string | null }>();
  if (error) return null;
  return data?.prenom ?? null;
}
