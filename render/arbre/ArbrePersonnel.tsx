"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { PLANCHES_METAMORPHOSE } from "./metamorphose-planches";
import s from "./arbre-personnel.module.css";

function PlanchePersonnelle({ index, ariaLabel }: { readonly index: number; readonly ariaLabel: string }) {
  const planche = PLANCHES_METAMORPHOSE[index];
  const suivante = PLANCHES_METAMORPHOSE[index + 1];
  const [etat, setEtat] = useState<"chargement" | "prete" | "erreur">("chargement");
  const [essai, setEssai] = useState(0);
  const support = useRef<HTMLDivElement>(null);

  return (
    <div ref={support} className={s.support} role="group" aria-label="Ton arbre" tabIndex={-1}
      aria-busy={etat === "chargement"} data-planche={planche.id}>
      <Image key={essai} src={planche.src} width={planche.width} height={planche.height}
        alt={`${ariaLabel} ${planche.alt}`} sizes="(max-width: 48rem) 90vw, 36rem" loading="eager" decoding="async"
        draggable={false} className={`${s.image} ${etat === "prete" ? s.prete : s.attente}`}
        onLoad={() => setEtat("prete")} onError={() => setEtat("erreur")} />
      {etat !== "prete" && (
        <div className={s.etat}>
          <p role="status" className="t-corps">
            {etat === "erreur" ? "L’image de ton arbre n’a pas pu être chargée." : "Chargement de ton arbre…"}
          </p>
          {etat === "erreur" && <button type="button" className={s.reessayer} data-commandes-arbre
            onClick={() => { support.current?.focus(); setEtat("chargement"); setEssai((valeur) => valeur + 1); }}>
            Réessayer l’image
          </button>}
        </div>
      )}
      {etat === "prete" && suivante && <div className={s.prechargement} aria-hidden>
        <Image src={suivante.src} width={suivante.width} height={suivante.height} alt=""
          sizes="(max-width: 48rem) 90vw, 36rem" loading="eager" decoding="async" />
      </div>}
    </div>
  );
}

export default function ArbrePersonnel({ index, troncEnReserve, ariaLabel }: {
  readonly index: number;
  readonly troncEnReserve: boolean;
  readonly ariaLabel: string;
}) {
  return <div className={s.personnel} data-index-croissance={index}
    data-etape-arbre={index === 0 ? "graine" : "branches"} data-tronc-reserve={troncEnReserve ? "" : undefined}>
    <PlanchePersonnelle key={index} index={index} ariaLabel={ariaLabel} />
  </div>;
}
