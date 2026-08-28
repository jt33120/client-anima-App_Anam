import { redirect } from "next/navigation";
import RecupererProtection from "../../passkeys/RecupererProtection";
import {
  authentificationRecente,
  passkeysActives,
} from "@/lib/auth/verrou-prive";
import { createSupabaseServerClient } from "@/lib/data/supabase/server";
import s from "../../protection.module.css";

const METHODES_COURRIEL = new Set(["email", "otp", "magiclink", "recovery"]);

export const dynamic = "force-dynamic";
export const metadata = { title: "Anam" };

export default async function PageRecupererProtection() {
  if (!passkeysActives()) redirect("/");
  const supabase = await createSupabaseServerClient();
  const [utilisateur, jeton] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getClaims(),
  ]);
  if (!utilisateur.data.user) {
    redirect("/entrer?recuperation=1&vers=%2Fsecuriser%2Frecuperer");
  }
  if (
    !authentificationRecente(jeton.data?.claims, METHODES_COURRIEL, 15 * 60)
  ) {
    redirect("/entrer?recuperation=1&vers=%2Fsecuriser%2Frecuperer");
  }

  return (
    <main className={s.page}>
      <section className={s.carte} aria-labelledby="titre-recuperation">
        <p className="t-surtitre">Récupération vérifiée</p>
        <h1 id="titre-recuperation" className="t-display">Retrouver mon accès</h1>
        <div className={s.explication}>
          <p className="t-anam">Ton e-mail vient de confirmer que ce compte est bien le tien.</p>
          <p className={s.fait}>
            Continuer supprimera les anciennes clés d’accès. Tu pourras ensuite en créer une
            nouvelle depuis Réglages. Aucune donnée personnelle n’est effacée.
          </p>
        </div>
        <div className={s.actions}>
          <RecupererProtection />
          <a className={s.lienDiscret} href="/verrou">Annuler</a>
        </div>
      </section>
    </main>
  );
}
