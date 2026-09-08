import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/data/supabase/server";
import { lireLectureNumerologie, noterLectureNumerologie } from "@/lib/data/depot-lecture-numerologie";
import { genererLectureNumerologie } from "@/lib/ai/lecture-numerologie";
import { verifierDroitsArt9 } from "@/lib/ai/egress-guard";
import { ENTETES_ART9 } from "@/lib/ai/entetes-art9";
import { validerNoteNumerologie } from "@/lib/domain/lecture-numerologie";

export const maxDuration = 60;
const repondre = (corps: unknown, status = 200) => NextResponse.json(corps, {status, headers: ENTETES_ART9});
const erreur = (code: string, message: string, status: number) => repondre({code, message}, status);

async function session() {
  const supabase = await createSupabaseServerClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return { refus: erreur("non_authentifie", "Reconnecte-toi pour retrouver ta lecture.", 401) };
  if (await verifierDroitsArt9(supabase)) return { refus: erreur("droits_retires", "Ton accord est nécessaire pour accéder à cette lecture.", 403) };
  return { supabase, user };
}
function originePermise(request: Request): boolean {
  return request.headers.get("origin") === new URL(request.url).origin &&
    !["cross-site", "same-site"].includes(request.headers.get("sec-fetch-site") ?? "");
}
async function corpsBorne(request: Request): Promise<unknown> {
  const lecteur = request.body?.getReader();
  if (!lecteur) return {};
  const morceaux: Uint8Array[] = [];
  let taille = 0;
  try {
    for (;;) {
      const {done, value} = await lecteur.read();
      if (done) break;
      taille += value.byteLength;
      if (taille > 1024) { await lecteur.cancel(); throw new Error("corps_trop_long"); }
      morceaux.push(value);
    }
  } finally { lecteur.releaseLock(); }
  const brut = Buffer.concat(morceaux).toString("utf8");
  return brut.length ? JSON.parse(brut) : {};
}

export async function GET() {
  try {
    const courant = await session();
    if (courant.refus) return courant.refus;
    return repondre({lecture: await lireLectureNumerologie(courant.supabase!, courant.user!.id)});
  } catch { return erreur("lecture_indisponible", "Ta lecture n’a pas pu être chargée. Réessaie.", 503); }
}
export async function POST(request: Request) {
  if (!originePermise(request)) return erreur("origine_refusee", "Ouvre cette action depuis l’app.", 403);
  try {
    const courant = await session();
    if (courant.refus) return courant.refus;
    const corps = await corpsBorne(request).catch(() => null);
    if (!corps || typeof corps !== "object" || Array.isArray(corps) || Object.keys(corps).length) return erreur("requete_invalide", "La demande est invalide.", 400);
    const resultat = await genererLectureNumerologie(courant.supabase!, courant.user!.id);
    if (resultat.statut === "en_cours") return erreur("en_cours", "Ta lecture est en préparation. Réessaie dans un instant.", 409);
    if (resultat.statut === "limite") return erreur("limite", "Plusieurs essais ont déjà eu lieu. Réessaie demain.", 429);
    if (!("lecture" in resultat) || !resultat.lecture) return erreur("lecture_perimee", "Tes repères ont changé. Recharge la page.", 409);
    return repondre({lecture: resultat.lecture});
  } catch (e) {
    if (e instanceof Error && e.message === "numerologie_lecture_perimee") return erreur("lecture_perimee", "Tes repères ont changé. Recharge la page.", 409);
    return erreur("generation_indisponible", "La lecture n’a pas pu être créée. Réessaie dans deux minutes.", 503); }
}
export async function PATCH(request: Request) {
  if (!originePermise(request)) return erreur("origine_refusee", "Ouvre cette action depuis l’app.", 403);
  try {
    const courant = await session();
    if (courant.refus) return courant.refus;
    const note = validerNoteNumerologie(await corpsBorne(request).catch(() => null));
    if (!note) return erreur("note_invalide", "Choisis une note de 1 à 5. Le partage nécessite 5 étoiles.", 400);
    await noterLectureNumerologie(courant.supabase!, note);
    return repondre({lecture: await lireLectureNumerologie(courant.supabase!, courant.user!.id)});
  } catch (e) {
    if (e instanceof Error && e.message === "numerologie_lecture_perimee") return erreur("lecture_perimee", "Tes repères ont changé. Recharge la page.", 409);
    return erreur("notation_indisponible", "L’enregistrement de ton choix n’a pas pu être confirmé. Recharge la lecture pour vérifier son état.", 503); }
}
