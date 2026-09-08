import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EntreesNumerologie } from "@/lib/astro/numerologie";
import { lireNumerologie } from "./lire-numerologie";
import { createSupabaseAdminClient } from "./supabase/admin";
import { VERSION_LECTURE_NUMEROLOGIE, type LectureNumerologieVue, type TexteLectureNumerologie } from "@/lib/domain/lecture-numerologie";

export function sourceNumerologie(entrees: EntreesNumerologie): string {
  return createHash("md5").update(`${entrees.date}|${entrees.nomComplet ?? ""}`).digest("hex");
}
export interface LigneLectureNumerologie {
  id: string; annee: number; source: string; version: string;
  guidance_annee: string | null; vision_long_terme: string | null; portrait: string | null;
  note: number | null; partage_anam: boolean;
}
export function vueLectureNumerologie(ligne: LigneLectureNumerologie): LectureNumerologieVue | null {
  if (!ligne.guidance_annee || !ligne.vision_long_terme || !ligne.portrait) return null;
  return { id: ligne.id, annee: ligne.annee, guidanceAnnee: ligne.guidance_annee, visionLongTerme: ligne.vision_long_terme, portrait: ligne.portrait, note: ligne.note, partageAnam: ligne.note === 5 && ligne.partage_anam };
}
export async function lireLectureNumerologie(supabase: SupabaseClient, utilisatriceId: string): Promise<LectureNumerologieVue | null> {
  const {data, error} = await supabase.from("lecture_numerologie")
    .select("id,annee,source,version,guidance_annee,vision_long_terme,portrait,note,partage_anam")
    .eq("utilisatrice_id", utilisatriceId).eq("version", VERSION_LECTURE_NUMEROLOGIE).maybeSingle<LigneLectureNumerologie>();
  if (error) throw new Error("lecture_numerologie_indisponible");
  return data ? vueLectureNumerologie(data) : null;
}
export async function commencerLectureNumerologie(supabase: SupabaseClient, utilisatriceId: string) {
  const calcul = await lireNumerologie(supabase, utilisatriceId, new Date());
  if (calcul.statut !== "calcule") throw new Error("naissance_indisponible");
  const {data, error} = await supabase.rpc("commencer_lecture_numerologie", {
    p_source: sourceNumerologie(calcul.entrees), p_annee: calcul.numerologie.anneeDeReference,
  });
  if (error) throw new Error("reservation_numerologie_indisponible");
  return { reservation: data as {statut: "prete" | "en_cours" | "patience" | "limite" | "reservee"; reessaiApres?: number; id?: string; jeton?: string}, numerologie: calcul.numerologie };
}
export async function lireEtatLectureNumerologie(supabase: SupabaseClient): Promise<{statut: "absente" | "prete" | "en_cours" | "patience" | "limite"; reessaiApres?: number}> {
  const {data, error} = await supabase.rpc("etat_lecture_numerologie");
  if (error) throw new Error("lecture_numerologie_indisponible");
  return data;
}
export async function terminerLectureNumerologie(utilisatriceId: string, jeton: string, texte: TexteLectureNumerologie | null): Promise<void> {
  const {error} = await createSupabaseAdminClient().rpc("terminer_lecture_numerologie", {
    p_utilisatrice_id: utilisatriceId, p_jeton: jeton,
    p_guidance: texte?.guidanceAnnee ?? null, p_vision: texte?.visionLongTerme ?? null, p_portrait: texte?.portrait ?? null,
  });
  if (error) throw new Error("ecriture_numerologie_indisponible");
}
export async function noterLectureNumerologie(supabase: SupabaseClient, note: {id:string; note:number; partagerAnam:boolean}): Promise<void> {
  const {error} = await supabase.rpc("noter_lecture_numerologie", { p_id: note.id, p_note: note.note, p_partager: note.partagerAnam });
  if (error) throw new Error(error.code === "22023" ? "numerologie_lecture_perimee" : "notation_numerologie_indisponible");
}
