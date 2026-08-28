"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { oublierVerrouLocal } from "@/lib/auth/verrou-local";
import s from "./reglages.module.css";

type CleAffichable = {
  readonly id: string;
  readonly nom: string;
  readonly creeeLe: string;
  readonly utiliseeLe: string | null;
};

type Resultat =
  | { readonly ok: true; readonly destination: string }
  | { readonly ok: false; readonly message: string };

function dateLisible(valeur: string): string {
  const date = new Date(valeur);
  return Number.isNaN(date.getTime())
    ? "date inconnue"
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}

export default function GestionPasskeys({
  protectionActive,
  clesInitiales,
  supprimer,
}: {
  readonly protectionActive: boolean;
  readonly clesInitiales: readonly CleAffichable[];
  readonly supprimer: (id: string) => Promise<Resultat>;
}) {
  const routeur = useRouter();
  const [cles, setCles] = useState(clesInitiales);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function retirer(id: string) {
    if (
      cles.length === 1 &&
      !window.confirm(
        "Retirer cette dernière clé désactivera la protection de l’application. Continuer ?",
      )
    ) return;
    setEnCours(id);
    setMessage(null);
    try {
      const resultat = await supprimer(id);
      if (!resultat.ok) {
        setMessage(resultat.message);
        return;
      }
      const restantes = cles.filter((cle) => cle.id !== id);
      setCles(restantes);
      if (restantes.length === 0) oublierVerrouLocal();
      routeur.refresh();
    } catch {
      setMessage("La clé n’a pas pu être retirée. Réessaie.");
    } finally {
      setEnCours(null);
    }
  }

  return (
    <section className={s.section} aria-labelledby="titre-protection-appareil">
      <h2 id="titre-protection-appareil" className={s.titre}>Protection de l&rsquo;application</h2>
      <p className={s.description}>
        {protectionActive && cles.length > 0
          ? "Anam demande Face ID, Touch ID, l’empreinte ou le code/PIN de l’appareil après chaque nouvelle ouverture."
          : "Ajoute une clé d’accès pour que la longue session e-mail ne suffise pas à voir tes données."}
      </p>
      {cles.length > 0 ? (
        <ul className={s.listePasskeys}>
          {cles.map((cle) => (
            <li key={cle.id} className={s.passkey}>
              <div>
                <p className={s.etat}>{cle.nom}</p>
                <p className={s.metaPasskey}>
                  Créée le {dateLisible(cle.creeeLe)}
                  {cle.utiliseeLe ? ` · utilisée le ${dateLisible(cle.utiliseeLe)}` : ""}
                </p>
              </div>
              <button
                type="button"
                className={s.bouton}
                disabled={enCours !== null}
                onClick={() => void retirer(cle.id)}
              >
                {enCours === cle.id ? "Suppression…" : "Retirer"}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {message ? <p className={s.message} role="alert">{message}</p> : null}
      <a className={s.lienBouton} href="/securiser?vers=%2Freglages">
        {cles.length > 0 ? "Ajouter une autre clé" : "Activer la protection"}
      </a>
      <p className={s.description}>
        La biométrie reste dans l&rsquo;appareil ; Anam ne reçoit qu&rsquo;une preuve cryptographique.
      </p>
    </section>
  );
}
