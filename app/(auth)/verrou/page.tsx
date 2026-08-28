import { redirect } from "next/navigation";
import BoutonConnexionPasskey from "../passkeys/BoutonConnexionPasskey";
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

export default async function PageVerrou({
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
  if (!passkeyRequise(user)) redirect(`/securiser?vers=${encodeURIComponent(vers)}`);

  const { data: jeton } = await supabase.auth.getClaims();
  if (sessionDeverrouillee(jeton?.claims, await lireDeverrouillage())) redirect(vers);

  const retourRecuperation = "/securiser/recuperer";
  return (
    <main className={s.page}>
      <section className={s.carte} aria-labelledby="titre-verrou">
        <p className="t-surtitre">Espace privé</p>
        <h1 id="titre-verrou" className="t-display">Déverrouiller Anam</h1>
        <div className={s.explication}>
          <p className="t-anam">
            Ton téléphone va te demander Face ID, Touch ID, ton empreinte ou son code/PIN.
          </p>
          <p className={s.fait}>
            Ces données restent dans ton appareil. Anam reçoit seulement une preuve signée.
          </p>
        </div>
        <div className={s.actions}>
          <BoutonConnexionPasskey vers={vers} libelle="Déverrouiller avec mon appareil" />
          <a
            className={s.lienDiscret}
            href={`/entrer?recuperation=1&vers=${encodeURIComponent(retourRecuperation)}`}
          >
            Je n&rsquo;ai plus accès à ma clé
          </a>
        </div>
      </section>
    </main>
  );
}
