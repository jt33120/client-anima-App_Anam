"use client";

import { useEffect, useRef } from "react";
import type { BrancheProjetee } from "@/lib/scene/projection";
import { FRONT_UNITES, partRevelee } from "@/lib/scene/portail";
import { CENTRE_ARBRE, construireGeometrieLunaire } from "../arbre/geometrie";
import { ECHELLE_HANDOFF, MoteurArbreLunaire } from "../arbre/MoteurArbreLunaire";
import s from "./portail.module.css";

/**
 * ArbreQuiPousse.tsx — L'ARBRE DU PORTAIL, DE LA GRAINE À L'ARBRE QUI RAYONNE.
 *
 * ══ CE FICHIER A CHANGÉ D'ARBRE LE 2026-09-04, ET C'ÉTAIT UNE ERREUR DE MA PART ════════════════
 *
 * Retour de Julian : « c'est pas du tout le bon arbre sur l'écran de chargement, le bon avait des
 * racines et s'illuminait ». Il a raison, et la confusion est entièrement de mon fait : le dépôt
 * porte DEUX arbres, et j'avais pris le mauvais.
 *
 *   - `render/arbre-vivant.tsx` (`MoteurArbre`) est le DÉCOR de la scène : un feuillage en bouquet,
 *     une souche à peine évasée, aucune notion de lumière. C'est lui que le portail montrait.
 *   - `render/arbre/MoteurArbreLunaire.ts` est l'ARBRE DU PRODUIT — le handoff « Arbre de Vie
 *     Lunaire » : un éventail de RACINES sous le sol, et une lumière nacre qui monte de la base des
 *     branches vers la cime. C'est celui que la personne retrouve dans sa halte, et c'est celui-là
 *     qu'un portail d'entrée doit annoncer.
 *
 * ══ POURQUOI LA LUMIÈRE EST RÉVÉLÉE, ET NON RECUITE À CHAQUE IMAGE ═════════════════════════════
 *
 * La voie naïve — appeler `mettreAJour` à chaque image avec une intensité croissante — a été
 * ÉCRITE ET MESURÉE avant d'être abandonnée : dans Chromium, 66 images (2,2 s à 30 im/s) coûtent
 * **7,7 s** de fil principal, 90 ms par image en médiane. Le moteur lunaire est conçu pour cuire
 * un état durable, pas pour être rejoué ; c'est d'ailleurs pour cela qu'il n'a aucune horloge
 * (AC10, `tests/arbre-rendu.test.ts`).
 *
 * On cuit donc UNE SEULE FOIS, en plein rayonnement, et l'animation n'est plus qu'un voile : un
 * dégradé radial qui s'ouvre depuis la graine. Mesuré au même endroit : **0 ms** en médiane par
 * image. La cuisson unique coûte 668 ms sur un processeur ralenti 4× (un téléphone de milieu de
 * gamme) — payés une fois, à l'intérieur d'un portail qui dure de toute façon 2,2 s.
 *
 * ⚠️ ET C'EST POURQUOI LE VOILE S'OUVRE EN ROND PLUTÔT QU'EN MONTANT. Depuis la graine, la
 * révélation descend dans les racines et monte dans le tronc EN MÊME TEMPS — ce que fait un arbre
 * qui pousse. Un balayage vertical aurait fait apparaître les racines par leurs pointes, c'est-à-dire
 * à l'envers.
 *
 * ══ CE QUE CE COMPOSANT NE SAIT PAS ════════════════════════════════════════════════════════════
 *
 * Ni quand partir, ni pourquoi. Il reçoit un `eveil` et il peint. Le QUAND vit dans
 * `lib/scene/portail.ts`, pur et testé — un composant qui déciderait de sa propre disparition
 * mettrait la seule propriété dangereuse de ce travail dans le seul endroit qu'on ne peut pas
 * éprouver sans navigateur.
 *
 * ══ AUCUNE DONNÉE N'ENTRE ICI ══════════════════════════════════════════════════════════════════
 *
 * Les treize branches sont FABRIQUÉES, toutes en rayonnement, et elles ne quittent jamais ce
 * fichier. Le portail paraît avant toute session : il ne lit rien, il ne peut donc rien dire de
 * personne. C'est ce qui distingue cette lumière-là de celle de la halte, où chaque branche porte
 * ce qui a été vécu — et c'est pour ça que l'interdit d'animer la croissance (AC10) vise l'arbre
 * ADRESSABLE, pas ce décor.
 */

/**
 * Les treize branches du handoff, en plein rayonnement — une par bulbe de canopée.
 *
 * ⚠️ TREIZE, ET PAS UN NOMBRE CHOISI ICI. `construireGeometrieLunaire` ne rend que les branches
 * qu'on lui donne (`slice(0, branchesOrdonnees.length)`) : en donner moins ferait un arbre à moitié
 * chauve, en donner plus inventerait des bulbes hors du prototype validé au pixel près.
 */
const BRANCHES_DECOR: readonly BrancheProjetee[] = Array.from({ length: 13 }, (_, rang) => ({
  id: `portail-decor-${rang}`,
  etat: "rayonnement",
  intensite: 1,
  extraitSourceId: `portail-decor-${rang}`,
}));

