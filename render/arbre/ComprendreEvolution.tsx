"use client";

import { useId, useRef, useState, type RefObject } from "react";
import Feuille from "@/render/Feuille";
import MetamorphoseArbre from "./MetamorphoseArbre";
import { ACTION_COMPRENDRE_EVOLUTION, ETAPES_EVOLUTION, FERMER_COMPRENDRE_EVOLUTION, LEGENDE_EXEMPLE_EVOLUTION } from "./copie-arbre";
import s from "./arbre.module.css";
import m from "./metamorphose.module.css";

export function DialogueEvolution({ declencheur, onFermer, indexInitial = 0, id }: {
  readonly declencheur: RefObject<HTMLElement | null>;
  readonly onFermer: () => void;
  readonly indexInitial?: number;
  readonly id?: string;
}) {
  return (
    <Feuille id={id} titre={ACTION_COMPRENDRE_EVOLUTION} libelleFermer={FERMER_COMPRENDRE_EVOLUTION}
      declencheur={declencheur} onFermer={onFermer}>
      <MetamorphoseArbre indexInitial={indexInitial} />
      <details className={m.explication}>
        <summary className="t-corps">Ce que raconte mon arbre</summary>
        <p className="t-meta">{LEGENDE_EXEMPLE_EVOLUTION}</p>
        <ol className={m.etapes}>
          {ETAPES_EVOLUTION.map((etape) => (
            <li key={etape.titre}>
              <h3 className="t-titre-sm">{etape.titre}</h3>
              <p className="t-corps">{etape.corps}</p>
            </li>
          ))}
        </ol>
      </details>
    </Feuille>
  );
}

export default function ComprendreEvolution({ variante = "information", onOuvrir, compact = false }: {
  readonly compact?: boolean;
  readonly variante?: "graine" | "information";
  /** A trigger inside the transformed garden delegates its dialog to the region root. */
  readonly onOuvrir?: (declencheur: HTMLButtonElement) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const declencheur = useRef<HTMLButtonElement>(null);
  const id = useId();
  const graine = variante === "graine";

  return (
    <>
      <button ref={declencheur} type="button" className={compact ? s.comprendreCompact : graine ? m.appel : s.actionSecondaire}
        aria-haspopup="dialog" aria-expanded={onOuvrir ? undefined : ouvert} aria-controls={ouvert ? id : undefined}
        onClick={(event) => onOuvrir ? onOuvrir(event.currentTarget) : setOuvert(true)}>
        {compact ? "Comprendre" : graine ? "Voir la graine éclore" : ACTION_COMPRENDRE_EVOLUTION}
      </button>
      {ouvert && <DialogueEvolution id={id} declencheur={declencheur} onFermer={() => setOuvert(false)} indexInitial={graine ? 1 : 0} />}
    </>
  );
}
