"use client";

import { useEffect } from "react";
import s from "./erreur-application.module.css";

interface ErreurAvecEmpreinte extends Error {
  readonly digest?: string;
}

export default function ErreurApplication({
  error,
  retry,
  globale = false,
}: {
  readonly error: ErreurAvecEmpreinte;
  readonly retry: () => void;
  readonly globale?: boolean;
}) {
  useEffect(() => {
    // Le message peut contenir des données de l'utilisatrice. Seule l'empreinte opaque de Next
    // traverse le journal client ; aucune donnée art. 9 ni pile n'est recopiée ici.
    console.error("[rendu] frontière d’erreur", { digest: error.digest ?? "absent" });
  }, [error]);

  return (
    <main className={`${s.page} ${globale ? s.pageGlobale : ""}`}>
      <section className={s.carte} aria-labelledby="titre-erreur">
        <p className={s.surtitre}>Anima</p>
        <h1 id="titre-erreur" className={s.titre}>
          Cette page n’a pas pu s’ouvrir
        </h1>
        <p className={s.texte}>Tu peux reprendre l’ouverture ou revenir à ton espace.</p>
        <div className={s.actions}>
          <button type="button" className={s.actionPrimaire} onClick={retry}>
            Réessayer
          </button>
          <a className={s.actionSecondaire} href="/">
            Revenir à Moi
          </a>
        </div>
        <a className={s.aide} href="/aide">
          Ouvrir l’aide
        </a>
      </section>
    </main>
  );
}
