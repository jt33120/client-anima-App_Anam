/** Indices de CONFIDENTIALITÉ seulement. Ils ne participent jamais à l'autorisation serveur. */
export const CLE_LOCALE_VERROU_REQUIS = "anam_verrou_requis";
export const CLE_SESSION_REVERROUILLEE = "anam_session_reverrouillee";

function avecStockage(type: "localStorage" | "sessionStorage"): Storage | null {
  try {
    return window[type] ?? null;
  } catch {
    // Safari privé, stockage désactivé ou harnais : le serveur reste la garde d'autorisation.
    return null;
  }
}

export function noterVerrouRequis(): void {
  avecStockage("localStorage")?.setItem(CLE_LOCALE_VERROU_REQUIS, "oui");
  avecStockage("sessionStorage")?.removeItem(CLE_SESSION_REVERROUILLEE);
}

export function oublierVerrouLocal(): void {
  avecStockage("localStorage")?.removeItem(CLE_LOCALE_VERROU_REQUIS);
  avecStockage("sessionStorage")?.removeItem(CLE_SESSION_REVERROUILLEE);
}

export function verrouLocalRequis(): boolean {
  return avecStockage("localStorage")?.getItem(CLE_LOCALE_VERROU_REQUIS) === "oui";
}

export function noterSessionReverrouillee(): void {
  avecStockage("sessionStorage")?.setItem(CLE_SESSION_REVERROUILLEE, "oui");
}

export function sessionReverrouillee(): boolean {
  return avecStockage("sessionStorage")?.getItem(CLE_SESSION_REVERROUILLEE) === "oui";
}

export function retourDoitResterCouvert(pathname: string): boolean {
  return !routeExempteeDuVerrou(pathname);
}
import { routeExempteeDuVerrou } from "./routes-verrou";
