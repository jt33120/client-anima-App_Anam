import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/data/supabase/server";
import { ErreurSuiviAnam, lireSuiviAnam, modifierSuiviPersonnel } from "@/lib/data/depot-suivi-anam";
import { commandePersonnelleSuiviValide } from "@/lib/domain/suivi-anam";
import { ENTETES_ART9 } from "@/lib/ai/entetes-art9";

const reponse = (corps: unknown, status = 200) => NextResponse.json(corps, { status, headers: ENTETES_ART9 });
function refus(e: unknown) {
  const code = e instanceof ErreurSuiviAnam ? e.code : "indisponible";
  return reponse({ code, ...(code === "indisponible" ? { statut: "indisponible" } : {}) },
    { conflit: 409, refuse: 403, invalide: 400, indisponible: 503 }[code]);
}
export async function GET(request: Request): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return reponse({ code: "non_authentifie" }, 401);
    if (request.headers.get("X-Anam-Compte") !== user.id) return reponse({ code: "session_modifiee" }, 409);
    const suivi = await lireSuiviAnam(supabase, user.id);
    return reponse(suivi ? { statut: "disponible", suivi } : { statut: "absent", suivi: null });
  } catch (e) { return refus(e); }
}
/** Les commandes natives de l'agent ne sont jamais acceptées depuis le navigateur. */
export async function POST(request: Request): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return reponse({ code: "non_authentifie" }, 401);
    if (request.headers.get("X-Anam-Compte") !== user.id) return reponse({ code: "session_modifiee" }, 409);
    const corps: unknown = await request.json().catch(() => null);
    if (!commandePersonnelleSuiviValide(corps)) return reponse({ code: "invalide" }, 400);
    const suivi = await modifierSuiviPersonnel(supabase, user.id, corps);
    return reponse({ statut: "disponible", suivi });
  } catch (e) { return refus(e); }
}
