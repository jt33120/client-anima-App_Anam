"use client";

import { useEffect, useSyncExternalStore } from "react";
import tokens from "@/design/tokens.json";

const KEY = "anam-carnet-theme";
const EVENT = "anam-carnet-theme-change";
let sessionPreference: boolean | null = null;
const subscribe = (callback: () => void) => {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};
const snapshot = () => {
  if (sessionPreference !== null) return sessionPreference;
  try { return localStorage.getItem(KEY) !== "papier"; } catch { return true; }
};
const serverSnapshot = () => true;

export function ThemeCarnetDocument() {
  const nuit = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  useEffect(() => {
    document.documentElement.dataset.carnetTheme = nuit ? "nuit" : "papier";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", nuit ? tokens.dark.fond : tokens.light.fond);
  }, [nuit]);
  return null;
}

export default function ThemeCarnet({ className }: { readonly className?: string }) {
  const nuit = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return (
    <button className={className} type="button" aria-label={nuit ? "Passer au thème papier" : "Passer au thème nuit"}
      onClick={() => {
        sessionPreference = !nuit;
        try {
          localStorage.setItem(KEY, nuit ? "papier" : "nuit");
          sessionPreference = null;
        } catch { /* Keep the preference in memory when storage is full or unavailable. */ }
        window.dispatchEvent(new Event(EVENT));
      }}>
      <span aria-hidden>{nuit ? "Papier" : "Nuit"}</span>
    </button>
  );
}
