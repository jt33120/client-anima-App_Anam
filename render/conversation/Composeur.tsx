"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { decisionEntree, type Palier } from "./composeur-clavier";
import s from "./conversation.module.css";

/**
 * Composeur — la bande de saisie (Story 2.2, B3 ; AC5, AC7, AC8). TEXTE SEUL en v1 : champ
 * multiligne auto-extensible (jusqu'à 6 lignes puis défilement interne) + bouton d'envoi. AUCUN
 * micro, aucune barre d'outils, aucun emoji, aucune pièce jointe (décision produit v1 — l'epic
 * prime sur DESIGN.md). Ne DISPARAÎT jamais (rendu tant que la conversation est montée).
 *
 * Entrée contextuelle (AC7, UX-DR-21) : la décision sm/md est prouvée dans `composeur-clavier`.
 * The writing field uses one focus envelope; the send button keeps its own keyboard focus.
 */

const MAX_LIGNES = 6;

/** Palier de saisie : md dès 768px (Entrée envoie) ; sm en dessous (Entrée = nouvelle ligne). */
function usePalier(): Palier {
  const [palier, setPalier] = useState<Palier>("sm");
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const maj = () => setPalier(mq.matches ? "md" : "sm");
    maj();
    mq.addEventListener("change", maj);
    return () => mq.removeEventListener("change", maj);
  }, []);
  return palier;
}

export default function Composeur({
  onEnvoyer,
  occupe,
  champRef,
  motifDesactive,
}: {
  onEnvoyer: (texte: string) => void;
  occupe: boolean;
  /** Réf du champ, détenue par le parent → permet de redéplacer le focus (après « Réessayer »). */
  champRef: RefObject<HTMLTextAreaElement | null>;
  /**
   * Story 3.4 (AC4) : allocation résiduelle épuisée → le composeur reste VISIBLE mais DÉSACTIVÉ, avec
   * ce motif (registre système) affiché à côté. Distinct d'`occupe` (transitoire, pendant un flux) :
   * `motifDesactive` est un arrêt persistant. Jamais « Passe au premium » — le socle reste ouvert.
   */
  motifDesactive?: string;
}) {
  const [valeur, setValeur] = useState("");
  const palier = usePalier();
  const bloque = !!motifDesactive; // arrêt persistant (quota épuisé) — indépendant de `occupe`
  const motifRef = useRef<HTMLParagraphElement>(null);

  // Story 3.4 (revue F8) : quand le quota épuise et que le champ passe `disabled`, le navigateur ferait
  // retomber le focus sur <body> (perte de contexte, WCAG 2.4.3). On le redirige vers le motif visible
  // (registre système) — jamais un appât commercial. Le `<p>` est ciblable par script (tabIndex=-1).
  useEffect(() => {
    if (bloque) motifRef.current?.focus();
  }, [bloque]);

  // The CSS caps writing at three lines when the keyboard leaves a short viewport. Recompute
  // on viewport changes too: a long draft must shrink when the keyboard opens and recover later.
  useEffect(() => {
    const el = champRef.current;
    if (!el) return;
    const ajuster = () => {
      const style = getComputedStyle(el);
      const ligne = Number.parseFloat(style.lineHeight) || 24;
      const lignes = Math.min(MAX_LIGNES, Number.parseInt(style.getPropertyValue("--lignes-composeur"), 10) || MAX_LIGNES);
      const interieur = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom) || 0;
      const bordures = Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth) || 0;
      el.style.height = "auto";
      const contenu = el.scrollHeight + bordures;
      const max = ligne * lignes + interieur + bordures;
      el.style.height = `${Math.min(contenu, max)}px`;
      el.style.overflowY = contenu > max ? "auto" : "hidden";
    };
    // A frame also lets the scene apply its viewport attributes before reading inherited CSS.
    let frame = 0;
    const apresViewport = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(ajuster);
    };
    ajuster();
    window.visualViewport?.addEventListener("resize", apresViewport);
    window.addEventListener("resize", apresViewport);
    return () => {
      cancelAnimationFrame(frame);
      window.visualViewport?.removeEventListener("resize", apresViewport);
      window.removeEventListener("resize", apresViewport);
    };
  }, [valeur, champRef]);

  const envoyer = () => {
    const t = valeur.trim();
    if (!t || occupe || bloque) return; // quota épuisé → aucun envoi (le champ est désactivé)
    onEnvoyer(t);
    setValeur("");
  };

  const surTouche = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const action = decisionEntree(palier, {
      key: e.key,
      shiftKey: e.shiftKey,
      isComposing: e.nativeEvent.isComposing,
    });
    if (action === "envoyer") {
      e.preventDefault(); // sinon un saut de ligne s'insère avant l'envoi
      envoyer();
    }
    // "nouvelle-ligne" / "ignorer" → comportement natif du textarea (retour à la ligne / frappe).
  };

  return (
    <div className={s.composeurZone}>
      {/* Story 3.4 (AC4) : motif d'arrêt affiché À CÔTÉ du composeur (au-dessus de la bande de saisie),
          registre système. `role="status"` → annoncé poliment au lecteur d'écran (le champ désactivé
          ne recevant pas le focus, `aria-describedby` seul ne suffirait pas). */}
      {bloque ? (
        <p id="motif-composeur" ref={motifRef} tabIndex={-1} className={`${s.motifDesactive} t-meta`} role="status">
          {motifDesactive}
        </p>
      ) : null}
      <div className={s.composeur}>
        <textarea
          ref={champRef}
          className={`${s.champ} t-corps`}
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          onKeyDown={surTouche}
          rows={1}
          placeholder="Écris à Anam…"
          aria-label="Ton message à Anam"
          disabled={bloque}
          aria-describedby={bloque ? "motif-composeur" : undefined}
        />
        <button
          type="button"
          className={s.envoi}
          onClick={envoyer}
          disabled={!valeur.trim() || occupe || bloque}
          aria-label="Envoyer"
        >
          <span className={s.flecheEnvoi} aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
