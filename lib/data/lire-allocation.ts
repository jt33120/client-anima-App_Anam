import "server-only";
import { createSupabaseAdminClient } from "./supabase/admin";
import { jetonTourValide } from "../ai/jeton-tour";

export class ErreurReservationQuota extends Error {
  readonly codeTechnique: string;

  constructor(codeTechnique: string) {
    super("réservation allocation résiduelle indisponible.");
    this.name = "ErreurReservationQuota";
    this.codeTechnique = codeTechnique;
  }
}

/** Code borné et non sensible pour distinguer timeout, permission et contrat RPC dans les logs. */
export function codeTechniqueReservationQuota(erreur: unknown): string {
  if (erreur instanceof ErreurReservationQuota) return erreur.codeTechnique;
  if (erreur instanceof Error && erreur.message === "reservation_quota_timeout") return "timeout";
  return "inconnu";
}

/**
 * Réserve une unité de quota pour un tour LOGIQUE. La RPC calcule elle-même le mois UTC, sérialise
 * les concurrentes qui partagent la même limite, puis vérifie la clé avant le plafond : un retry
 * déjà admis reste donc autorisé sans nouvelle unité.
 *
 * Le booléen est validé strictement. Une panne ou une forme inconnue LÈVE : la route transforme ce
 * doute en accès (fail-open, FR-058), sans jamais inventer une décision de quota.
 */
export async function reserverTourResiduelDuMois(
  utilisatriceId: string,
  cleIdempotence: string,
  limite: number,
): Promise<boolean> {
  const cleCanonique = jetonTourValide(cleIdempotence);
  if (!utilisatriceId || !cleCanonique) {
    throw new Error("réservation allocation résiduelle invalide.");
  }
  if (!Number.isSafeInteger(limite) || limite < 0) {
    throw new Error("limite allocation résiduelle invalide.");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("reserver_quota_ia_atomique", {
    p_utilisatrice: utilisatriceId,
    p_cle_idempotence: cleCanonique,
    p_limite: limite,
  });
  if (error) {
    throw new ErreurReservationQuota(error.code ?? "rpc_inconnue");
  }
  if (typeof data !== "boolean") {
    throw new ErreurReservationQuota("forme_invalide");
  }
  return data;
}

/** Premier jour du mois calendaire UTC, au format de la colonne PostgreSQL `date`. */
export function premierJourMoisUtc(maintenant = new Date()): string {
  if (Number.isNaN(maintenant.getTime())) throw new Error("date allocation résiduelle invalide.");
  const annee = maintenant.getUTCFullYear();
  const mois = String(maintenant.getUTCMonth() + 1).padStart(2, "0");
  return `${annee}-${mois}-01`;
}

/**
 * Lecture compatible pour l'exploitation et les tests : le quota vient désormais du registre
 * d'admission `reservation_quota_ia`, jamais du coût fournisseur `usage_ia`.
 */
export async function compterToursResiduelsDuMois(
  utilisatriceId: string,
  cleIdempotenceCourante?: string,
): Promise<number> {
  const admin = createSupabaseAdminClient();
  const maintenant = new Date();
  const moisUtc = premierJourMoisUtc(maintenant);
  let requete = admin
    .from("reservation_quota_ia")
    .select("*", { count: "exact", head: true })
    .eq("utilisatrice_id", utilisatriceId)
    .eq("mois_utc", moisUtc);
  // Signature historique conservée pour les lecteurs d'exploitation. Le gate nominal n'exclut plus
  // sa clé : il appelle la RPC, qui reconnaît atomiquement une réservation existante avant le plafond.
  const cleExclue = cleIdempotenceCourante
    ? jetonTourValide(cleIdempotenceCourante)
    : null;
  if (cleExclue) requete = requete.neq("cle_idempotence", cleExclue);
  const { count, error } = await requete;
  if (error) throw new Error(`comptage allocation résiduelle a échoué (${error.code ?? "inconnu"}).`);
  return count ?? 0;
}
