"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { effacerResultat, recommencerInventaire } from "./actions";
import s from "@/render/psychologie/questionnaire.module.css";

/**
 * resultat.tsx — LES CINQ AXES SITUÉS (2026-09-03).
 *
 * ── CINQ LECTURES QUI SE LISENT ENSEMBLE, JAMAIS UN VERDICT ───────────────────────────────────
 *
 * Le Big Five ne désigne personne : il situe cinq axes indépendants. L'écran les pose donc CÔTE À
 * CÔTE, dans l'ordre du domaine, sans qu'aucun ne prime — un titre « ton trait dominant » serait
 * faux par construction, et c'est la faute que fait la majorité des rendus de cet inventaire.
 *
 * ── UNE POSITION, JAMAIS UN SCORE ─────────────────────────────────────────────────────────────
 *
 * Aucun nombre de points, aucune barre, aucun « ouverture : 72 / 100 » (FR-031). Le serveur a
 * conclu, et le total n'a pas franchi la frontière : cet écran n'a jamais reçu de nombre. Il ne peut
 * donc pas en peindre un.
 *
 * ── LE TEXTE VIENT D'ANIMA, OU N'EXISTE PAS ENCORE — ET ON LE DIT ─────────────────────────────
 *
 * `TexteCorpus` n'a que deux états (FR-054/FR-086) : il n'existe pas de « texte par défaut ». Tant
 * qu'un créneau est vide, l'écran le dit dans la voix du PRODUIT (`t-corps`), jamais dans celle
 * d'Anam.
 */

export interface AxeVue {
  readonly libelle: string;
  readonly position: string;
  /** Le texte d'Anima, ou `null` si le créneau n'est pas encore écrit. */
  readonly texte: string | null;
}

export default function Resultat({
  axes,
  origine,
  messageSansTexte,
  libelles,
}: {
  readonly axes: readonly AxeVue[];
  readonly origine: string;
  /** La phrase du PRODUIT quand un créneau est vide. Servie par le serveur, jamais composée ici. */
  readonly messageSansTexte: string;
  readonly libelles: { readonly refaire: string; readonly effacer: string };
}) {
  const router = useRouter();
  const verrou = useRef(false);
  const [envoi, setEnvoi] = useState(false);

  /**
   * ⚠️ « REFAIRE » N'EFFACE PAS LE RÉSULTAT D'ABORD. Le réflexe serait de repartir d'une page
   * blanche — et il la laisserait SANS RÉSULTAT si elle abandonne au huitième énoncé. On efface
   * seulement la passe en cours (pour que la `key` change et que rien ne fuie de l'ancienne), et le
   * résultat reste en place jusqu'à ce qu'un nouveau le remplace.
   */
  async function agir(quoi: () => Promise<void>, versLeTest = false) {
    if (verrou.current) return;
    verrou.current = true;
    setEnvoi(true);
    try {
      await quoi();
      if (versLeTest) router.push("/big-five?refaire=1");
      else router.refresh();
    } finally {
      verrou.current = false;
      setEnvoi(false);
    }
  }

  return (
    <section className={`${s.bloc} fondu-texte`} aria-label="Tes cinq axes">
      <p className="t-corps">{origine}</p>
      <ul className={s.axes}>
        {axes.map((axe) => (
          <li className={s.axe} key={axe.libelle}>
            <h2 className="t-titre-sm">{axe.libelle}</h2>
            <p className={`${s.position} t-meta`}>{axe.position}</p>
            {/* Le texte d'Anima quand il existe — dans SA voix. Le message d'absence, lui, est du
                produit : `t-corps`, jamais `t-anam`. */}
            {axe.texte !== null ? (
              <p className="t-anam">{axe.texte}</p>
            ) : (
              <p className="t-corps">{messageSansTexte}</p>
            )}
          </li>
        ))}
      </ul>
      <div className={s.gestes}>
        <button
          type="button"
          className={s.discret}
          disabled={envoi}
          onClick={() => agir(recommencerInventaire, true)}
        >
          <span className="t-bouton">{libelles.refaire}</span>
        </button>
        <button
          type="button"
          className={s.discret}
          disabled={envoi}
          onClick={() => agir(effacerResultat)}
        >
          <span className="t-bouton">{libelles.effacer}</span>
        </button>
      </div>
    </section>
  );
}
