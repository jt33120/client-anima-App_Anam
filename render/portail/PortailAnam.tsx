"use client";

import { useEffect, useRef, useState } from "react";
import { etatDuPortail, momentDuDepart, portailFini } from "@/lib/scene/portail";
import LotusAttente from "../conversation/LotusAttente";
import ArbreQuiPousse from "./ArbreQuiPousse";
import s from "./portail.module.css";

/**
 * PortailAnam.tsx — LE PORTAIL D'ENTRÉE VERS L'UNIVERS D'ANAM (2026-09-03).
 *
 * Retour de Julian : « au lancement de l'app ou son refresh, un écran de chargement qui est l'arbre
 * que l'on a en asset, qui passe par les différents stades, de graine à arbre scintillant, tout en
 * étant souple et apaisé. En dessous de l'arbre un écran de chargement. Carte blanche pour en faire
 * le portail d'entrée vers l'univers d'Anam. »
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
 * ══ LE MOUVEMENT : UNE LUMIÈRE QUI S'OUVRE, PAS UNE BOUCLE ═════════════════════════════════════
 *
 * La respiration reste le seul mouvement en boucle du produit. La lumière du portail, elle, va dans
 * un sens et s'arrête — le régime déjà écrit pour le remplissage d'étoiles du seuil
 * (`monde.module.css`). Sous `prefers-reduced-motion`, l'arbre paraît d'emblée entier et rayonnant,
 * immobile, et le portail s'efface après un battement : on retire le MOUVEMENT, jamais l'image.
 */
export default function PortailAnam({
  copie,
}: {
  readonly copie: {
    readonly nom: string;
    readonly attente: string;
    readonly annonce: string;
  };
}) {
  const [etat, setEtat] = useState({ eveil: 0, retrait: false });
  const [parti, setParti] = useState(false);
  /** L'instant où la scène s'est déclarée prête. `null` tant qu'elle ne l'a pas fait — et le
   *  plafond décide alors seul (voir `momentDuDepart`). */
  const scenePreteRef = useRef<number | null>(null);

  useEffect(() => {
    // ⚠️ LU UNE FOIS, AU MONTAGE. Écouter les changements de ce réglage en cours de portail ferait
    // basculer l'arbre d'un état à l'autre au milieu du geste — un saut, c'est-à-dire ce que le
    // réglage existe pour éviter.
    const reduit =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const depart0 = performance.now();
    const marquerPrete = () => {
      scenePreteRef.current ??= performance.now() - depart0;
    };
    if (document.readyState === "complete") marquerPrete();
    else window.addEventListener("load", marquerPrete, { once: true });

    // ⚠️ ON NE PEINT PAS À CHAQUE FRAME, ET C'EST DÉLIBÉRÉ. Trente images par seconde suffisent
    // amplement à un geste de deux secondes, et divisent par deux le travail fait pendant que la
    // page s'hydrate — le moment le plus chargé de la vie de l'app, sur le téléphone le plus lent.
    // La boucle, elle, continue de tourner à la frame : c'est le RENDU qu'on espace, jamais la
    // mesure du temps. (Depuis le 2026-09-04 chaque image ne coûte qu'un voile posé sur un bitmap
    // déjà cuit — mesuré à 0 ms en médiane ; l'espacement reste, il ne coûte rien et il protège
    // des appareils qu'on ne mesure pas.)
    const PAS_MS = 1000 / 30;
    let frame = 0;
    let dernierRendu = -Infinity;
    const peindre = () => {
      const ecoule = performance.now() - depart0;
      const depart = momentDuDepart(scenePreteRef.current, reduit);
      if (portailFini(ecoule, depart)) {
        setParti(true);
        return; // ⚠️ AUCUNE NOUVELLE FRAME N'EST DEMANDÉE : la boucle s'éteint d'elle-même.
      }
      if (ecoule - dernierRendu < PAS_MS) {
        frame = requestAnimationFrame(peindre);
        return;
      }
      dernierRendu = ecoule;
      setEtat(etatDuPortail(ecoule, depart, reduit));
      frame = requestAnimationFrame(peindre);
    };
    frame = requestAnimationFrame(peindre);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("load", marquerPrete);
    };
  }, []);

  if (parti) return null;

  return (
    <div
      className={`${s.portail} ${etat.retrait ? s.retrait : ""}`}
      data-portail-anam=""
      // `role="status"` + `aria-live="polite"` : une annonce, une fois, sans voler le focus.
      role="status"
      aria-live="polite"
      aria-label={copie.annonce}
    >
      <div className={s.scene}>
        <ArbreQuiPousse eveil={etat.eveil} />
        {/* Le nom porte le scintillement de `globals.css` — le halo derrière la lettre, jamais une
            ombre portée sur le texte (leçon de `tests/voile.test.ts`). */}
        <p className={`${s.nom} t-titre scintillement`}>{copie.nom}</p>
        <p className={`${s.attente} t-corps`}>{copie.attente}</p>
        {/* Le signe d'attente du produit, à sa plus petite taille : c'est le même lotus que la
            conversation, pas un tourniquet inventé pour cet écran. */}
        <LotusAttente taille={28} className={s.lotus} />
      </div>
    </div>
  );
}
