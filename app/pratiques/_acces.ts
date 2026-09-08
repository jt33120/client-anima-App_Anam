import { redirect } from "next/navigation";
import { etapeOnboardingPour } from "@/app/(auth)/etat-onboarding";
import { createSupabaseServerClient } from "@/lib/data/supabase/server";

/** Chaque page vérifie son accès ; un layout conservé ne suffit pas après révocation. */
export async function verifierAccesPratiques() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/entrer");
  const etape = await etapeOnboardingPour(supabase, auth.user.id);
  if (etape === "barre") redirect("/barriere");
  if (etape === "mineur") {
    await supabase.auth.signOut();
    redirect("/entrer?refus=age");
  }
  if (etape === "naissance") redirect("/naissance");
  if (etape === "consentement") redirect("/consentement");
  if (etape === "revoque") redirect("/consentement/revoque");
}
