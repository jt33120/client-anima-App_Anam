"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import type { PointerEvent as EvenementPointeur, ReactNode, RefObject } from "react";
import s from "./feuille.module.css";

/**
 * Feuille.tsx : LA FEUILLE MODALE GÉNÉRIQUE (sheet). Rendu MUET (AD-7).
 *
 * ══ D'OÙ ELLE VIENT ═════════════════════════════════════════════════════════════════════════════
 *
 * `render/menu/MenuCompte.tsx` (Story 7.3) est la feuille de référence du produit : fond fixe en
 * `color-mix`, `role="dialog"` et `aria-modal`, focus posé sur la feuille elle-même à l'ouverture,
 * piège à focus borné, Échap qui ferme, focus rendu au déclencheur, bouton « Fermer » nommé,
 * gestes de pointeur arrêtés au bord. Ces mécanismes sont repris ICI À L'IDENTIQUE, pour qu'une
 * seconde feuille (les neuf repères de l'ennéagramme, retour du fondateur du 2026-09-02 : « moins
 * de scroll, plus de pop-up ») ne les réinvente pas à moitié.
 *
 * ⚠️ MENUCOMPTE N'EST PAS RÉÉCRIT PAR-DESSUS, ET C'EST UN CHOIX. Sa feuille est soudée à la
 * navigation : le verrou de destination désactive « Fermer », `aria-busy` suit la route, une ligne
 * d'état vit dans son en-tête, et le changement de pathname la ferme SANS rendre le focus. Faire
 * passer tout cela par des propriétés ici aurait été plus de surface que de partage.
 * `tests/rendu/menu-compte-rendu.test.tsx` reste la preuve du patron ; ce fichier en est la copie
 * pure, éprouvée par `tests/rendu/reperes-enneagramme.test.tsx`.
 *
 * ══ CE QU'ELLE NE DÉCIDE PAS ════════════════════════════════════════════════════════════════════
 *
 * Elle ne sait ni QUAND s'ouvrir ni QUOI montrer : le parent la monte quand elle est ouverte et la
 * démonte quand elle ne l'est plus, exactement comme le glyphe du menu. Le contenu arrive en
 * enfants, les libellés en propriétés (`render/` n'importe ni `lib/domain` ni `lib/corpus`).
 *
 * ══ PROFONDEUR MODALE : UN NIVEAU, JAMAIS DEUX (`EXPERIENCE.md` ligne 87) ═══════════════════════
 *
 * Rien à l'intérieur n'ouvre une autre feuille. Le composant rend ses enfants sans les inspecter :
 * c'est le test de CHAQUE feuille qui refuse tout `aria-haspopup` dedans.
 */

export interface ProprietesFeuille {
  /** L'identifiant du dialogue, pour l'`aria-controls` du déclencheur. */
  readonly id?: string;
  readonly titre: string;
  readonly libelleFermer: string;
  /**
   * L'élément qui a ouvert la feuille : le focus lui REVIENT à la fermeture (`EXPERIENCE.md`
   * ligne 216). Une référence explicite, jamais `document.activeElement` relevé à l'ouverture : un
   * clic programmatique ou un test n'y pose pas le focus, et le retour deviendrait un hasard.
   */
  readonly declencheur: RefObject<HTMLElement | null>;
  /** Appelé à chaque fermeture (Échap, bouton nommé, fond). Le parent démonte alors la feuille. */
  readonly onFermer: () => void;
  readonly children: ReactNode;
}

/**
 * Ce qu'une tabulation peut atteindre dans la feuille. `summary` y figure : un accordéon natif
 * (`<details>`) se tabule sans `tabindex`, et un piège qui l'ignorerait laisserait le focus
 * s'échapper derrière la feuille dès le premier repère.
 */