/**
 * L'échelle de cuisson du portail : la moitié de celle du handoff.
 *
 * ⚠️ MESURÉE, PAS CHOISIE. Cuire en plein rayonnement coûte, sur un processeur ralenti 4× :
 * 1 797 ms à l'échelle 0,7 (celle de l'arbre réel, qu'on peut agrandir au zoom), 1 070 ms à 0,5,
 * **668 ms à 0,35**. Le portail affiche un arbre de deux cent cinquante pixels de large : à 0,35 le
 * bitmap en fait 493, soit près du double — il n'a aucune raison de payer la définition de celui
 * qu'on explore au doigt. C'est la seule constante à toucher si le portail paraissait flou.
 */
export const ECHELLE_PORTAIL = ECHELLE_HANDOFF / 2;

export default function ArbreQuiPousse({
  eveil,
}: {
  /** 0 → 100. Un paramètre de DESSIN — la part de l'arbre déjà venue à la lumière, jamais un score. */
  readonly eveil: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cuitRef = useRef<HTMLCanvasElement | null>(null);

  // LA CUISSON, une seule fois. C'est la seule dépense de ce composant, et elle ne dépend d'aucune
  // propriété : la refaire à chaque image est précisément la voie qui coûtait 7,7 s.
  useEffect(() => {
    const horsEcran = document.createElement("canvas");
    new MoteurArbreLunaire(horsEcran, ECHELLE_PORTAIL).mettreAJour(
      construireGeometrieLunaire(BRANCHES_DECOR),
      false,
    );
    cuitRef.current = horsEcran;

    // Le canevas visible prend la taille du bitmap cuit : un `drawImage` à l'échelle 1:1 est le
    // chemin le plus court, et la feuille de style se charge seule de la taille à l'écran.
    const canvas = canvasRef.current;
    if (canvas && horsEcran.width > 0) {
      canvas.width = horsEcran.width;
      canvas.height = horsEcran.height;
    }
    return () => {
      cuitRef.current = null;
    };
  }, []);

  // LA RÉVÉLATION, à chaque changement d'éveil. React cadence déjà à l'image ; demander en plus une
  // `requestAnimationFrame` ici ferait deux horloges pour une seule image.
  useEffect(() => {
    const canvas = canvasRef.current;
    const cuit = cuitRef.current;
    if (!canvas || !cuit) return;
    const contexte = canvas.getContext("2d");
    if (!contexte) return;

    contexte.clearRect(0, 0, canvas.width, canvas.height);

    const grX = CENTRE_ARBRE.x * ECHELLE_PORTAIL;
    const grY = (CENTRE_ARBRE.solY + 7) * ECHELLE_PORTAIL;
    // Le rayon qui atteint le coin le PLUS LOIN de la graine. Le mesurer sur le mauvais coin
    // laisserait une part de l'arbre dans l'ombre à la fin du geste.
    const rayonPlein = Math.hypot(
      Math.max(grX, canvas.width - grX),
      Math.max(grY, canvas.height - grY),
    );
    const front = FRONT_UNITES * ECHELLE_PORTAIL;
    const part = partRevelee(eveil);
    // ⚠️ LE FRONT VA JUSQU'À `rayonPlein + front`, ET C'EST CE QUI GARANTIT L'ARBRE ENTIER AU BOUT.
    // Un front qui s'arrête au rayon plein laisse son propre dégradé sur les derniers pixels :
    // l'arbre finirait éternellement à quatre-vingt-quinze pour cent de lui-même.
    const bord = part * (rayonPlein + front);

    contexte.drawImage(cuit, 0, 0);
    contexte.globalCompositeOperation = "destination-in";
    const voile = contexte.createRadialGradient(
      grX,
      grY,
      Math.max(0, bord - front),
      grX,
      grY,
      Math.max(0.01, bord),
    );
    voile.addColorStop(0, "rgba(0,0,0,1)");
    voile.addColorStop(1, "rgba(0,0,0,0)");
    contexte.fillStyle = voile;
    contexte.fillRect(0, 0, canvas.width, canvas.height);
    contexte.globalCompositeOperation = "source-over";
  }, [eveil]);

  // Les proportions de la boîte sont celles du canevas logique, écrites dans la feuille et
  // comparées à `CANEVAS` par `tests/rendu/portail.test.tsx` — le patron de
  // `tests/scene-sans-bords.test.ts` pour l'arbre du décor. Une valeur en dur qu'une garde compare
  // vaut mieux qu'un style en ligne : la feuille reste lisible, et la copie ne peut pas dériver en
  // silence.
  return (
    <div className={s.arbre}>
      {/* `aria-hidden` : le portail entier est décoratif, et il porte sa propre annonce (voir
          `PortailAnam`). Un canevas annoncé au lecteur d'écran n'apporterait rien de plus qu'un mot
          déjà dit. */}
      <canvas ref={canvasRef} className={s.canevas} aria-hidden />
    </div>
  );
}
