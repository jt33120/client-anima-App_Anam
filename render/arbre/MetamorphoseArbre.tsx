"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { PLANCHES_METAMORPHOSE, type PlancheMetamorphose } from "./metamorphose-planches";
import s from "./metamorphose.module.css";

const FAMILLES = [
  { titre: "Éclosion", debut: 0, fin: 3 },
  { titre: "Croissance", debut: 4, fin: 15 },
  { titre: "Canopée", debut: 16, fin: 23 },
  { titre: "Lumière", debut: 24, fin: 34 },
] as const;

const TAILLES_IMAGE = "(max-width: 48rem) 80vw, 32rem";

function ImagePlanche({ planche, onChargee }: {
  readonly planche: PlancheMetamorphose;
  readonly onChargee: () => void;
}) {
  const [etat, setEtat] = useState<"chargement" | "prete" | "erreur">("chargement");
  const [essai, setEssai] = useState(0);
  const plateau = useRef<HTMLDivElement>(null);

  return (
    <div ref={plateau} className={s.plateau} aria-busy={etat === "chargement"} data-planche={planche.id}
      role="group" aria-label={`Illustration : ${planche.titre}`} tabIndex={-1}>
      <Image key={essai} src={planche.src} width={planche.width} height={planche.height}
        alt={planche.alt} sizes={TAILLES_IMAGE} loading="eager" decoding="async"
        className={`${s.image} ${etat === "prete" ? s.imagePrete : s.imageEnAttente}`}
        onLoad={() => { setEtat("prete"); onChargee(); }} onError={() => setEtat("erreur")} />
      {etat !== "prete" && (
        <div className={s.etatImage}>
          <p className="t-corps" role="status">
            {etat === "erreur" ? "Cette illustration n’a pas pu être chargée." : "Chargement de l’illustration…"}
          </p>
          {etat === "erreur" && (
            <button type="button" className={s.reessayer}
              onClick={() => { plateau.current?.focus(); setEtat("chargement"); setEssai((valeur) => valeur + 1); }}>
              Réessayer l’illustration
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** A manual illustration viewer. It has no access to the person's tree or its actions. */
export default function MetamorphoseArbre({ indexInitial = 0 }: { readonly indexInitial?: number }) {
  const [index, setIndex] = useState(() => Number.isFinite(indexInitial)
    ? Math.max(0, Math.min(Math.trunc(indexInitial), PLANCHES_METAMORPHOSE.length - 1)) : 0);
  const [chargee, setChargee] = useState<string | null>(null);
  const choix = useRef<HTMLSelectElement>(null);
  const choixId = useId();
  const imageId = useId();
  const planche = PLANCHES_METAMORPHOSE[index];
  const suivante = PLANCHES_METAMORPHOSE[index + 1];
  const parcourir = (position: number, commande: HTMLButtonElement) => {
    // WebKit drops focus when the activated command becomes disabled at an endpoint.
    if ((position === 0 || position === PLANCHES_METAMORPHOSE.length - 1) && document.activeElement === commande) {
      choix.current?.focus();
    }
    setIndex(position);
  };

  return (
    <div className={s.galerie}>
      <p className={s.annotation}>Explorer les formes de l’arbre</p>
      <figure className={s.figure}>
        <div id={imageId}>
          <ImagePlanche key={planche.id} planche={planche} onChargee={() => setChargee(planche.id)} />
        </div>
        <figcaption className={s.legende}>
          <p className={s.position} role="status" aria-atomic="true">
            Illustration {index + 1} sur {PLANCHES_METAMORPHOSE.length} : <strong>{planche.titre}</strong>
          </p>
          <p className={`t-corps ${s.texte}`}>{planche.texte}</p>
        </figcaption>
      </figure>
      <div className={s.navigation} aria-label="Parcourir les illustrations" role="group">
        <button type="button" className={s.commande} aria-label="Image précédente" aria-controls={imageId}
          disabled={index === 0} onClick={(event) => parcourir(index - 1, event.currentTarget)}>
          Précédente
        </button>
        <button type="button" className={s.commande} aria-label="Image suivante" aria-controls={imageId}
          disabled={index === PLANCHES_METAMORPHOSE.length - 1} onClick={(event) => parcourir(index + 1, event.currentTarget)}>
          Suivante
        </button>
      </div>
      <div className={s.choixEtape}>
        <label htmlFor={choixId} className="t-meta">Choisir une étape</label>
        <select ref={choix} id={choixId} className={s.selecteur} value={index} aria-controls={imageId}
          onChange={(event) => setIndex(Number(event.currentTarget.value))}>
          {PLANCHES_METAMORPHOSE.map((item, position) => (
            <option key={item.id} value={position}>{String(position + 1).padStart(2, "0")} : {item.titre}</option>
          ))}
        </select>
      </div>
      <div className={s.reperes} role="group" aria-label="Les familles de l’arbre">
        {FAMILLES.map((famille) => (
          <button key={famille.titre} type="button" className={s.repere}
            aria-pressed={index >= famille.debut && index <= famille.fin}
            aria-label={`Voir la famille : ${famille.titre}`} aria-controls={imageId}
            onClick={() => setIndex(famille.debut)}>{famille.titre}</button>
        ))}
      </div>
      <p className={`t-meta ${s.precision}`}>Ces illustrations se parcourent librement. Ton arbre personnel suit tes échanges et tes branches.</p>
      {chargee === planche.id && suivante && (
        <div className={s.prechargement} aria-hidden>
          <Image src={suivante.src} width={suivante.width} height={suivante.height}
            alt="" sizes={TAILLES_IMAGE} loading="eager" decoding="async" />
        </div>
      )}
    </div>
  );
}
