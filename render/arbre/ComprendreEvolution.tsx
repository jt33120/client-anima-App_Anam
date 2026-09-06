"use client";

import { useId, useMemo, useRef, useState } from "react";
import Feuille from "@/render/Feuille";
import type { BrancheProjetee } from "@/lib/scene/projection";
import ArbreLunaire from "./ArbreLunaire";
import GraineAttente from "./GraineAttente";
import { construireGeometrieLunaire } from "./geometrie";
import {
  ACTION_COMPRENDRE_EVOLUTION,
  ETAPES_EVOLUTION,
  FERMER_COMPRENDRE_EVOLUTION,
  LEGENDE_EXEMPLE_EVOLUTION,
} from "./copie-arbre";
import s from "./arbre.module.css";

const HALTES = ["Graine", "Premier élan", "Feuillaison", "Pleine lumière"] as const;

/** These branches only illustrate the visual vocabulary. They never enter the user's projection. */
function branchesExemple(etape: number): readonly BrancheProjetee[] {
  if (etape === 0) return [];
  const etat = etape === 1 ? "naissance" : etape === 2 ? "feuillaison" : "rayonnement";
  return Array.from({ length: etape === 1 ? 1 : 7 }, (_, index) => ({
    id: `illustration-${index}`,
    nom: "Branche d’exemple",
    extraitSourceId: `illustration-source-${index}`,
    dateNaissance: `2026-01-${String(index + 1).padStart(2, "0")}T12:00:00Z`,
    etat,
    intensite: etape === 1 ? 0 : etape === 2 ? 0.7 : 1,
  }));
}

function IllustrationEvolution() {
  const [etape, setEtape] = useState(0);
  const geometrie = useMemo(() => construireGeometrieLunaire(branchesExemple(etape)), [etape]);
  const detailId = useId();

  return (
    <div className={s.explorationEvolution}>
      <p className={s.explorationAnnotation}>De la graine à la lumière</p>
      <figure className={s.exempleEvolution}>
        <div className={s.apercuJardin}>
          <div className={s.apercuPortrait}>
            <ArbreLunaire geometrie={geometrie} troncEnReserve={false} ariaLabel={`Un exemple d’arbre : ${HALTES[etape]}`} />
            {etape === 0 && <GraineAttente className={s.apercuGraine} />}
          </div>
          <span className={s.mentionExemple}>Illustration</span>
        </div>
        <figcaption className="t-meta">{LEGENDE_EXEMPLE_EVOLUTION}</figcaption>
      </figure>
      <div className={s.haltesEvolution} role="group" aria-label="Explorer les étapes de l’arbre">
        {HALTES.map((halte, index) => (
          <button key={halte} type="button" aria-pressed={etape === index} aria-controls={detailId}
            className={s.halteEvolution} onClick={() => setEtape(index)}>
            <span aria-hidden className={s.halteRepere} />
            {halte}
          </button>
        ))}
      </div>
      <div id={detailId} className={s.detailEvolution} aria-live="polite" aria-atomic="true">
        <h3 className="t-titre-sm">{ETAPES_EVOLUTION[etape].titre}</h3>
        <p className="t-corps">{ETAPES_EVOLUTION[etape].corps}</p>
      </div>
    </div>
  );
}

export default function ComprendreEvolution() {
  const [ouvert, setOuvert] = useState(false);
  const declencheur = useRef<HTMLButtonElement>(null);
  const id = useId();

  return (
    <>
      <button ref={declencheur} type="button" className={s.actionSecondaire}
        aria-haspopup="dialog" aria-expanded={ouvert} aria-controls={ouvert ? id : undefined}
        onClick={() => setOuvert(true)}>
        {ACTION_COMPRENDRE_EVOLUTION}
      </button>
      {ouvert ? (
        <Feuille id={id} titre={ACTION_COMPRENDRE_EVOLUTION} libelleFermer={FERMER_COMPRENDRE_EVOLUTION}
          declencheur={declencheur} onFermer={() => setOuvert(false)}>
          <IllustrationEvolution />
        </Feuille>
      ) : null}
    </>
  );
}
