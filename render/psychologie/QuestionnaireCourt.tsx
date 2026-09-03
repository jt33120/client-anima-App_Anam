"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import GlypheUnivers from "@/render/GlypheUnivers";
import s from "./questionnaire.module.css";

/**
 * QuestionnaireCourt.tsx — L'ÉCRAN PARTAGÉ DES DEUX INVENTAIRES (2026-09-03).
 *
 * Né `app/enneagramme/test-court.tsx` (Story 5.5), déplacé ici le jour où le Big Five est arrivé
 * avec exactement le même écran. Ce qui est partagé est la MÉCANIQUE — le verrou d'envoi,
 * l'enregistrement optimiste, l'appariement par identifiant — c'est-à-dire la partie qu'on ne veut
 * surtout pas corriger d'un seul côté. Les MOTS, eux, descendent en propriétés.
 *
 * ⚠️ NI LE BARÈME, NI LES ACTIONS NE SONT ÉCRITS ICI. `render/` ne peut importer ni `@/lib/domain`
 * ni `@/app/*` (AD-7/AD-10) : les trois gestes serveur arrivent en propriétés, et c'est ce qui rend
 * la frontière structurelle plutôt que disciplinaire. Le score se calcule côté serveur, sur les
 * réponses RELUES EN BASE — ce composant n'a jamais reçu de total, il ne peut donc pas en peindre
 * un (FR-031).
 */

export interface ItemAffiche {
  readonly id: string;
  readonly texte: string;
}

type ValeurReponseClient = number | null;
type IssueInitiale = "en_cours" | "indetermine";

/**
 * L'issue d'un envoi, telle que l'écran a besoin de la connaître.
 *
 * ⚠️ DÉCLARÉE ICI ET NON IMPORTÉE, parce que `render/` ne peut pas importer `app/`. Les deux modules
 * d'actions rendent une union structurellement identique ; TypeScript vérifie l'accord à chaque
 * point d'appel, et un cinquième statut ajouté d'un seul côté ne compile pas.
 */
export type EtatQuestionnaire =
  | { readonly statut: "en_cours" }
  | { readonly statut: "erreur"; readonly message: string }
  | { readonly statut: "retenu" }
  | { readonly statut: "indetermine" };

/** Les trois gestes serveur. Aucun ne lève : ils rendent un état, et l'écran le dit. */
export interface ActionsQuestionnaire {
  readonly enregistrer: (reponses: Record<string, ValeurReponseClient>) => Promise<{ ok: boolean }>;
  readonly conclure: (reponses: Record<string, ValeurReponseClient>) => Promise<EtatQuestionnaire>;
  readonly recommencer: () => Promise<void>;
}

/** Ce que le questionnaire dit de lui-même. Miroir de `CopieQuestionnaire` (`lib/domain`). */
export interface CopieQuestionnaireVue {
  readonly commencer: string;
  readonly libelleCommencer: string;
  readonly libelleQuestionnaire: string;
  readonly libelleSansResultat: string;
  readonly titreSansResultat: string;
  readonly corpsSansResultat: readonly string[];
  readonly reprendre: string;
  readonly enregistrement: string;
  readonly enregistre: string;
  readonly voir: string;
  readonly erreurReponse: string;
}

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
export default function QuestionnaireCourt({
  items,
  libelles,
  libelleInconnu,
  reponsesInitiales,
  nouvelle,
  issueInitiale,
  introduction,
  actions,
  copie,
}: {
  items: readonly ItemAffiche[];
  readonly libelles: readonly string[];
  readonly libelleInconnu: string;
  readonly reponsesInitiales: Readonly<Record<string, ValeurReponseClient>>;
  readonly nouvelle: boolean;
  readonly issueInitiale: IssueInitiale;
  readonly introduction: ReactNode;
  readonly actions: ActionsQuestionnaire;
  readonly copie: CopieQuestionnaireVue;
}) {
  const router = useRouter();
  const [reponses, setReponses] = useState<Record<string, ValeurReponseClient>>({
    ...reponsesInitiales,
  });
  const [etat, setEtat] = useState<EtatQuestionnaire>({ statut: issueInitiale });
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
        const { ok } = await actions.enregistrer(suivantes);
        if (!ok) setEtat({ statut: "erreur", message: copie.erreurReponse });
        return;
      }

      const resultat = await actions.conclure(suivantes);
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
      await actions.recommencer();
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
      const resultat = await actions.conclure(reponses);
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
        <section className={s.bloc} aria-label={copie.libelleCommencer}>
          <button type="button" className={s.bouton} onClick={() => setDemarre(true)}>
            <span className="t-bouton">{copie.commencer}</span>
          </button>
        </section>
      </>
    );
  }

  if (etat.statut === "indetermine") {
    return (
      <section
        className={`${s.bloc} fondu-texte`}
        aria-label={copie.libelleSansResultat}
        aria-busy={envoi}
      >
        <h2 className="t-titre-sm">{copie.titreSansResultat}</h2>
        {copie.corpsSansResultat.map((paragraphe) => (
          <p className="t-corps" key={paragraphe}>
            {paragraphe}
          </p>
        ))}
        <button type="button" className={s.discret} disabled={envoi} onClick={recommencer}>
          <span className="t-bouton">{copie.reprendre}</span>
        </button>
      </section>
    );
  }

  if (!courant) {
    return (
      <section className={s.bloc} aria-live="polite" aria-busy={envoi}>
        <p className="t-corps">{envoi ? copie.enregistrement : copie.enregistre}</p>
        {!envoi ? (
          <button type="button" className={s.bouton} onClick={finaliser}>
            <span className="t-bouton">{copie.voir}</span>
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
    <section className={s.bloc} aria-label={copie.libelleQuestionnaire}>
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
