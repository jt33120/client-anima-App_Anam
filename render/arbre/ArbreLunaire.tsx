"use client";

import { useEffect, useRef } from "react";
import tokens from "@/design/tokens.json";
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
  const projectionPeinte = useRef<string | null>(null);

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
    const signature = geometrie.branches.map(({ branche }) => `${branche.id}:${branche.etat}:${branche.intensite}`).join("|");
    const precedente = projectionPeinte.current;
    projectionPeinte.current = signature;
    const canvas = canvasRef.current;
    const mouvementReduit = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
    if (
      precedente === null || precedente === signature || !canvas?.animate ||
      mouvementReduit?.matches || document.hidden || canvas.closest('[inert], [aria-hidden="true"]')
    ) return;

    // Une transition du bitmap final, seulement après une donnée nouvelle. Aucun stade simulé,
    // aucune nouvelle cuisson pendant le fondu, aucune transformation des points interactifs.
    const animation = canvas.animate([{ opacity: 0.65 }, { opacity: 1 }], {
      duration: Number.parseFloat(tokens.shared["carnet-duree-region"]),
      easing: "ease-out",
    });
    const arreter = () => animation.cancel();
    const visibilite = () => { if (document.hidden) arreter(); };
    const region = canvas.closest('[role="region"]');
    const observateur = region && typeof MutationObserver !== "undefined"
      ? new MutationObserver(() => { if (region.matches('[inert], [aria-hidden="true"]')) arreter(); })
      : null;
    observateur?.observe(region!, { attributes: true, attributeFilter: ["inert", "aria-hidden"] });
    mouvementReduit?.addEventListener("change", arreter);
    document.addEventListener("visibilitychange", visibilite);
    const nettoyer = () => {
      observateur?.disconnect();
      mouvementReduit?.removeEventListener("change", arreter);
      document.removeEventListener("visibilitychange", visibilite);
    };
    animation.addEventListener("finish", nettoyer, { once: true });
    animation.addEventListener("cancel", nettoyer, { once: true });
    return () => { nettoyer(); animation.cancel(); };
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
