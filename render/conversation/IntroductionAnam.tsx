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
export default function IntroductionAnam({ texte }: { texte: string }) {
  const [longueurVisible, setLongueurVisible] = useState(0);

  useEffect(() => {
    const mouvementReduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    <div className={s.introductionAnam} data-introduction-anam="">
      <p
        className={`${s.introductionBulle} t-anam fondu-texte`}
        role="note"
        aria-label={texte}
      >
        <span aria-hidden="true">{texte.slice(0, longueurVisible)}</span>
      </p>
      <ImageAnam
        format="presence"
        alt="Illustration nocturne"
        className={`${s.introductionPortrait} fondu-personnage`}
        chargement="eager"
      />
    </div>
  );
}
