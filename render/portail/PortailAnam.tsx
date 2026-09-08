"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { etatDuPortail, momentDuDepart, portailFini } from "@/lib/scene/portail";
import s from "./portail.module.css";

/**
 * PortailAnam.tsx — LE PORTAIL D'ENTRÉE VERS L'UNIVERS D'ANAM (2026-09-03).
 *
 * Au lancement ou au refresh, le portail montre Anam de dos avant de révéler la scène.
 *
 * ══ TROIS PROPRIÉTÉS, ET ELLES COMPTENT PLUS QUE LE DESSIN ═════════════════════════════════════
 *
 *   1. IL S'EN VA TOUJOURS. Le QUAND vient de `lib/scene/portail.ts`, pur et éprouvé, dont le
 *      plafond ne dépend d'aucun état du monde. Un voile plein écran qui reste est la seule façon
 *      dont ce travail peut faire du mal, et elle ne se voit sur aucun écran de développement.
 *   2. IL NE PIÈGE PERSONNE. `pointer-events: none` du premier au dernier pixel : un doigt posé
 *      pendant le portail atteint la scène qui est déjà là, dessous, montée et hydratée. Le portail
 *      est un VOILE, pas une porte fermée — et un voile n'a pas besoin d'être ouvert.
 *   3. IL NE SE REJOUE JAMAIS. Monté une fois par CHARGEMENT DE DOCUMENT ; une navigation cliente
 *      ne le remonte pas, puisque son état vit au-dessus du routeur. « Au lancement ou son
 *      refresh », c'est-à-dire exactement là où un document naît.
 *
 * ══ CE QUE « LA SCÈNE EST PRÊTE » VEUT DIRE ICI, ET POURQUOI PAS AUTRE CHOSE ═══════════════════
 *
 * L'événement `load` du document : toutes les ressources critiques sont arrivées. On aurait pu
 * demander à la scène de se déclarer prête elle-même — un rappel depuis `SceneDom`. On ne l'a pas
 * fait, et c'est une décision : ce couplage ferait dépendre la DISPARITION du portail d'un composant
 * qui peut lever, se démonter, ou changer de forme. Un signal du navigateur ne se perd pas, et le
 * plafond couvre le cas où il arriverait trop tard de toute façon.
 *
 * ══ LE MOUVEMENT : UNE APPARITION FINIE ═══════════════════════════════════════════════════════
 *
 * Le portrait et sa lumière apparaissent une seule fois, puis le portail s'efface. La séquence
 * CSS n'ajoute aucun délai au cycle de vie. Sous `prefers-reduced-motion`, la composition reste
 * immobile et part après le bref séjour existant.
 */
export default function PortailAnam({
  copie,
}: {
  readonly copie: {
    readonly nom: string;
    readonly annonce: string;
  };
}) {
  const [retrait, setRetrait] = useState(false);
  const [parti, setParti] = useState(false);
  const [portraitAbsent, setPortraitAbsent] = useState(false);
  /** L'instant où la scène s'est déclarée prête. `null` tant qu'elle ne l'a pas fait — et le
   *  plafond décide alors seul (voir `momentDuDepart`). */
  const scenePreteRef = useRef<number | null>(null);

  useEffect(() => {
    // ⚠️ LU UNE FOIS, AU MONTAGE. Écouter les changements de ce réglage en cours de portail ferait
    // basculer le portail au milieu du geste — un saut, c'est-à-dire ce que le réglage évite.
    const reduit =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const depart0 = performance.now();
    const marquerPrete = () => {
      scenePreteRef.current ??= performance.now() - depart0;
    };
    if (document.readyState === "complete") marquerPrete();
    else window.addEventListener("load", marquerPrete, { once: true });

    // La boucle mesure le départ à la frame, mais React ne repeint que lorsque le retrait commence.
    const PAS_MS = 1000 / 30;
    let frame = 0;
    let dernierRendu = -Infinity;
    const suivre = () => {
      const ecoule = performance.now() - depart0;
      const depart = momentDuDepart(scenePreteRef.current, reduit);
      if (portailFini(ecoule, depart)) {
        setParti(true);
        return; // ⚠️ AUCUNE NOUVELLE FRAME N'EST DEMANDÉE : la boucle s'éteint d'elle-même.
      }
      if (ecoule - dernierRendu < PAS_MS) {
        frame = requestAnimationFrame(suivre);
        return;
      }
      dernierRendu = ecoule;
      setRetrait(etatDuPortail(ecoule, depart, reduit).retrait);
      frame = requestAnimationFrame(suivre);
    };
    frame = requestAnimationFrame(suivre);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("load", marquerPrete);
    };
  }, []);

  if (parti) return null;

  return (
    <div
      className={`${s.portail} ${retrait ? s.retrait : ""}`}
      data-portail-anam=""
      // `role="status"` + `aria-live="polite"` : une annonce, une fois, sans voler le focus.
      role="status"
      aria-live="polite"
      aria-label={copie.annonce}
    >
      <div className={s.atmosphere} aria-hidden="true" />
      <div className={s.scene}>
        <div className={s.apparition} aria-hidden="true">
          <div className={s.halo} />
          <div className={s.etoiles}>
            {Array.from({ length: 22 }, (_, rang) => (
              <span
                key={rang}
                className={s.etoile}
                style={{
                  "--etoile-x": (rang * 37 + 11) % 100,
                  "--etoile-y": (rang * 23 + 7) % 100,
                  "--etoile-rang": rang % 5,
                } as CSSProperties}
              />
            ))}
          </div>
        {/* The launch export preserves the source detail; the existing PNG remains a fallback. */}
        {!portraitAbsent && <picture className={s.portrait}>
          <source type="image/webp" srcSet="/scene/portail/anam-portail.webp" />
          <img
          src="/scene/veille/anam-veille.png"
          srcSet="/scene/veille/anam-veille.png 180w, /scene/veille/anam-veille@2x.png 360w"
          sizes="(max-height: 600px) 26svh, (min-height: 940px) 290px, 31svh"
          width="360"
          height="537"
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          onError={() => setPortraitAbsent(true)}
          />
        </picture>}
          <div className={s.brume} />
        </div>
        <div className={s.signature}>
          <p className={s.marque} aria-hidden="true">anam<span>.</span></p>
          <p className={`${s.nom} t-meta`}>{copie.nom}</p>
        </div>
      </div>
    </div>
  );
}
