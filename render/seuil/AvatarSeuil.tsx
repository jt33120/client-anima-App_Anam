"use client";

import { useEffect, useRef, useState } from "react";
import ImageAnam from "../conversation/ImageAnam";
import LotusAttente from "../conversation/LotusAttente";
import { DUREE_DEFAUT_MS, demarrerRemplissage, type Remplissage } from "./remplissage-etoiles";
import s from "./avatar-seuil.module.css";

/**
 * AvatarSeuil — L'IMAGE DU SEUIL : Anam qui se remplit d'étoiles (retour du fondateur, 2026-09-02).
 *
 * « Quand on crée un compte, on voit l'arbre : mets plutôt l'avatar d'Anam. Il faut un effet wow,
 * plénitude et confiance, une animation lente, un asset d'Anam qui se remplit d'étoiles. Une sorte
 * d'écran de chargement beau et long. »
 *
 * ══ CE QUE FAIT L'ÉCRAN, DANS L'ORDRE ═══════════════════════════════════════════════════════════
 *
 *   1. la région seuil est montée : un `<canvas aria-hidden>` par-dessus un `ImageAnam` format
 *      « seuil » dont l'enveloppe est à `opacity: 0` (classe `.image`, jamais un style inline) ;
 *   2. quand la région est ACTIVE, on attend que l'`<img>` soit décodée (`decode()`), puis
 *      `demarrerRemplissage` prend la main : les étoiles convergent vers la silhouette pendant
 *      `DUREE_REMPLISSAGE_MS`, et l'image affleure dans le canvas sur le dernier quart ;
 *   3. à `termine`, l'enveloppe de l'image passe à `opacity: 1` par le fondu standard, et le
 *      LOTUS apparaît aux mains d'Anam (voir `.lotus` dans la feuille) — c'est ce qui rend l'écran
 *      « plein » : le détourage de l'asset a perdu le lotus lumineux qu'elle tenait au-dessus des
 *      mains, et c'est le lotus qui respire déjà dans la conversation qui le lui rend ;
 *   4. `arreter()` au démontage et dès que la région cesse d'être active : on ne dessine jamais
 *      dans une région `inert`.
 *
 * ⚠️ LE NOM, LA PHRASE ET LA PORTE NE SONT PAS DERRIÈRE CE COMPOSANT. Ils sont visibles PENDANT
 * l'animation : le « chargement beau et long » est l'avatar qui se remplit, pas un verrou qui ferait
 * attendre 4,5 s avant de pouvoir lire « commencer ». Ce composant ne tient que l'image.
 *
 * ══ POURQUOI CE N'EST PAS UNE ENTORSE À « LE FONDU DE RÉGION EST LA SEULE GRAMMAIRE » ═══════════
 *
 * `monde.module.css` pose deux invariants : le fondu de région est la seule grammaire de mouvement,
 * et la respiration est le seul mouvement EN BOUCLE. Le remplissage n'est ni l'un ni l'autre : c'est
 * une animation FINIE — elle dure `DUREE_REMPLISSAGE_MS`, puis la boucle rAF s'arrête d'elle-même
 * (`remplissage-etoiles.ts`, « zéro coût au repos »). Elle ne boucle pas, elle ne se rejoue pas, et
 * elle ne porte aucune information : quelqu'un qui arrive après elle voit exactement la même chose,
 * l'avatar plein. Sous `prefers-reduced-motion`, le module dessine l'état final une fois, sans
 * boucle — jamais rien de vide.
 *
 * ══ REPLIS — l'écran n'est jamais vide ══════════════════════════════════════════════════════════
 *
 *   • pas de contexte 2D (jsdom, navigateur ancien) : le module résout `termine` aussitôt, l'image
 *     s'affiche telle quelle ;
 *   • l'asset manque : `ImageAnam` retire son `<img>` et montre son halo plumeux ; `decode()` rejette,
 *     on montre l'enveloppe sans animer ;
 *   • `decode()` absent (jsdom) : on part sur `complete`/`load`, que le module gère.
 *
 * ══ PERF ════════════════════════════════════════════════════════════════════════════════════════
 *
 * Le canvas est UNE couche composée, plafonnée par le module (DPR 2, 400 × 520 physiques). Aucune
 * animation DOM n'est ajoutée ici ; aucun `will-change` (le dépôt n'en tolère qu'un, mesuré, dans
 * `monde.module.css`). Le lotus est le composant existant, monté APRÈS la fin du remplissage : les
 * deux ne se chevauchent jamais.
 *
 * Décoratif : `aria-hidden` sur le canvas et le lotus ; le sens est porté par `ImageAnam`
 * (`role="img"` + son `alt` sobre), et le nom du lieu reste le h1 de la région.
 */

