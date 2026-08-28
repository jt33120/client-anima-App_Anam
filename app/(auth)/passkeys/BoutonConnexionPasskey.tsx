"use client";

import { browserSupportsWebAuthn, startAuthentication } from "@simplewebauthn/browser";
import { useState } from "react";
import { noterVerrouRequis } from "@/lib/auth/verrou-local";
import {
  commencerConnexionPasskey,
  verifierConnexionPasskey,
} from "./actions";
import s from "../protection.module.css";

function messageNavigateur(erreur: unknown): string {
  if (erreur instanceof Error && erreur.name === "NotAllowedError") {
    return "La demande a été fermée ou a expiré. Rien n’a été modifié.";
  }
  return "L’appareil n’a pas pu ouvrir la reconnexion sécurisée. Essaie l’e-mail.";
}

export default function BoutonConnexionPasskey({
  vers = "/",
  libelle = "Me reconnecter avec Face ID ou mon code",
}: {
  readonly vers?: string;
  readonly libelle?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function connecter() {
    setMessage(null);
    if (!browserSupportsWebAuthn()) {
      setMessage("Ce navigateur ne prend pas en charge les clés d’accès. Utilise l’e-mail.");
      return;
    }
    setEnCours(true);
    try {
      const debut = await commencerConnexionPasskey();
      if (!debut.ok) {
        setMessage(debut.message);
        return;
      }
      const credential = await startAuthentication({ optionsJSON: debut.options });
      const resultat = await verifierConnexionPasskey(debut.challengeId, credential, vers);
      if (!resultat.ok) {
        setMessage(resultat.message);
        return;
      }
      noterVerrouRequis();
      window.location.assign(resultat.destination);
    } catch (erreur) {
      setMessage(messageNavigateur(erreur));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className={s.actionIsolee}>
      <button
        type="button"
        className={s.boutonPrincipal}
        onClick={connecter}
        disabled={enCours}
        aria-describedby={message ? "erreur-passkey-connexion" : undefined}
      >
        <span className="t-bouton">{enCours ? "Vérification…" : libelle}</span>
      </button>
      {message ? (
        <p id="erreur-passkey-connexion" className={s.erreur} role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
