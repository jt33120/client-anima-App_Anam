"use client";

import { browserSupportsWebAuthn, startRegistration } from "@simplewebauthn/browser";
import { useState } from "react";
import { noterVerrouRequis } from "@/lib/auth/verrou-local";
import {
  commencerInscriptionPasskey,
  verifierInscriptionPasskey,
} from "./actions";
import s from "../protection.module.css";

export default function EnrolerPasskey({
  vers = "/",
  libelle = "Activer la protection sur cet appareil",
}: {
  readonly vers?: string;
  readonly libelle?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function enroler() {
    setMessage(null);
    if (!browserSupportsWebAuthn()) {
      setMessage("Cet appareil ne sait pas créer de clé d’accès. Tu peux continuer par e-mail.");
      return;
    }
    setEnCours(true);
    try {
      const debut = await commencerInscriptionPasskey();
      if (!debut.ok) {
        setMessage(debut.message);
        return;
      }
      const credential = await startRegistration({ optionsJSON: debut.options });
      const resultat = await verifierInscriptionPasskey(debut.challengeId, credential, vers);
      if (!resultat.ok) {
        setMessage(resultat.message);
        return;
      }
      noterVerrouRequis();
      window.location.assign(resultat.destination);
    } catch (erreur) {
      setMessage(
        erreur instanceof Error && erreur.name === "NotAllowedError"
          ? "La demande a été fermée ou a expiré. Rien n’a été enregistré."
          : "L’appareil n’a pas pu créer la clé d’accès. Réessaie ou continue par e-mail.",
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className={s.actionIsolee}>
      <button
        type="button"
        className={s.boutonPrincipal}
        onClick={enroler}
        disabled={enCours}
        aria-describedby={message ? "erreur-passkey-inscription" : undefined}
      >
        <span className="t-bouton">{enCours ? "Activation…" : libelle}</span>
      </button>
      {message ? (
        <p id="erreur-passkey-inscription" className={s.erreur} role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
