"use client";

import { useState } from "react";
import { oublierVerrouLocal } from "@/lib/auth/verrou-local";
import { recupererProtectionParEmail } from "./actions";
import s from "../protection.module.css";

export default function RecupererProtection() {
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function recuperer() {
    setMessage(null);
    setEnCours(true);
    try {
      const resultat = await recupererProtectionParEmail();
      if (!resultat.ok) {
        setMessage(resultat.message);
        return;
      }
      oublierVerrouLocal();
      window.location.assign(resultat.destination);
    } catch {
      setMessage("La récupération n’a pas abouti. Réessaie sans fermer cette page.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className={s.actionIsolee}>
      <button type="button" className={s.boutonPrincipal} onClick={recuperer} disabled={enCours}>
        <span className="t-bouton">{enCours ? "Vérification…" : "Retirer les anciennes clés"}</span>
      </button>
      {message ? <p className={s.erreur} role="alert">{message}</p> : null}
    </div>
  );
}