/**
 * DURÉE. Le module propose 4,5 s (`DUREE_DEFAUT_MS`), dans la fourchette « 4 à 6 s » demandée. C'est
 * LE réglage à toucher si le fondateur veut plus long ou plus court — pas la courbe, pas le nombre
 * d'étoiles.
 */
export const DUREE_REMPLISSAGE_MS = DUREE_DEFAUT_MS;

/**
 * TAILLE DU LOTUS, en px CSS — 44 est le seuil au-dessus duquel `LotusAttente` dessine tout son
 * détail (nervures, étincelles, reflet). La taille RENDUE est ensuite fixée par `.lotus` dans la
 * feuille, en pourcentage de l'avatar, pour qu'elle suive l'avatar à toutes les largeurs.
 */
const TAILLE_LOTUS = 44;

export default function AvatarSeuil({ actif, alt }: { actif: boolean; alt: string }) {
  const enveloppe = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  /** L'animation est FINIE (ou n'a pas pu avoir lieu) : l'image se montre, le lotus paraît. */
  const [pret, setPret] = useState(false);

  useEffect(() => {
    if (!actif) return;
    const toile = canvas.current;
    // L'`<img>` est CELLE d'`ImageAnam` : on ne charge pas l'asset une seconde fois, on lit le
    // bitmap que le navigateur a déjà décodé pour l'afficher.
    const image = enveloppe.current?.querySelector("img") ?? null;
    if (!toile || !image) {
      // Rien à animer (asset absent → `ImageAnam` a déjà remplacé l'image par son halo) : on montre
      // ce qu'il y a. Jamais une enveloppe invisible pour toujours.
      setPret(true);
      return;
    }

    let annule = false;
    let remplissage: Remplissage | null = null;
    const montrer = () => {
      if (!annule) setPret(true);
    };
    const lancer = () => {
      if (annule) return;
      remplissage = demarrerRemplissage(toile, image, { dureeMs: DUREE_REMPLISSAGE_MS });
      // `termine` est résolue à la fin naturelle ET par `arreter()` : `annule` empêche alors de
      // toucher l'état d'un composant démonté ou d'une région devenue inerte.
      void remplissage.termine.then(montrer);
    };

    // `decode()` garantit un bitmap prêt AVANT la première trame (pas de décodage synchrone dans
    // le rAF, qui ferait sauter la première image). Sans `decode` (jsdom), `complete`/`load`
    // suffisent : le module les gère. Un décodage qui ÉCHOUE, c'est une image cassée — on ne la
    // passe pas à `drawImage`, on montre l'enveloppe et son repli.
    const decodage =
      typeof image.decode === "function" ? image.decode() : Promise.resolve();
    decodage.then(lancer, montrer);

    return () => {
      annule = true;
      remplissage?.arreter();
    };
  }, [actif]);

  return (
    <div ref={enveloppe} className={s.avatar}>
      <ImageAnam format="seuil" alt={alt} className={`${s.image} ${pret ? s.imagePrete : ""}`} />
      <canvas ref={canvas} className={s.toile} aria-hidden data-remplissage-etoiles />
      {pret && (
        <div className={`${s.lotus} fondu-image`} aria-hidden>
          <LotusAttente taille={TAILLE_LOTUS} />
        </div>
      )}
    </div>
  );
}
