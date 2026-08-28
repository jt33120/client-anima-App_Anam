import { redirect } from "next/navigation";
import { etapeOnboardingPour } from "@/app/(auth)/etat-onboarding";
import EnrolerPasskey from "../passkeys/EnrolerPasskey";
import {
  destinationInterne,
  lireDeverrouillage,
  passkeyRequise,
  passkeysActives,
  sessionDeverrouillee,
} from "@/lib/auth/verrou-prive";
import { createSupabaseServerClient } from "@/lib/data/supabase/server";
import s from "../protection.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Anam" };

export default async function PageSecuriser({
  searchParams,
}: {
  readonly searchParams: Promise<{ vers?: string }>;
}) {
  const vers = destinationInterne((await searchParams).vers);
  if (!passkeysActives()) redirect(vers);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrer?vers=${encodeURIComponent(vers)}`);

  const etape = await etapeOnboardingPour(supabase, user.id);
  if (etape === "barre") redirect("/barriere");
  if (etape === "mineur") {
    await supabase.auth.signOut();
    redirect("/entrer?refus=age");
  }
  if (etape === "naissance") redirect("/naissance");
  if (etape === "consentement") redirect("/consentement");
  if (etape === "revoque") redirect("/consentement/revoque");

  const dejaProtegee = passkeyRequise(user);
  if (dejaProtegee) {
    const { data: jeton } = await supabase.auth.getClaims();
    if (!sessionDeverrouillee(jeton?.claims, await lireDeverrouillage())) {
      redirect(`/verrou?vers=${encodeURIComponent(`/securiser?vers=${encodeURIComponent(vers)}`)}`);
    }
  }

  return (
    <main className={s.page}>
      <section className={s.carte} aria-labelledby="titre-protection">
        <p className="t-surtitre">{dejaProtegee ? "Tes clés d’accès" : "Avant d’entrer"}</p>
        <h1 id="titre-protection" className="t-display">
          {dejaProtegee ? "Ajouter cet appareil" : "Protéger cet espace privé"}
        </h1>
        <div className={s.explication}>
          <p className="t-anam">
            {dejaProtegee
              ? "Crée une autre clé d’accès pour pouvoir entrer depuis cet appareil."
              : "Une fois activée, cette protection sera demandée à chaque nouvelle ouverture de l’application."}
          </p>
          <p className={s.fait}>
            Elle repose sur WebAuthn : Face ID, Touch ID, l’empreinte ou le code/PIN vérifient que
            c’est bien toi. La biométrie ne quitte jamais l’appareil.
          </p>
        </div>
        <div className={s.actions}>
          <EnrolerPasskey
            vers={vers}
            libelle={dejaProtegee ? "Ajouter une clé sur cet appareil" : undefined}
          />
          {dejaProtegee ? (
            <a className={s.lienSecondaire} href={vers}>Terminer</a>
          ) : (
            <a className={s.lienDiscret} href={vers}>
              Continuer par e-mail pour cette fois
            </a>
          )}
        </div>
      </section>
    </main>
  );
}
