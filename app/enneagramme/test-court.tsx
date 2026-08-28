"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import GlypheUnivers from "@/render/GlypheUnivers";
import {
  conclureTest,
  enregistrerReponses,
  recommencerTest,
  type EtatTest,
} from "./actions";
import s from "./enneagramme.module.css";

export interface ItemAffiche {
  readonly id: string;
  readonly texte: string;
}

type ValeurReponseClient = number | null;
type IssueInitiale = "en_cours" | "indetermine";

function GlyphesFrequence({ niveau }: { readonly niveau: number }) {
  return (
    <span className={s.glyphesFrequence} aria-hidden>
      {Array.from({ length: niveau + 1 }, (_, index) => (
        <span className={s.glypheFrequence} key={index}>
          <GlypheUnivers cle="psychologie" />
        </span>
      ))}
    </span>
  );
}

/**
 * Questionnaire court, repris depuis la tentative RLS et jamais depuis le stockage du navigateur.
 * Le barème reste côté serveur ; `null` signifie explicitement « Je ne sais pas » et n'est jamais
 * converti en zéro. Les clés de réponse restent stables afin de conserver le focus entre items.
 */
export default function TestCourt({
  items,
  libelles,
  libelleInconnu,
  reponsesInitiales,
  nouvelle,
  issueInitiale,
  introduction,
}: {
  items: readonly ItemAffiche[];
  readonly libelles: readonly string[];
  readonly libelleInconnu: string;
  readonly reponsesInitiales: Readonly<Record<string, ValeurReponseClient>>;
  readonly nouvelle: boolean;
  readonly issueInitiale: IssueInitiale;
  readonly introduction: ReactNode;
}) {
  const router = useRouter();
  const [reponses, setReponses] = useState<Record<string, ValeurReponseClient>>({
    ...reponsesInitiales,
  });
  const [etat, setEtat] = useState<EtatTest>({ statut: issueInitiale });
  const [demarre, setDemarre] = useState(
    !nouvelle || Object.keys(reponsesInitiales).length > 0,
  );
  const [envoi, setEnvoi] = useState(false);
  const verrou = useRef(false);

  const courant = items.find((item) => !Object.hasOwn(reponses, item.id)) ?? null;

  async function repondre(itemId: string, valeur: ValeurReponseClient) {
    if (verrou.current) return;
    verrou.current = true;
    setEnvoi(true);

    const suivantes = { ...reponses, [itemId]: valeur };
    setReponses(suivantes);
    setEtat({ statut: "en_cours" });

    const reste = items.some((item) => !Object.hasOwn(suivantes, item.id));
    try {
      if (reste) {
        const { ok } = await enregistrerReponses(suivantes);
        if (!ok) setEtat({ statut: "erreur", message: "Ta réponse n’est pas encore enregistrée." });
        return;
      }

      const resultat = await conclureTest(suivantes);
      if (resultat.statut === "retenu") {
        router.refresh();
        return;
      }
      setEtat(resultat);
    } finally {
      verrou.current = false;
      setEnvoi(false);
    }
  }

  async function recommencer() {
    if (verrou.current) return;
    verrou.current = true;
    setEnvoi(true);
    try {
      await recommencerTest();
      router.refresh();
    } finally {
      verrou.current = false;
      setEnvoi(false);
    }
  }

  async function finaliser() {
    if (verrou.current) return;
    verrou.current = true;
    setEnvoi(true);
    try {
      const resultat = await conclureTest(reponses);
      if (resultat.statut === "retenu") {
        router.refresh();
        return;
      }
      setEtat(resultat);
    } finally {
      verrou.current = false;
      setEnvoi(false);
    }
  }

  if (!demarre) {
    return (
      <>
        {introduction}
        <section className={s.bloc} aria-label="Commencer l’exploration">
          <button type="button" className={s.bouton} onClick={() => setDemarre(true)}>
            <span className="t-bouton">Commencer</span>
          </button>
        </section>
      </>
    );
  }

  if (etat.statut === "indetermine") {
    return (
      <section
        className={`${s.bloc} fondu-texte`}
        aria-label="Résultat sans type"
        aria-busy={envoi}
      >
        <h2 className="t-titre-sm">Le résultat reste ouvert</h2>
        <p className="t-corps">
          Tes réponses ne permettent pas de retenir un type sans en inventer un. C’est un résultat
          valable&nbsp;: aucun type n’est enregistré.
        </p>
        <p className="t-corps">Tu peux t’arrêter ici ou reprendre depuis le début.</p>
        <button type="button" className={s.discret} disabled={envoi} onClick={recommencer}>
          <span className="t-bouton">Reprendre depuis le début</span>
        </button>
      </section>
    );
  }

  if (!courant) {
    return (
      <section className={s.bloc} aria-live="polite" aria-busy={envoi}>
        <p className="t-corps">{envoi ? "Enregistrement…" : "Tes réponses sont enregistrées."}</p>
        {!envoi ? (
          <button type="button" className={s.bouton} onClick={finaliser}>
            <span className="t-bouton">Voir ce qui ressort</span>
          </button>
        ) : null}
        {etat.statut === "erreur" ? (
          <p className={s.erreur} role="alert">
            {etat.message}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className={s.bloc} aria-label="Le questionnaire">
      <fieldset className={s.question} aria-busy={envoi}>
        <legend key={courant.id} className={`${s.enonce} t-corps fondu-texte`}>
          {courant.texte}
        </legend>
        <ul className={s.reponses}>
          {libelles.map((libelle, niveau) => (
            <li key={libelle}>
              <button
                type="button"
                className={s.reponse}
                disabled={envoi}
                onClick={() => repondre(courant.id, niveau)}
              >
                <GlyphesFrequence niveau={niveau} />
                <span className="t-corps">{libelle}</span>
              </button>
            </li>
          ))}
          <li key={libelleInconnu}>
            <button
              type="button"
              className={s.reponse}
              disabled={envoi}
              onClick={() => repondre(courant.id, null)}
            >
              <span className={`${s.glypheInconnu} t-titre-sm`} aria-hidden>
                ?
              </span>
              <span className="t-corps">{libelleInconnu}</span>
            </button>
          </li>
        </ul>
      </fieldset>
      {etat.statut === "erreur" ? (
        <p className={s.erreur} role="alert">
          {etat.message}
        </p>
      ) : null}
    </section>
  );
}
