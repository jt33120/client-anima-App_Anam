"use client";

import { useEffect, useState } from "react";
import ImageAnam from "./ImageAnam";
import s from "./conversation.module.css";

const DELAI_AVANT_FRAPPE_MS = 450;
const RYTHME_FRAPPE_MS = 22;

/**
 * Première prise de parole d'Anam : une bulle calme, accompagnée de son portrait, puis révélée
 * comme si elle s'écrivait. Le texte complet reste immédiatement accessible via le nom du
 * `role="note"` et l'animation est supprimée lorsque les mouvements sont réduits.
 */
export default function IntroductionAnam({
  texte,
  statique = false,
}: {
  texte: string;
  /** La phrase générale du journal vide, distincte d'une ouverture quotidienne persistée. */
  statique?: boolean;
}) {
  const [longueurVisible, setLongueurVisible] = useState(0);

  useEffect(() => {
    const mouvementReduit =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (mouvementReduit) {
      setLongueurVisible(texte.length);
      return;
    }

    setLongueurVisible(0);
    let intervalle: ReturnType<typeof setInterval> | undefined;
    const depart = window.setTimeout(() => {
      intervalle = setInterval(() => {
        setLongueurVisible((longueur) => {
          const suivante = Math.min(longueur + 1, texte.length);
          if (suivante === texte.length && intervalle) clearInterval(intervalle);
          return suivante;
        });
      }, RYTHME_FRAPPE_MS);
    }, DELAI_AVANT_FRAPPE_MS);

    return () => {
      window.clearTimeout(depart);
      if (intervalle) clearInterval(intervalle);
    };
  }, [texte]);

  return (
    <div
      className={s.introductionAnam}
      data-introduction-anam={statique ? "" : undefined}
      data-parole-ouverture-anam={statique ? undefined : ""}
    >
      <div className={s.introductionLettre}>
        <span className={s.signatureAnam}>Anam</span>
        <p
          className={`${s.introductionBulle} t-anam fondu-texte`}
          role="note"
          aria-label={texte}
        >
        {/* Le texte invisible réserve dès la première frame la hauteur finale de la bulle. La
            frappe se superpose dans cette boîte stable : aucun mot ne pousse le composeur. */}
        <span className={s.texteOuvertureReserve} aria-hidden="true">{texte}</span>
        <span className={s.texteOuvertureFrappe} aria-hidden="true">
          {texte.slice(0, longueurVisible)}
        </span>
        </p>
      </div>
      <ImageAnam
        format="presence"
        alt="Illustration nocturne"
        className={`${s.introductionPortrait} fondu-personnage`}
        chargement="eager"
      />
    </div>
  );
}
