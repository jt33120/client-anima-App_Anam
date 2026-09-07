"use client";

import { useEffect, useRef, type RefObject } from "react";

/** The scene owns the visible viewport. Children must not subtract keyboard height again. */
export function useConversationViewport(active: boolean): RefObject<HTMLElement | null> {
  const scene = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = scene.current;
    if (!element) return;
    const viewport = window.visualViewport;
    let hauteurAuRepos = Math.max(window.innerHeight, viewport?.height ?? 0);

    const reset = () => {
      element.style.removeProperty("--conversation-vh");
      element.style.removeProperty("--conversation-top");
      delete element.dataset.viewportConversation;
      delete element.dataset.clavierOuvert;
    };

    const actualiser = () => {
      // Native pinch zoom keeps control of the viewport; never chase its moving window.
      if (!active || !viewport || Math.abs(viewport.scale - 1) > 0.01) {
        reset();
        return;
      }
      const hauteur = viewport.height;
      const haut = viewport.offsetTop;
      if (!Number.isFinite(hauteur) || hauteur <= 0 || !Number.isFinite(haut)) {
        reset();
        return;
      }

      const cible = document.activeElement;
      const saisie = cible instanceof HTMLElement && element.contains(cible) && (
        cible instanceof HTMLTextAreaElement ||
        (cible instanceof HTMLInputElement && /^(text|email|search|tel|url|password|number)$/.test(cible.type)) ||
        cible.isContentEditable
      );
      if (!saisie) hauteurAuRepos = Math.max(window.innerHeight, hauteur);

      // Android may already resize innerHeight. Compare with the resting viewport, never
      // subtract innerHeight - visualViewport.height from a height that is already reduced.
      element.style.setProperty("--conversation-vh", `${hauteur}px`);
      element.style.setProperty("--conversation-top", `${Math.max(0, haut)}px`);
      element.dataset.viewportConversation = "";
      if (saisie && hauteurAuRepos - hauteur > 100) element.dataset.clavierOuvert = "";
      else delete element.dataset.clavierOuvert;
    };

    actualiser();
    viewport?.addEventListener("resize", actualiser);
    viewport?.addEventListener("scroll", actualiser);
    window.addEventListener("resize", actualiser);
    document.addEventListener("focusin", actualiser);
    document.addEventListener("focusout", actualiser);
    return () => {
      viewport?.removeEventListener("resize", actualiser);
      viewport?.removeEventListener("scroll", actualiser);
      window.removeEventListener("resize", actualiser);
      document.removeEventListener("focusin", actualiser);
      document.removeEventListener("focusout", actualiser);
      reset();
    };
  }, [active]);

  return scene;
}

export default useConversationViewport;
