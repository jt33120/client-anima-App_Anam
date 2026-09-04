"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { MoteurArbre } from "../arbre-vivant";
import GraineAttente from "../arbre/GraineAttente";
import s from "./portail.module.css";

/**
 * ArbreQuiPousse.tsx — L'ARBRE DU PORTAIL, DE LA GRAINE À LA RAMURE (2026-09-03).
 *
 * ══ UNE ANIMATION FINIE, ET C'EST LE RÉGIME DÉJÀ ÉCRIT ═════════════════════════════════════════
 *
 * `render/monde.module.css` a tranché ce cas pour le remplissage d'étoiles du seuil : « une
 * animation FINIE sur un canvas — puis la boucle s'arrête d'elle-même, zéro coût au repos, jamais
 * rejouée. Elle ne boucle pas (la respiration reste le seul mouvement en boucle) et ne déplace aucun
 * texte ; sous reduced-motion, état final immédiat. » La pousse suit ce régime à la lettre.
 *
 * ⚠️ LA BOUCLE S'ARRÊTE DEUX FOIS PLUTÔT QU'UNE. `annuler()` est appelé au démontage ET la boucle
 * cesse de se redemander une frame quand la pousse est finie. Une seule des deux suffirait
 * aujourd'hui ; les deux ensemble font qu'aucune frame ne tourne derrière un portail déjà parti,
 * même si le composant survivait à son fondu.
 *
 * ══ CE QUE CE COMPOSANT NE SAIT PAS ════════════════════════════════════════════════════════════
 *
 * Ni quand partir, ni pourquoi. Il reçoit `eveil` et `graine` et il peint. Le QUAND vit dans
 * `lib/scene/portail.ts`, pur et testé — un composant qui déciderait de sa propre disparition
 * mettrait la seule propriété dangereuse de ce travail dans le seul endroit qu'on ne peut pas
 * éprouver sans navigateur.
 *
 * ══ LA GRAINE EST CELLE DE L'ARBRE, PAS UNE AUTRE ══════════════════════════════════════════════
 *
 * `GraineAttente` est le dessin de l'étape 0 de l'arbre réel (retour du fondateur du 2026-09-02,
 * « la faire bouger pour symboliser qu'elle n'attend que d'éclore »). La réutiliser ici, plutôt que
 * d'en dessiner une seconde, garantit que le portail s'ouvre sur EXACTEMENT l'image que la personne
 * retrouvera dans son arbre le premier jour.
 *
 * ⚠️ SON OPACITÉ SE POSE SUR UN ENVELOPPE, JAMAIS SUR ELLE. `tests/rendu/graine-attente.test.tsx`
 * exige qu'aucun élément du dessin ne porte d'attribut `style` — sa règle, et elle est bonne : le
 * souffle et le soulèvement vivent dans la feuille, et un `style=` serait la porte par laquelle un
 * second mouvement entrerait sans passer par la charte. Le portail pose donc la VALEUR sur un
 * jeton (`--opacite-graine`), et la feuille décide de ce que ce jeton fait — le patron de
 * `LotusAttente` et de son `--taille-lotus`.
 */
export default function ArbreQuiPousse({
  eveil,
  graine,
  temps,
}: {
  /** 0 → 100, l'échelle de `MoteurArbre`. Un paramètre de dessin, jamais une progression lue. */
  readonly eveil: number;
  /** L'opacité de la graine, 1 → 0. Elle s'efface pendant que le bois monte. */
  readonly graine: number;
  /** L'horloge du balancement, en secondes. Figée à 0 sous `prefers-reduced-motion`. */
  readonly temps: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const moteurRef = useRef<MoteurArbre | null>(null);

  // La GÉNÉRATION de l'arbre, une seule fois. Elle est chère (elle engendre toute la géométrie)
  // et elle ne dépend d'aucune propriété : la refaire à chaque frame hacherait la pousse.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const moteur = new MoteurArbre(canvas);
    moteur.build();
    moteurRef.current = moteur;
    return () => {
      moteurRef.current = null;
    };
  }, []);

  // La PEINTURE, à chaque changement d'éveil. React cadence déjà à la frame ; demander en plus une
  // `requestAnimationFrame` ici ferait deux horloges pour une image.
  useEffect(() => {
    moteurRef.current?.dessiner(eveil, temps);
  }, [eveil, temps]);

  return (
    <div className={s.arbre}>
      {/* `aria-hidden` sur les deux : le portail entier est décoratif, et il porte sa propre
          annonce (voir `PortailAnam`). Un canevas de 1408 × 860 annoncé au lecteur d'écran
          n'apporterait rien de plus qu'un mot déjà dit. */}
      <canvas ref={canvasRef} className={s.canevas} aria-hidden />
      {graine > 0 ? (
        <div
          className={s.graine}
          style={{ "--opacite-graine": graine } as CSSProperties}
        >
          <GraineAttente />
        </div>
      ) : null}
    </div>
  );
}
