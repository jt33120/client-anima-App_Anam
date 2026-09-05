"use client";

import { useId, useRef, useState } from "react";
import Feuille from "@/render/Feuille";
import {
  ACTION_COMPRENDRE_EVOLUTION,
  ETAPES_EVOLUTION,
  FERMER_COMPRENDRE_EVOLUTION,
  LEGENDE_EXEMPLE_EVOLUTION,
} from "./copie-arbre";
import s from "./arbre.module.css";

function IllustrationEvolution() {
  return (
    <figure className={s.exempleEvolution}>
      <svg viewBox="0 0 480 220" role="img" aria-labelledby="exemple-evolution-titre">
        <title id="exemple-evolution-titre">Un exemple d’arbre avec un tronc et trois branches à différents états</title>
        <g className={s.exempleBois} fill="none">
          <path d="M240 205C232 165 244 130 238 84C235 60 229 41 234 20" />
          <path d="M239 143C195 126 162 101 139 68" />
          <path d="M238 112C281 99 315 72 334 39" />
          <path d="M240 164C283 158 320 142 352 111" />
        </g>
        <g className={s.exempleFeuilles}>
          <ellipse cx="136" cy="64" rx="9" ry="16" transform="rotate(-38 136 64)" />
          <ellipse cx="334" cy="37" rx="9" ry="16" transform="rotate(34 334 37)" />
          <ellipse cx="354" cy="109" rx="9" ry="16" transform="rotate(46 354 109)" />
          <circle cx="334" cy="37" r="27" className={s.exempleRayonnement} />
        </g>
        <ellipse className={s.exempleGraine} cx="240" cy="207" rx="13" ry="7" />
      </svg>
      <figcaption className="t-meta">{LEGENDE_EXEMPLE_EVOLUTION}</figcaption>
    </figure>
  );
}

export default function ComprendreEvolution() {
  const [ouvert, setOuvert] = useState(false);
  const declencheur = useRef<HTMLButtonElement>(null);
  const id = useId();

  return (
    <>
      <button
        ref={declencheur}
        type="button"
        className={s.actionSecondaire}
        aria-haspopup="dialog"
        aria-expanded={ouvert}
        aria-controls={ouvert ? id : undefined}
        onClick={() => setOuvert(true)}
      >
        {ACTION_COMPRENDRE_EVOLUTION}
      </button>
      {ouvert ? (
        <Feuille
          id={id}
          titre={ACTION_COMPRENDRE_EVOLUTION}
          libelleFermer={FERMER_COMPRENDRE_EVOLUTION}
          declencheur={declencheur}
          onFermer={() => setOuvert(false)}
        >
          <ol className={s.etapesEvolution}>
            {ETAPES_EVOLUTION.map((etape) => (
              <li key={etape.titre}>
                <h3 className="t-titre-sm">{etape.titre}</h3>
                <p className="t-corps">{etape.corps}</p>
              </li>
            ))}
          </ol>
          <IllustrationEvolution />
        </Feuille>
      ) : null}
    </>
  );
}
