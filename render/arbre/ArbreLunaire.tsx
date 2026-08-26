"use client";

import { useEffect, useRef } from "react";
import type { GeometrieArbreLunaire } from "./geometrie";
import { MoteurArbreLunaire } from "./MoteurArbreLunaire";
import s from "./arbre.module.css";

export interface ProprietesArbreLunaire {
  readonly geometrie: GeometrieArbreLunaire;
  readonly troncEnReserve: boolean;
  readonly ariaLabel: string;
}

/**
 * Adaptateur React du moteur procédural. Le Canvas reste transparent : le ciel étoilé de la scène
 * traverse donc l'étape graine comme les états feuillus, sans image de référence ni fond de secours.
 */
export default function ArbreLunaire({ geometrie, troncEnReserve, ariaLabel }: ProprietesArbreLunaire) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const moteurRef = useRef<MoteurArbreLunaire | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    moteurRef.current = new MoteurArbreLunaire(canvas);
    return () => {
      moteurRef.current = null;
    };
    // Le moteur doit naître une seule fois par bitmap ; les mises à jour vivent dans l'effet suivant.
  }, []);

  useEffect(() => {
    moteurRef.current?.mettreAJour(geometrie, troncEnReserve);
  }, [geometrie, troncEnReserve]);

  return (
    <canvas
      ref={canvasRef}
      className={s.canvasLunaire}
      role="img"
      aria-label={ariaLabel}
      data-etape-arbre={geometrie.branches.length === 0 ? "graine" : "branches"}
      data-tronc-reserve={troncEnReserve ? "" : undefined}
    />
  );
}