const FOCUSABLES =
  'a[href], button:not(:disabled), summary, input:not(:disabled), select:not(:disabled), ' +
  'textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export default function Feuille({
  id,
  titre,
  libelleFermer,
  declencheur,
  onFermer,
  children,
}: ProprietesFeuille) {
  const feuille = useRef<HTMLDivElement>(null);
  const idTitre = useId();

  const fermer = useCallback(() => {
    onFermer();
    // ⚠️ LE FOCUS REVIENT AU DÉCLENCHEUR (`EXPERIENCE.md` ligne 216). Sans ça, fermer la feuille au
    // clavier renvoie le focus au `<body>` : la tabulation suivante repart du tout début de la
    // page, et quelqu'un qui navigue au clavier perd sa place sans comprendre pourquoi.
    declencheur.current?.focus();
  }, [onFermer, declencheur]);

  useEffect(() => {
    // ⚠️ LE FOCUS VA SUR LA FEUILLE ELLE-MÊME, PAS SUR SON PREMIER BOUTON. C'est le patron ARIA
    // d'un dialogue (APG) : le lecteur d'écran annonce alors le TITRE et le rôle avant la première
    // commande. Viser le premier élément focusable aurait fait entendre « Fermer » comme première
    // chose à l'ouverture. La feuille porte `tabIndex={-1}` pour être focalisable sans entrer dans
    // l'ordre de tabulation. Une seule fois, au montage : rejouer ce focus à chaque rendu volerait
    // la place au repère qu'on vient d'atteindre au clavier.
    feuille.current?.focus();
  }, []);

  useEffect(() => {
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        fermer();
        return;
      }
      if (e.key !== "Tab") return;
      // ⚠️ PIÈGE À FOCUS VOLONTAIRE, ET BORNÉ. Tant que la feuille est ouverte, la tabulation n'en
      // sort pas (`EXPERIENCE.md` ligne 216) ; sinon on tabule « derrière » un panneau visible, ce
      // qui est le défaut d'accessibilité le plus courant des feuilles modales. Elle en sort par
      // Échap ou par le bouton de fermeture, jamais par accident.
      const focusables = [...(feuille.current?.querySelectorAll<HTMLElement>(FOCUSABLES) ?? [])];
      if (focusables.length === 0) return;
      const premierF = focusables[0];
      const dernierF = focusables[focusables.length - 1];
      if (
        e.shiftKey &&
        (document.activeElement === feuille.current || document.activeElement === premierF)
      ) {
        e.preventDefault();
        dernierF.focus();
      } else if (!e.shiftKey && document.activeElement === dernierF) {
        e.preventDefault();
        premierF.focus();
      }
    };
    document.addEventListener("keydown", auClavier);
    return () => document.removeEventListener("keydown", auClavier);
  }, [fermer]);

  /**
   * Les gestes de pointeur s'arrêtent à la feuille. `render/scene-dom.tsx` pose
   * `onPointerDown/Move/Up` sur `<main>` pour glisser d'une région à l'autre au doigt : sans ces
   * barrages, parcourir une feuille ouverte sur la scène ferait glisser la scène DERRIÈRE elle.
   * Aucun test unitaire ne le verrait ; on garde le barrage partout où la feuille peut se poser.
   */
  const stopper = (e: EvenementPointeur) => e.stopPropagation();

  return (
    <>
      {/* Le fond. Il ferme au toucher : un panneau qu'on ne peut fermer qu'en visant un petit
          bouton est un panneau dont on se sent prisonnier. Décoratif : la fermeture accessible
          passe par Échap et par le bouton nommé ci-dessous. */}
      <div className={s.fond} aria-hidden onClick={fermer} onPointerDown={stopper} />

      <div
        ref={feuille}
        id={id}
        className={`${s.feuille} fondu-texte`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitre}
        tabIndex={-1}
        onPointerDown={stopper}
        onPointerMove={stopper}
        onPointerUp={stopper}
      >
        <div className={s.enTete}>
          <h2 id={idTitre} className={`t-titre-sm ${s.titre}`}>
            {titre}
          </h2>
          <button type="button" className={s.fermer} onClick={fermer}>
            <span className="t-meta">{libelleFermer}</span>
          </button>
        </div>
        <div className={s.contenu}>{children}</div>
      </div>
    </>
  );
}
