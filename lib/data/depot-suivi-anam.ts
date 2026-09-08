import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  commandeOutilSuiviValide, commandePersonnelleSuiviValide, reperesSuiviValides, revisionSuiviValide,
  type CommandeOutilSuivi, type CommandePersonnelleSuivi, type SuiviAnam, type EvenementSuivi,
} from "@/lib/domain/suivi-anam";
import { pratiqueParId } from "@/lib/domain/pratiques";
import { createSupabaseServerClient } from "./supabase/server";
import { createSupabaseAdminClient } from "./supabase/admin";

export class ErreurSuiviAnam extends Error {
  constructor(readonly code: "conflit" | "refuse" | "invalide" | "indisponible") {
    super(`suivi_${code}`);
    this.name = "ErreurSuiviAnam";
  }
}
function erreurSql(error: { code?: string } | null): void {
  if (!error) return;
  throw new ErreurSuiviAnam(["40001", "PT409"].includes(error.code ?? "") ? "conflit" : error.code === "42501" ? "refuse" :
    ["22023", "23514", "22P02"].includes(error.code ?? "") ? "invalide" : "indisponible");
}
const niveauValide = (n: unknown): n is number => Number.isInteger(n) && Number(n) >= 0 && Number(n) <= 34;
const objet = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
function evenement(v: unknown): EvenementSuivi {
  if (!objet(v) || typeof v.id !== "string" || !["ajuster", "avancer"].includes(String(v.type)) ||
      typeof v.resume !== "string" || (v.titre_etape !== null && typeof v.titre_etape !== "string") ||
      !niveauValide(v.niveau_arbre) || typeof v.cree_le !== "string") throw new ErreurSuiviAnam("indisponible");
  return { id: v.id, type: v.type as "ajuster" | "avancer", resume: v.resume,
    titreEtape: v.titre_etape as string | null, niveauArbre: v.niveau_arbre, creeLe: v.cree_le };
}

/** Lecture de contenu exclusivement sous le JWT courant. Une panne ne signifie jamais absence. */
export async function lireSuiviAnam(supabase: SupabaseClient, utilisatriceId: string): Promise<SuiviAnam | null> {
  const lecture = await supabase.from("suivi_anam")
    .select("revision,pause,cap,synthese,reperes,etapes,niveau_arbre,maj_le")
    .eq("utilisatrice_id", utilisatriceId).maybeSingle();
  erreurSql(lecture.error);
  const v: unknown = lecture.data;
  if (v === null) return null;
  if (!objet(v) || !revisionSuiviValide(v.revision) || typeof v.pause !== "boolean" || typeof v.cap !== "string" ||
      typeof v.synthese !== "string" || !reperesSuiviValides(v.reperes) || !Array.isArray(v.etapes) ||
      v.etapes.length > 3 || !niveauValide(v.niveau_arbre) || typeof v.maj_le !== "string") {
    throw new ErreurSuiviAnam("indisponible");
  }
  const etapes = v.etapes.map((e: unknown) => {
    if (!objet(e) || typeof e.id !== "string" || typeof e.titre !== "string" ||
        !(e.pratiqueId === null || pratiqueParId(e.pratiqueId))) throw new ErreurSuiviAnam("indisponible");
    return { id: e.id, titre: e.titre, pratiqueId: e.pratiqueId as string | null };
  });
  const histoire = await supabase.from("suivi_evenement")
    .select("id,type,resume,titre_etape,niveau_arbre,cree_le")
    .eq("utilisatrice_id", utilisatriceId).lte("revision", v.revision).order("revision", { ascending: false }).limit(10);
  erreurSql(histoire.error);
  if (!Array.isArray(histoire.data)) throw new ErreurSuiviAnam("indisponible");
  return { revision: v.revision, pause: v.pause, cap: v.cap, synthese: v.synthese, reperes: v.reperes,
    etapes, niveauArbre: v.niveau_arbre, majLe: v.maj_le, evenements: histoire.data.map(evenement) };
}

export async function modifierSuiviPersonnel(supabase: SupabaseClient, utilisatriceId: string,
  commande: CommandePersonnelleSuivi): Promise<SuiviAnam> {
  if (!commandePersonnelleSuiviValide(commande)) throw new ErreurSuiviAnam("invalide");
  const { error } = await supabase.rpc("modifier_suivi_personnel", { p_revision: commande.revision, p_commande: commande });
  erreurSql(error);
  const suivi = await lireSuiviAnam(supabase, utilisatriceId);
  if (!suivi) throw new ErreurSuiviAnam("indisponible");
  return suivi;
}

export async function lireRecuSuiviAnam(supabase: SupabaseClient, cleTour: string,
  messageSource: string): Promise<{ type: "ajuster" | "avancer" } | null> {
  const { data, error } = await supabase.rpc("lire_recu_suivi", { p_cle_tour: cleTour, p_message_source: messageSource });
  erreurSql(error);
  if (data === null) return null;
  if (!objet(data) || !["ajuster", "avancer"].includes(String(data.type)) || Object.keys(data).length !== 1) {
    throw new ErreurSuiviAnam("indisponible");
  }
  return { type: data.type as "ajuster" | "avancer" };
}

/**
 * Exception bornée analogue à consigner_tour_anam : le serveur atteste une commande native.
 * Le rôle privilégié reçoit uniquement une mutation fermée, jamais une lecture libre de contenu.
 * SQL revalide identité, source du journal, droits, preuve, version et idempotence atomiquement.
 */
export async function appliquerOutilSuiviAnam(p: {
  utilisatriceId: string; cleTour: string; revision: number; commande: CommandeOutilSuivi;
}): Promise<SuiviAnam> {
  if (!revisionSuiviValide(p.revision) || !commandeOutilSuiviValide(p.commande) ||
      typeof p.cleTour !== "string" || p.cleTour.length < 1 || p.cleTour.length > 200) {
    throw new ErreurSuiviAnam("invalide");
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.id !== p.utilisatriceId) throw new ErreurSuiviAnam("refuse");
  const { error } = await createSupabaseAdminClient().rpc("appliquer_outil_suivi_anam", {
    p_utilisatrice_id: p.utilisatriceId, p_cle_tour: p.cleTour, p_revision: p.revision, p_commande: p.commande,
  });
  erreurSql(error);
  const suivi = await lireSuiviAnam(supabase, p.utilisatriceId);
  if (!suivi) throw new ErreurSuiviAnam("indisponible");
  return suivi;
}
